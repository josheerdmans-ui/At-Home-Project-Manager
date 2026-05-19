import { useState } from "react";
import { ChefHat, Clock, Flame, Heart, Pencil, Plus, Trash2, X } from "lucide-react";

const FAMILY_MEMBERS = ["Dad", "Mom", "Mila", "Cora", "Max"] as const;
type FamilyMember = (typeof FAMILY_MEMBERS)[number];

type Meal = {
  id: number;
  name: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  instructions: string;
  likedBy: string[];
};

const INITIAL_MEALS: Meal[] = [
  {
    id: 1,
    name: "Baja Fish Tacos",
    prepTime: "20m",
    cookTime: "15m",
    ingredients: [
      "White fish fillets",
      "Corn tortillas",
      "Cabbage slaw",
      "Lime crema",
      "Fresh Cilantro",
      "Avocado",
    ],
    instructions:
      "1. Season the fish fillets with cumin, chili powder, and salt.\n2. Grill or pan-sear the fish until flaky.\n3. Warm the corn tortillas on a skillet.\n4. Assemble tacos: layer fish, slaw, avocado, and drizzle with lime crema.",
    likedBy: ["Dad", "Mom", "Cora"],
  },
  {
    id: 2,
    name: "Spaghetti Bolognese",
    prepTime: "15m",
    cookTime: "45m",
    ingredients: [
      "Ground beef (80/20)",
      "Yellow onion & Garlic",
      "Crushed San Marzano tomatoes",
      "Spaghetti pasta",
      "Parmesan cheese",
      "Olive oil",
    ],
    instructions:
      "1. Finely dice the onion and mince garlic.\n2. Brown the ground beef in a large pot with olive oil, onion, and garlic.\n3. Pour in crushed tomatoes, reduce heat, and simmer for 30 minutes.\n4. Boil pasta in salted water until al dente.\n5. Combine pasta with sauce and top with grated parmesan.",
    likedBy: ["Dad", "Mila", "Max"],
  },
  {
    id: 3,
    name: "Homemade Pizza Night",
    prepTime: "30m",
    cookTime: "12m",
    ingredients: [
      "Pizza dough (store-bought or homemade)",
      "Marinara sauce",
      "Shredded Mozzarella",
      "Pepperoni slices",
      "Fresh basil",
      "Cornmeal (for dusting)",
    ],
    instructions:
      "1. Preheat oven to 500°F (or highest setting) with a pizza stone inside if you have one.\n2. Stretch the dough out on a surface dusted with cornmeal.\n3. Spread marinara sauce evenly, leaving a crust edge.\n4. Add mozzarella and pepperoni.\n5. Bake for 10-12 minutes until crust is golden brown and cheese is bubbly.",
    likedBy: ["Dad", "Mom", "Mila", "Cora", "Max"],
  },
  {
    id: 4,
    name: "Chicken Teriyaki Bowls",
    prepTime: "10m",
    cookTime: "20m",
    ingredients: [
      "Chicken breasts (cubed)",
      "Teriyaki sauce",
      "Jasmine rice",
      "Broccoli florets",
      "Sesame seeds",
    ],
    instructions:
      "1. Start cooking the jasmine rice in a rice cooker or pot.\n2. Sauté chicken cubes in a pan until cooked through.\n3. Steam the broccoli florets until tender-crisp.\n4. Pour teriyaki sauce over the chicken and simmer until it thickens and coats the meat.\n5. Serve chicken and broccoli over rice, garnished with sesame seeds.",
    likedBy: ["Mom", "Cora", "Max"],
  },
];

function getAvatarColor(name: string): string {
  switch (name) {
    case "Dad":
      return "bg-indigo-500";
    case "Mom":
      return "bg-rose-500";
    case "Mila":
      return "bg-pink-400";
    case "Cora":
      return "bg-amber-400";
    case "Max":
      return "bg-emerald-500";
    default:
      return "bg-slate-500";
  }
}

