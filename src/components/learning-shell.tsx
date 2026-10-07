"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookMarked,
  BookOpen,
  BookOpenText,
  ChartNoAxesCombined,
  ChevronLeft,
  Home,
  Library,
  Menu,
  RefreshCcw,
  Settings,
  Sparkles,
  SunMedium,
  UserRound,
  X,
} from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { SyncButton } from "@/components/sync-button";

type LearningShellProps = {
  children: React.ReactNode;
  email?: string;
  displayName?: string | null;
  unreadAlerts: number;
};

const navigation = [
  { href: "/app/learning", label: "Accueil", icon: Home },
  { href: "/app/learning/lessons", label: "Leçons", icon: BookOpenText },
  { href: "/app/learning/revisions", label: "Révisions", icon: RefreshCcw },
  { href: "/app/learning/quran", label: "Coran", icon: BookMarked },
  { href: "/app/learning/routines", label: "Routines", icon: SunMedium },
  { href: "/app/learning/resources", label: "Ressources", icon: Library },
  { href: "/app/learning/progress", label: "Progression", icon: ChartNoAxesCombined },
] as const;

const mobileNavigation = navigation.filter((item) => ["/app/learning", "/app/learning/lessons", "/app/learning/revisions", "/app/learning/quran", "/app/learning/progress"].includes(item.href));

export function LearningShell({ children, email, displayName, unreadAlerts }: LearningShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const touch = useRef<{ x: number; edge: "left" | "right" } | null>(null);

  useEffect(() => setMenuOpen(false), [pathname]);

  function isActive(href: string) {
    return href === "/app/learning" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

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

  return (
    <div className="min-h-screen bg-[#f8f5ef] lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-emerald-950/15 bg-[#173f35] text-emerald-50 transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`} aria-label="Navigation Apprentissage">
        <div className="flex h-20 items-center justify-between px-5">
          <Link href="/app/learning" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#f2e9da] text-[#173f35]"><BookOpen size={21} /></span>
            <span><strong className="block text-lg tracking-tight">Apprentissage</strong><span className="text-xs text-emerald-100/70">Apprendre · réviser · progresser</span></span>
          </Link>
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fermer la navigation"><X size={20} /></button>
        </div>

        <div className="px-3 pb-3">
          <Link href="/app/dashboard" className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-emerald-50/90 transition hover:bg-white/10">
            <ChevronLeft size={17} /> Retour à LifeOS
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-50/45">Religion · domaine actif</p>
          <ul className="grid gap-1">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${active ? "bg-[#f6f0e5] text-[#173f35] shadow-sm" : "text-emerald-50/80 hover:bg-white/10 hover:text-white"}`}>
                    <Icon size={19} aria-hidden />{label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm font-bold"><Sparkles size={16} /> Un univers extensible</div>
            <p className="mt-2 text-xs leading-5 text-emerald-50/65">Religion d’abord. Arabe, certifications et autres apprentissages pourront rejoindre cet espace ensuite sans modifier LifeOS principal.</p>
          </div>
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link href="/app/settings" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-emerald-50/80 hover:bg-white/10"><Settings size={19} /> Réglages LifeOS</Link>
        </div>
      </aside>

      {menuOpen ? <button className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu" /> : null}

      <div className="min-w-0 pb-20 lg:pb-0" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e7dfd2] bg-[#fffdf8]/92 px-4 backdrop-blur md:px-7">
          <button className="button-secondary size-10 px-0 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Ouvrir la navigation"><Menu size={20} /></button>
          <Link href="/app/learning" className="ml-2 flex items-center gap-2 text-lg font-black tracking-[-0.03em] text-slate-950 lg:hidden"><BookOpen size={19} className="text-emerald-800" /> Apprentissage</Link>
          <div className="hidden items-center gap-2 rounded-full bg-[#efe7d9] px-3 py-1.5 text-sm font-black text-[#6a4a27] lg:flex"><BookOpen size={16} /> Religion</div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/app/alerts" className="button-secondary relative size-10 px-0" aria-label={`${unreadAlerts} alertes non lues`}><Bell size={19} />{unreadAlerts > 0 ? <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{Math.min(unreadAlerts, 99)}</span> : null}</Link>
            <SyncButton />
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-[#e7dfd2] bg-white px-2.5 py-1.5 text-left"><span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-900"><UserRound size={17} /></span><span className="hidden max-w-36 truncate text-xs md:block"><strong className="block truncate text-sm">{displayName || "Mon LifeOS"}</strong><span className="text-slate-500">{email}</span></span></summary>
              <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><Link className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100" href="/app/settings">Mon profil</Link><Link className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100" href="/app/settings/export">Exporter mes données</Link><form action={signOutAction}><button className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50">Se déconnecter</button></form></div>
            </details>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-[92rem] px-4 py-6 md:px-7 md:py-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#e7dfd2] bg-[#fffdf8]/96 px-1 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur lg:hidden" aria-label="Navigation Apprentissage mobile">
        {mobileNavigation.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return <Link key={href} href={href} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold ${active ? "text-emerald-800" : "text-slate-500"}`}><Icon size={19} /><span>{label}</span></Link>;
        })}
      </nav>
    </div>
  );
}
