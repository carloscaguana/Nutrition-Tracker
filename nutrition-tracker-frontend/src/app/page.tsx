"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { getTodaysMealsWithItems, getPastMealsWithItems, deleteMeal } from "@/features/meals/mealApi";
import { deleteAllMealItems } from "@/features/mealItems/mealItemApi";
import { getActiveGoal } from "@/features/goals/goalApi";
import { getWeightLogs } from "@/features/weightLogs/weightLogApi";
import { Database } from "@/types/database.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type MealRow = Database["public"]["Tables"]["meals"]["Row"];
type FoodRow = Database["public"]["Tables"]["foods"]["Row"];
type ServingUnitRow = Database["public"]["Tables"]["serving_units"]["Row"];
type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type WeightLogRow = Database["public"]["Tables"]["weight_logs"]["Row"];

type MealItem = {
  mealitem_id: number;
  quantity_grams: number;
  foods: FoodRow | null;
  serving_units: ServingUnitRow | null;
};

type MealWithItems = MealRow & { meal_items: MealItem[] };

// ─── Macro helpers ─────────────────────────────────────────────────────────────

function computeItemKcal(item: MealItem): number {
  const food = item.foods;
  if (!food) return 0;
  return (item.quantity_grams / 100) * food.kcal_val;
}

function computeItemMacro(item: MealItem, field: keyof FoodRow): number {
  const food = item.foods;
  if (!food || food[field] == null) return 0;
  return (item.quantity_grams / 100) * (food[field] as number);
}

function sumMacros(meals: MealWithItems[]) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0;
  for (const meal of meals) {
    for (const item of meal.meal_items) {
      kcal    += computeItemKcal(item);
      protein += computeItemMacro(item, "protein_g");
      carbs   += computeItemMacro(item, "carbs_g");
      fat     += computeItemMacro(item, "fats_g");
    }
  }
  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

function mealKcal(meal: MealWithItems): number {
  return Math.round(meal.meal_items.reduce((sum, item) => sum + computeItemKcal(item), 0));
}

// ─── Greeting helper ──────────────────────────────────────────────────────────

