export const LEARNING_DOMAINS = [
  { value: "religion", label: "Religion et Coran" },
  { value: "arabic", label: "Arabe" },
  { value: "english", label: "Anglais" },
  { value: "certification", label: "Certifications" },
  { value: "professional", label: "Compétences professionnelles" },
  { value: "finance", label: "Finance" },
  { value: "business", label: "Entrepreneuriat" },
  { value: "reading", label: "Lecture et culture" },
  { value: "practical", label: "Compétences pratiques" },
  { value: "exploration", label: "Explorations" },
] as const;

export const LEARNING_TYPES = [
  { value: "strategic", label: "Priorité" },
  { value: "maintenance", label: "Entretien" },
  { value: "exploration", label: "Exploration" },
  { value: "leisure", label: "Loisir" },
] as const;

export const LEARNING_ACTIVITY_TYPES = [
  { value: "lesson", label: "Leçon" },
  { value: "reading", label: "Lecture" },
  { value: "video", label: "Vidéo" },
  { value: "lab", label: "Lab" },
  { value: "exercise", label: "Exercice" },
  { value: "quiz", label: "Quiz" },
  { value: "writing", label: "Écriture" },
  { value: "speaking", label: "Expression orale" },
  { value: "memorization", label: "Mémorisation" },
  { value: "review", label: "Révision" },
  { value: "deliverable", label: "Livrable" },
] as const;

export type Assessment = "forgot" | "fragile" | "correct" | "mastered";
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30, 60] as const;

/** Explainable review spacing; actual persistence uses the matching SQL transaction. */
export function nextReviewStep(step: number, answer: Assessment): { step: number; afterDays: number } {
  if (!Number.isInteger(step) || step < 0 || step > 5) throw new RangeError("Invalid learning review step");
  const next = answer === "forgot" ? 0 : answer === "fragile" ? Math.max(0, step - 1)
    : answer === "correct" ? Math.min(5, step + 1) : Math.min(5, step + 2);
  return { step: next, afterDays: REVIEW_INTERVAL_DAYS[next] ?? REVIEW_INTERVAL_DAYS[0] };
}

export function completedRatio(completed: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((100 * Math.min(total, Math.max(0, completed))) / total);
}

export function domainLabel(domain: string): string {
  return LEARNING_DOMAINS.find((item) => item.value === domain)?.label ?? domain;
}
