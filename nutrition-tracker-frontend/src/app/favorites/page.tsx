"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { getFavoriteFoods, addFavorite, removeFavorite } from "@/features/favorites/favoriteApi";
import { getAllFoods } from "@/features/foods/foodApi";
import { Database } from "@/types/database.types";

type FoodRow = Database["public"]["Tables"]["foods"]["Row"];

// ─── Nutrient field definitions ───────────────────────────────────────────────

const MACRO_FIELDS: { label: string; key: keyof FoodRow; unit: string }[] = [
  { label: "Calories",            key: "kcal_val",        unit: " kcal" },
  { label: "Protein",             key: "protein_g",       unit: "g" },
  { label: "Carbohydrates",       key: "carbs_g",         unit: "g" },
  { label: "Sugars",              key: "sugars_g",        unit: "g" },
  { label: "Dietary Fiber",       key: "fiber_g",         unit: "g" },
  { label: "Total Fat",           key: "fats_g",          unit: "g" },
  { label: "Saturated Fat",       key: "sat_fats_g",      unit: "g" },
  { label: "Monounsaturated Fat", key: "mono_fats_g",     unit: "g" },
  { label: "Polyunsaturated Fat", key: "poly_fats_g",     unit: "g" },
  { label: "Cholesterol",         key: "cholesterol_mg",  unit: "mg" },
  { label: "Water",               key: "water_g",         unit: "g" },
  { label: "Sodium",              key: "sodium_g",        unit: "g" },
];

const MINERAL_FIELDS: { label: string; key: keyof FoodRow; unit: string }[] = [
  { label: "Calcium",    key: "calcium_mg",    unit: "mg" },
  { label: "Iron",       key: "iron_mg",       unit: "mg" },
  { label: "Magnesium",  key: "magnesium_mg",  unit: "mg" },
  { label: "Phosphorus", key: "phosphorus_mg", unit: "mg" },
  { label: "Potassium",  key: "potassium_mg",  unit: "mg" },
  { label: "Zinc",       key: "zinc_mg",       unit: "mg" },
  { label: "Copper",     key: "copper_mg",     unit: "mg" },
  { label: "Manganese",  key: "manganese_mg",  unit: "mg" },
  { label: "Selenium",   key: "selenium_mg",   unit: "mg" },
];

const VITAMIN_FIELDS: { label: string; key: keyof FoodRow; unit: string }[] = [
  { label: "Vitamin A",             key: "vit_a_mg",   unit: "mg" },
  { label: "Vitamin B1 (Thiamine)", key: "vit_b1_mg",  unit: "mg" },
  { label: "Vitamin B2 (Riboflavin)", key: "vit_b2_mg", unit: "mg" },
  { label: "Vitamin B3 (Niacin)",   key: "vit_b3_mg",  unit: "mg" },
  { label: "Vitamin B5",            key: "vit_b5_mg",  unit: "mg" },
  { label: "Vitamin B6",            key: "vit_b6_mg",  unit: "mg" },
  { label: "Vitamin B11 (Folate)",  key: "vit_b11_mg", unit: "mg" },
  { label: "Vitamin B12",           key: "vit_b12_mg", unit: "mg" },
  { label: "Vitamin C",             key: "vit_c_mg",   unit: "mg" },
  { label: "Vitamin D",             key: "vit_d_mg",   unit: "mg" },
  { label: "Vitamin E",             key: "vit_e_mg",   unit: "mg" },
  { label: "Vitamin K",             key: "vit_k_mg",   unit: "mg" },
];

// ─── Nutrient group (expandable detail panel) ─────────────────────────────────

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

// ─── Heart icon ───────────────────────────────────────────────────────────────

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return filled ? (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  ) : (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
    </svg>
  );
}

// ─── Favorite food row (top section — always favorited, has remove button) ────

