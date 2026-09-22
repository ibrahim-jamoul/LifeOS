import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, BriefcaseBusiness, CircleDollarSign, FileLock2, FolderKanban, HeartPulse, Languages, MoonStar, Settings, Sparkles, Target } from "lucide-react";

export const metadata: Metadata = { title: "Explorer" };

const groups = [
  { title: "Pilotage", items: [
    { href: "/app/goals", label: "Objectifs, projets & tâches", description: "Administration détaillée du système de pilotage.", icon: Target },
    { href: "/app/goals/projects", label: "Projets", description: "Portefeuille, statuts, prochaines actions et jalons.", icon: FolderKanban },
    { href: "/app/goals/decisions", label: "Décisions", description: "Journal de décisions et dates de réévaluation.", icon: BriefcaseBusiness },
  ] },
  { title: "Personnel", items: [
    { href: "/app/health", label: "Santé, sport & habitudes", description: "Routines, séances et données factuelles.", icon: HeartPulse },
    { href: "/app/finances", label: "Finances", description: "Comptes, transactions, budgets et patrimoine.", icon: CircleDollarSign },
    { href: "/app/documents", label: "Documents", description: "Coffre documentaire privé.", icon: FileLock2 },
    { href: "/app/memories", label: "Souvenirs", description: "Photos et moments importants.", icon: Sparkles },
  ] },
  { title: "Religion & apprentissage", items: [
    { href: "/app/religion", label: "Religion", description: "Sujets, sessions et routines.", icon: MoonStar },
    { href: "/app/quran", label: "Coran", description: "Lecture, mémorisation et révision.", icon: BookOpen },
    { href: "/app/arabic", label: "Arabe", description: "Sessions, temps étudié et progression.", icon: Languages },
  ] },
  { title: "Administration", items: [
    { href: "/app/settings", label: "Réglages", description: "Profil, conventions et données avancées.", icon: Settings },
  ] },
] as const;

export default function ExplorerPage() {
  return (
    <div className="grid gap-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Explorer</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Toutes les données, sans encombrer le quotidien</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Les écrans détaillés existants restent disponibles ici. Le pilotage quotidien passe désormais par Aujourd’hui, Progression, Insights et Revue.</p>
      </header>
      {groups.map((group) => (
        <section key={group.title}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.15em] text-slate-500">{group.title}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {group.items.map(({ href, label, description, icon: Icon }) => (
              <Link href={href} key={href} className="card group flex items-start gap-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Icon size={20} /></span>
                <span><strong className="block">{label}</strong><span className="mt-1 block text-sm leading-5 text-slate-600">{description}</span></span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
