"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import type { DailyPlanItem } from "@/lib/domain/daily-plan";

type Props = {
  today: string;
  tomorrow: string;
  nextWeek: string;
  top: readonly DailyPlanItem[];
  remaining: readonly DailyPlanItem[];
  completedRoutines: number;
  totalRoutines: number;
  localHour: number;
};

type PendingAction = { key: string; label: string } | null;

type ApiEnvelope = {
  ok: boolean;
  error?: { message?: string };
};

export function TodayManager({
  today,
  tomorrow,
  nextWeek,
  top,
  remaining,
  completedRoutines,
  totalRoutines,
  localHour,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const all = useMemo(() => [...top, ...remaining], [top, remaining]);
  const message = dayMessage(localHour, all.length);

  async function request(key: string, label: string, url: string, init: RequestInit) {
    setPending({ key, label });
    setError(null);
    try {
      const response = await fetch(url, init);
      const envelope = await readEnvelope(response);
      if (!response.ok || !envelope.ok) {
        throw new Error(envelope.error?.message || "L’action n’a pas pu être enregistrée.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "L’action n’a pas pu être enregistrée.");
    } finally {
      setPending(null);
    }
  }

  async function complete(item: DailyPlanItem) {
    if (item.kind === "task" && item.taskId) {
      await request(item.id, "Validation", `/api/tasks/${item.taskId}/complete`, { method: "POST" });
      return;
    }
    if (item.kind === "routine" && item.routineId && item.routineType) {
      await request(item.id, "Validation", "/api/routines/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routineType: item.routineType,
          routineId: item.routineId,
          occurredOn: today,
          completed: true,
        }),
      });
    }
  }

  async function plan(item: DailyPlanItem, plannedOn: string, label: string) {
    if (!item.taskId) return;
    await request(item.id, label, `/api/tasks/${item.taskId}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plannedOn }),
    });
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#edf9f4,#ffffff_58%,#f7faf9)] px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">LifeOS Manager</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">{message.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{message.body}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-emerald-900/10 bg-white/80 px-3 py-2 text-xs text-slate-600">
            <Check size={16} className="text-emerald-700" />
            <span><strong className="text-slate-900">{completedRoutines}/{totalRoutines}</strong> routines validées</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="p-5 md:p-6">
        {top.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
            <Check className="mx-auto text-emerald-700" size={28} />
            <p className="mt-2 font-bold text-emerald-950">Rien de prioritaire à exécuter maintenant.</p>
            <p className="mt-1 text-sm text-emerald-800">LifeOS n’ajoute pas artificiellement du travail quand aucune action n’est due.</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {top.map((item, index) => (
              <PriorityCard
                key={item.id}
                item={item}
                rank={index + 1}
                pending={pending?.key === item.id}
                pendingLabel={pending?.key === item.id ? pending.label : null}
                onComplete={() => void complete(item)}
                onTomorrow={() => void plan(item, tomorrow, "Report à demain")}
                onNextWeek={() => void plan(item, nextWeek, "Report à la semaine prochaine")}
              />
            ))}
          </div>
        )}

        {remaining.length > 0 ? (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="font-bold">Suite de la journée</h3>
              <span className="text-xs text-slate-500">{remaining.length} élément{remaining.length > 1 ? "s" : ""}</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {remaining.map((item) => (
                <li key={item.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-500 transition hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                    disabled={pending?.key === item.id}
                    onClick={() => void complete(item)}
                    aria-label={`Marquer comme fait : ${item.title}`}
                  >
                    {pending?.key === item.id ? <LoaderCircle className="animate-spin" size={18} /> : <Circle size={18} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <ItemMeta item={item} />
                  </div>
                  {item.kind === "task" ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button className="button-secondary min-h-9 px-3 py-1.5 text-xs" disabled={pending?.key === item.id} onClick={() => void plan(item, tomorrow, "Report à demain")}><RotateCcw size={14} />Demain</button>
                      <button className="button-secondary min-h-9 px-3 py-1.5 text-xs" disabled={pending?.key === item.id} onClick={() => void plan(item, nextWeek, "Report à la semaine prochaine")}><CalendarClock size={14} />+7 j</button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>Les échéances réelles restent séparées des dates de travail : reporter n’efface pas un retard.</span>
          <Link href="/app/goals/tasks" className="inline-flex items-center gap-1 font-bold text-emerald-800">Administration exceptionnelle <ChevronRight size={14} /></Link>
        </div>
      </div>
    </section>
  );
}

function PriorityCard({
  item,
  rank,
  pending,
  pendingLabel,
  onComplete,
  onTomorrow,
  onNextWeek,
}: {
  item: DailyPlanItem;
  rank: number;
  pending: boolean;
  pendingLabel: string | null;
  onComplete: () => void;
  onTomorrow: () => void;
  onNextWeek: () => void;
}) {
  return (
    <article className={`relative rounded-2xl border p-4 ${item.state === "overdue" ? "border-red-200 bg-red-50/60" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">{rank}</span>
        <AreaBadge area={item.lifeArea} />
      </div>
      <h3 className="mt-4 min-h-12 font-bold leading-snug text-slate-950">{item.title}</h3>
      <ItemMeta item={item} />
      <button
        type="button"
        className="button-primary mt-4 w-full"
        disabled={pending}
        onClick={onComplete}
      >
        {pending ? <><LoaderCircle className="animate-spin" size={17} />{pendingLabel ?? "Enregistrement"}</> : <><Check size={17} />Fait</>}
      </button>
      {item.kind === "task" ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" className="button-secondary min-h-9 px-2 py-1.5 text-xs" disabled={pending} onClick={onTomorrow}><RotateCcw size={14} />Demain</button>
          <button type="button" className="button-secondary min-h-9 px-2 py-1.5 text-xs" disabled={pending} onClick={onNextWeek}><CalendarClock size={14} />+7 jours</button>
        </div>
      ) : null}
    </article>
  );
}

function ItemMeta({ item }: { item: DailyPlanItem }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
      <span className={`inline-flex items-center gap-1 font-semibold ${item.state === "overdue" ? "text-red-700" : item.state === "due_today" ? "text-amber-800" : "text-slate-600"}`}>
        {item.state === "overdue" ? <AlertTriangle size={13} /> : <Clock3 size={13} />}{item.reason}
      </span>
      {item.durationMinutes !== null ? <span>{item.durationMinutes} min</span> : null}
      {item.priority && item.priority !== "unset" ? <span>Priorité {priorityLabel(item.priority)}</span> : null}
      {item.dueOn ? <span>Échéance {formatDateOnly(item.dueOn)}</span> : null}
    </div>
  );
}

