export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialActionState: ActionState = { status: "idle" };

export function publicError(error: unknown, fallback = "Une erreur inattendue est survenue."): string {
  if (error instanceof Error && error.message.includes("Supabase is not configured")) {
    return "Supabase n’est pas encore configuré. Ajoutez les variables dans .env.local.";
  }
  return fallback;
}
