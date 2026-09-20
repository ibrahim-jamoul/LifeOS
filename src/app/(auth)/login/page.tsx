import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { signInAction } from "../actions";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <Suspense><AuthForm mode="signin" action={signInAction} /></Suspense>;
}
