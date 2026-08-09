import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  MealInsert,
  MealLikeRow,
  MealPlanEntryInsert,
  MealPlanEntryRow,
  MealRow,
  MealUpdate,
} from "../../../types";
import { supabase } from "../../lib/supabase";
import { toDateKey } from "../../lib/calendar-aggregate";

const MEALS_KEY = ["meals"] as const;
const LIKES_KEY = ["meal_likes"] as const;
const PLAN_KEY = ["meal_plan_entries"] as const;

export type MealSlot = "breakfast" | "lunch" | "dinner";

export type MealWithLikes = MealRow & { likedMemberIds: string[] };

export function isMissingMealsTableError(message: string) {
  return (
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("meals") ||
    message.includes("meal_likes") ||
    message.includes("meal_plan_entries")
  );
}

async function fetchMeals(): Promise<MealRow[]> {
  const { data, error } = await supabase.from("meals").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchLikes(): Promise<MealLikeRow[]> {
  const { data, error } = await supabase.from("meal_likes").select("*");
  if (error) throw error;
  return data ?? [];
}

async function fetchPlanEntries(from: string, to: string): Promise<MealPlanEntryRow[]> {
  const { data, error } = await supabase
    .from("meal_plan_entries")
    .select("*")
    .gte("plan_date", from)
    .lte("plan_date", to)
    .order("plan_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function useMeals() {
  return useQuery({
    queryKey: MEALS_KEY,
    queryFn: fetchMeals,
    retry: false,
  });
}

export function useMealLikes() {
  return useQuery({
    queryKey: LIKES_KEY,
    queryFn: fetchLikes,
    retry: false,
  });
}

export function useMealPlan(weekStart: Date) {
  const from = toDateKey(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const to = toDateKey(end);
  return useQuery({
    queryKey: [...PLAN_KEY, from, to],
    queryFn: () => fetchPlanEntries(from, to),
    retry: false,
  });
}

export function mergeMealsWithLikes(meals: MealRow[], likes: MealLikeRow[]): MealWithLikes[] {
  const byMeal = new Map<string, string[]>();
  for (const like of likes) {
    const list = byMeal.get(like.meal_id) ?? [];
    list.push(like.member_id);
    byMeal.set(like.meal_id, list);
  }
  return meals.map((m) => ({
    ...m,
    likedMemberIds: byMeal.get(m.id) ?? [],
  }));
}

export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = out.getDay();
  out.setDate(out.getDate() - day);
  return out;
}

export function useMealsMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: MEALS_KEY });
    void qc.invalidateQueries({ queryKey: LIKES_KEY });
    void qc.invalidateQueries({ queryKey: PLAN_KEY });
  };

  const createMeal = useMutation({
    mutationFn: async (input: {
      name: string;
      prep_time: string;
      cook_time: string;
      ingredients: string[];
      instructions: string;
      likedMemberIds: string[];
    }) => {
      const row: MealInsert = {
        name: input.name.trim(),
        prep_time: input.prep_time.trim() || "N/A",
        cook_time: input.cook_time.trim() || "N/A",
        ingredients: input.ingredients,
        instructions: input.instructions,
      };
      const { data, error } = await supabase.from("meals").insert(row).select().single();
      if (error) throw error;
      if (input.likedMemberIds.length > 0) {
        const { error: likeError } = await supabase.from("meal_likes").insert(
          input.likedMemberIds.map((member_id) => ({ meal_id: data.id, member_id })),
        );
        if (likeError) throw likeError;
      }
      return data;
    },
    onSuccess: invalidate,
  });

  const updateMeal = useMutation({
    mutationFn: async ({
      id,
      patch,
      likedMemberIds,
    }: {
      id: string;
      patch: MealUpdate;
      likedMemberIds: string[];
    }) => {
      const { data, error } = await supabase.from("meals").update(patch).eq("id", id).select().single();
      if (error) throw error;
      const { error: delError } = await supabase.from("meal_likes").delete().eq("meal_id", id);
      if (delError) throw delError;
      if (likedMemberIds.length > 0) {
        const { error: likeError } = await supabase
          .from("meal_likes")
          .insert(likedMemberIds.map((member_id) => ({ meal_id: id, member_id })));
        if (likeError) throw likeError;
      }
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const upsertPlanEntry = useMutation({
    mutationFn: async (input: MealPlanEntryInsert) => {
      const { data, error } = await supabase
        .from("meal_plan_entries")
        .upsert(input, { onConflict: "plan_date,slot" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const clearPlanEntry = useMutation({
    mutationFn: async ({ plan_date, slot }: { plan_date: string; slot: MealSlot }) => {
      const { error } = await supabase
        .from("meal_plan_entries")
        .delete()
        .eq("plan_date", plan_date)
        .eq("slot", slot);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createMeal, updateMeal, deleteMeal, upsertPlanEntry, clearPlanEntry };
}
