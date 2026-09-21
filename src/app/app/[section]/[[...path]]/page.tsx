import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ResourceWorkspace } from "@/components/resource-workspace";

type SectionDefinition = {
  heading: string;
  intro: string;
  resources: readonly string[];
  paths: Readonly<Record<string, string>>;
};

const sections: Readonly<Record<string, SectionDefinition>> = {
  goals: {
    heading: "Pilotage",
    intro: "Reliez résultats, projets, actions, mesures, revues et décisions dans une seule boucle.",
    resources: ["vision", "goals", "projects", "tasks", "kpis", "kpi_entries", "weekly_reviews", "decisions", "reminders", "resources"],
    paths: { objectives: "goals", projects: "projects", tasks: "tasks", kpis: "kpis", "kpi-entries": "kpi_entries", reviews: "weekly_reviews", decisions: "decisions", reminders: "reminders", resources: "resources", vision: "vision" },
  },
  religion: {
    heading: "Religion",
    intro: "Organisez vos apprentissages et routines personnelles sans imposer de pratique ni confondre activité et maîtrise.",
    resources: ["religion_topics", "religion_sessions", "religion_routines", "religion_logs"],
    paths: { topics: "religion_topics", sessions: "religion_sessions", routines: "religion_routines", logs: "religion_logs" },
  },
  arabic: {
    heading: "Arabe",
    intro: "Suivez le temps réellement étudié, les compétences travaillées et votre objectif hebdomadaire.",
    resources: ["arabic_profile", "arabic_sessions"],
    paths: { progress: "arabic_profile", sessions: "arabic_sessions" },
  },
  quran: {
    heading: "Coran",
    intro: "Distinguez clairement lecture, mémorisation et révision, avec une vraie file d’échéances.",
    resources: ["quran_items", "quran_sessions"],
    paths: { items: "quran_items", sessions: "quran_sessions", revision: "quran_items" },
  },
  finances: {
    heading: "Finances",
    intro: "Connaissez votre position et votre capacité avant de décider; les transferts internes restent hors revenus et dépenses.",
    resources: ["financial_accounts", "financial_transactions", "budget_items", "financial_goals", "net_worth_snapshots"],
    paths: { accounts: "financial_accounts", transactions: "financial_transactions", budgets: "budget_items", goals: "financial_goals", "net-worth": "net_worth_snapshots" },
  },
  health: {
    heading: "Santé, sport & habitudes",
    intro: "Enregistrez des données factuelles et observez leurs tendances, sans interprétation médicale.",
    resources: ["habits", "habit_logs", "health_metrics", "health_entries", "workouts"],
    paths: { habits: "habits", logs: "habit_logs", metrics: "health_metrics", entries: "health_entries", workouts: "workouts" },
  },
  settings: {
    heading: "Réglages",
    intro: "Définissez les conventions temporelles et monétaires utilisées dans votre LifeOS.",
    resources: ["profile", "vision"],
    paths: { profile: "profile", vision: "vision" },
  },
};

type PageProps = { params: Promise<{ section: string; path?: string[] }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  return { title: sections[section]?.heading ?? "LifeOS" };
}

export default async function SectionPage({ params }: PageProps) {
  const { section, path } = await params;
  const definition = sections[section];
  if (!definition) notFound();

  const requestedPath = path?.join("/") ?? "";
  const initialResource = requestedPath ? definition.paths[requestedPath] : definition.resources[0];
  if (!initialResource) notFound();

  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-slate-200/80" />}>
      <ResourceWorkspace
        key={`${section}-${requestedPath}`}
        resourceKeys={definition.resources}
        initialResource={initialResource}
        initialView={section === "quran" && requestedPath === "revision" ? "revision" : undefined}
        heading={definition.heading}
        intro={definition.intro}
      />
    </Suspense>
  );
}
