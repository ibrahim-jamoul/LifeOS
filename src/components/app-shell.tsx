"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Bell, BookOpen, BrainCircuit, CalendarDays, ChartNoAxesCombined, ChevronDown, Compass, Eye, Gauge, Lightbulb, Menu, NotebookPen, Settings, Target, X } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { QuickCapture } from "@/components/quick-capture";
import { LearningShell } from "@/components/learning-shell";
import { SyncButton } from "@/components/sync-button";

type AppShellProps = {
  children: React.ReactNode;
  email?: string;
  displayName?: string | null;
  unreadAlerts: number;
};

const navigation = [
  { href: "/app/dashboard", label: "Aujourd’hui", icon: Gauge, tone: "bg-emerald-100 text-emerald-800" },
  { href: "/app/learning", label: "Apprentissage", icon: BookOpen, tone: "bg-amber-100 text-amber-900" },
  { href: "/app/planning", label: "Planning", icon: CalendarDays, tone: "bg-teal-100 text-teal-800" },
  { href: "/app/goals/objectives", label: "Objectifs", icon: Target, tone: "bg-orange-100 text-orange-800" },
  { href: "/app/kpis", label: "KPI", icon: Activity, tone: "bg-blue-100 text-blue-800" },
  { href: "/app/review", label: "Revue", icon: NotebookPen, tone: "bg-indigo-100 text-indigo-800" },
  { href: "/app/goals/vision", label: "Vision", icon: Eye, tone: "bg-sky-100 text-sky-800" },
] as const;

const advancedNavigation = [
  { href: "/app/progression", label: "Progression", icon: ChartNoAxesCombined },
  { href: "/app/insights", label: "Insights", icon: Lightbulb },
  { href: "/app/explorer", label: "Explorer les données", icon: Compass },
] as const;

function pageTheme(pathname: string) {
  if (pathname.startsWith("/app/planning")) return "from-emerald-50/90 via-white to-teal-50/70";
  if (pathname.startsWith("/app/goals/objectives")) return "from-orange-50/80 via-white to-rose-50/55";
  if (pathname.startsWith("/app/kpis")) return "from-blue-50/85 via-white to-sky-50/60";
  if (pathname.startsWith("/app/review")) return "from-indigo-50/80 via-white to-slate-50/70";
  if (pathname.startsWith("/app/goals/vision")) return "from-sky-50/90 via-white to-blue-50/60";
  return "from-stone-50 via-white to-emerald-50/45";
}

export function AppShell({ children, email, displayName, unreadAlerts }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const touch = useRef<{ x: number; edge: "left" | "right" } | null>(null);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const current = useMemo(() => {
    return navigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? null;
  }, [pathname]);
  const CurrentIcon = current?.icon;

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (window.innerWidth >= 1024 || event.touches.length !== 1) return;
    const target = event.target as Element | null;
    if (target?.closest("input,textarea,select,button,[data-no-swipe]")) return;
    const point = event.touches.item(0);
    if (!point) return;
    const x = point.clientX;
    const width = window.innerWidth;
    if (x <= 30) touch.current = { x, edge: "left" };
    else if (x >= width - 30) touch.current = { x, edge: "right" };
    else touch.current = null;
  }

  function onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touch.current;
    touch.current = null;
    if (!start || event.changedTouches.length !== 1) return;
    const point = event.changedTouches.item(0);
    if (!point) return;
    const delta = point.clientX - start.x;
    if ((start.edge === "left" && delta >= 72) || (start.edge === "right" && delta <= -72)) router.back();
  }

  if (pathname === "/app/learning" || pathname.startsWith("/app/learning/")) {
    return <LearningShell email={email} displayName={displayName} unreadAlerts={unreadAlerts}>{children}</LearningShell>;
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-emerald-950/15 bg-[#123c33] text-emerald-50 transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`} aria-label="Navigation principale">
        <div className="flex h-20 items-center justify-between px-5">
          <Link href="/app/dashboard" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-100 font-extrabold text-emerald-950">LO</span><span><strong className="block text-lg tracking-tight">LifeOS</strong><span className="text-xs text-emerald-100/70">Exécuter · mesurer · ajuster</span></span></Link>
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fermer la navigation"><X size={20} /></button>
        </div>
        <div className="px-3 pb-3"><QuickCapture /></div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          <ul className="grid gap-1">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return <li key={href}><Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${active ? "bg-emerald-50 text-emerald-950 shadow-sm" : "text-emerald-50/80 hover:bg-white/10 hover:text-white"}`}><Icon size={19} aria-hidden />{label}</Link></li>;
            })}
          </ul>
          <details className="mt-4 border-t border-white/10 pt-3">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-50/55 hover:bg-white/5"><ChevronDown size={15} /> Outils avancés</summary>
            <ul className="mt-1 grid gap-1 pl-2">
              {advancedNavigation.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return <li key={href}><Link href={href} className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition ${active ? "bg-white/15 text-white" : "text-emerald-50/70 hover:bg-white/10 hover:text-white"}`}><Icon size={17} />{label}</Link></li>;
              })}
            </ul>
          </details>
        </nav>
        <div className="border-t border-white/10 p-3"><Link href="/app/settings" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-emerald-50/80 hover:bg-white/10"><Settings size={19} /> Réglages</Link></div>
      </aside>

      {menuOpen ? <button className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu" /> : null}

      <div className="min-w-0" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur md:px-7">
          <button className="button-secondary size-10 px-0 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Ouvrir la navigation"><Menu size={20} /></button>
          <Link href="/app/dashboard" className="ml-2 text-xl font-black tracking-[-0.04em] text-slate-950 lg:hidden">LifeOS</Link>
          {current && CurrentIcon ? <div className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-sm font-black lg:flex ${current.tone}`}><CurrentIcon size={16} />{current.label}</div> : <div />}
          <div className="ml-auto flex items-center gap-2">
            <Link href="/app/alerts" className="button-secondary relative size-10 px-0" aria-label={`${unreadAlerts} alertes non lues`}><Bell size={19} />{unreadAlerts > 0 ? <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{Math.min(unreadAlerts, 99)}</span> : null}</Link>
            <SyncButton />
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-left"><span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-900"><BrainCircuit size={17} /></span><span className="hidden max-w-36 truncate text-xs md:block"><strong className="block truncate text-sm">{displayName || "Mon LifeOS"}</strong><span className="text-slate-500">{email}</span></span></summary>
              <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><Link className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100" href="/app/settings">Mon profil</Link><Link className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100" href="/app/settings/notifications">Notifications</Link><Link className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100" href="/app/settings/export">Exporter mes données</Link><form action={signOutAction}><button className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50">Se déconnecter</button></form></div>
            </details>
          </div>
        </header>
        <div className={`min-h-[calc(100vh-4rem)] bg-gradient-to-br ${pageTheme(pathname)}`}>
          <main className="mx-auto w-full max-w-[96rem] px-4 py-6 md:px-7 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