export function KitchenRoom() {
  const [meals, setMeals] = useState<Meal[]>(INITIAL_MEALS);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [mealFormOpen, setMealFormOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState<number | null>(null);

  const [formName, setFormName] = useState("");
  const [formPrep, setFormPrep] = useState("");
  const [formCook, setFormCook] = useState("");
  const [formIngredients, setFormIngredients] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const [formLikedBy, setFormLikedBy] = useState<string[]>([]);

  const toggleLike = (member: FamilyMember) => {
    setFormLikedBy((prev) =>
      prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member],
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

  const openEditForm = (meal: Meal) => {
    setEditingMealId(meal.id);
    setFormName(meal.name);
    setFormPrep(meal.prepTime === "N/A" ? "" : meal.prepTime);
    setFormCook(meal.cookTime === "N/A" ? "" : meal.cookTime);
    setFormIngredients(meal.ingredients.join("\n"));
    setFormInstructions(meal.instructions);
    setFormLikedBy([...meal.likedBy]);
    setSelectedMeal(null);
    setMealFormOpen(true);
  };

  const handleSaveMeal = () => {
    if (!formName.trim()) return;

    const mealData: Omit<Meal, "id"> = {
      name: formName.trim(),
      prepTime: formPrep || "N/A",
      cookTime: formCook || "N/A",
      ingredients: formIngredients.split("\n").filter((i) => i.trim() !== ""),
      instructions: formInstructions,
      likedBy: formLikedBy,
    };

    if (editingMealId !== null) {
      setMeals((prev) =>
        prev.map((m) => (m.id === editingMealId ? { ...mealData, id: editingMealId } : m)),
      );
    } else {
      setMeals((prev) => [{ ...mealData, id: Date.now() }, ...prev]);
    }
    closeMealForm();
  };

  const handleDeleteMeal = (meal: Meal) => {
    if (!confirm(`Delete "${meal.name}"?`)) return;
    setMeals((prev) => prev.filter((m) => m.id !== meal.id));
    setSelectedMeal(null);
  };

  return (
    <div className="relative z-10 min-h-full w-full p-12 pb-24">
      <div className="mb-10 flex flex-col gap-6 pr-44 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-white/50 bg-cyan-100 p-4 text-cyan-700 shadow-inner">
            <ChefHat size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-800">Recipe Vault</h1>
            <p className="text-lg font-medium text-slate-500">Manage meals and family preferences.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-8 py-3.5 font-bold text-white shadow-[0_8px_20px_rgba(8,145,178,0.3)] transition-all hover:bg-cyan-500"
        >
          <Plus size={20} /> Add New Meal
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-12 md:grid-cols-2 lg:grid-cols-3">
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
            className="group cursor-pointer rounded-3xl border border-white/80 bg-white/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/80 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)]"
          >
            <div className="mb-6 flex items-start justify-between">
              <div className="rounded-2xl border border-white/80 bg-white/60 p-3 text-cyan-700 shadow-sm transition-colors group-hover:bg-cyan-100">
                <ChefHat size={28} />
              </div>
              <div className="flex -space-x-2">
                {meal.likedBy.map((member) => (
                  <div
                    key={member}
                    title={member}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white shadow-sm ${getAvatarColor(member)}`}
                  >
                    {member.substring(0, 2)}
                  </div>
                ))}
              </div>
            </div>
            <h3 className="mb-3 text-2xl font-black text-slate-800 transition-colors group-hover:text-cyan-700">
              {meal.name}
            </h3>
            <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/50 bg-slate-100/50 px-3 py-1.5">
                <Clock size={16} className="text-cyan-600" /> {meal.prepTime}
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/50 bg-slate-100/50 px-3 py-1.5">
                <Flame size={16} className="text-orange-500" /> {meal.cookTime}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedMeal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"
            onClick={() => setSelectedMeal(null)}
            role="presentation"
          />
          <div className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-white bg-white/80 shadow-2xl backdrop-blur-3xl">
            <div className="relative flex items-start justify-between border-b border-white/50 bg-white/40 px-8 py-8 md:px-10">
              <div className="pr-12">
                <h2 className="mb-4 text-4xl font-black tracking-tight text-slate-800">
                  {selectedMeal.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 md:gap-6 md:text-base">
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-cyan-600" /> Prep: {selectedMeal.prepTime}
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame size={20} className="text-orange-500" /> Cook: {selectedMeal.cookTime}
                  </div>
                  <div className="hidden h-6 w-px bg-slate-300 md:block" />
                  <div className="flex items-center gap-3">
                    <Heart size={20} className="text-rose-500" /> Loved by:
                    <div className="flex -space-x-2">
                      {selectedMeal.likedBy.map((member) => (
                        <div
                          key={member}
                          title={member}
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-sm ${getAvatarColor(member)}`}
                        >
                          {member.substring(0, 2)}
                        </div>
                      ))}
                      {selectedMeal.likedBy.length === 0 && (
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
                        <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
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
                className="rounded-full border border-white/80 bg-white/60 px-6 py-3 font-bold text-slate-600 transition-colors hover:bg-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => openEditForm(selectedMeal)}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-6 py-3 font-bold text-cyan-800 transition-colors hover:bg-cyan-100"
              >
                <Pencil size={18} />
                Edit meal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMeal(selectedMeal)}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-6 py-3 font-bold text-red-700 transition-colors hover:bg-red-100"
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
                {editingMealId !== null ? "Edit Meal" : "Create New Meal"}
              </h2>
              <button
                type="button"
                onClick={closeMealForm}
                className="rounded-full border border-white bg-white/50 p-2 text-slate-600 transition-colors hover:bg-red-500 hover:text-white"
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
                  className="w-full rounded-xl border border-white/80 bg-white/50 px-4 py-3.5 text-lg font-bold text-slate-800 shadow-inner outline-none transition-all focus:bg-white focus:ring-2 focus:ring-cyan-400"
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
                    className="w-full rounded-xl border border-white/80 bg-white/50 px-4 py-3 font-medium text-slate-800 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-cyan-400"
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
                    className="w-full rounded-xl border border-white/80 bg-white/50 px-4 py-3 font-medium text-slate-800 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  <Heart size={16} /> Who Likes This?
                </label>
                <div className="flex flex-wrap gap-3">
                  {FAMILY_MEMBERS.map((member) => (
                    <button
                      key={member}
                      type="button"
                      onClick={() => toggleLike(member)}
                      className={`rounded-full border-2 px-5 py-2.5 font-bold transition-all duration-300 ${
                        formLikedBy.includes(member)
                          ? "scale-105 border-cyan-400 bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                          : "border-white/80 bg-white/40 text-slate-500 hover:bg-white/80"
                      }`}
                    >
                      {member}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 border-t border-slate-200/50 pt-2 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-500">
                    Ingredients
                  </label>
                  <p className="mb-2 text-xs italic text-slate-400">Put one ingredient per line.</p>
                  <textarea
                    value={formIngredients}
                    onChange={(e) => setFormIngredients(e.target.value)}
                    rows={6}
                    className="w-full resize-none rounded-xl border border-white/80 bg-white/50 px-4 py-3 font-medium text-slate-800 shadow-inner outline-none transition-all focus:bg-white focus:ring-2 focus:ring-cyan-400"
                    placeholder={"2 cups flour\n1 tsp salt\n1/2 cup olive oil..."}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-500">
                    Instructions
                  </label>
                  <p className="mb-2 text-xs italic text-slate-400">Break steps into lines or paragraphs.</p>
                  <textarea
                    value={formInstructions}
                    onChange={(e) => setFormInstructions(e.target.value)}
                    rows={6}
                    className="w-full resize-none rounded-xl border border-white/80 bg-white/50 px-4 py-3 font-medium text-slate-800 shadow-inner outline-none transition-all focus:bg-white focus:ring-2 focus:ring-cyan-400"
                    placeholder={
                      "1. Mix dry ingredients in a bowl.\n2. Add oil and water.\n3. Knead dough for 5 minutes..."
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 rounded-b-[2rem] border-t border-white/50 bg-white/40 p-6">
              <button
                type="button"
                onClick={closeMealForm}
                className="rounded-full border border-white/80 bg-white/60 px-6 py-3 font-bold text-slate-600 transition-colors hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMeal}
                className="flex items-center gap-2 rounded-full bg-cyan-600 px-8 py-3 font-bold text-white shadow-[0_8px_20px_rgba(8,145,178,0.3)] transition-all hover:bg-cyan-500"
              >
                {editingMealId !== null ? "Save changes" : "Save Recipe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
