import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  RoutineInsert,
  RoutineRow,
  RoutineStepCompletionRow,
  RoutineStepInsert,
  RoutineStepRow,
} from "../../types";
import { supabase } from "../lib/supabase";

const ROUTINES_KEY = ["routines"] as const;
const COMPLETIONS_KEY = (day: string) => ["routine_completions", day] as const;

export function isMissingRoutinesTableError(message: string) {
  return (
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("routines") ||
    message.includes("routine_steps")
  );
}

export type RoutineWithSteps = RoutineRow & { steps: RoutineStepRow[] };

function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function fetchRoutines(): Promise<RoutineWithSteps[]> {
  const { data: routines, error } = await supabase
    .from("routines")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;

  const { data: steps, error: stepsErr } = await supabase
    .from("routine_steps")
    .select("*")
    .order("sort_order", { ascending: true });
  if (stepsErr) throw stepsErr;

  const byRoutine = new Map<string, RoutineStepRow[]>();
  for (const s of steps ?? []) {
    const list = byRoutine.get(s.routine_id) ?? [];
    list.push(s);
    byRoutine.set(s.routine_id, list);
  }

  return (routines ?? []).map((r) => ({
    ...r,
    steps: byRoutine.get(r.id) ?? [],
  }));
}

export function useRoutines() {
  return useQuery({
    queryKey: ROUTINES_KEY,
    queryFn: fetchRoutines,
    retry: false,
  });
}

export function useRoutineCompletions(day = todayKey()) {
  return useQuery({
    queryKey: COMPLETIONS_KEY(day),
    queryFn: async (): Promise<RoutineStepCompletionRow[]> => {
      const { data, error } = await supabase
        .from("routine_step_completions")
        .select("*")
        .eq("completed_on", day);
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
}

export function useRoutinesMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ROUTINES_KEY });
  };

  const createRoutine = useMutation({
    mutationFn: async (input: { title: string; icon_key?: string; steps?: string[] }) => {
      const row: RoutineInsert = {
        title: input.title.trim(),
        icon_key: input.icon_key ?? "sun",
        sort_order: 0,
      };
      const { data: routine, error } = await supabase.from("routines").insert(row).select().single();
      if (error) throw error;

      const stepTitles = (input.steps ?? []).map((t) => t.trim()).filter(Boolean);
      if (stepTitles.length > 0) {
        const stepRows: RoutineStepInsert[] = stepTitles.map((title, i) => ({
          routine_id: routine.id,
          title,
          sort_order: i,
        }));
        const { error: se } = await supabase.from("routine_steps").insert(stepRows);
        if (se) throw se;
      }
      return routine;
    },
    onSuccess: invalidate,
  });

  const addStep = useMutation({
    mutationFn: async ({ routineId, title }: { routineId: string; title: string }) => {
      const { data, error } = await supabase
        .from("routine_steps")
        .insert({ routine_id: routineId, title: title.trim(), sort_order: 99 } satisfies RoutineStepInsert)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteRoutine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("routines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("routine_steps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleStepToday = useMutation({
    mutationFn: async ({
      stepId,
      completed,
      day = todayKey(),
    }: {
      stepId: string;
      completed: boolean;
      day?: string;
    }) => {
      if (completed) {
        const { error } = await supabase
          .from("routine_step_completions")
          .upsert({ step_id: stepId, completed_on: day }, { onConflict: "step_id,completed_on" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("routine_step_completions")
          .delete()
          .eq("step_id", stepId)
          .eq("completed_on", day);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: COMPLETIONS_KEY(vars.day ?? todayKey()) });
    },
  });

  return { createRoutine, addStep, deleteRoutine, deleteStep, toggleStepToday, todayKey };
}
