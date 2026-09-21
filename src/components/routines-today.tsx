"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, LoaderCircle } from "lucide-react";

export type RoutineTodayItem = {
  id: string;
  routineType: "habit" | "religion";
  name: string;
  completed: boolean;
  completedOn?: string | null;
  completedCount?: number | null;
  targetCount?: number | null;
  targetUnit?: string | null;
  durationMinutes?: number | null;
  lifeArea?: "pro" | "perso" | "religion" | null;
  timeContext?: string | null;
  nextOccurrence?: string | null;
  periodLabel?: "day" | "week" | "month" | null;
  configurationStatus?: "ready" | "to_complete" | "to_validate" | "to_configure" | null;
};

type ApiEnvelope = {
  ok: boolean;
  error?: { message?: string };
};

export function RoutinesToday({ date, items, missedLast7 = 0, configurationNeeded = 0 }: { date: string; items: readonly RoutineTodayItem[]; missedLast7?: number; configurationNeeded?: number }) {
  const router = useRouter();
  const [completion, setCompletion] = useState<Record<string, boolean>>(() => completionState(items));
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCompletion(completionState(items));
  }, [items]);

  const completedCount = useMemo(
    () => items.reduce((total, item) => total + (completion[itemKey(item)] ? 1 : 0), 0),
    [completion, items],
  );
  const remainingCount = items.length - completedCount;

  async function toggle(item: RoutineTodayItem) {
    const key = itemKey(item);
    if (pendingKeys.has(key)) return;

    const wasCompleted = Boolean(completion[key]);
    const nextCompleted = !wasCompleted;
    setError(null);
    setCompletion((current) => ({ ...current, [key]: nextCompleted }));
    setPendingKeys((current) => new Set(current).add(key));

    try {
      const response = await fetch("/api/routines/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routineType: item.routineType,
          routineId: item.id,
          occurredOn: nextCompleted ? date : item.completedOn ?? date,
          completed: nextCompleted,
        }),
      });
      const result = await readEnvelope(response);
      if (!response.ok || !result.ok) {
        throw new Error(result.error?.message ?? "La routine n’a pas pu être mise à jour.");
      }
      router.refresh();
    } catch (cause) {
      setCompletion((current) => ({ ...current, [key]: wasCompleted }));
      setError(cause instanceof Error ? cause.message : "La routine n’a pas pu être mise à jour.");
    } finally {
      setPendingKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }

  if (items.length === 0) {
    return <div className="py-6 text-sm text-slate-500"><p>Aucune routine planifiée aujourd’hui.</p>{configurationNeeded > 0 ? <p className="mt-2 text-amber-800">{configurationNeeded} routine{configurationNeeded > 1 ? "s" : ""} à configurer avant de générer ses occurrences.</p> : null}</div>;
  }

  return (
    <div className="pt-3">
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{completedCount} sur {items.length} terminée{completedCount === 1 ? "" : "s"}</span>
        <span>{remainingCount} restante{remainingCount === 1 ? "" : "s"}</span>
      </div>
      {missedLast7 > 0 || configurationNeeded > 0 ? (
        <p className="mb-3 text-xs text-amber-800">
          {missedLast7 > 0 ? `${missedLast7} occurrence${missedLast7 > 1 ? "s" : ""} non cochée${missedLast7 > 1 ? "s" : ""} sur les 7 derniers jours.` : ""}
          {missedLast7 > 0 && configurationNeeded > 0 ? " " : ""}
          {configurationNeeded > 0 ? `${configurationNeeded} routine${configurationNeeded > 1 ? "s" : ""} à configurer.` : ""}
        </p>
      ) : null}
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <span
          className="block h-full rounded-full bg-emerald-700 transition-[width]"
          style={{ width: `${Math.round((completedCount / items.length) * 100)}%` }}
        />
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-3 divide-y divide-slate-100">
        {items.map((item) => {
          const key = itemKey(item);
          const isCompleted = Boolean(completion[key]);
          const isPending = pendingKeys.has(key);
          return (
            <li key={key} className="flex items-center gap-3 py-3">
              <button
                type="button"
                className={`grid size-10 shrink-0 place-items-center rounded-xl border transition ${isCompleted ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"}`}
                onClick={() => void toggle(item)}
                disabled={isPending}
                aria-pressed={isCompleted}
                aria-label={`${isCompleted ? "Marquer à faire" : "Marquer comme faite"} : ${item.name}`}
              >
                {isPending ? <LoaderCircle className="animate-spin" size={18} /> : isCompleted ? <Check size={18} /> : <Circle size={18} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${isCompleted ? "text-slate-500 line-through" : "text-slate-900"}`}>{item.name}</p>
                <p className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
                  {item.lifeArea ? <span>{lifeAreaLabel(item.lifeArea)}</span> : null}
                  {item.durationMinutes !== null && item.durationMinutes !== undefined ? <span>{item.durationMinutes} min</span> : null}
                  {item.targetCount !== null && item.targetCount !== undefined ? <span>{item.targetCount} {item.targetUnit ?? "fois"}</span> : null}
                  {item.timeContext ? <span>{item.timeContext}</span> : null}
                  {item.periodLabel === "week" ? <span>Occurrence de la semaine</span> : item.periodLabel === "month" ? <span>Occurrence du mois</span> : null}
                  {item.nextOccurrence ? <span>Prochaine : {formatDateOnly(item.nextOccurrence)}</span> : null}
                  {item.configurationStatus && item.configurationStatus !== "ready" ? <span>{configurationStatusLabel(item.configurationStatus)}</span> : null}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function completionState(items: readonly RoutineTodayItem[]): Record<string, boolean> {
  return Object.fromEntries(items.map((item) => [itemKey(item), item.completed]));
}

function itemKey(item: Pick<RoutineTodayItem, "id" | "routineType">): string {
  return `${item.routineType}:${item.id}`;
}

function lifeAreaLabel(value: NonNullable<RoutineTodayItem["lifeArea"]>): string {
  return value === "pro" ? "PRO" : value === "perso" ? "PERSO" : "RELIGION";
}

function configurationStatusLabel(value: Exclude<NonNullable<RoutineTodayItem["configurationStatus"]>, "ready">): string {
  return value === "to_complete" ? "À compléter" : value === "to_validate" ? "À valider" : "À configurer";
}

async function readEnvelope(response: Response): Promise<ApiEnvelope> {
  try {
    return await response.json() as ApiEnvelope;
  } catch {
    return { ok: false, error: { message: "Réponse serveur invalide." } };
  }
}
