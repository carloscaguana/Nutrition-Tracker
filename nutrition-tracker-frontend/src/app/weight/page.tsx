"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import {
  getWeightLogs,
  insertWeightLog,
  updateWeightLog,
  deleteWeightLog,
} from "@/features/weightLogs/weightLogApi";
import { Database } from "@/types/database.types";

type WeightLog = Database["public"]["Tables"]["weight_logs"]["Row"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowDatetimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function extractError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err)
    return String((err as { message: unknown }).message);
  return "An unexpected error occurred.";
}

// ─── Log form ─────────────────────────────────────────────────────────────────

function LogForm({
  onSave,
  onCancel,
  saving,
  error,
}: {
  onSave: (weight_kg: number, recorded_at: string) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [weight, setWeight] = useState("");
  const [timestamp, setTimestamp] = useState(nowDatetimeLocal);

  return (
    <div className="mb-8 rounded-2xl border border-[var(--brand)]/30 bg-[var(--card)] p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">
        Log weight
      </h2>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        {/* Weight input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Weight</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              step={0.1}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.0"
              autoFocus
              className="w-36 rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 pl-4 pr-10 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
              kg
            </span>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Date &amp; time</label>
          <input
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--background)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const kg = parseFloat(weight);
              if (!kg || kg <= 0) return;
              onSave(kg, new Date(timestamp).toISOString());
            }}
            disabled={saving || !weight || parseFloat(weight) <= 0}
            className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Save
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}

// ─── Inline edit row ──────────────────────────────────────────────────────────

function EditRow({
  log,
  onSave,
  onCancel,
  saving,
}: {
  log: WeightLog;
  onSave: (weight_kg: number, recorded_at: string) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const initTimestamp = (() => {
    const d = new Date(log.recorded_at);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  })();

  const [weight, setWeight] = useState(String(log.weight_kg));
  const [timestamp, setTimestamp] = useState(initTimestamp);

  return (
    <tr className="bg-[var(--brand-light)]/20">
      <td className="py-3 pl-4 pr-3">
        <div className="relative w-28">
          <input
            type="number"
            min={0}
            step={0.1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-[var(--brand)] bg-[var(--background)] py-1.5 pl-3 pr-8 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">kg</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <input
          type="datetime-local"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
        />
      </td>
      <td className="py-3 pl-3 pr-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const kg = parseFloat(weight);
              if (!kg || kg <= 0) return;
              onSave(kg, new Date(timestamp).toISOString());
            }}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-dark)] disabled:opacity-50"
          >
            {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            Save
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WeightPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    getWeightLogs(user.id)
      .then((data) => setLogs(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  async function handleLog(weight_kg: number, recorded_at: string) {
    setSaving(true);
    setFormError(null);
    try {
      const created = await insertWeightLog(weight_kg, recorded_at);
      setLogs((prev) =>
        [created, ...prev].sort(
          (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
        )
      );
      setShowForm(false);
    } catch (err) {
      setFormError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id: number, weight_kg: number, recorded_at: string) {
    setEditSaving(true);
    try {
      await updateWeightLog(id, { weight_kg, recorded_at });
      setLogs((prev) =>
        prev
          .map((l) => (l.weightlog_id === id ? { ...l, weight_kg, recorded_at } : l))
          .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
      );
      setEditingId(null);
    } catch (err) {
      console.error("Edit weight error:", err);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this weight entry?")) return;
    try {
      await deleteWeightLog(id);
      setLogs((prev) => prev.filter((l) => l.weightlog_id !== id));
    } catch (err) {
      console.error("Delete weight error:", err);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--brand)]" />
      </div>
    );
  }

  const latest = logs[0] ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16 pt-28">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
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
            <h1 className="text-2xl font-bold tracking-tight">Weight</h1>
            {!loading && (
              <p className="mt-1 text-sm text-[var(--muted)]">
                {logs.length} entr{logs.length !== 1 ? "ies" : "y"}
                {latest && ` · Latest: ${latest.weight_kg} kg`}
              </p>
            )}
          </div>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setFormError(null); }}
              className="flex items-center gap-1.5 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-dark)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Log weight
            </button>
          )}
        </div>

        {/* Log form */}
        {showForm && (
          <LogForm
            onSave={handleLog}
            onCancel={() => { setShowForm(false); setFormError(null); }}
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
        {!loading && logs.length === 0 && !showForm && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[var(--border)] py-16 text-center">
            <svg className="h-10 w-10 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            <div>
              <p className="font-semibold text-[var(--foreground)]">No weight entries yet</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Log your first weight to start tracking your progress.</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-dark)]"
            >
              Log weight
            </button>
          </div>
        )}

        {/* History table */}
        {!loading && logs.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">History</h2>
            <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--card)]">
                    <th className="py-3 pl-4 pr-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                      Weight
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                      Date &amp; time
                    </th>
                    <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
                  {logs.map((log, idx) =>
                    editingId === log.weightlog_id ? (
                      <EditRow
                        key={log.weightlog_id}
                        log={log}
                        onSave={(kg, ts) => handleEdit(log.weightlog_id, kg, ts)}
                        onCancel={() => setEditingId(null)}
                        saving={editSaving}
                      />
                    ) : (
                      <tr key={log.weightlog_id} className="transition-colors hover:bg-[var(--card)]">
                        <td className="py-3.5 pl-4 pr-3">
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-[var(--foreground)]">
                              {log.weight_kg}
                            </span>
                            <span className="text-xs text-[var(--muted)]">kg</span>
                            {idx === 0 && (
                              <span className="ml-1.5 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                Latest
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-sm text-[var(--muted)]">
                          {formatDateTime(log.recorded_at)}
                        </td>
                        <td className="py-3.5 pl-3 pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingId(log.weightlog_id)}
                              aria-label="Edit entry"
                              className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--card)] hover:text-[var(--foreground)]"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(log.weightlog_id)}
                              aria-label="Delete entry"
                              className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--card)] hover:text-red-500"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
