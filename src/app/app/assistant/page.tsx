import type { Metadata } from "next";
import { AssistantConsole } from "@/components/assistant-console";
import { hasAiEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Assistant IA" };
export const dynamic = "force-dynamic";

export default function AssistantPage() {
  return <AssistantConsole enabled={hasAiEnv()} />;
}
