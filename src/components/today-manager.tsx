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
  Sparkles,
  SunMedium,
  ListChecks,
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

type TodaySection = {
  key: string;
  title: string;
  subtitle: string;
  icon: "tasks" | "routines" | "overdue" | "later";
  items: DailyPlanItem[];
};

export function TodayManager({
  today,
  tomorrow,
  nextWeek,
  top,
  remaining,
  localHour,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const all = useMemo(() => [...top, ...remaining], [top, remaining]);
  const message = dayMessage(localHour, all.length);
  const sections = useMemo(() => buildSections(top, remaining), [top, remaining]);

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
            <span><strong className="text-slate-900">{all.length}</strong> élément{all.length > 1 ? "s" : ""} à traiter</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="p-5 md:p-6">
        {sections.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
            <Check className="mx-auto text-emerald-700" size={28} />
            <p className="mt-2 font-bold text-emerald-950">Rien de prévu pour aujourd’hui.</p>
            <p className="mt-1 text-sm text-emerald-800">LifeOS n’ajoute pas artificiellement du travail quand aucune action n’est planifiée ou due.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <section key={section.key} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/45">
                <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-white/75 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <SectionIcon icon={section.icon} />
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight text-slate-950">{section.title}</h3>
                      <p className="text-sm text-slate-500">{section.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-slate-500">
                    {section.items.length} élément{section.items.length > 1 ? "s" : ""}
                  </span>
                </div>

                <ul className="divide-y divide-slate-200/80 bg-white">
                  {section.items.map((item) => (
                    <TodayRow
                      key={item.id}
                      item={item}
                      pending={pending?.key === item.id}
                      pendingLabel={pending?.key === item.id ? pending.label : null}
                      onComplete={() => void complete(item)}
                      onTomorrow={() => void plan(item, tomorrow, "Report à demain")}
                      onNextWeek={() => void plan(item, nextWeek, "Report à la semaine prochaine")}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <InfoCallout
            icon={<SunMedium size={18} className="text-emerald-700" />}
            title="Aujourd’hui = ce que tu es réellement censé exécuter."
            body="Pas plus, pas moins. Coche tes tâches au fur et à mesure et avance sereinement."
          />
          <InfoCallout
            icon={<Sparkles size={18} className="text-emerald-700" />}
            title="FOCUS aide à prioriser, mais ne crée jamais l’éligibilité."
            body="Les éléments affichés ici sont ceux qui sont planifiés, dus ou réellement actionnables aujourd’hui."
          />
          <InfoCallout
            icon={<ListChecks size={18} className="text-emerald-700" />}
            title="Objectifs → Projets → Actions → Planification → Aujourd’hui"
            body="Une vision claire, une exécution concrète."
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>Les échéances réelles restent séparées des dates de travail : reporter n’efface pas un retard.</span>
          <Link href="/app/goals/tasks" className="inline-flex items-center gap-1 font-bold text-emerald-800">Administration exceptionnelle <ChevronRight size={14} /></Link>
        </div>
      </div>
    </section>
  );
}

function TodayRow({
  item,
  pending,
  pendingLabel,
  onComplete,
  onTomorrow,
  onNextWeek,
}: {
  item: DailyPlanItem;
  pending: boolean;
  pendingLabel: string | null;
  onComplete: () => void;
  onTomorrow: () => void;
  onNextWeek: () => void;
}) {
  return (
    <li className="px-4 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <button
            type="button"
            className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-500 transition hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-50"
            disabled={pending}
            onClick={onComplete}
            aria-label={`Marquer comme fait : ${item.title}`}
          >
            {pending ? <LoaderCircle className="animate-spin" size={17} /> : <Circle size={17} />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
              <p className="min-w-0 text-lg font-semibold tracking-tight text-slate-950">{item.title}</p>
              <ReasonBadge item={item} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              <span>{item.kind === "task" ? taskContext(item) : routineContext(item)}</span>
              {item.durationMinutes !== null ? <span>{item.durationMinutes} min</span> : null}
              {item.kind === "routine" && item.timeContext ? <span>{item.timeContext}</span> : null}
              {item.priority && item.priority !== "unset" ? <span>Priorité {priorityLabel(item.priority)}</span> : null}
              {item.dueOn ? <span>Échéance {formatDateOnly(item.dueOn)}</span> : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
          <button type="button" className="button-primary min-h-10 px-4" disabled={pending} onClick={onComplete}>
            {pending ? <><LoaderCircle className="animate-spin" size={16} />{pendingLabel ?? "Enregistrement"}</> : <><Check size={16} />Fait</>}
          </button>
          {item.kind === "task" ? (
            <>
              <button type="button" className="button-secondary min-h-10 px-4" disabled={pending} onClick={onTomorrow}><RotateCcw size={15} />Demain</button>
              <button type="button" className="button-secondary min-h-10 px-4" disabled={pending} onClick={onNextWeek}><CalendarClock size={15} />+7 jours</button>
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function InfoCallout({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-emerald-950/10 bg-[linear-gradient(180deg,#f7fbf9,#ffffff)] px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50">{icon}</div>
        <div>
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{body}</p>
        </div>
      </div>
    </div>
  );
}

function SectionIcon({ icon }: { icon: TodaySection["icon"] }) {
  if (icon === "routines") return <div className="grid size-11 place-items-center rounded-2xl bg-amber-50 text-amber-600"><SunMedium size={22} /></div>;
  if (icon === "overdue") return <div className="grid size-11 place-items-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle size={22} /></div>;
  if (icon === "later") return <div className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Clock3 size={22} /></div>;
  return <div className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Check size={22} /></div>;
}

function ReasonBadge({ item }: { item: DailyPlanItem }) {
  const className = item.state === "overdue"
    ? "bg-red-50 text-red-700"
    : item.reason.toLowerCase().includes("week-end")
      ? "bg-amber-50 text-amber-800"
      : item.reason.toLowerCase().includes("quotid")
        ? "bg-emerald-50 text-emerald-800"
        : item.reason.toLowerCase().includes("aujourd")
          ? "bg-blue-50 text-blue-800"
          : "bg-slate-100 text-slate-700";

  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${className}`}>{item.reason}</span>;
}

function taskContext(item: DailyPlanItem): string {
  const area = item.lifeArea === "pro" ? "Projet pro" : item.lifeArea === "religion" ? "Projet religion" : item.lifeArea === "perso" ? "Projet perso" : "Tâche";
  return area;
}

function routineContext(item: DailyPlanItem): string {
  if (item.lifeArea === "religion") return "Routine spirituelle";
  if (item.lifeArea === "pro") return "Routine professionnelle";
  if (item.lifeArea === "perso") return "Routine personnelle";
  return "Routine";
}

function buildSections(top: readonly DailyPlanItem[], remaining: readonly DailyPlanItem[]): TodaySection[] {
  const overdue = [...top, ...remaining].filter((item) => item.state === "overdue");
  const actionableTop = top.filter((item) => item.state !== "overdue");
  const routineRemaining = remaining.filter((item) => item.kind === "routine" && item.state !== "overdue");
  const taskRemaining = remaining.filter((item) => item.kind === "task" && item.state !== "overdue");

  const sections: TodaySection[] = [];
  if (actionableTop.length) sections.push({ key: "top", title: "À faire aujourd’hui", subtitle: "Tes actions prévues pour aujourd’hui", icon: "tasks", items: actionableTop });
  if (routineRemaining.length) sections.push({ key: "routines", title: "Routines du jour", subtitle: "Tes habitudes qui comptent", icon: "routines", items: routineRemaining });
  if (taskRemaining.length) sections.push({ key: "remaining", title: "Suite de la journée", subtitle: "Les autres éléments à traiter aujourd’hui", icon: "later", items: taskRemaining });
  if (overdue.length) sections.push({ key: "overdue", title: "À surveiller / en retard", subtitle: "Éléments à ne pas laisser de côté", icon: "overdue", items: overdue });
  return sections;
}

function priorityLabel(priority: NonNullable<DailyPlanItem["priority"]>): string {
  return priority === "critical" ? "critique" : priority === "high" ? "haute" : priority === "medium" ? "moyenne" : priority === "low" ? "basse" : "non définie";
}

function dayMessage(hour: number, remaining: number): { title: string; body: string } {
  if (remaining === 0) return { title: "Programme à jour", body: "Aucune action planifiée ou due ne nécessite ton attention aujourd’hui." };
  if (hour < 12) return { title: "Voici ton ordre du jour", body: "Concentre-toi sur les tâches réellement prévues aujourd’hui. Coche au fur et à mesure et avance pas à pas." };
  if (hour < 18) return { title: "Continue sur l’essentiel", body: "LifeOS te montre ce qui est vraiment à exécuter aujourd’hui, sans mélanger les objectifs globaux et les actions du jour." };
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
