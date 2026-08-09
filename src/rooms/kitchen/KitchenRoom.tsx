import { useMemo, useState } from "react";
import {
  ChefHat,
  Clock,
  Flame,
  Heart,
  Pencil,
  Plus,
  Trash2,
  X,
  CalendarDays,
} from "lucide-react";
import { MealImage } from "../../components/MealImage";
import { DbSetupPanel } from "../../components/DbSetupPanel";
import { MEAL_PLANNING_SETUP_SQL } from "../../lib/meal-planning-setup-sql";
import { HOUSEHOLD_SETUP_SQL } from "../../lib/household-setup-sql";
import { colorStyle } from "../../lib/member-colors";
import { toDateKey } from "../../lib/calendar-aggregate";
import {
  isMissingMembersTableError,
  useHouseholdMembers,
} from "../../hooks/useHouseholdMembers";
import {
  isMissingMealsTableError,
  mergeMealsWithLikes,
  startOfWeek,
  useMealLikes,
  useMealPlan,
  useMeals,
  useMealsMutations,
  type MealSlot,
  type MealWithLikes,
} from "./useMeals";

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];

function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

export function KitchenRoom() {
  const { data: members = [], error: membersError } = useHouseholdMembers();
  const { data: mealRows = [], error, isLoading } = useMeals();
  const { data: likes = [] } = useMealLikes();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const { data: planEntries = [] } = useMealPlan(weekStart);
  const mut = useMealsMutations();

  const meals = useMemo(() => mergeMealsWithLikes(mealRows, likes), [mealRows, likes]);

  const [selectedMeal, setSelectedMeal] = useState<MealWithLikes | null>(null);
  const [mealFormOpen, setMealFormOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [tab, setTab] = useState<"recipes" | "plan">("recipes");

  const [formName, setFormName] = useState("");
  const [formPrep, setFormPrep] = useState("");
  const [formCook, setFormCook] = useState("");
  const [formIngredients, setFormIngredients] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const [formLikedBy, setFormLikedBy] = useState<string[]>([]);

  if (membersError && isMissingMembersTableError(membersError.message)) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <DbSetupPanel title="Household database setup" sql={HOUSEHOLD_SETUP_SQL} />
      </div>
    );
  }

  if (error && isMissingMealsTableError(error.message)) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <DbSetupPanel title="Meal planning database setup" sql={MEAL_PLANNING_SETUP_SQL} />
      </div>
    );
  }

  const toggleLike = (memberId: string) => {
    setFormLikedBy((prev) =>
      prev.includes(memberId) ? prev.filter((m) => m !== memberId) : [...prev, memberId],
    );
  };

  const resetForm = () => {
    setFormName("");
    setFormPrep("");
    setFormCook("");
    setFormIngredients("");
    setFormInstructions("");
    setFormLikedBy([]);
  };

  const closeMealForm = () => {
    setMealFormOpen(false);
    setEditingMealId(null);
    resetForm();
  };

  const openCreateForm = () => {
    setEditingMealId(null);
    resetForm();
    setMealFormOpen(true);
  };

  const openEditForm = (meal: MealWithLikes) => {
    setEditingMealId(meal.id);
    setFormName(meal.name);
    setFormPrep(meal.prep_time === "N/A" ? "" : meal.prep_time);
    setFormCook(meal.cook_time === "N/A" ? "" : meal.cook_time);
    setFormIngredients(meal.ingredients.join("\n"));
    setFormInstructions(meal.instructions);
    setFormLikedBy([...meal.likedMemberIds]);
    setSelectedMeal(null);
    setMealFormOpen(true);
  };

  const handleSaveMeal = async () => {
    if (!formName.trim()) return;
    const ingredients = formIngredients.split("\n").map((i) => i.trim()).filter(Boolean);
    const payload = {
      name: formName.trim(),
      prep_time: formPrep || "N/A",
      cook_time: formCook || "N/A",
      ingredients,
      instructions: formInstructions,
      likedMemberIds: formLikedBy,
    };
    if (editingMealId) {
      await mut.updateMeal.mutateAsync({
        id: editingMealId,
        patch: {
          name: payload.name,
          prep_time: payload.prep_time,
          cook_time: payload.cook_time,
          ingredients: payload.ingredients,
          instructions: payload.instructions,
        },
        likedMemberIds: payload.likedMemberIds,
      });
    } else {
      await mut.createMeal.mutateAsync(payload);
    }
    closeMealForm();
  };

  const handleDeleteMeal = async (meal: MealWithLikes) => {
    if (!confirm(`Delete "${meal.name}"?`)) return;
    await mut.deleteMeal.mutateAsync(meal.id);
    setSelectedMeal(null);
  };

  const days = weekDays(weekStart);

  const planLookup = (dateKey: string, slot: MealSlot) =>
    planEntries.find((e) => e.plan_date === dateKey && e.slot === slot);

  return (
    <div className="relative z-10 flex h-full w-full flex-col overflow-hidden p-3 sm:p-4">
      <div className="mb-3 flex shrink-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-white/50 bg-cyan-100 p-4 text-cyan-700 shadow-inner">
            <ChefHat size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-800">Kitchen</h1>
            <p className="text-lg font-medium text-slate-500">Recipes and week meal plan.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-white/80 bg-white/70 p-1">
            <button
              type="button"
              onClick={() => setTab("recipes")}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                tab === "recipes" ? "bg-cyan-600 text-white" : "text-slate-600"
              }`}
            >
              Recipes
            </button>
            <button
              type="button"
              onClick={() => setTab("plan")}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                tab === "plan" ? "bg-cyan-600 text-white" : "text-slate-600"
              }`}
            >
              Week plan
            </button>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-6 py-3 font-bold text-white shadow-[0_8px_20px_rgba(8,145,178,0.3)] transition-all hover:bg-cyan-500"
          >
            <Plus size={20} /> Add meal
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="py-16 text-center text-slate-500">Loading meals…</p>
        ) : tab === "recipes" ? (
          meals.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-white/40 px-6 py-16 text-center text-lg font-semibold text-slate-500">
              No recipes yet. Add your first meal.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedMeal(meal)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedMeal(meal);
                    }
                  }}
                  className="group cursor-pointer overflow-hidden rounded-3xl border border-white/80 bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/80"
                >
                  <MealImage mealName={meal.name} className="h-36 w-full" iconSize={36} />
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-end">
                      <div className="flex -space-x-2">
                        {meal.likedMemberIds.map((id) => {
                          const member = members.find((m) => m.id === id);
                          if (!member) return null;
                          return (
                            <div
                              key={id}
                              title={member.display_name}
                              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white shadow-sm ${colorStyle(member.color_token).solid}`}
                            >
                              {member.display_name.substring(0, 2)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <h3 className="mb-3 text-xl font-black text-slate-800 group-hover:text-cyan-700 sm:text-2xl">
                      {meal.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
                      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/50 bg-slate-100/50 px-3 py-1.5">
                        <Clock size={16} className="text-cyan-600" /> {meal.prep_time}
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/50 bg-slate-100/50 px-3 py-1.5">
                        <Flame size={16} className="text-orange-500" /> {meal.cook_time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/80 bg-white/50 px-4 py-3 backdrop-blur-xl">
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <CalendarDays size={18} className="text-cyan-600" />
                Week of{" "}
                {weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-bold text-slate-700"
                  onClick={() => {
                    const d = new Date(weekStart);
                    d.setDate(d.getDate() - 7);
                    setWeekStart(d);
                  }}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-bold text-slate-700"
                  onClick={() => setWeekStart(startOfWeek(new Date()))}
                >
                  This week
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-bold text-slate-700"
                  onClick={() => {
                    const d = new Date(weekStart);
                    d.setDate(d.getDate() + 7);
                    setWeekStart(d);
                  }}
                >
                  Next
                </button>
              </div>
            </div>

            {meals.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-300 bg-white/40 px-6 py-12 text-center font-semibold text-slate-500">
                Add recipes before planning the week.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {days.map((day) => {
                  const dateKey = toDateKey(day);
                  return (
                    <div
                      key={dateKey}
                      className="rounded-3xl border border-white/80 bg-white/55 p-4 shadow-sm backdrop-blur-xl"
                    >
                      <p className="mb-3 text-sm font-black uppercase tracking-wide text-slate-600">
                        {day.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <div className="space-y-3">
                        {SLOTS.map((slot) => {
                          const entry = planLookup(dateKey, slot);
                          return (
                            <label key={slot} className="block text-xs font-bold uppercase text-slate-500">
                              {slot}
                              <select
                                className="mt-1 w-full rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-sm font-semibold normal-case text-slate-800 outline-none focus:ring-2 focus:ring-cyan-400"
                                value={entry?.meal_id ?? ""}
                                onChange={(e) => {
                                  const mealId = e.target.value;
                                  if (!mealId) {
                                    mut.clearPlanEntry.mutate({ plan_date: dateKey, slot });
                                    return;
                                  }
                                  mut.upsertPlanEntry.mutate({
                                    plan_date: dateKey,
                                    slot,
                                    meal_id: mealId,
                                  });
                                }}
                              >
                                <option value="">—</option>
                                {meals.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {error && !isMissingMealsTableError(error.message) && (
        <p className="text-center text-red-600">{error.message}</p>
      )}

      {selectedMeal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"
            onClick={() => setSelectedMeal(null)}
            role="presentation"
          />
          <div className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-white bg-white/80 shadow-2xl backdrop-blur-3xl">
            <MealImage mealName={selectedMeal.name} className="h-48 w-full shrink-0" iconSize={48} />
            <div className="relative flex items-start justify-between border-b border-white/50 bg-white/40 px-8 py-8 md:px-10">
              <div className="pr-12">
                <h2 className="mb-4 text-4xl font-black tracking-tight text-slate-800">
                  {selectedMeal.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 md:gap-6 md:text-base">
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-cyan-600" /> Prep: {selectedMeal.prep_time}
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame size={20} className="text-orange-500" /> Cook: {selectedMeal.cook_time}
                  </div>
                  <div className="flex items-center gap-3">
                    <Heart size={20} className="text-rose-500" /> Loved by:
                    <div className="flex -space-x-2">
                      {selectedMeal.likedMemberIds.map((id) => {
                        const member = members.find((m) => m.id === id);
                        if (!member) return null;
                        return (
                          <div
                            key={id}
                            title={member.display_name}
                            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-sm ${colorStyle(member.color_token).solid}`}
                          >
                            {member.display_name.substring(0, 2)}
                          </div>
                        );
                      })}
                      {selectedMeal.likedMemberIds.length === 0 && (
                        <span className="font-normal italic text-slate-400">No one yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMeal(null)}
                className="absolute right-6 top-6 rounded-full border border-white bg-white/50 p-3 text-slate-600 shadow-sm transition-colors hover:bg-slate-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white/20 to-transparent p-8 md:p-10">
              <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                <div className="md:col-span-1">
                  <h3 className="mb-5 inline-block border-b-2 border-cyan-200 pb-2 text-xl font-black text-slate-800">
                    Ingredients
                  </h3>
                  <ul className="space-y-3">
                    {selectedMeal.ingredients.map((ing, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-xl border border-white/60 bg-white/40 p-3"
                      >
                        <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400" />
                        <span className="font-medium leading-tight text-slate-700">{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <h3 className="mb-5 inline-block border-b-2 border-cyan-200 pb-2 text-xl font-black text-slate-800">
                    Instructions
                  </h3>
                  <div className="space-y-4">
                    {selectedMeal.instructions
                      .split("\n")
                      .filter((step) => step.trim() !== "")
                      .map((step, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl border border-white/60 bg-white/40 p-5 font-medium leading-relaxed text-slate-700"
                        >
                          {step}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-white/50 bg-white/40 px-8 py-5 md:px-10">
              <button
                type="button"
                onClick={() => setSelectedMeal(null)}
                className="rounded-full border border-white/80 bg-white/60 px-6 py-3 font-bold text-slate-600 hover:bg-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => openEditForm(selectedMeal)}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-6 py-3 font-bold text-cyan-800 hover:bg-cyan-100"
              >
                <Pencil size={18} />
                Edit meal
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteMeal(selectedMeal)}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-6 py-3 font-bold text-red-700 hover:bg-red-100"
              >
                <Trash2 size={18} />
                Delete meal
              </button>
            </div>
          </div>
        </div>
      )}

      {mealFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md" onClick={closeMealForm} role="presentation" />
          <div className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-white bg-white/80 shadow-2xl backdrop-blur-3xl">
            <div className="flex items-center justify-between border-b border-white/50 bg-white/40 px-8 py-6">
              <h2 className="text-2xl font-black text-slate-800">
                {editingMealId ? "Edit Meal" : "Create New Meal"}
              </h2>
              <button
                type="button"
                onClick={closeMealForm}
                className="rounded-full border border-white bg-white/50 p-2 text-slate-600 hover:bg-red-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-8">
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-500">
                  Meal Name
                </label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  type="text"
                  placeholder="e.g., Spicy Thai Noodles"
                  className="w-full rounded-xl border border-white/80 bg-white/50 px-4 py-3.5 text-lg font-bold text-slate-800 shadow-inner outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                    <Clock size={16} /> Prep Time
                  </label>
                  <input
                    value={formPrep}
                    onChange={(e) => setFormPrep(e.target.value)}
                    type="text"
                    placeholder="e.g., 15m"
                    className="w-full rounded-xl border border-white/80 bg-white/50 px-4 py-3 font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                    <Flame size={16} /> Cook Time
                  </label>
                  <input
                    value={formCook}
                    onChange={(e) => setFormCook(e.target.value)}
                    type="text"
                    placeholder="e.g., 45m"
                    className="w-full rounded-xl border border-white/80 bg-white/50 px-4 py-3 font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  <Heart size={16} /> Who Likes This?
                </label>
                {members.length === 0 ? (
                  <p className="text-sm font-medium text-slate-500">
                    Add people in Roster to track likes.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {members.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleLike(member.id)}
                        className={`rounded-full border-2 px-5 py-2.5 font-bold transition-all ${
                          formLikedBy.includes(member.id)
                            ? "scale-105 border-cyan-400 bg-cyan-500 text-white"
                            : "border-white/80 bg-white/40 text-slate-500 hover:bg-white/80"
                        }`}
                      >
                        {member.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 border-t border-slate-200/50 pt-2 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-500">
                    Ingredients
                  </label>
                  <p className="mb-2 text-xs italic text-slate-400">One ingredient per line.</p>
                  <textarea
                    value={formIngredients}
                    onChange={(e) => setFormIngredients(e.target.value)}
                    rows={6}
                    className="w-full resize-none rounded-xl border border-white/80 bg-white/50 px-4 py-3 font-medium text-slate-800 shadow-inner outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-500">
                    Instructions
                  </label>
                  <p className="mb-2 text-xs italic text-slate-400">One step per line.</p>
                  <textarea
                    value={formInstructions}
                    onChange={(e) => setFormInstructions(e.target.value)}
                    rows={6}
                    className="w-full resize-none rounded-xl border border-white/80 bg-white/50 px-4 py-3 font-medium text-slate-800 shadow-inner outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 border-t border-white/50 bg-white/40 p-6">
              <button
                type="button"
                onClick={closeMealForm}
                className="rounded-full border border-white/80 bg-white/60 px-6 py-3 font-bold text-slate-600 hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveMeal()}
                disabled={mut.createMeal.isPending || mut.updateMeal.isPending}
                className="rounded-full bg-cyan-600 px-8 py-3 font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
              >
                {editingMealId ? "Save changes" : "Save Recipe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
