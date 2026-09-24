import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { ResourceWorkspace } from "@/components/resource-workspace";

export const metadata: Metadata = { title: "Coran · Apprentissage" };

export default function LearningQuranPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-[#e8dfd1] bg-[#fffdf8] p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Coran</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">Lecture, mémorisation et révision</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Le parcours Coran reste distinct des objectifs LifeOS. Vous enregistrez ici ce que vous travaillez, vos sessions, votre confiance et la prochaine révision.</p>
          </div>
          <Link href="/app/learning/revisions" className="button-secondary shrink-0"><AlertTriangle size={17} /> Points d’attention</Link>
        </div>
      </section>
      <ResourceWorkspace
        resourceKeys={["quran_items", "quran_sessions"]}
        heading="Parcours Coran"
        intro="Créez les passages réellement travaillés et journalisez vos sessions. Les échéances de révision restent des données d’apprentissage et n’encombrent pas l’interface Aujourd’hui de LifeOS."
      />
      <Link href="/app/learning/revisions" className="card flex items-center justify-between gap-4 border-amber-200 bg-amber-50/60">
        <div><strong className="flex items-center gap-2"><RefreshCcw size={17} /> Ouvrir la file de révisions</strong><p className="mt-1 text-sm text-slate-600">Points fragiles et passages arrivés à échéance.</p></div><span aria-hidden>→</span>
      </Link>
    </div>
  );
}
