"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function complete() {
    setPending(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, { method: "POST" });
      if (!response.ok) throw new Error();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button className="button-secondary size-9 px-0" disabled={pending} onClick={() => void complete()} aria-label="Marquer la tâche terminée">
      {pending ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}
    </button>
  );
}
