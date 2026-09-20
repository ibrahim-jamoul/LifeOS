export type KpiTargetType = "min" | "max" | "exact" | "range" | "none";

export type KpiClassification =
  | "on_track"
  | "watch"
  | "off_track"
  | "insufficient_data";

export type KpiTarget = Readonly<{
  targetType: KpiTargetType;
  targetValue?: number | null;
  targetMin?: number | null;
  targetMax?: number | null;
  /** Absolute distance outside the target that is classified as `watch`. */
  watchMargin?: number;
}>;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function approximatelyEqual(left: number, right: number): boolean {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= Number.EPSILON * scale;
}

function isWithinMargin(distance: number, margin: number): boolean {
  return distance < margin || approximatelyEqual(distance, margin);
}

/**
 * Classifies the latest KPI value without inferring missing targets or data.
 *
 * The product specification does not define a universal `watch` threshold.
 * Callers may therefore opt into one with `watchMargin`; with the default
 * margin of zero, a miss is classified as `off_track`.
 */
export function classifyKpiValue(
  target: KpiTarget,
  latestValue: number | null | undefined,
): KpiClassification {
  if (!isFiniteNumber(latestValue) || target.targetType === "none") {
    return "insufficient_data";
  }

  const watchMargin = target.watchMargin ?? 0;
  if (!isFiniteNumber(watchMargin) || watchMargin < 0) {
    return "insufficient_data";
  }

  switch (target.targetType) {
    case "min": {
      if (!isFiniteNumber(target.targetValue)) {
        return "insufficient_data";
      }
      if (latestValue >= target.targetValue) {
        return "on_track";
      }
      return watchMargin > 0 && isWithinMargin(target.targetValue - latestValue, watchMargin)
        ? "watch"
        : "off_track";
    }

    case "max": {
      if (!isFiniteNumber(target.targetValue)) {
        return "insufficient_data";
      }
      if (latestValue <= target.targetValue) {
        return "on_track";
      }
      return watchMargin > 0 && isWithinMargin(latestValue - target.targetValue, watchMargin)
        ? "watch"
        : "off_track";
    }

    case "exact": {
      if (!isFiniteNumber(target.targetValue)) {
        return "insufficient_data";
      }
      const distance = Math.abs(latestValue - target.targetValue);
      if (approximatelyEqual(latestValue, target.targetValue)) {
        return "on_track";
      }
      return watchMargin > 0 && isWithinMargin(distance, watchMargin) ? "watch" : "off_track";
    }

    case "range": {
      if (
        !isFiniteNumber(target.targetMin) ||
        !isFiniteNumber(target.targetMax) ||
        target.targetMin > target.targetMax
      ) {
        return "insufficient_data";
      }
      if (latestValue >= target.targetMin && latestValue <= target.targetMax) {
        return "on_track";
      }
      const distance =
        latestValue < target.targetMin
          ? target.targetMin - latestValue
          : latestValue - target.targetMax;
      return watchMargin > 0 && isWithinMargin(distance, watchMargin) ? "watch" : "off_track";
    }
  }
}
