"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import {
  getAllGoals,
  insertGoal,
  updateGoal,
  deleteGoal,
} from "@/features/goals/goalApi";
import { Database } from "@/types/database.types";

type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type GoalType = Database["public"]["Enums"]["goal_type"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GOAL_TYPES: { value: GoalType; label: string; description: string }[] = [
  { value: "deficit",     label: "Deficit",     description: "Eat below maintenance to lose weight" },
  { value: "maintenance", label: "Maintenance", description: "Eat at maintenance to stay the same" },
  { value: "surplus",     label: "Surplus",     description: "Eat above maintenance to gain weight" },
  { value: "other",       label: "Other",       description: "Custom goal" },
];

/** Local-timezone date, not UTC. */
function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * The current goal is whichever goal has the most recent start_date on or
 * before today. We compare by start_date only — end_date is not reliable
 * for this check because Supabase can return the sentinel "9999-12-31" as a
 * full timestamp string, breaking both equality and range comparisons.
 */
function currentGoalId(goals: GoalRow[]): number | null {
  const today = todayISO();
  const started = goals.filter((g) => g.start_date.slice(0, 10) <= today);
  if (started.length === 0) return null;
  // goals are already ordered start_date DESC from getAllGoals, so first match wins
  return started[0].goal_id;
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function extractError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err)
    return String((err as { message: unknown }).message);
  return "An unexpected error occurred.";
}

// ─── Empty form state ─────────────────────────────────────────────────────────

// Sentinel used as end_date for the "current" goal — effectively means "no end"
const OPEN_END = "9999-01-01";

type FormState = {
  goal_type: GoalType;
  calorie_target: string;
  protein_target: string;
  carb_target: string;
  fat_target: string;
};

function emptyForm(): FormState {
  return {
    goal_type: "maintenance",
    calorie_target: "",
    protein_target: "",
    carb_target: "",
    fat_target: "",
  };
}

function formFromGoal(g: GoalRow): FormState {
  return {
    goal_type: g.goal_type ?? "other",
    calorie_target: String(g.calorie_target),
    protein_target: g.protein_target !== null ? String(g.protein_target) : "",
    carb_target: g.carb_target !== null ? String(g.carb_target) : "",
    fat_target: g.fat_target !== null ? String(g.fat_target) : "",
  };
}

// ─── Goal form ────────────────────────────────────────────────────────────────

function GoalForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: FormState;
  onSave: (f: FormState) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mb-8 rounded-2xl border border-[var(--brand)]/30 bg-[var(--card)] p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">
        Goal details
      </h2>

      {/* Goal type */}
      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Type</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GOAL_TYPES.map(({ value, label, description }) => (
            <button
              key={value}
              type="button"
              onClick={() => set("goal_type", value)}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                form.goal_type === value
                  ? "border-[var(--brand)] bg-[var(--brand-light)]/40 ring-1 ring-[var(--brand)]"
                  : "border-[var(--border)] hover:border-[var(--brand)]/50"
              }`}
            >
              <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
              <span className="mt-0.5 text-xs text-[var(--muted)]">{description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Targets */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { key: "calorie_target" as const, label: "Calories", unit: "kcal", required: true },
          { key: "protein_target" as const, label: "Protein",  unit: "g",    required: false },
          { key: "carb_target"    as const, label: "Carbs",    unit: "g",    required: false },
          { key: "fat_target"     as const, label: "Fat",      unit: "g",    required: false },
        ].map(({ key, label, unit, required }) => (
          <div key={key}>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              {label}
              {!required && <span className="ml-1 text-xs font-normal text-[var(--muted)]">(optional)</span>}
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={1}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder="—"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 pl-4 pr-12 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--background)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.calorie_target}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
          Save goal
        </button>
      </div>
    </div>
  );
}

// ─── Goal card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  isCurrent,
  onEdit,
  onDelete,
}: {
  goal: GoalRow;
  isCurrent: boolean;
  onEdit: (g: GoalRow) => void;
  onDelete: (id: number) => void;
}) {
  const active = isCurrent;

  return (
    <div className={`rounded-2xl border bg-[var(--card)] p-5 ${active ? "border-[var(--brand)]/50 ring-1 ring-[var(--brand)]/30" : "border-[var(--border)]"}`}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <p className="text-lg font-bold capitalize text-[var(--foreground)]">
            {goal.goal_type ?? "Custom"}
          </p>
          {active && (
            <span className="rounded-full bg-[var(--brand)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(goal)}
            aria-label="Edit goal"
            className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(goal.goal_id)}
            aria-label="Delete goal"
            className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-red-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Date range */}
      <p className="mb-4 text-xs text-[var(--muted)]">
        Started {formatDate(goal.start_date)}
        {isCurrent
          ? <span className="ml-1.5 font-medium text-[var(--brand)]">· Current</span>
          : ` — Ended ${formatDate(goal.end_date)}`}
      </p>

      {/* Targets grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Calories", value: goal.calorie_target, unit: "kcal", always: true },
          { label: "Protein",  value: goal.protein_target, unit: "g",    always: false },
          { label: "Carbs",    value: goal.carb_target,    unit: "g",    always: false },
          { label: "Fat",      value: goal.fat_target,     unit: "g",    always: false },
        ].map(({ label, value, unit, always }) =>
          always || value !== null ? (
            <div key={label} className="rounded-xl bg-[var(--background)] px-3 py-2.5">
              <p className="text-xs text-[var(--muted)]">{label}</p>
              <p className="mt-0.5 text-base font-bold text-[var(--foreground)]">
                {value ?? "—"}
                <span className="ml-0.5 text-xs font-normal text-[var(--muted)]">{unit}</span>
              </p>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FormMode = { kind: "add" } | { kind: "edit"; goal: GoalRow } | null;

export default function GoalsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading) return;
    getAllGoals()
      .then(setGoals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading]);

  function openAdd() {
    setFormError(null);
    setFormMode({ kind: "add" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEdit(goal: GoalRow) {
    setFormError(null);
    setFormMode({ kind: "edit", goal });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setFormMode(null);
    setFormError(null);
  }

  async function handleSave(form: FormState) {
    if (!form.calorie_target) return;
    setSaving(true);
    setFormError(null);
    try {
      const macros = {
        goal_type: form.goal_type,
        calorie_target: Number(form.calorie_target),
        protein_target: form.protein_target ? Number(form.protein_target) : null,
        carb_target: form.carb_target ? Number(form.carb_target) : null,
        fat_target: form.fat_target ? Number(form.fat_target) : null,
      };

      if (formMode?.kind === "edit") {
        // Editing only changes targets — never touches dates
        await updateGoal(formMode.goal.goal_id, macros);
        setGoals((prev) =>
          prev.map((g) =>
            g.goal_id === formMode.goal.goal_id ? { ...g, ...macros } : g
          )
        );
      } else {
        // New goal: close any existing active goal by ending it yesterday,
        // then insert the new one starting today as open-ended.
        const today = todayISO();
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const yesterdayISO = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, "0")}-${String(yest.getDate()).padStart(2, "0")}`;

        const currentActive = goals.find((g) => g.goal_id === currentGoalId(goals));
        if (currentActive) {
          await updateGoal(currentActive.goal_id, { end_date: yesterdayISO });
          setGoals((prev) =>
            prev.map((g) =>
              g.goal_id === currentActive.goal_id ? { ...g, end_date: yesterdayISO } : g
            )
          );
        }

        const created = await insertGoal({ ...macros, start_date: today, end_date: OPEN_END });
        setGoals((prev) => [created, ...prev]);
      }
      closeForm();
    } catch (err) {
      setFormError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(goalId: number) {
    if (!window.confirm("Delete this goal?")) return;
    try {
      await deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.goal_id !== goalId));
    } catch (err) {
      console.error("Delete goal error:", err);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--brand)]" />
      </div>
    );
  }

  const activeId = currentGoalId(goals);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16 pt-28">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="mb-1 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to dashboard
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
            {!loading && (
              <p className="mt-1 text-sm text-[var(--muted)]">
                {goals.length} goal{goals.length !== 1 ? "s" : ""}
                {activeId !== null ? " · 1 active" : " · none active"}
              </p>
            )}
          </div>
          {formMode === null && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-dark)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add goal
            </button>
          )}
        </div>

        {/* Form (add or edit) */}
        {formMode !== null && (
          <GoalForm
            initial={formMode.kind === "edit" ? formFromGoal(formMode.goal) : emptyForm()}
            onSave={handleSave}
            onCancel={closeForm}
            saving={saving}
            error={formError}
          />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--brand)]" />
          </div>
        )}

        {/* Empty state */}
        {!loading && goals.length === 0 && formMode === null && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[var(--border)] py-16 text-center">
            <svg className="h-10 w-10 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <p className="font-semibold text-[var(--foreground)]">No goals yet</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Set a calorie and macro target to start tracking progress.</p>
            </div>
            <button
              onClick={openAdd}
              className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-dark)]"
            >
              Create your first goal
            </button>
          </div>
        )}

        {/* Goals list */}
        {!loading && goals.length > 0 && (
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal.goal_id}
                goal={goal}
                isCurrent={goal.goal_id === activeId}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
