"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CheckCheck, Clock3, ExternalLink, LoaderCircle, RefreshCw, X } from "lucide-react";
import type { LifeOsAlert } from "@/lib/alerts";

type NotificationRow = {
  id: string;
  alert_code: string;
  dedupe_key: string;
  title: string;
  body: string | null;
  severity: "info" | "warning" | "critical";
  source_type: string | null;
  source_id: string | null;
  due_at: string | null;
  read_at: string | null;
};

type AlertsPayload = { derived: LifeOsAlert[]; persisted: NotificationRow[] };

const hrefBySource: Readonly<Record<string, string>> = {
  task: "/app/goals/tasks", goal: "/app/goals/objectives", project: "/app/goals/projects", kpi: "/app/goals/kpis",
  decision: "/app/goals/decisions", weekly_review: "/app/goals/reviews", document: "/app/documents", quran_item: "/app/learning/revisions",
  reminder: "/app/goals/reminders", habit: "/app/health/habits", religion_routine: "/app/learning/routines",
};

export function AlertCenter() {
  const router = useRouter();
  const [payload, setPayload] = useState<AlertsPayload>({ derived: [], persisted: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (materialize = false) => {
    setLoading(true);
    setError(null);
    try {
      if (materialize) await fetch("/api/alerts", { method: "POST" });
      const response = await fetch("/api/alerts", { cache: "no-store" });
      const result = await response.json() as { ok: boolean; data?: AlertsPayload; error?: { message: string } };
      if (!result.ok || !result.data) throw new Error(result.error?.message ?? "Chargement impossible.");
      setPayload(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(true); }, [load]);

  async function lifecycle(id: string, action: "read" | "unread" | "dismiss" | "snooze") {
    setBusy(id);
    try {
      const body = action === "snooze"
        ? { id, action, until: tomorrowIso() }
        : { id, action };
      const response = await fetch("/api/alerts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!result.ok) throw new Error(result.error?.message ?? "Action impossible.");
      await load(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action impossible.");
    } finally {
      setBusy(null);
    }
  }

  const persistedKeys = new Set(payload.persisted.map((item) => item.dedupe_key));
  const derivedFallback = payload.derived.filter((item) => !persistedKeys.has(item.dedupeKey));

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Exceptions actionnables</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Centre d’alertes</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Les échéances sont recalculées à chaque lecture; le scheduler améliore les rappels sans conditionner le dashboard.</p>
        </div>
        <button className="button-secondary" disabled={loading} onClick={() => void load(true)}><RefreshCw className={loading ? "animate-spin" : ""} size={17} />Actualiser</button>
      </header>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</div> : null}
      {loading ? <div className="grid min-h-48 place-items-center"><LoaderCircle className="animate-spin text-emerald-800" /></div> : null}

      {!loading && payload.persisted.length === 0 && derivedFallback.length === 0 ? (
        <section className="card grid min-h-56 place-items-center text-center"><div><CheckCheck className="mx-auto text-emerald-700" size={34} /><h2 className="mt-3 font-bold">Aucune alerte active</h2><p className="mt-1 text-sm text-slate-600">Les échéances et données manquantes continueront d’être surveillées.</p></div></section>
      ) : null}

      <section className="grid gap-3">
        {payload.persisted.map((alert) => (
          <article key={alert.id} className={`card flex flex-col gap-4 border-l-4 md:flex-row md:items-center ${severityClass(alert.severity)} ${alert.read_at ? "opacity-70" : ""}`}>
            <BellRing className="shrink-0" size={20} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{alert.title}</h2><Severity value={alert.severity} />{!alert.read_at ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">Non lue</span> : null}</div>
              {alert.body ? <p className="mt-1 text-sm text-slate-700">{alert.body}</p> : null}
              {alert.due_at ? <p className="mt-1 text-xs text-slate-500">Échéance : {formatDate(alert.due_at)}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="button-secondary min-h-9 px-3 py-1.5" href={hrefBySource[alert.source_type ?? ""] ?? "/app/dashboard"}><ExternalLink size={15} />Ouvrir</Link>
              <button className="button-secondary min-h-9 px-3 py-1.5" disabled={busy === alert.id} onClick={() => void lifecycle(alert.id, alert.read_at ? "unread" : "read")}><CheckCheck size={15} />{alert.read_at ? "Non lue" : "Lue"}</button>
              <button className="button-secondary min-h-9 px-3 py-1.5" disabled={busy === alert.id} onClick={() => void lifecycle(alert.id, "snooze")}><Clock3 size={15} />24 h</button>
              <button className="button-secondary min-h-9 px-3 py-1.5" disabled={busy === alert.id} onClick={() => void lifecycle(alert.id, "dismiss")}><X size={15} />Ignorer</button>
            </div>
          </article>
        ))}
        {derivedFallback.map((alert) => (
          <article key={alert.dedupeKey} className={`card flex gap-4 border-l-4 ${severityClass(alert.severity)}`}>
            <BellRing className="shrink-0" size={20} /><div className="flex-1"><h2 className="font-bold">{alert.title}</h2><p className="mt-1 text-sm">{alert.body}</p></div><Link className="button-secondary" href={alert.href}>Ouvrir</Link>
          </article>
        ))}
      </section>
    </div>
  );
}

function tomorrowIso(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString();
}

function Severity({ value }: { value: NotificationRow["severity"] }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${value === "critical" ? "bg-red-100 text-red-800" : value === "warning" ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-800"}`}>{value}</span>;
}
function severityClass(value: NotificationRow["severity"]): string { return value === "critical" ? "border-l-red-600" : value === "warning" ? "border-l-amber-500" : "border-l-blue-500"; }
function formatDate(value: string): string { const date = new Date(value.length === 10 ? `${value}T12:00:00` : value); return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", ...(value.length > 10 ? { timeStyle: "short" as const } : {}) }).format(date); }
