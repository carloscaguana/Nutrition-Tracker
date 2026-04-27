"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { getAllPastMealsWithItems, deleteMeal } from "@/features/meals/mealApi";
import { deleteAllMealItems } from "@/features/mealItems/mealItemApi";
import { Database } from "@/types/database.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type MealRow = Database["public"]["Tables"]["meals"]["Row"];
type FoodRow = Database["public"]["Tables"]["foods"]["Row"];
type ServingUnitRow = Database["public"]["Tables"]["serving_units"]["Row"];

type MealItem = {
  mealitem_id: number;
  quantity_grams: number;
  foods: FoodRow | null;
  serving_units: ServingUnitRow | null;
};

type MealWithItems = MealRow & { meal_items: MealItem[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeItemKcal(item: MealItem): number {
  const food = item.foods;
  if (!food) return 0;
  return (item.quantity_grams / 100) * food.kcal_val;
}

function mealKcal(meal: MealWithItems): number {
  return Math.round(meal.meal_items.reduce((sum, item) => sum + computeItemKcal(item), 0));
}

const mealTypeLabel: Record<string, string> = {
  breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner",
  snack: "Snack", drink: "Drink", other: "Other",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function dateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US");
}

// ─── Meal card ────────────────────────────────────────────────────────────────

function MealCard({
  meal,
  onDelete,
}: {
  meal: MealWithItems;
  onDelete: (id: number) => void;
}) {
  const kcal = mealKcal(meal);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-[var(--brand-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">
            {mealTypeLabel[meal.meal_type ?? "other"]}
          </span>
          <span className="text-xs text-[var(--muted)]">{formatTime(meal.time_consumed_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--muted)]">{kcal} kcal</span>
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
            onClick={() => onDelete(meal.meal_id)}
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
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MealHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [meals, setMeals] = useState<MealWithItems[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getAllPastMealsWithItems(page)
      .then((result) => {
        if (!cancelled) {
          setMeals((result.data as MealWithItems[]) ?? []);
          setTotalCount(result.count);
          setPageSize(result.pageSize);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message
            : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to load meal history.";
          setError(message);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, authLoading]);

  async function handleDelete(mealId: number) {
    if (!window.confirm("Delete this meal and all its items?")) return;
    try {
      await deleteAllMealItems(mealId);
      await deleteMeal(mealId);
      setMeals((prev) => prev.filter((m) => m.meal_id !== mealId));
      setTotalCount((c) => c - 1);
    } catch (err) {
      console.error("Delete meal error:", err);
    }
  }

  // Group meals by calendar date for display
  const groups: { dateLabel: string; meals: MealWithItems[] }[] = [];
  for (const meal of meals) {
    const key = dateKey(meal.time_consumed_at);
    const last = groups[groups.length - 1];
    if (last && dateKey(last.meals[0].time_consumed_at) === key) {
      last.meals.push(meal);
    } else {
      groups.push({ dateLabel: formatDate(meal.time_consumed_at), meals: [meal] });
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize);
  const startEntry = totalCount === 0 ? 0 : page * pageSize + 1;
  const endEntry = Math.min((page + 1) * pageSize, totalCount);

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

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16 pt-28">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to dashboard
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Meal history</h1>
            {!loading && totalCount > 0 && (
              <p className="mt-1 text-sm text-[var(--muted)]">
                {totalCount.toLocaleString()} meal{totalCount !== 1 ? "s" : ""} logged
              </p>
            )}
          </div>
          <Link
            href="/meals/new"
            className="flex items-center gap-1.5 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-dark)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Log meal
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--brand)]" />
          </div>
        )}

        {/* Empty state */}
        {!loading && meals.length === 0 && !error && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[var(--border)] py-16 text-center">
            <svg className="h-10 w-10 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div>
              <p className="font-semibold text-[var(--foreground)]">No meal history yet</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Meals you log will appear here after today.</p>
            </div>
            <Link
              href="/meals/new"
              className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-dark)]"
            >
              Log your first meal
            </Link>
          </div>
        )}

        {/* Meals grouped by date */}
        {!loading && groups.length > 0 && (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.dateLabel}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  {group.dateLabel}
                </p>
                <div className="space-y-3">
                  {group.meals.map((meal) => (
                    <MealCard key={meal.meal_id} meal={meal} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">
              {startEntry.toLocaleString()}–{endEntry.toLocaleString()} of {totalCount.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--card)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <span className="text-sm text-[var(--muted)]">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--card)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
