import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PushNotificationsCard } from "@/components/push-notifications-card";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <header>
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800 hover:text-emerald-950" href="/app/settings"><ArrowLeft size={17} />Réglages</Link>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Rappels</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Activez d’abord votre appareil. Les rappels automatiques seront paramétrés ensuite, selon vos choix.</p>
      </header>
      <PushNotificationsCard />
    </div>
  );
}