function AreaBadge({ area }: { area: DailyPlanItem["lifeArea"] }) {
  const label = area === "pro" ? "PRO" : area === "perso" ? "PERSO" : area === "religion" ? "RELIGION" : "À classer";
  const style = area === "pro" ? "bg-blue-50 text-blue-800" : area === "perso" ? "bg-emerald-50 text-emerald-800" : area === "religion" ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${style}`}>{label}</span>;
}

function priorityLabel(priority: NonNullable<DailyPlanItem["priority"]>): string {
  return priority === "critical" ? "critique" : priority === "high" ? "haute" : priority === "medium" ? "moyenne" : priority === "low" ? "basse" : "non définie";
}

function dayMessage(hour: number, remaining: number): { title: string; body: string } {
  if (remaining === 0) return { title: "Programme à jour", body: "Aucune action prioritaire ne nécessite ton attention maintenant." };
  if (hour < 12) return { title: "Voici ton ordre du jour", body: "Commence par les trois premières actions. LifeOS recalculera la suite après chaque validation." };
  if (hour < 18) return { title: "Continue sur l’essentiel", body: "Le programme est ordonné à partir des échéances, planifications, priorités et routines encore ouvertes." };
  return { title: "Termine ou reporte proprement", body: "Valide ce qui est fait. Pour le reste, reporte la date de travail sans effacer les vraies échéances." };
}

function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

async function readEnvelope(response: Response): Promise<ApiEnvelope> {
  try {
    return await response.json() as ApiEnvelope;
  } catch {
    return { ok: false, error: { message: "Réponse serveur invalide." } };
  }
}
