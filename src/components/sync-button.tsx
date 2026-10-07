"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useTransition } from "react";

export function SyncButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="button-secondary size-10 px-0"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      aria-label={pending ? "Synchronisation des données en cours" : "Synchroniser les données"}
      title={pending ? "Synchronisation…" : "Synchroniser avec LifeOS"}
    >
      <RefreshCw className={pending ? "animate-spin" : ""} size={18} aria-hidden="true" />
    </button>
  );
}
