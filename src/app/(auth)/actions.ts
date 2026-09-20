"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/actions";
import { publicError } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email("Adresse e-mail invalide.").max(254);
const passwordSchema = z.string().min(8, "Utilisez au moins 8 caractères.").max(128);

function formValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function safeNextPath(value: string): string {
  return value.startsWith("/app/") && !value.startsWith("//") ? value : "/app/dashboard";
}

export async function signInAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ email: emailSchema, password: passwordSchema, next: z.string().optional() })
    .safeParse({
      email: formValue(formData, "email"),
      password: formValue(formData, "password"),
      next: formValue(formData, "next"),
    });

  if (!parsed.success) {
    return { status: "error", message: "Corrigez les champs signalés.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) return { status: "error", message: "E-mail ou mot de passe incorrect." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Connexion impossible pour le moment.") };
  }

  redirect(safeNextPath(parsed.data.next ?? ""));
}

export async function signUpAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      displayName: z.string().trim().min(2, "Indiquez au moins 2 caractères.").max(80),
      email: emailSchema,
      password: passwordSchema,
      confirmPassword: z.string(),
      origin: z.string().url().optional(),
    })
    .refine((value) => value.password === value.confirmPassword, {
      path: ["confirmPassword"],
      message: "Les mots de passe ne correspondent pas.",
    })
    .safeParse({
      displayName: formValue(formData, "displayName"),
      email: formValue(formData, "email"),
      password: formValue(formData, "password"),
      confirmPassword: formValue(formData, "confirmPassword"),
      origin: formValue(formData, "origin") || undefined,
    });

  if (!parsed.success) {
    return { status: "error", message: "Corrigez les champs signalés.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const supabase = await createClient();
    const callback = parsed.data.origin ? `${parsed.data.origin}/auth/callback?next=/app/dashboard` : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.displayName },
        emailRedirectTo: callback,
      },
    });
    if (error) return { status: "error", message: "Création du compte impossible. Vérifiez l’adresse et réessayez." };
    if (!data.session) {
      return { status: "success", message: "Compte créé. Ouvrez l’e-mail de confirmation pour activer LifeOS." };
    }
  } catch (error) {
    return { status: "error", message: publicError(error, "Création du compte impossible pour le moment.") };
  }

  redirect("/app/dashboard");
}

export async function requestPasswordResetAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ email: emailSchema, origin: z.string().url().optional() })
    .safeParse({ email: formValue(formData, "email"), origin: formValue(formData, "origin") || undefined });

  if (!parsed.success) {
    return { status: "error", message: "Adresse e-mail invalide.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const supabase = await createClient();
    const redirectTo = parsed.data.origin ? `${parsed.data.origin}/auth/callback?next=/update-password` : undefined;
    await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
    return {
      status: "success",
      message: "Si ce compte existe, un lien de réinitialisation vient d’être envoyé.",
    };
  } catch (error) {
    return { status: "error", message: publicError(error, "Envoi impossible pour le moment.") };
  }
}

export async function updatePasswordAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ password: passwordSchema, confirmPassword: z.string() })
    .refine((value) => value.password === value.confirmPassword, {
      path: ["confirmPassword"],
      message: "Les mots de passe ne correspondent pas.",
    })
    .safeParse({
      password: formValue(formData, "password"),
      confirmPassword: formValue(formData, "confirmPassword"),
    });

  if (!parsed.success) {
    return { status: "error", message: "Corrigez les champs signalés.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { status: "error", message: "Le mot de passe n’a pas pu être modifié." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Modification impossible pour le moment.") };
  }

  redirect("/app/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
