/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ImagePlus, LoaderCircle, MapPin, Plus, Search, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  buildPrivateStoragePath,
  formatBytes,
  MEMORIES_BUCKET,
  resolveMemoryMime,
  validateMemoryFiles,
} from "@/lib/file-workflows";

type Asset = {
  id: string;
  original_filename: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  signed_url: string | null;
};

type MemoryRow = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  location_text: string | null;
  description: string | null;
  tags: string[];
  assets: Asset[];
  created_at: string;
};

type Envelope<T> = { ok: true; data: T } | { ok: false; error: { message: string } };

export function MemoryTimeline({ userId }: { userId: string }) {
  const [items, setItems] = useState<MemoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [tag, setTag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    if (tag) query.set("tag", tag);
    try {
      const response = await fetch(`/api/memories?${query}`, { cache: "no-store" });
      const result = await parseEnvelope<{ items: MemoryRow[] }>(response);
      if (!result.ok) throw new Error(result.error.message);
      setItems(result.data.items);
    } catch (cause) {
      setItems([]);
      setError(messageOf(cause, "Chargement des souvenirs impossible."));
    } finally {
      setLoading(false);
    }
  }, [search, tag]);

  useEffect(() => { void load(); }, [load]);

  async function createMemory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    const form = event.currentTarget;
    const values = new FormData(form);
    const files = values.getAll("assets").filter((value): value is File => value instanceof File && value.size > 0);
    const validationError = validateMemoryFiles(files);
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    let memoryId: string | null = null;
    let completed = 0;
    try {
      const response = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: textValue(values, "title"),
          start_date: textValue(values, "start_date"),
          end_date: textValue(values, "end_date"),
          location_text: textValue(values, "location_text"),
          description: textValue(values, "description"),
          tags: textValue(values, "tags"),
        }),
      });
      const memoryResult = await parseEnvelope<MemoryRow>(response);
      if (!memoryResult.ok) throw new Error(memoryResult.error.message);
      memoryId = memoryResult.data.id;

      const supabase = createClient();
      const year = textValue(values, "start_date").slice(0, 4) || new Date().getUTCFullYear();
      for (const file of files) {
        const mime = resolveMemoryMime(file);
        if (!mime) throw new Error(`${file.name} n’est pas pris en charge.`);
        const path = buildPrivateStoragePath(userId, year, file.name);
        const { error: uploadError } = await supabase.storage.from(MEMORIES_BUCKET).upload(path, file, { contentType: mime, upsert: false });
        if (uploadError) throw new Error(`Upload privé impossible pour ${file.name}. Vérifiez le bucket « memories » et ses politiques.`);
        const assetResponse = await fetch(`/api/memories/${memoryId}/assets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storage_path: path, original_filename: file.name, mime_type: mime, file_size_bytes: file.size }),
        });
        const assetResult = await parseEnvelope<Asset>(assetResponse);
        if (!assetResult.ok) {
          await supabase.storage.from(MEMORIES_BUCKET).remove([path]);
          throw new Error(assetResult.error.message);
        }
        completed += 1;
      }

      form.reset();
      setFormKey((value) => value + 1);
      setShowForm(false);
      setNotice(`Souvenir enregistré avec ${completed} média${completed > 1 ? "s" : ""} privé${completed > 1 ? "s" : ""}.`);
      await load();
    } catch (cause) {
      const prefix = memoryId ? `${completed} média${completed > 1 ? "s" : ""} enregistré${completed > 1 ? "s" : ""}; ` : "";
      setError(`${prefix}${messageOf(cause, "Création du souvenir impossible.")}`);
      if (memoryId) await load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteMemory(memory: MemoryRow) {
    if (!window.confirm(`Supprimer définitivement « ${memory.title} » et tous ses médias privés ?`)) return;
    setError(null);
    const response = await fetch(`/api/memories/${memory.id}`, { method: "DELETE" });
    const result = await parseEnvelope<{ deleted: boolean }>(response);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setNotice("Souvenir et médias privés supprimés.");
    await load();
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Chronologie privée</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Souvenirs</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Photos et vidéos restent dans un bucket privé; cette vue n’utilise que des URLs signées temporaires.</p></div>
        <button className="button-primary" onClick={() => setShowForm((value) => !value)}><Plus size={18} />Créer un souvenir</button>
      </header>

      {notice ? <Message tone="success" onClose={() => setNotice(null)}>{notice}</Message> : null}
      {error ? <Message tone="error" onClose={() => setError(null)}>{error}</Message> : null}

      {showForm ? (
        <form key={formKey} className="card grid gap-4" onSubmit={createMemory}>
          <div className="flex items-center justify-between"><h2 className="font-bold">Nouveau souvenir</h2><button type="button" onClick={() => setShowForm(false)} aria-label="Fermer"><X size={19} /></button></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="field md:col-span-2"><span>Titre *</span><input className="input" name="title" required maxLength={240} /></label>
            <label className="field"><span>Lieu</span><input className="input" name="location_text" maxLength={300} /></label>
            <label className="field"><span>Date de début</span><input className="input" name="start_date" type="date" /></label>
            <label className="field"><span>Date de fin</span><input className="input" name="end_date" type="date" /></label>
            <label className="field"><span>Tags (virgules)</span><input className="input" name="tags" maxLength={500} /></label>
            <label className="field md:col-span-2 xl:col-span-3"><span>Description</span><textarea className="input min-h-24" name="description" maxLength={5000} /></label>
            <label className="field md:col-span-2 xl:col-span-3"><span>Photos ou vidéos * (sélection multiple)</span><input className="input" name="assets" type="file" multiple required accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,video/mp4,video/quicktime,video/webm" /></label>
          </div>
          <p className="text-xs text-slate-500">12 fichiers par envoi, 20 par souvenir, 50 Mo par fichier et 150 Mo par sélection.</p>
          <div><button className="button-primary" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={18} /> : <ImagePlus size={18} />}{saving ? "Upload privé en cours…" : "Enregistrer le souvenir"}</button></div>
        </form>
      ) : null}

      <form className="card flex flex-col gap-3 p-3 md:flex-row" onSubmit={(event) => { event.preventDefault(); setSearch(searchDraft.trim()); setTag(tagDraft.trim()); }}>
        <label className="relative flex-1"><span className="sr-only">Rechercher</span><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input className="input pl-10" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Titre, lieu ou description…" /></label>
        <input className="input md:w-56" value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} placeholder="Filtrer par tag exact" aria-label="Tag" />
        <button className="button-secondary" type="submit"><Search size={17} />Rechercher</button>
      </form>

      {loading ? <div className="card flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={20} />Chargement de la chronologie…</div> : items.length === 0 ? <Empty /> : (
        <section className="relative grid gap-5 before:absolute before:bottom-0 before:left-4 before:top-0 before:w-px before:bg-emerald-200 md:before:left-6">
          {items.map((memory) => (
            <article key={memory.id} className="card relative ml-9 md:ml-12">
              <span className="absolute -left-[2.65rem] top-6 size-3 rounded-full border-2 border-white bg-emerald-700 ring-4 ring-emerald-100 md:-left-[3.65rem]" />
              <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-bold">{memory.title}</h2><p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><CalendarDays size={14} />{memory.start_date ? formatDateRange(memory.start_date, memory.end_date) : "Date non précisée"}</span>{memory.location_text ? <span className="inline-flex items-center gap-1"><MapPin size={14} />{memory.location_text}</span> : null}</p></div><button className="button-danger shrink-0" onClick={() => void deleteMemory(memory)}><Trash2 size={16} /><span className="sr-only sm:not-sr-only">Supprimer</span></button></header>
              {memory.description ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{memory.description}</p> : null}
              {memory.assets.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{memory.assets.map((asset) => <AssetPreview key={asset.id} asset={asset} />)}</div> : <p className="mt-4 text-sm text-amber-800">Aucun média disponible pour ce souvenir.</p>}
              {memory.tags.length ? <ul className="mt-4 flex flex-wrap gap-2">{memory.tags.map((value) => <li key={value} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{value}</li>)}</ul> : null}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function AssetPreview({ asset }: { asset: Asset }) {
  return <figure className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">{asset.signed_url ? asset.mime_type?.startsWith("video/") ? <video className="aspect-video w-full object-contain" controls preload="metadata" src={asset.signed_url} /> : <a href={asset.signed_url} target="_blank" rel="noreferrer"><img className="aspect-video w-full object-cover" src={asset.signed_url} alt={asset.original_filename} loading="lazy" /></a> : <div className="grid aspect-video place-items-center px-4 text-center text-xs text-white">URL privée indisponible</div>}<figcaption className="truncate bg-white px-3 py-2 text-xs text-slate-600">{asset.original_filename} · {formatBytes(asset.file_size_bytes)}</figcaption></figure>;
}

function textValue(form: FormData, key: string): string { const value = form.get(key); return typeof value === "string" ? value.trim() : ""; }
async function parseEnvelope<T>(response: Response): Promise<Envelope<T>> { try { return await response.json() as Envelope<T>; } catch { return { ok: false, error: { message: `Réponse serveur invalide (${response.status}).` } }; } }
function messageOf(cause: unknown, fallback: string): string { return cause instanceof Error ? cause.message : fallback; }
function formatDate(value: string): string { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`)); }
function formatDateRange(start: string, end: string | null): string { return end && end !== start ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start); }
function Empty() { return <div className="card py-12 text-center"><ImagePlus className="mx-auto text-slate-400" /><h2 className="mt-3 font-bold">Aucun souvenir</h2><p className="mt-1 text-sm text-slate-500">Créez une première entrée avec plusieurs photos ou vidéos.</p></div>; }
function Message({ children, tone, onClose }: { children: React.ReactNode; tone: "success" | "error"; onClose: () => void }) { return <div role={tone === "error" ? "alert" : "status"} className={`flex items-center justify-between rounded-xl border p-3 text-sm ${tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}><span>{children}</span><button onClick={onClose} aria-label="Fermer"><X size={17} /></button></div>; }
