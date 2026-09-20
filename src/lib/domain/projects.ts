export type ProjectScoreInput = Readonly<{
  impact: number | null | undefined;
  urgency: number | null | undefined;
  confidence: number | null | undefined;
  effort: number | null | undefined;
}>;

function isRating(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 5;
}

/**
 * Computes the advisory project score from the product specification.
 *
 * Project fields are nullable in the database, so incomplete or invalid input
 * deliberately produces `null` instead of a misleading score. An effort of
 * zero is tolerated defensively and uses the documented minimum divisor of 1.
 */
export function calculateProjectScore(input: ProjectScoreInput): number | null {
  const { impact, urgency, confidence, effort } = input;

  if (!isRating(impact) || !isRating(urgency) || !isRating(confidence)) {
    return null;
  }

  if (
    typeof effort !== "number" ||
    !Number.isFinite(effort) ||
    effort < 0 ||
    effort > 5
  ) {
    return null;
  }

  const rawScore = (impact * urgency * confidence) / Math.max(effort, 1);
  return Math.round((rawScore + Number.EPSILON) * 100) / 100;
}
