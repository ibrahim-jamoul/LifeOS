"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  BrainCircuit,
  ChevronDown,
  CircleDollarSign,
  FileLock2,
  Gauge,
  HeartPulse,
  Languages,
  Menu,
  MoonStar,
  Plus,
  Settings,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";

type AppShellProps = {
  children: React.ReactNode;
  email?: string;
  displayName?: string | null;
  unreadAlerts: number;
};

const navigation = [
  { href: "/app/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/app/religion", label: "Religion", icon: MoonStar },
  { href: "/app/arabic", label: "Arabe", icon: Languages },
  { href: "/app/quran", label: "Coran", icon: BookOpen },
  { href: "/app/goals", label: "Objectifs & KPI", icon: Target },
  { href: "/app/assistant", label: "Assistant IA", icon: Bot },
  { href: "/app/finances", label: "Finances", icon: CircleDollarSign },
  { href: "/app/health", label: "Santé & habitudes", icon: HeartPulse },
  { href: "/app/documents", label: "Documents", icon: FileLock2 },
  { href: "/app/memories", label: "Souvenirs", icon: Sparkles },
] as const;

const quickLinks = [
  { label: "Tâche", href: "/app/goals/tasks?new=1" },
  { label: "Mesure KPI", href: "/app/goals/kpi-entries?new=1" },
  { label: "Décision", href: "/app/goals/decisions?new=1" },
  { label: "Transaction", href: "/app/finances/transactions?new=1" },
  { label: "Session d’étude", href: "/app/religion/sessions?new=1" },
] as const;

export function AppShell({ children, email, displayName, unreadAlerts }: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setCaptureOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-emerald-950/15 bg-[#123c33] text-emerald-50 transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigation principale"
      >
        <div className="flex h-20 items-center justify-between px-5">
          <Link href="/app/dashboard" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 font-extrabold text-emerald-950">LO</span>
            <span>
              <strong className="block text-lg tracking-tight">LifeOS</strong>
              <span className="text-xs text-emerald-100/70">Piloter l’essentiel</span>
            </span>
          </Link>
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fermer la navigation">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          <ul className="grid gap-1">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/app/dashboard" && pathname.startsWith(`${href}/`));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                      active ? "bg-emerald-50 text-emerald-950 shadow-sm" : "text-emerald-50/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={19} aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link href="/app/settings" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-emerald-50/80 hover:bg-white/10">
            <Settings size={19} /> Réglages
          </Link>
        </div>
      </aside>

      {menuOpen ? (
        <button className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu" />
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur md:px-7">
          <button className="button-secondary size-10 px-0 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Ouvrir la navigation">
            <Menu size={20} />
          </button>

          <div className="relative ml-auto flex items-center gap-2">
            <button className="button-primary" onClick={() => setCaptureOpen((value) => !value)} aria-expanded={captureOpen}>
              <Plus size={18} />
              <span className="hidden sm:inline">Capturer</span>
              <ChevronDown size={15} />
            </button>
            {captureOpen ? (
              <div className="absolute right-20 top-12 z-40 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl sm:right-24">
                {quickLinks.map((link) => (
                  <Link key={link.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100" href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}

            <Link href="/app/alerts" className="button-secondary relative size-10 px-0" aria-label={`${unreadAlerts} alertes non lues`}>
              <Bell size={19} />
              {unreadAlerts > 0 ? (
                <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                  {Math.min(unreadAlerts, 99)}
                </span>
              ) : null}
            </Link>

            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-left">
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-900"><BrainCircuit size={17} /></span>
                <span className="hidden max-w-36 truncate text-xs md:block">
                  <strong className="block truncate text-sm">{displayName || "Mon LifeOS"}</strong>
                  <span className="text-slate-500">{email}</span>
                </span>
              </summary>
              <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <Link className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100" href="/app/settings">Mon profil</Link>
                <Link className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100" href="/app/settings/export">Exporter mes données</Link>
                <form action={signOutAction}>
                  <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50">Se déconnecter</button>
                </form>
              </div>
            </details>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[96rem] px-4 py-6 md:px-7 md:py-8">{children}</main>
      </div>
    </div>
  );
}