function getGreeting(user: User): string {
  const name =
    (user.user_metadata?.name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there";
  const hour = new Date().getHours();
  const salutation =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${salutation}, ${name}!`;
}

// ─── Dashboard view ───────────────────────────────────────────────────────────

const HISTORY_PREVIEW_LIMIT = 10;

function Dashboard({ user }: { user: User }) {
  const [meals, setMeals] = useState<MealWithItems[]>([]);
  const [pastMeals, setPastMeals] = useState<MealWithItems[]>([]);
  const [pastMealTotal, setPastMealTotal] = useState(0);
  const [goal, setGoal] = useState<GoalRow | null>(null);
  const [latestWeight, setLatestWeight] = useState<WeightLogRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [mealsData, weightData, pastData] = await Promise.all([
          getTodaysMealsWithItems(),
          getWeightLogs(user.id),
          getPastMealsWithItems(HISTORY_PREVIEW_LIMIT + 1), // fetch one extra to know if "See all" is needed
        ]);
        setMeals((mealsData as MealWithItems[]) ?? []);
        setLatestWeight(weightData?.[0] ?? null);

        const past = (pastData as MealWithItems[]) ?? [];
        setPastMealTotal(past.length);
        setPastMeals(past.slice(0, HISTORY_PREVIEW_LIMIT));

        // Goal fetch may fail if no active goal exists
        try {
          const goalData = await getActiveGoal(user.id);
          setGoal(goalData);
        } catch {
          setGoal(null);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  const totals = sumMacros(meals);

  const macros = [
    { label: "Calories", value: totals.kcal,    target: goal?.calorie_target ?? null, unit: "kcal", color: "bg-[var(--brand)]" },
    { label: "Protein",  value: totals.protein,  target: goal?.protein_target ?? null, unit: "g",    color: "bg-blue-400" },
    { label: "Carbs",    value: totals.carbs,    target: goal?.carb_target    ?? null, unit: "g",    color: "bg-amber-400" },
    { label: "Fat",      value: totals.fat,      target: goal?.fat_target     ?? null, unit: "g",    color: "bg-rose-400" },
  ];

  const mealTypeLabel: Record<string, string> = {
    breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner",
    snack: "Snack", drink: "Drink", other: "Other",
  };

  async function handleDeleteMeal(mealId: number) {
    if (!window.confirm("Delete this meal and all its items?")) return;
    try {
      await deleteAllMealItems(mealId);
      await deleteMeal(mealId);
      setMeals((prev) => prev.filter((m) => m.meal_id !== mealId));
    } catch (err) {
      console.error("Delete meal error:", err);
    }
  }

  async function handleDeletePastMeal(mealId: number) {
    if (!window.confirm("Delete this meal and all its items?")) return;
    try {
      await deleteAllMealItems(mealId);
      await deleteMeal(mealId);
      setPastMeals((prev) => prev.filter((m) => m.meal_id !== mealId));
    } catch (err) {
      console.error("Delete meal error:", err);
    }
  }

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--brand)]" />
      </div>
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-28 pt-8">

        {/* ── Greeting ───────────────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-sm text-[var(--muted)]">{todayLabel}</p>
          <h1 className="text-3xl font-bold tracking-tight">{getGreeting(user)}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {totals.kcal > 0
              ? `You've logged ${totals.kcal} kcal so far today.`
              : "You haven't logged any meals yet today."}
          </p>
        </div>

        {/* ── Prominent log-meal CTA (shown when no meals exist) ─────────── */}
        {meals.length === 0 && (
          <Link
            href="/meals/new"
            className="group mb-8 flex items-center gap-4 rounded-2xl border-2 border-dashed border-[var(--brand)]/40 bg-[var(--brand-light)]/30 p-5 transition-all hover:border-[var(--brand)] hover:bg-[var(--brand-light)]/60"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-white shadow-sm transition-colors group-hover:bg-[var(--brand-dark)]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <div className="flex-1">
              <p className="font-semibold text-[var(--foreground)]">Log your first meal today</p>
              <p className="text-sm text-[var(--muted)]">Search foods, set portions, and track your intake</p>
            </div>
            <svg className="h-5 w-5 shrink-0 text-[var(--muted)] transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {/* ── Macro cards ────────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {macros.map((m) => {
            const pct = m.target ? Math.min(100, Math.round((m.value / m.target) * 100)) : null;
            return (
              <div key={m.label} className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                <span className="text-xs text-[var(--muted)]">{m.label}</span>
                <span className="text-2xl font-bold">
                  {m.value}
                  <span className="ml-0.5 text-xs font-normal text-[var(--muted)]">{m.unit}</span>
                </span>
                {pct !== null ? (
                  <>
                    <div className="h-1.5 w-full rounded-full bg-[var(--border)]">
                      <div className={`h-1.5 rounded-full transition-all ${m.color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-[var(--muted)]">{pct}% of {m.target}{m.unit}</span>
                  </>
                ) : (
                  <span className="text-xs text-[var(--muted)]">No goal set</span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Meals list ─────────────────────────────────────────────────── */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">Today's meals</h2>
            {meals.length > 0 && (
              <Link
                href="/meals/new"
                className="flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add meal
              </Link>
            )}
          </div>

          {meals.length === 0 ? (
            <p className="py-2 text-sm text-[var(--muted)]">No meals logged yet — use the button above to get started.</p>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => (
                <div key={meal.meal_id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-lg bg-[var(--brand-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">
                      {mealTypeLabel[meal.meal_type ?? "other"]}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--muted)]">{mealKcal(meal)} kcal</span>
                      <Link
                        href={`/meals/${meal.meal_id}/edit`}
                        className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                        aria-label="Edit meal"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDeleteMeal(meal.meal_id)}
                        className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-red-500"
                        aria-label="Delete meal"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {meal.meal_items.length === 0 ? (
                    <p className="text-xs text-[var(--muted)]">No items added.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {meal.meal_items.map((item) => (
                        <li key={item.mealitem_id} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--foreground)]">{item.foods?.food_name ?? "Unknown food"}</span>
                          <span className="text-[var(--muted)]">
                            {item.quantity_grams}g
                            {item.serving_units ? ` · ${item.serving_units.unit_name}` : ""}
                            {" · "}{Math.round(computeItemKcal(item))} kcal
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Meal history preview ───────────────────────────────────────── */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">Meal history</h2>
            {pastMealTotal > HISTORY_PREVIEW_LIMIT && (
              <Link
                href="/meals/history"
                className="flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                See all
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          {pastMeals.length === 0 ? (
            <p className="py-2 text-sm text-[var(--muted)]">No past meals logged yet.</p>
          ) : (
            <div className="space-y-3">
              {pastMeals.map((meal, idx) => {
                // Insert a date divider whenever the day changes
                const mealDate = new Date(meal.time_consumed_at).toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                });
                const prevDate = idx > 0
                  ? new Date(pastMeals[idx - 1].time_consumed_at).toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                    })
                  : null;
                const showDateDivider = mealDate !== prevDate;

                return (
                  <div key={meal.meal_id}>
                    {showDateDivider && (
                      <p className="mb-2 mt-4 first:mt-0 text-xs font-semibold text-[var(--muted)]">{mealDate}</p>
                    )}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-[var(--brand-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">
                            {mealTypeLabel[meal.meal_type ?? "other"]}
                          </span>
                          <span className="text-xs text-[var(--muted)]">
                            {new Date(meal.time_consumed_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--muted)]">{mealKcal(meal)} kcal</span>
                          <Link
                            href={`/meals/${meal.meal_id}/edit`}
                            className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                            aria-label="Edit meal"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDeletePastMeal(meal.meal_id)}
                            className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-red-500"
                            aria-label="Delete meal"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {meal.meal_items.length === 0 ? (
                        <p className="text-xs text-[var(--muted)]">No items added.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {meal.meal_items.map((item) => (
                            <li key={item.mealitem_id} className="flex items-center justify-between text-sm">
                              <span className="text-[var(--foreground)]">{item.foods?.food_name ?? "Unknown food"}</span>
                              <span className="text-[var(--muted)]">
                                {item.quantity_grams}g
                                {item.serving_units ? ` · ${item.serving_units.unit_name}` : ""}
                                {" · "}{Math.round(computeItemKcal(item))} kcal
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Bottom stats ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="mb-1 text-xs text-[var(--muted)]">Current weight</p>
            {latestWeight ? (
              <>
                <p className="text-2xl font-bold">
                  {latestWeight.weight_kg}
                  <span className="ml-0.5 text-xs font-normal text-[var(--muted)]">kg</span>
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {new Date(latestWeight.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--muted)]">No entries yet</p>
            )}
          </div>
          <Link
            href="/goals"
            className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--brand)]/50"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-[var(--muted)]">Active goal</p>
              <svg className="h-3.5 w-3.5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {goal ? (
              <>
                <p className="text-2xl font-bold capitalize">{goal.goal_type ?? "Custom"}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{goal.calorie_target} kcal / day</p>
                {(goal.protein_target || goal.carb_target || goal.fat_target) && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {goal.protein_target && (
                      <span className="text-xs text-[var(--muted)]">P: {goal.protein_target}g</span>
                    )}
                    {goal.carb_target && (
                      <span className="text-xs text-[var(--muted)]">C: {goal.carb_target}g</span>
                    )}
                    {goal.fat_target && (
                      <span className="text-xs text-[var(--muted)]">F: {goal.fat_target}g</span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--muted)]">No active goal</p>
                <p className="mt-1 text-xs text-[var(--brand)]">+ Set a goal</p>
              </>
            )}
          </Link>
        </div>

      </main>

      {/* ── Floating action button (always visible) ──────────────────────── */}
      <Link
        href="/meals/new"
        aria-label="Log a meal"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 hover:bg-[var(--brand-dark)] active:scale-95"
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </>
  );
}

// ─── Landing page (unauthenticated) ──────────────────────────────────────────

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: "Meal Logging",
    description: "Log every meal with ease — breakfast, lunch, dinner, snacks, and drinks.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
    ),
    title: "Food Database",
    description: "Search a comprehensive database with 30+ nutritional data points per food.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Nutrition Goals",
    description: "Set personalized calorie and macro targets for deficit, maintenance, or surplus.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Weight Tracking",
    description: "Monitor your progress over time with a clean weight history log.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
      </svg>
    ),
    title: "Favorite Foods",
    description: "Save your go-to foods for lightning-fast logging every day.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: "Personal Profile",
    description: "Set your age, height, and activity level for smarter goal recommendations.",
  },
];

function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-40 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[500px] w-[700px] rounded-full bg-[var(--brand)] opacity-[0.08] blur-3xl" />
        </div>

        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--brand-light)] bg-[var(--brand-light)] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--brand)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
          Nutrition made simple
        </span>

        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Track what you eat.
          <br />
          <span className="text-[var(--brand)]">Fuel the life you want.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
          NutriTrack makes logging meals, hitting your macros, and watching your progress feel effortless.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-full bg-[var(--brand)] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-[var(--brand-dark)]"
          >
            Start tracking for free
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 rounded-full border border-[var(--border)] px-7 py-3.5 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--card)]"
          >
            See features
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold tracking-tight">Everything you need to succeed</h2>
            <p className="mt-4 text-lg text-[var(--muted)]">Powerful tools, zero complexity.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--brand)] hover:shadow-lg hover:shadow-[var(--brand)]/10"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-light)] text-[var(--brand)] transition-colors group-hover:bg-[var(--brand)] group-hover:text-white">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--muted)]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--brand-light)] via-[var(--card)] to-[var(--card)] p-12 text-center">
          <h2 className="text-4xl font-bold tracking-tight">Ready to take control?</h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-[var(--muted)]">
            Join NutriTrack today and start building habits that move the needle.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-[var(--brand-dark)]"
          >
            Get started — it's free
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--brand)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />
      <div className="flex flex-1 flex-col pt-16">
        {user ? <Dashboard user={user} /> : <LandingPage />}
      </div>
    </div>
  );
}