function FavoriteRow({
  food,
  onRemove,
  removing,
}: {
  food: FoodRow;
  onRemove: (id: number) => void;
  removing: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className="transition-colors hover:bg-[var(--card)]">
        {/* Expand toggle */}
        <td
          className="cursor-pointer py-3 pl-4 pr-3 text-sm font-medium text-[var(--foreground)]"
          onClick={() => setOpen((v) => !v)}
        >
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
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">{food.kcal_val}</td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">{food.protein_g}g</td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">{food.carbs_g}g</td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">{food.fats_g}g</td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">
          {food.fiber_g !== null ? `${food.fiber_g}g` : "—"}
        </td>
        {/* Remove button */}
        <td className="py-3 pl-3 pr-4 text-right">
          <button
            onClick={() => onRemove(food.food_id)}
            disabled={removing}
            title="Remove from favorites"
            className="ml-auto flex items-center justify-center rounded-lg p-1.5 text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:hover:bg-rose-950"
          >
            <HeartIcon filled className="h-4 w-4" />
          </button>
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

// ─── Search result row (bottom section — heart toggle) ────────────────────────

function SearchRow({
  food,
  isFavorited,
  onToggle,
  toggling,
}: {
  food: FoodRow;
  isFavorited: boolean;
  onToggle: (id: number, currently: boolean) => void;
  toggling: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className="transition-colors hover:bg-[var(--card)]">
        <td
          className="cursor-pointer py-3 pl-4 pr-3 text-sm font-medium text-[var(--foreground)]"
          onClick={() => setOpen((v) => !v)}
        >
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
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">{food.kcal_val}</td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">{food.protein_g}g</td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">{food.carbs_g}g</td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">{food.fats_g}g</td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">
          {food.fiber_g !== null ? `${food.fiber_g}g` : "—"}
        </td>
        {/* Heart toggle */}
        <td className="py-3 pl-3 pr-4 text-right">
          <button
            onClick={() => onToggle(food.food_id, isFavorited)}
            disabled={toggling}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            className={`ml-auto flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:opacity-40 ${
              isFavorited
                ? "text-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                : "text-[var(--muted)] hover:bg-[var(--card)] hover:text-rose-400"
            }`}
          >
            <HeartIcon filled={isFavorited} className="h-4 w-4" />
          </button>
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

// ─── Shared table shell ───────────────────────────────────────────────────────

function FoodTable({
  children,
  lastColLabel,
}: {
  children: React.ReactNode;
  lastColLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--card)]">
              <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Food name</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Calories</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Protein</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Carbs</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Fat</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Fiber</th>
              <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">{lastColLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Pagination helpers ───────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500];

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

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // ── Favorites state ──────────────────────────────────────────────────────
  const [favoriteFoods, setFavoriteFoods] = useState<FoodRow[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loadingFavs, setLoadingFavs] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  // ── Search / food database state ─────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const prevQuery = useRef(query);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  // ── Load favorites on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user) return;

    setLoadingFavs(true);
    getFavoriteFoods(user.id)
      .then((rows) => {
        const foods = rows
          .map((r) => r.foods as unknown as FoodRow | null)
          .filter((f): f is FoodRow => f !== null);
        setFavoriteFoods(foods);
        setFavoriteIds(new Set(foods.map((f) => f.food_id)));
      })
      .catch(console.error)
      .finally(() => setLoadingFavs(false));
  }, [user, authLoading]);

  // ── Reset page on query / page size change ────────────────────────────────
  useEffect(() => {
    if (prevQuery.current !== query) {
      prevQuery.current = query;
      setPage(0);
    }
  }, [query]);

  useEffect(() => { setPage(0); }, [pageSize]);

  // ── Fetch food database ───────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    setLoadingFoods(true);
    setSearchError(null);

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
          setSearchError(message);
        }
      } finally {
        if (!cancelled) setLoadingFoods(false);
      }
    }, 300);

    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, page, pageSize, authLoading]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleRemoveFavorite(foodId: number) {
    if (!user) return;
    setRemovingId(foodId);
    try {
      await removeFavorite(user.id, foodId);
      setFavoriteFoods((prev) => prev.filter((f) => f.food_id !== foodId));
      setFavoriteIds((prev) => { const next = new Set(prev); next.delete(foodId); return next; });
    } catch (err) {
      console.error("Remove favorite error:", err);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleToggleFavorite(foodId: number, currentlyFavorited: boolean) {
    if (!user) return;
    setTogglingId(foodId);
    try {
      if (currentlyFavorited) {
        await removeFavorite(user.id, foodId);
        setFavoriteFoods((prev) => prev.filter((f) => f.food_id !== foodId));
        setFavoriteIds((prev) => { const next = new Set(prev); next.delete(foodId); return next; });
      } else {
        await addFavorite(user.id, foodId);
        const food = foods.find((f) => f.food_id === foodId);
        if (food) {
          setFavoriteFoods((prev) => [food, ...prev]);
          setFavoriteIds((prev) => new Set([...prev, foodId]));
        }
      }
    } catch (err) {
      console.error("Toggle favorite error:", err);
    } finally {
      setTogglingId(null);
    }
  }

  // ── Derived pagination values ─────────────────────────────────────────────
  const totalPages = Math.ceil(totalCount / pageSize);
  const startEntry = totalCount === 0 ? 0 : page * pageSize + 1;
  const endEntry = Math.min((page + 1) * pageSize, totalCount);
  const pageNumbers = getPageNumbers(page, totalPages);

  // ── Loading screen ────────────────────────────────────────────────────────
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

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Favorite foods</h1>
          <p className="text-sm text-[var(--muted)]">
            Save foods you eat often for quick access when logging meals.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — USER'S FAVORITES
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-12">
          <div className="mb-3 flex items-center gap-2">
            <HeartIcon filled className="h-4 w-4 text-rose-400" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">
              My favorites
              {!loadingFavs && (
                <span className="ml-2 rounded-full bg-[var(--card)] border border-[var(--border)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">
                  {favoriteFoods.length}
                </span>
              )}
            </h2>
          </div>

          {loadingFavs ? (
            <div className="flex justify-center py-12">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
            </div>
          ) : favoriteFoods.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--card)] text-[var(--muted)]">
                <HeartIcon filled={false} className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]">No favorites yet</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Search for foods below and click the{" "}
                <HeartIcon filled={false} className="inline h-3.5 w-3.5 align-middle" />{" "}
                icon to save them here.
              </p>
            </div>
          ) : (
            <FoodTable lastColLabel="Remove">
              {favoriteFoods.map((food) => (
                <FavoriteRow
                  key={food.food_id}
                  food={food}
                  onRemove={handleRemoveFavorite}
                  removing={removingId === food.food_id}
                />
              ))}
            </FoodTable>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — FOOD DATABASE SEARCH
        ═══════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">Food database</h2>
          </div>

          {/* Search bar + page size selector */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                placeholder="Search foods to add as favorites…"
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

            <div className="flex shrink-0 items-center gap-2">
              <label htmlFor="page-size" className="text-sm text-[var(--muted)]">Rows per page</label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
              >
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* Search error */}
          {searchError && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">{searchError}</p>
            </div>
          )}

          {/* Results count */}
          {!loadingFoods && !searchError && (
            <p className="mb-3 text-sm text-[var(--muted)]">
              {totalCount.toLocaleString()} food{totalCount !== 1 ? "s" : ""} found
              {query ? ` for "${query}"` : ""}
            </p>
          )}

          {/* Food table */}
          <FoodTable lastColLabel="Favorite">
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
              foods.map((food) => (
                <SearchRow
                  key={food.food_id}
                  food={food}
                  isFavorited={favoriteIds.has(food.food_id)}
                  onToggle={handleToggleFavorite}
                  toggling={togglingId === food.food_id}
                />
              ))
            )}
          </FoodTable>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <p className="text-sm text-[var(--muted)]">
                {startEntry.toLocaleString()}–{endEntry.toLocaleString()} of {totalCount.toLocaleString()}
              </p>

              <div className="flex items-center gap-1">
                {/* First */}
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

                {/* Previous */}
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Previous page"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--card)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Numbered buttons */}
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

                {/* Next */}
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

                {/* Last */}
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
        </section>

      </main>
    </div>
  );
}
