import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { signUpAction } from "../actions";

export const metadata: Metadata = { title: "Créer un compte" };
export const dynamic = "force-dynamic";

export default function SignupPage() {
  return <Suspense><AuthForm mode="signup" action={signUpAction} /></Suspense>;
}
