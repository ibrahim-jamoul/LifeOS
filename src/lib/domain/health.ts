import { parseDateInput, type DateInput } from "./dates";

const DAY_IN_MS = 86_400_000;

export type HealthTrendPoint = Readonly<{
  measuredAt: DateInput;
  value: number;
}>;

export type HealthTrendWindowOptions = Readonly<{
  windowDays: number;
  now?: DateInput;
}>;

export type HealthTrendWindow<T extends HealthTrendPoint> = Readonly<{
  from: Date;
  to: Date;
  points: readonly T[];
  /** Raw last-minus-first value; null until at least two real points exist. */
  change: number | null;
}>;

/** Selects and orders real metric entries inside an inclusive rolling window. */
export function getHealthTrendWindow<T extends HealthTrendPoint>(
  entries: readonly T[],
  { windowDays, now = new Date() }: HealthTrendWindowOptions,
): HealthTrendWindow<T> {
  if (!Number.isInteger(windowDays) || windowDays <= 0) {
    throw new RangeError("windowDays must be a positive integer");
  }

  const end = parseDateInput(now);
  const start = new Date(end.getTime() - windowDays * DAY_IN_MS);

  const pointsWithTime = entries.map((entry) => {
    if (!Number.isFinite(entry.value)) {
      throw new RangeError("Health metric values must be finite");
    }
    return { entry, timestamp: parseDateInput(entry.measuredAt).getTime() };
  });

  const points = pointsWithTime
    .filter(({ timestamp }) => timestamp >= start.getTime() && timestamp <= end.getTime())
    .sort((left, right) => left.timestamp - right.timestamp)
    .map(({ entry }) => entry);

  const first = points[0];
  const last = points.at(-1);

  return {
    from: start,
    to: end,
    points,
    change: first && last && points.length >= 2 ? last.value - first.value : null,
  };
}
