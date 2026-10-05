"use client";

import { BellRing, CheckCircle2, LoaderCircle, Send, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

type Status = "checking" | "unsupported" | "denied" | "inactive" | "active";
type ApiResponse = { ok: boolean; error?: { message?: string } };

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bytes = window.atob(base64);
  const output = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) output[index] = bytes.charCodeAt(index);
  return output.buffer;
}

async function responseMessage(response: Response): Promise<string | null> {
  const payload = await response.json().catch(() => null) as ApiResponse | null;
  return payload?.error?.message ?? null;
}

export function PushNotificationsCard() {
  const [status, setStatus] = useState<Status>("checking");
  const [pending, setPending] = useState<"enable" | "test" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription();
      setStatus(subscription && Notification.permission === "granted" ? "active" : "inactive");
    })().catch(() => setStatus("inactive"));
  }, []);

  async function enable() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setMessage("La configuration de notifications est incomplète. Réessayez après le prochain déploiement.");
      return;
    }
    setPending("enable");
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "inactive");
        setMessage("L’autorisation est nécessaire pour recevoir les rappels.");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToArrayBuffer(publicKey),
      });
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error((await responseMessage(response)) ?? "L’appareil n’a pas pu être enregistré.");
      setStatus("active");
      setMessage("Notifications activées sur cet appareil.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "L’activation a échoué.");
    } finally {
      setPending(null);
    }
  }

  async function sendTest() {
    setPending("test");
    setMessage(null);
    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      if (!response.ok) throw new Error((await responseMessage(response)) ?? "Le test n’a pas pu être envoyé.");
      setMessage("Notification de test envoyée. Elle peut apparaître avec un léger délai.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Le test a échoué.");
    } finally {
      setPending(null);
    }
  }

  const loading = status === "checking";
  const enableDisabled = loading || status === "unsupported" || status === "denied" || pending !== null;

  return (
    <section className="card grid gap-5">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><BellRing /></span>
        <div><h2 className="font-bold">Notifications sur cet appareil</h2><p className="mt-1 text-sm leading-6 text-slate-600">Recevez des rappels LifeOS comme une notification native, sans e-mail. Aucune règle de rappel n’est active pour le moment.</p></div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <Smartphone className="mt-0.5 shrink-0 text-emerald-800" size={19} />
        <p>Sur iPhone, ouvrez d’abord LifeOS dans Safari puis <strong>Partager → Sur l’écran d’accueil</strong>. Ouvrez ensuite l’app installée et activez les notifications ici.</p>
      </div>

      {status === "active" ? <div className="flex items-center gap-2 text-sm font-medium text-emerald-800"><CheckCircle2 size={18} /> Activées sur cet appareil</div> : null}
      {status === "denied" ? <p className="text-sm text-amber-800">Les notifications sont bloquées dans les réglages du navigateur ou de l’app. Autorisez-les puis rechargez cette page.</p> : null}
      {status === "unsupported" ? <p className="text-sm text-amber-800">Ce navigateur ne prend pas en charge les notifications web. Utilisez Safari sur iPhone après l’ajout à l’écran d’accueil, ou un navigateur récent sur ordinateur.</p> : null}
      {message ? <p className="text-sm text-slate-700" role="status">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button className="button-primary" type="button" onClick={() => void enable()} disabled={enableDisabled}>{pending === "enable" ? <LoaderCircle className="animate-spin" size={18} /> : <BellRing size={18} />}{status === "active" ? "Réactiver" : "Activer les notifications"}</button>
        <button className="button-secondary" type="button" onClick={() => void sendTest()} disabled={status !== "active" || pending !== null}>{pending === "test" ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}Envoyer un test</button>
      </div>
    </section>
  );
}
