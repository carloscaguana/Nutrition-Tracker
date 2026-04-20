"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { insertMeal } from "@/features/meals/mealApi";
import { addMealItem } from "@/features/mealItems/mealItemApi";
import { searchFoods } from "@/features/foods/foodApi";
import { getServingUnits, ServingUnit } from "@/features/servingUnits/servingUnitApi";
import { Database } from "@/types/database.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type MealType = Database["public"]["Enums"]["meal_type"];
type FoodRow = Database["public"]["Tables"]["foods"]["Row"];

type SelectedItem = {
  id: string; // local key for list rendering
  food: FoodRow;
  unit: ServingUnit | null; // optional display label only
  quantity_grams: number;   // the actual gram weight the user entered
  kcal: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcKcal(food: FoodRow, grams: number): number {
  return Math.round((grams / 100) * food.kcal_val);
}

function localDatetimeNow(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "drink", label: "Drink" },
  { value: "other", label: "Other" },
];

// ─── Food search panel ────────────────────────────────────────────────────────

function FoodSearchPanel({
  servingUnits,
  onAdd,
}: {
  servingUnits: ServingUnit[];
  onAdd: (item: SelectedItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState<FoodRow | null>(null);
  const [grams, setGrams] = useState<number>(100);
  const [unit, setUnit] = useState<ServingUnit | null>(null); // optional label only
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchFoods(query);
        setResults(data ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setResults([]);
        setExpanded(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectFood(food: FoodRow) {
    setExpanded(food);
    setGrams(100);
    setUnit(null);
    setResults([]);
    setQuery("");
  }

  function handleAdd() {
    if (!expanded || grams <= 0) return;
    onAdd({
      id: `${expanded.food_id}-${Date.now()}`,
      food: expanded,
      unit,
      quantity_grams: grams,
      kcal: calcKcal(expanded, grams),
    });
    setExpanded(null);
    setGrams(100);
    setUnit(null);
  }

  return (
    <div ref={searchRef} className="flex flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setExpanded(null); }}
          placeholder="Search for a food…"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
        />
        {searching && (
          <span className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
        )}
      </div>

      {/* Search results dropdown */}
      {results.length > 0 && (
        <ul className="max-h-56 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
          {results.map((food) => (
            <li key={food.food_id}>
              <button
                type="button"
                onClick={() => selectFood(food)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--background)]"
              >
                <span className="font-medium text-[var(--foreground)]">{food.food_name}</span>
                <span className="shrink-0 text-xs text-[var(--muted)]">{food.kcal_val} kcal / 100g</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Grams + optional label picker (shown after a food is selected) */}
      {expanded && (
        <div className="rounded-xl border border-[var(--brand)]/30 bg-[var(--brand-light)]/30 p-4">
          <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            {expanded.food_name}
            <span className="ml-2 text-xs font-normal text-[var(--muted)]">
              {expanded.kcal_val} kcal / 100g · {expanded.protein_g}g protein · {expanded.carbs_g}g carbs · {expanded.fats_g}g fat
            </span>
          </p>

          <div className="flex items-end gap-3">
            {/* Grams — the only field that drives the calculation */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted)]">Grams</label>
              <input
                type="number"
                min={1}
                step={1}
                value={grams}
                onChange={(e) => setGrams(parseFloat(e.target.value) || 0)}
                className="w-24 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
              />
            </div>

            {/* Label — optional, purely for display purposes */}
            {servingUnits.length > 0 && (
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-xs font-medium text-[var(--muted)]">
                  Label <span className="font-normal">(optional)</span>
                </label>
                <select
                  value={unit?.unit_id ?? ""}
                  onChange={(e) => {
                    const found = servingUnits.find((u) => u.unit_id === Number(e.target.value));
                    setUnit(found ?? null);
                  }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
                >
                  <option value="">— none —</option>
                  {servingUnits.map((u) => (
                    <option key={u.unit_id} value={u.unit_id}>{u.unit_name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Calories preview — driven by grams only */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted)]">Calories</label>
              <p className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--brand)]">
                {calcKcal(expanded, grams)} kcal
              </p>
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setExpanded(null); setQuery(""); }}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--background)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={grams <= 0}
              className="rounded-lg bg-[var(--brand)] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-dark)] disabled:opacity-50"
            >
              Add to meal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewMealPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [timeConsumedAt, setTimeConsumedAt] = useState(localDatetimeNow);
  const [servingUnits, setServingUnits] = useState<ServingUnit[]>([]);
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  // Load serving units once
  useEffect(() => {
    getServingUnits().then(setServingUnits).catch(() => {});
  }, []);

  function addItem(item: SelectedItem) {
    setItems((prev) => [...prev, item]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const totalKcal = items.reduce((sum, i) => sum + i.kcal, 0);

  async function handleSave() {
    if (!user || items.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      // 1. Create the meal row
      const meal = await insertMeal({
        meal_type: mealType,
        time_consumed_at: new Date(timeConsumedAt).toISOString(),
      });

      // 2. Insert all meal items
      await Promise.all(
        items.map((item) =>
          addMealItem({
            meal_id: meal.meal_id,
            food_id: item.food.food_id,
            quantity_grams: item.quantity_grams,
            unit_id: item.unit?.unit_id ?? null,
          })
        )
      );

      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save meal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--brand)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-16 pt-28">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>

        <h1 className="mb-8 text-2xl font-bold tracking-tight">Log a meal</h1>

        {/* ── Section 1: Meal type + time ─────────────────────────────────── */}
        <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">
            Meal details
          </h2>

          {/* Meal type */}
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Type</p>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMealType(value)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                    mealType === value
                      ? "bg-[var(--brand)] text-white shadow-sm"
                      : "border border-[var(--border)] text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & time */}
          <div>
            <label htmlFor="time" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Date &amp; time
            </label>
            <input
              id="time"
              type="datetime-local"
              value={timeConsumedAt}
              onChange={(e) => setTimeConsumedAt(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>
        </section>

        {/* ── Section 2: Food search ──────────────────────────────────────── */}
        <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">
            Add foods
          </h2>
          <FoodSearchPanel servingUnits={servingUnits} onAdd={addItem} />
        </section>

        {/* ── Section 3: Selected items ───────────────────────────────────── */}
        <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">
              Items added
            </h2>
            {items.length > 0 && (
              <span className="rounded-full bg-[var(--brand-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">
                {items.length} food{items.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--muted)]">
              No foods added yet. Search above to get started.
            </p>
          ) : (
            <>
              <ul className="mb-4 divide-y divide-[var(--border)]">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {item.food.food_name}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {item.quantity_grams}g
                        {item.unit ? ` · ${item.unit.unit_name}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[var(--brand)]">
                      {item.kcal} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                      className="shrink-0 rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Totals row */}
              <div className="flex items-center justify-between rounded-xl bg-[var(--background)] px-4 py-3">
                <span className="text-sm font-semibold text-[var(--foreground)]">Total</span>
                <span className="text-base font-bold text-[var(--brand)]">{totalKcal} kcal</span>
              </div>
            </>
          )}
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || items.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving meal…
            </>
          ) : (
            <>
              Save meal
              {items.length > 0 && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {totalKcal} kcal
                </span>
              )}
            </>
          )}
        </button>
      </main>
    </div>
  );
}
