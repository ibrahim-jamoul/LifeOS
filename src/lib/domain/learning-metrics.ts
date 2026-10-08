export type TimedLearningSession = { duration_minutes: number; path_id?: string; result?: string };
/** Use only verified recorded durations. Never infer mastery from time spent. */
export function totalLearningMinutes(sessions: readonly TimedLearningSession[]): number {
  return sessions.reduce((sum, session) => sum + (Number.isFinite(session.duration_minutes) && session.duration_minutes > 0 ? session.duration_minutes : 0), 0);
}
export function learningMinutesByPath(sessions: readonly (TimedLearningSession & { path_id: string })[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const session of sessions) totals[session.path_id] = (totals[session.path_id] ?? 0) + totalLearningMinutes([session]);
  return totals;
}
export function evidenceOfApplication(sessions: readonly TimedLearningSession[]): number {
  return sessions.filter((item) => item.result === "applied").length;
}
export function quizPercentage(correct: number, total: number): number | null {
  if (!Number.isInteger(total) || total <= 0 || !Number.isInteger(correct) || correct < 0 || correct > total) return null;
  return Math.round(100 * correct / total);
}
