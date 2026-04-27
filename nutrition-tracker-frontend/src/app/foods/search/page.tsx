"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { getAllFoods } from "@/features/foods/foodApi";
import { Database } from "@/types/database.types";

type FoodRow = Database["public"]["Tables"]["foods"]["Row"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MACRO_FIELDS: { label: string; key: keyof FoodRow; unit: string }[] = [
  { label: "Calories", key: "kcal_val", unit: " kcal" },
  { label: "Protein", key: "protein_g", unit: "g" },
  { label: "Carbohydrates", key: "carbs_g", unit: "g" },
  { label: "Sugars", key: "sugars_g", unit: "g" },
  { label: "Dietary Fiber", key: "fiber_g", unit: "g" },
  { label: "Total Fat", key: "fats_g", unit: "g" },
  { label: "Saturated Fat", key: "sat_fats_g", unit: "g" },
  { label: "Monounsaturated Fat", key: "mono_fats_g", unit: "g" },
  { label: "Polyunsaturated Fat", key: "poly_fats_g", unit: "g" },
  { label: "Cholesterol", key: "cholesterol_mg", unit: "mg" },
  { label: "Water", key: "water_g", unit: "g" },
  { label: "Sodium", key: "sodium_g", unit: "g" },
];

const MINERAL_FIELDS: { label: string; key: keyof FoodRow; unit: string }[] = [
  { label: "Calcium", key: "calcium_mg", unit: "mg" },
  { label: "Iron", key: "iron_mg", unit: "mg" },
  { label: "Magnesium", key: "magnesium_mg", unit: "mg" },
  { label: "Phosphorus", key: "phosphorus_mg", unit: "mg" },
  { label: "Potassium", key: "potassium_mg", unit: "mg" },
  { label: "Zinc", key: "zinc_mg", unit: "mg" },
  { label: "Copper", key: "copper_mg", unit: "mg" },
  { label: "Manganese", key: "manganese_mg", unit: "mg" },
  { label: "Selenium", key: "selenium_mg", unit: "mg" },
];

const VITAMIN_FIELDS: { label: string; key: keyof FoodRow; unit: string }[] = [
  { label: "Vitamin A", key: "vit_a_mg", unit: "mg" },
  { label: "Vitamin B1 (Thiamine)", key: "vit_b1_mg", unit: "mg" },
  { label: "Vitamin B2 (Riboflavin)", key: "vit_b2_mg", unit: "mg" },
  { label: "Vitamin B3 (Niacin)", key: "vit_b3_mg", unit: "mg" },
  { label: "Vitamin B5", key: "vit_b5_mg", unit: "mg" },
  { label: "Vitamin B6", key: "vit_b6_mg", unit: "mg" },
  { label: "Vitamin B11 (Folate)", key: "vit_b11_mg", unit: "mg" },
  { label: "Vitamin B12", key: "vit_b12_mg", unit: "mg" },
  { label: "Vitamin C", key: "vit_c_mg", unit: "mg" },
  { label: "Vitamin D", key: "vit_d_mg", unit: "mg" },
  { label: "Vitamin E", key: "vit_e_mg", unit: "mg" },
  { label: "Vitamin K", key: "vit_k_mg", unit: "mg" },
];

// ─── Nutrient group (used inside the expanded row) ────────────────────────────

function NutrientGroup({
  title,
  fields,
  food,
}: {
  title: string;
  fields: { label: string; key: keyof FoodRow; unit: string }[];
  food: FoodRow;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">{title}</p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
        {fields.map(({ label, key, unit }) => (
          <div
            key={String(key)}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1 odd:bg-[var(--background)]"
          >
            <dt className="text-xs text-[var(--muted)]">{label}</dt>
            <dd className="text-xs font-semibold text-[var(--foreground)]">
              {food[key] !== null && food[key] !== undefined
                ? `${food[key]}${unit}`
                : "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ─── Single food row with collapsible detail panel ────────────────────────────

function FoodTableRow({ food }: { food: FoodRow }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer transition-colors hover:bg-[var(--card)]"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="py-3 pl-4 pr-3 text-sm font-medium text-[var(--foreground)]">
          <div className="flex items-center gap-2">
            <svg
              className={`h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-transform ${open ? "rotate-90" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {food.food_name}
          </div>
        </td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">
          {food.kcal_val}
        </td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">
          {food.protein_g}g
        </td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">
          {food.carbs_g}g
        </td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">
          {food.fats_g}g
        </td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">
          {food.fiber_g !== null ? `${food.fiber_g}g` : "—"}
        </td>
        <td className="py-3 pl-3 pr-4 text-right">
          <svg
            className={`ml-auto h-4 w-4 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={7} className="bg-[var(--card)] px-6 pb-5 pt-4">
            <div className="flex flex-col gap-5">
              <p className="text-xs text-[var(--muted)]">
                All values per <strong className="text-[var(--foreground)]">100g</strong> of {food.food_name}
                {food.nutrition_density !== null && (
                  <span className="ml-2 rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                    Nutrition density: {food.nutrition_density}
                  </span>
                )}
              </p>
              <NutrientGroup title="Macronutrients" fields={MACRO_FIELDS} food={food} />
              <NutrientGroup title="Minerals" fields={MINERAL_FIELDS} food={food} />
              <NutrientGroup title="Vitamins" fields={VITAMIN_FIELDS} food={food} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Pagination Helpers ───────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500];

/**
 * Returns an array of page numbers (0-indexed) and `null` for ellipsis gaps.
 * Always shows first, last, and up to 2 pages on either side of current.
 */
function getPageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const pages: (number | null)[] = [];
  const addPage = (p: number) => { if (!pages.includes(p)) pages.push(p); };
  const addEllipsis = () => { if (pages[pages.length - 1] !== null) pages.push(null); };

  addPage(0);
  if (current > 3) addEllipsis();
  for (let i = Math.max(1, current - 2); i <= Math.min(total - 2, current + 2); i++) addPage(i);
  if (current < total - 4) addEllipsis();
  addPage(total - 1);

  return pages;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FoodsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const prevQuery = useRef(query);

  // Reset to page 0 on query or page size change
  useEffect(() => {
    if (prevQuery.current !== query) {
      prevQuery.current = query;
      setPage(0);
    }
  }, [query]);

  useEffect(() => { setPage(0); }, [pageSize]);
  
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  // Fetch foods — debounced on query changes, immediate on page changes
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    setLoadingFoods(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const result = await getAllFoods(page, query, pageSize);
        if (!cancelled) {
          setFoods(result.data);
          setTotalCount(result.count);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : typeof err === "object" && err !== null && "message" in err
              ? String((err as { message: unknown }).message)
              : "Failed to load foods.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoadingFoods(false);
      }
    }, 300);

    return () => {cancelled = true; clearTimeout(timer); };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, page, pageSize, authLoading]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const startEntry = totalCount === 0 ? 0 : page * pageSize + 1;
  const endEntry = Math.min((page + 1) * pageSize, totalCount);
  const pageNumbers = getPageNumbers(page, totalPages);

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

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16 pt-28">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Food database</h1>
          {!loadingFoods && (
            <p className="text-sm text-[var(--muted)]">
              {totalCount.toLocaleString()} food{totalCount !== 1 ? "s" : ""} available
            </p>
          )}
        </div>

        {/* Search + page size selector */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by food name…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-2.5 pl-10 pr-10 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
            />
            {loadingFoods && (
              <span className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
            )}
            {query && !loadingFoods && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Rows per page */}
          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor="page-size" className="text-sm text-[var(--muted)]">Rows per page</label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
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

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--card)]">
                  <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    Food name
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    Calories
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    Protein
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    Carbs
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    Fat
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    Fiber
                  </th>
                  <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
                {loadingFoods && foods.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
                    </td>
                  </tr>
                ) : foods.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-[var(--muted)]">
                      No foods found{query ? ` matching "${query}"` : ""}.
                    </td>
                  </tr>
                ) : (
                  foods.map((food) => <FoodTableRow key={food.food_id} food={food} />)
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-[var(--muted)]">
              {startEntry.toLocaleString()}–{endEntry.toLocaleString()} of {totalCount.toLocaleString()}
            </p>
            {/* Page buttons */}
            <div className="flex items-center gap-1">
              {/* First page */}
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                aria-label="First page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--card)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Previous page */}
              <button
              //<button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--card)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {/* Numbered page buttons */}
              {pageNumbers.map((p, i) =>
                p === null ? (
                  <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-[var(--muted)]">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    aria-label={`Page ${p + 1}`}
                    aria-current={p === page ? "page" : undefined}
                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors ${
                      p === page
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card)]"
                    }`}
                  >
                    {p + 1}
                  </button>
                )
              )}

              {/* Next page */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--card)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {/* Last page */}
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                aria-label="Last page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--card)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
