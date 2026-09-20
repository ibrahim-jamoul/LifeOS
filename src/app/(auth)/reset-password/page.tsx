import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { requestPasswordResetAction } from "../actions";

export const metadata: Metadata = { title: "Réinitialiser le mot de passe" };
export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return <Suspense><AuthForm mode="reset" action={requestPasswordResetAction} /></Suspense>;
}
