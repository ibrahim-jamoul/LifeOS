"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileLock2, LoaderCircle, Plus, Search, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  buildPrivateStoragePath,
  DOCUMENT_BUCKET,
  documentCategories,
  formatBytes,
  resolveDocumentMime,
  validateDocumentFile,
} from "@/lib/file-workflows";

type DocumentRow = {
  id: string;
  title: string;
  category: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  issuer: string | null;
  issued_on: string | null;
  expires_on: string | null;
  tags: string[];
  notes: string | null;
  updated_at: string;
};

type Envelope<T> = { ok: true; data: T } | { ok: false; error: { message: string; fieldErrors?: Record<string, string[]> } };

export function DocumentVault({ userId }: { userId: string }) {
  const [items, setItems] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [expiry, setExpiry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    if (category) query.set("category", category);
    if (expiry) query.set("expiry", expiry);
    try {
      const response = await fetch(`/api/documents?${query}`, { cache: "no-store" });
      const result = await parseEnvelope<{ items: DocumentRow[] }>(response);
      if (!result.ok) throw new Error(result.error.message);
      setItems(result.data.items);
    } catch (cause) {
      setItems([]);
      setError(messageOf(cause, "Chargement des documents impossible."));
    } finally {
      setLoading(false);
    }
  }, [category, expiry, search]);

  useEffect(() => { void load(); }, [load]);

  async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    const form = event.currentTarget;
    const input = new FormData(form);
    const file = input.get("file");
    if (!(file instanceof File)) {
      setError("Sélectionnez un fichier.");
      setSaving(false);
      return;
    }
    const validationError = validateDocumentFile(file);
    const mime = resolveDocumentMime(file);
    if (validationError || !mime) {
      setError(validationError ?? "Format de fichier non pris en charge.");
      setSaving(false);
      return;
    }

    const issuedOn = textValue(input, "issued_on");
    const year = issuedOn.slice(0, 4) || new Date().getUTCFullYear();
    const storagePath = buildPrivateStoragePath(userId, year, file.name);
    const supabase = createClient();
    try {
      const { error: uploadError } = await supabase.storage.from(DOCUMENT_BUCKET).upload(storagePath, file, {
        contentType: mime,
        upsert: false,
      });
      if (uploadError) throw new Error("Upload privé impossible. Vérifiez que le bucket « documents » existe et reste privé.");

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: textValue(input, "title"),
          category: textValue(input, "category"),
          issuer: textValue(input, "issuer"),
          issued_on: issuedOn,
          expires_on: textValue(input, "expires_on"),
          tags: textValue(input, "tags"),
          notes: textValue(input, "notes"),
          storage_path: storagePath,
          original_filename: file.name,
          mime_type: mime,
          file_size_bytes: file.size,
        }),
      });
      const result = await parseEnvelope<DocumentRow>(response);
      if (!result.ok) {
        await supabase.storage.from(DOCUMENT_BUCKET).remove([storagePath]);
        throw new Error(result.error.message);
      }
      form.reset();
      setFormKey((value) => value + 1);
      setShowForm(false);
      setNotice("Document enregistré dans le coffre privé.");
      await load();
    } catch (cause) {
      setError(messageOf(cause, "Enregistrement du document impossible."));
    } finally {
      setSaving(false);
    }
  }

  async function openDocument(item: DocumentRow, download = false) {
    setError(null);
    try {
      const response = await fetch(`/api/documents/${item.id}/signed-url${download ? "?download=1" : ""}`, { cache: "no-store" });
      const result = await parseEnvelope<{ url: string }>(response);
      if (!result.ok) throw new Error(result.error.message);
      const opened = window.open(result.data.url, "_blank", "noopener,noreferrer");
      if (!opened) window.location.assign(result.data.url);
    } catch (cause) {
      setError(messageOf(cause, "Accès au fichier impossible."));
    }
  }

  async function deleteDocument(item: DocumentRow) {
    if (!window.confirm(`Supprimer définitivement « ${item.title} » et son fichier privé ?`)) return;
    setError(null);
    const response = await fetch(`/api/documents/${item.id}`, { method: "DELETE" });
    const result = await parseEnvelope<{ deleted: boolean }>(response);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setNotice("Document et fichier privé supprimés.");
    await load();
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Coffre privé</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Documents</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Métadonnées filtrables, fichiers isolés par utilisateur et liens temporaires de cinq minutes.</p>
        </div>
        <button className="button-primary" onClick={() => setShowForm((value) => !value)}><Plus size={18} />Ajouter un document</button>
      </header>

      {notice ? <Message tone="success" onClose={() => setNotice(null)}>{notice}</Message> : null}
      {error ? <Message tone="error" onClose={() => setError(null)}>{error}</Message> : null}

      {showForm ? (
        <form key={formKey} className="card grid gap-4" onSubmit={uploadDocument}>
          <div className="flex items-center justify-between"><h2 className="font-bold">Nouveau document privé</h2><button type="button" onClick={() => setShowForm(false)} aria-label="Fermer"><X size={19} /></button></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="field md:col-span-2"><span>Titre *</span><input className="input" name="title" required maxLength={240} /></label>
            <label className="field"><span>Catégorie *</span><select className="input" name="category" defaultValue="administrative" required>{documentCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="field"><span>Fichier *</span><input className="input" name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.doc,.docx,.xls,.xlsx,.ppt,.pptx" /></label>
            <label className="field"><span>Émetteur</span><input className="input" name="issuer" maxLength={240} /></label>
            <label className="field"><span>Tags (séparés par des virgules)</span><input className="input" name="tags" maxLength={500} /></label>
            <label className="field"><span>Date d’émission</span><input className="input" name="issued_on" type="date" /></label>
            <label className="field"><span>Date d’expiration</span><input className="input" name="expires_on" type="date" /></label>
            <label className="field md:col-span-2 xl:col-span-3"><span>Notes</span><textarea className="input min-h-24" name="notes" maxLength={5000} /></label>
          </div>
          <p className="text-xs text-slate-500">25 Mo maximum. PDF, images et formats Office pris en charge.</p>
          <div><button className="button-primary" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={18} /> : <FileLock2 size={18} />}{saving ? "Chiffrement et enregistrement…" : "Enregistrer dans le coffre"}</button></div>
        </form>
      ) : null}

      <form className="card flex flex-col gap-3 p-3 md:flex-row" onSubmit={(event) => { event.preventDefault(); setSearch(searchDraft.trim()); }}>
        <label className="relative flex-1"><span className="sr-only">Rechercher</span><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input className="input pl-10" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Titre, fichier, émetteur ou notes…" /></label>
        <select className="input md:w-48" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Catégorie"><option value="">Toutes catégories</option>{documentCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <select className="input md:w-48" value={expiry} onChange={(event) => setExpiry(event.target.value)} aria-label="Expiration"><option value="">Toute expiration</option><option value="7">Sous 7 jours</option><option value="30">Sous 30 jours</option><option value="90">Sous 90 jours</option><option value="expired">Expirés</option><option value="none">Sans expiration</option></select>
        <button className="button-secondary" type="submit"><Search size={17} />Rechercher</button>
      </form>

      {loading ? <Loading /> : items.length === 0 ? <Empty /> : (
        <section className="grid gap-3">
          {items.map((item) => (
            <article key={item.id} className="card flex flex-col gap-4 lg:flex-row lg:items-center">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><FileLock2 /></span>
              <div className="min-w-0 flex-1"><h2 className="truncate font-bold">{item.title}</h2><p className="mt-1 truncate text-xs text-slate-500">{item.original_filename} · {formatBytes(item.file_size_bytes)} · {labelForCategory(item.category)}</p><p className="mt-2 text-xs text-slate-600">{item.issuer ? `${item.issuer} · ` : ""}{item.expires_on ? `expire le ${formatDate(item.expires_on)}` : "sans expiration"}{item.tags.length ? ` · ${item.tags.join(", ")}` : ""}</p></div>
              <div className="flex flex-wrap gap-2"><button className="button-secondary" onClick={() => void openDocument(item)}><FileLock2 size={16} />Ouvrir</button><button className="button-secondary" onClick={() => void openDocument(item, true)} aria-label={`Télécharger ${item.title}`}><Download size={16} /></button><button className="button-danger" onClick={() => void deleteDocument(item)} aria-label={`Supprimer ${item.title}`}><Trash2 size={16} /></button></div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function textValue(form: FormData, key: string): string { const value = form.get(key); return typeof value === "string" ? value.trim() : ""; }
async function parseEnvelope<T>(response: Response): Promise<Envelope<T>> { try { return await response.json() as Envelope<T>; } catch { return { ok: false, error: { message: `Réponse serveur invalide (${response.status}).` } }; } }
function messageOf(cause: unknown, fallback: string): string { return cause instanceof Error ? cause.message : fallback; }
function labelForCategory(value: string): string { return documentCategories.find((item) => item.value === value)?.label ?? value; }
function formatDate(value: string): string { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`)); }
function Loading() { return <div className="card flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={20} />Chargement du coffre…</div>; }
function Empty() { return <div className="card py-12 text-center"><FileLock2 className="mx-auto text-slate-400" /><h2 className="mt-3 font-bold">Aucun document</h2><p className="mt-1 text-sm text-slate-500">Ajoutez un fichier pour démarrer votre coffre privé.</p></div>; }
function Message({ children, tone, onClose }: { children: React.ReactNode; tone: "success" | "error"; onClose: () => void }) { return <div role={tone === "error" ? "alert" : "status"} className={`flex items-center justify-between rounded-xl border p-3 text-sm ${tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}><span>{children}</span><button onClick={onClose} aria-label="Fermer"><X size={17} /></button></div>; }
