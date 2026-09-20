import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { updatePasswordAction } from "../actions";

export const metadata: Metadata = { title: "Nouveau mot de passe" };
export const dynamic = "force-dynamic";

export default function UpdatePasswordPage() {
  return <Suspense><AuthForm mode="update" action={updatePasswordAction} /></Suspense>;
}
