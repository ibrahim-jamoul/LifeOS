"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import type { ActionState } from "@/lib/actions";
import { initialActionState } from "@/lib/actions";

type AuthAction = (previous: ActionState, formData: FormData) => Promise<ActionState>;

type AuthFormProps = {
  action: AuthAction;
  mode: "signin" | "signup" | "reset" | "update";
};

const copy = {
  signin: { title: "Retrouver votre cap", subtitle: "Connectez-vous à votre espace privé LifeOS.", submit: "Se connecter" },
  signup: { title: "Créer votre LifeOS", subtitle: "Vos neuf domaines, isolés et prêts pour vos vraies données.", submit: "Créer mon compte" },
  reset: { title: "Réinitialiser le mot de passe", subtitle: "Nous vous enverrons un lien sécurisé si le compte existe.", submit: "Envoyer le lien" },
  update: { title: "Choisir un nouveau mot de passe", subtitle: "Utilisez au moins huit caractères.", submit: "Enregistrer le mot de passe" },
} as const;

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [showPassword, setShowPassword] = useState(false);
  const [origin, setOrigin] = useState("");
  const searchParams = useSearchParams();
  const details = copy[mode];
  const needsEmail = mode !== "update";
  const needsPassword = mode === "signin" || mode === "signup" || mode === "update";

  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
        <Link href="/" className="mb-8 inline-flex items-center gap-3" aria-label="LifeOS">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-900 text-sm font-bold text-white">LO</span>
          <span>
            <span className="block text-lg font-bold tracking-tight">LifeOS</span>
            <span className="block text-xs text-slate-500">Piloter, mesurer, ajuster.</span>
          </span>
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">{details.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{details.subtitle}</p>

        {searchParams.get("setup") === "1" ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
            Configurez d’abord les variables Supabase dans <code>.env.local</code>. La procédure figure dans le README.
          </div>
        ) : null}

        <form action={formAction} className="mt-7 grid gap-4">
          <input type="hidden" name="origin" value={origin} />
          <input type="hidden" name="next" value={searchParams.get("next") ?? "/app/dashboard"} />

          {mode === "signup" ? (
            <label className="field">
              Nom affiché
              <input className="input" name="displayName" autoComplete="name" required maxLength={80} />
              <FieldError messages={state.fieldErrors?.displayName} />
            </label>
          ) : null}

          {needsEmail ? (
            <label className="field">
              Adresse e-mail
              <input className="input" name="email" type="email" autoComplete="email" required maxLength={254} />
              <FieldError messages={state.fieldErrors?.email} />
            </label>
          ) : null}

          {needsPassword ? (
            <label className="field">
              {mode === "update" ? "Nouveau mot de passe" : "Mot de passe"}
              <span className="relative">
                <input
                  className="input pr-12"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  maxLength={128}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
              <FieldError messages={state.fieldErrors?.password} />
            </label>
          ) : null}

          {mode === "signup" || mode === "update" ? (
            <label className="field">
              Confirmer le mot de passe
              <input
                className="input"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
              />
              <FieldError messages={state.fieldErrors?.confirmPassword} />
            </label>
          ) : null}

          {state.message ? (
            <div
              className={`rounded-xl border p-3 text-sm ${
                state.status === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
              role={state.status === "error" ? "alert" : "status"}
            >
              {state.message}
            </div>
          ) : null}

          <button className="button-primary mt-1 w-full" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" size={18} /> : null}
            {pending ? "Traitement…" : details.submit}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm">
          {mode === "signin" ? (
            <>
              <Link className="font-medium text-emerald-800 hover:underline" href="/reset-password">Mot de passe oublié ?</Link>
              <Link className="font-medium text-emerald-800 hover:underline" href="/signup">Créer un compte</Link>
            </>
          ) : null}
          {mode === "signup" || mode === "reset" ? (
            <Link className="font-medium text-emerald-800 hover:underline" href="/login">Retour à la connexion</Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.[0] ? <span className="text-xs font-normal text-red-700">{messages[0]}</span> : null;
}
