import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileJson, ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Exporter mes données" };

export default function ExportPage() {
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Portabilité</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Exporter mes données</h1><p className="mt-2 text-sm leading-6 text-slate-600">Téléchargez une copie structurée de toutes les lignes appartenant à votre compte.</p></header>
      <section className="card grid gap-5">
        <div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><FileJson /></span><div><h2 className="font-bold">Export JSON LifeOS</h2><p className="mt-1 text-sm leading-6 text-slate-600">L’export couvre les neuf branches, le pilotage, les alertes, l’historique et les métadonnées de fichiers. Les binaires privés ne sont pas inclus.</p></div></div>
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><ShieldCheck className="mt-0.5 shrink-0" size={19} /><p>La génération est authentifiée, filtrée par votre identifiant et protégée par RLS. Conservez le fichier téléchargé comme une donnée sensible.</p></div>
        <div className="flex flex-wrap gap-3"><a className="button-primary" href="/api/export" download><Download size={18} />Télécharger le JSON</a><Link className="button-secondary" href="/app/settings">Retour aux réglages</Link></div>
      </section>
    </div>
  );
}
