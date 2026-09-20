"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Edit3,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { FieldConfig, ResourceConfig } from "@/lib/resources";
import { getField, getResourceConfig } from "@/lib/resources";
import { OperationalInsights } from "@/components/operational-insights";

type Row = Record<string, unknown> & { id?: string };
type OptionRow = { value: string; label: string };
type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
type PageData = { items: Row[]; page: number; limit: number; count: number; totalPages: number };

type ResourceWorkspaceProps = {
  resourceKeys: readonly string[];
  initialResource?: string;
  initialView?: string;
  heading?: string;
  intro?: string;
};

export function ResourceWorkspace({ resourceKeys, initialResource, initialView, heading, intro }: ResourceWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const available = useMemo(
    () => resourceKeys.map((key) => getResourceConfig(key)).filter((config): config is ResourceConfig => Boolean(config)),
    [resourceKeys],
  );
  const [activeKey, setActiveKey] = useState(initialResource && resourceKeys.includes(initialResource) ? initialResource : resourceKeys[0] ?? "");
  const config = getResourceConfig(activeKey);
  const [rows, setRows] = useState<Row[]>([]);
  const [relations, setRelations] = useState<Record<string, OptionRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const requestedView = searchParams.get("view") ?? initialView ?? "";
  const [view, setView] = useState(requestedView);
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState<Pick<PageData, "count" | "totalPages">>({ count: 0, totalPages: 1 });
  const [editor, setEditor] = useState<{ mode: "create" | "edit"; row?: Row } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [insightRefresh, setInsightRefresh] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setFilters({});
    setSearch("");
    setDebouncedSearch("");
    setView(activeKey === initialResource ? requestedView : "");
    setPage(1);
    setNotice(null);
  }, [activeKey, initialResource, requestedView]);

  const load = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError(null);
    const query = new URLSearchParams({ page: String(page), limit: config.singleton ? "1" : "50" });
    if (debouncedSearch) query.set("q", debouncedSearch);
    if (view) query.set("view", view);
    for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);

    try {
      const response = await fetch(`/api/data/${config.key}?${query}`, { cache: "no-store" });
      const result = await parseEnvelope<PageData>(response);
      if (!result.ok) throw new Error(result.error.message);
      setRows(result.data.items);
      setPageData({ count: result.data.count, totalPages: result.data.totalPages });
    } catch (cause) {
      setRows([]);
      setError(cause instanceof Error ? cause.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [config, page, debouncedSearch, filters, view]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!config) return;
    const relationKeys = Array.from(new Set(config.fields.map((field) => field.relation).filter((key): key is string => Boolean(key))));
    if (relationKeys.length === 0) {
      setRelations({});
      return;
    }
    let cancelled = false;
    void Promise.all(relationKeys.map(async (key) => {
      const relationConfig = getResourceConfig(key);
      if (!relationConfig) return [key, []] as const;
      const response = await fetch(`/api/data/${key}?limit=200`, { cache: "no-store" });
      const result = await parseEnvelope<PageData>(response);
      if (!result.ok) return [key, []] as const;
      return [key, result.data.items.map((row) => ({ value: String(row.id ?? ""), label: rowLabel(relationConfig, row) })).filter((option) => option.value)] as const;
    })).then((entries) => { if (!cancelled) setRelations(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, [config]);

  useEffect(() => {
    if (!config || loading || editor || searchParams.get("new") === null) return;
    setEditor({ mode: "create" });
  }, [config, editor, loading, searchParams]);

  if (!config || available.length === 0) {
    return <ErrorPanel message="Cette vue LifeOS n’est pas configurée." onRetry={() => router.refresh()} />;
  }
  const resolvedConfig: ResourceConfig = config;

  async function mutateRow(row: Row, changes: Record<string, unknown>, successMessage: string) {
    if (!row.id) return;
    setSavingId(row.id);
    setError(null);
    const payload = payloadFromRow(resolvedConfig, { ...row, ...changes });
    try {
      const response = await fetch(`/api/data/${resolvedConfig.key}/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await parseEnvelope<Row>(response);
      if (!result.ok) throw new Error(result.error.message);
      setNotice(successMessage);
      await load();
      setInsightRefresh((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Modification impossible.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(row: Row) {
    if (!row.id || !window.confirm(`Supprimer définitivement ${resolvedConfig.singular} « ${rowLabel(resolvedConfig, row)} » ? Cette action est irréversible.`)) return;
    setSavingId(row.id);
    try {
      const response = await fetch(`/api/data/${resolvedConfig.key}/${row.id}`, { method: "DELETE" });
      const result = await parseEnvelope<{ deleted: boolean }>(response);
      if (!result.ok) throw new Error(result.error.message);
      setNotice(`${capitalize(resolvedConfig.singular)} supprimé${resolvedConfig.singular.endsWith("e") ? "e" : ""}.`);
      await load();
      setInsightRefresh((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Suppression impossible.");
    } finally {
      setSavingId(null);
    }
  }

  function closeEditor() {
    setEditor(null);
    if (searchParams.has("new")) router.replace(window.location.pathname, { scroll: false });
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">{heading ?? "LifeOS"}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{config.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{intro ?? config.description}</p>
        </div>
        {!config.readOnly ? (
          <button className="button-primary shrink-0" onClick={() => setEditor({ mode: config.singleton && rows[0] ? "edit" : "create", row: config.singleton ? rows[0] : undefined })}>
            {config.singleton && rows[0] ? <Edit3 size={18} /> : <Plus size={18} />}
            {config.singleton && rows[0] ? "Modifier" : `Ajouter ${article(config.singular)}`}
          </button>
        ) : null}
      </header>

      {available.length > 1 ? (
        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2" aria-label="Sous-sections">
          {available.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveKey(item.key)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold ${item.key === activeKey ? "bg-emerald-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
            >
              {item.title}
            </button>
          ))}
        </nav>
      ) : null}

      {notice ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">
          <span className="flex items-center gap-2"><Check size={17} />{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Fermer"><X size={17} /></button>
        </div>
      ) : null}
      {error ? <ErrorPanel message={error} onRetry={() => void load()} /> : null}

      <OperationalInsights resourceKey={config.key} refreshToken={insightRefresh} />

      {!config.singleton ? (
        <section className="card flex flex-col gap-3 p-3 md:flex-row md:items-center">
          {config.searchFields?.length ? (
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Rechercher</span>
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input className="input pl-10" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={`Rechercher dans ${config.title.toLowerCase()}…`} />
            </label>
          ) : <div className="flex-1" />}
          {config.filterFields?.map((fieldKey) => {
            const field = getField(config, fieldKey);
            if (!field) return null;
            const options = field.options ?? (field.relation ? relations[field.relation] : undefined);
            if (!options) return null;
            return (
              <label key={fieldKey} className="sr-only md:not-sr-only md:grid md:gap-1 md:text-xs md:font-semibold md:text-slate-500">
                {field.label}
                <select className="input min-w-40" value={filters[fieldKey] ?? ""} onChange={(event) => { setFilters((current) => ({ ...current, [fieldKey]: event.target.value })); setPage(1); }}>
                  <option value="">Tous</option>
                  {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            );
          })}
          {config.key === "tasks" ? (
            <select className="input w-auto" aria-label="Vue des tâches" value={view} onChange={(event) => { setView(event.target.value); setPage(1); }}>
              <option value="">Toutes</option><option value="today">Aujourd’hui</option><option value="week">Cette semaine</option><option value="overdue">En retard</option>
            </select>
          ) : null}
          {config.key === "quran_items" ? (
            <button className={`button-secondary ${view === "revision" ? "border-emerald-700 bg-emerald-50" : ""}`} onClick={() => setView((current) => current === "revision" ? "" : "revision")}>File de révision</button>
          ) : null}
          <button className="button-secondary size-11 px-0" onClick={() => void load()} aria-label="Actualiser"><RefreshCw size={17} /></button>
        </section>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: config.singleton ? 1 : 6 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-2xl bg-slate-200/80" />)}
        </div>
      ) : rows.length === 0 ? (
        <section className="card grid min-h-56 place-items-center text-center">
          <div>
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Plus size={22} /></div>
            <h2 className="mt-4 font-bold">Aucune donnée pour le moment</h2>
            <p className="mt-1 max-w-md text-sm text-slate-600">Ajoutez vos vraies données; LifeOS n’invente aucune valeur de démonstration.</p>
            {!config.readOnly ? <button className="button-primary mt-5" onClick={() => setEditor({ mode: "create" })}>Ajouter {article(config.singular)}</button> : null}
          </div>
        </section>
      ) : (
        <section className={`grid gap-4 ${config.singleton ? "max-w-3xl" : "md:grid-cols-2 xl:grid-cols-3"}`}>
          {rows.map((row, index) => (
            <RecordCard
              key={row.id ?? index}
              config={config}
              row={row}
              relations={relations}
              busy={savingId === row.id}
              onEdit={() => setEditor({ mode: "edit", row })}
              onDelete={() => void deleteRow(row)}
              onArchive={config.archive ? () => void mutateRow(row, { [config.archive!.field]: config.archive!.value }, `${capitalize(config.singular)} archivé.`) : undefined}
              onComplete={config.key === "tasks" && row.status !== "done" ? () => void mutateRow(row, { status: "done", completed_at: new Date().toISOString() }, "Tâche terminée.") : undefined}
            />
          ))}
        </section>
      )}

      {!config.singleton && pageData.totalPages > 1 ? (
        <nav className="flex items-center justify-between gap-4" aria-label="Pagination">
          <span className="text-sm text-slate-600">{pageData.count} enregistrements · page {page}/{pageData.totalPages}</span>
          <div className="flex gap-2">
            <button className="button-secondary size-10 px-0" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label="Page précédente"><ChevronLeft size={18} /></button>
            <button className="button-secondary size-10 px-0" disabled={page >= pageData.totalPages} onClick={() => setPage((current) => Math.min(pageData.totalPages, current + 1))} aria-label="Page suivante"><ChevronRight size={18} /></button>
          </div>
        </nav>
      ) : null}

      {editor ? (
        <ResourceEditor
          config={config}
          mode={editor.mode}
          row={editor.row}
          relations={relations}
          onClose={closeEditor}
          onSaved={async () => { closeEditor(); setNotice(editor.mode === "create" ? `${capitalize(config.singular)} ajouté.` : "Modifications enregistrées."); await load(); setInsightRefresh((value) => value + 1); }}
        />
      ) : null}
    </div>
  );
}

function RecordCard({ config, row, relations, busy, onEdit, onDelete, onArchive, onComplete }: {
  config: ResourceConfig; row: Row; relations: Record<string, OptionRow[]>; busy: boolean;
  onEdit: () => void; onDelete: () => void; onArchive?: () => void; onComplete?: () => void;
}) {
  const projectScore = config.key === "projects" ? calculateDisplayedScore(row) : null;
  return (
    <article className="card flex min-w-0 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words font-bold leading-5">{rowLabel(config, row)}</h2>
          {typeof row.updated_at === "string" ? <p className="mt-1 text-xs text-slate-400">Mis à jour {formatDate(row.updated_at, true)}</p> : null}
        </div>
        {typeof row.status === "string" ? <StatusBadge value={row.status} /> : null}
      </div>

      <dl className="mt-4 grid gap-2 text-sm">
        {config.listFields.filter((key) => key !== config.primaryField && key !== "status" && row[key] !== null && row[key] !== undefined && row[key] !== "").map((key) => {
          const field = getField(config, key);
          if (!field) return null;
          return (
            <div key={key} className="grid grid-cols-[7.5rem_1fr] gap-2 border-t border-slate-100 pt-2">
              <dt className="text-xs font-semibold text-slate-500">{field.label}</dt>
              <dd className="min-w-0 break-words text-right text-slate-800">{formatValue(row[key], field, relations)}</dd>
            </div>
          );
        })}
        {projectScore !== null ? (
          <div className="grid grid-cols-[7.5rem_1fr] gap-2 border-t border-slate-100 pt-2"><dt className="text-xs font-semibold text-slate-500">Score indicatif</dt><dd className="text-right font-bold">{projectScore}</dd></div>
        ) : null}
      </dl>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {onComplete ? <button className="button-primary min-h-9 px-3 py-1.5" disabled={busy} onClick={onComplete}><Check size={16} />Terminer</button> : null}
        <button className="button-secondary min-h-9 px-3 py-1.5" disabled={busy} onClick={onEdit}><Edit3 size={15} />Modifier</button>
        {onArchive ? <button className="button-secondary min-h-9 px-3 py-1.5" disabled={busy} onClick={onArchive}><Archive size={15} />Archiver</button> : null}
        {!config.singleton ? <button className="button-danger min-h-9 px-3 py-1.5" disabled={busy} onClick={onDelete}>{busy ? <LoaderCircle className="animate-spin" size={15} /> : <Trash2 size={15} />}Supprimer</button> : null}
      </div>
    </article>
  );
}

function ResourceEditor({ config, mode, row, relations, onClose, onSaved }: {
  config: ResourceConfig; mode: "create" | "edit"; row?: Row; relations: Record<string, OptionRow[]>; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, unknown>>(() => buildForm(config, row));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const payload = payloadFromForm(config, form);
    const url = mode === "edit" && row?.id ? `/api/data/${config.key}/${row.id}` : `/api/data/${config.key}`;
    try {
      const response = await fetch(url, { method: mode === "edit" ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await parseEnvelope<Row>(response);
      if (!result.ok) {
        setFieldErrors(result.error.fieldErrors ?? {});
        throw new Error(result.error.message);
      }
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-slate-950/45 p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <section className="max-h-[96vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">{mode === "create" ? "Créer" : "Modifier"}</p><h2 id="editor-title" className="text-xl font-bold">{capitalize(config.singular)}</h2></div>
          <button className="button-secondary size-10 px-0" onClick={onClose} aria-label="Fermer"><X size={19} /></button>
        </header>
        <form onSubmit={submit} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          {config.fields.map((field) => (
            <DynamicField key={field.key} field={field} value={form[field.key]} relations={relations} error={fieldErrors[field.key]?.[0]} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} />
          ))}
          {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2" role="alert">{error}</div> : null}
          <footer className="sticky bottom-0 -mx-5 -mb-5 flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:col-span-2 sm:-mx-7 sm:-mb-7 sm:px-7">
            <button className="button-secondary" type="button" onClick={onClose} disabled={saving}>Annuler</button>
            <button className="button-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={17} /> : <Check size={17} />}{saving ? "Enregistrement…" : "Enregistrer"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function DynamicField({ field, value, relations, error, onChange }: { field: FieldConfig; value: unknown; relations: Record<string, OptionRow[]>; error?: string; onChange: (value: unknown) => void }) {
  const span = field.kind === "textarea" || field.kind === "multirelation" ? "sm:col-span-2" : "";
  const common = { name: field.key, required: field.required, disabled: false };
  const options = field.options ?? (field.relation ? relations[field.relation] ?? [] : []);

  return (
    <label className={`field ${span}`}>
      <span>{field.label}{field.required ? <span className="ml-1 text-red-600">*</span> : null}</span>
      {field.kind === "textarea" ? (
        <textarea {...common} className="input min-h-24 resize-y" rows={field.rows ?? 4} value={typeof value === "string" ? value : ""} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : field.kind === "select" || field.kind === "relation" ? (
        <select {...common} className="input" value={typeof value === "string" || typeof value === "number" ? String(value) : ""} onChange={(event) => onChange(event.target.value)}>
          {!field.required ? <option value="">— Aucun —</option> : <option value="" disabled>Choisir…</option>}
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.kind === "multirelation" ? (
        <select {...common} multiple className="input min-h-32 py-2" value={Array.isArray(value) ? value.map(String) : []} onChange={(event) => onChange(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.kind === "checkbox" ? (
        <span className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3"><input {...common} className="size-4 accent-emerald-800" type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />Oui</span>
      ) : (
        <input
          {...common}
          className="input"
          type={field.kind === "datetime" ? "datetime-local" : field.kind === "number" ? "number" : field.kind}
          value={typeof value === "string" || typeof value === "number" ? value : ""}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {field.help ? <span className="text-xs font-normal text-slate-500">{field.help}</span> : null}
      {error ? <span className="text-xs font-normal text-red-700">{error}</span> : null}
    </label>
  );
}

function buildForm(config: ResourceConfig, row?: Row): Record<string, unknown> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  return Object.fromEntries(config.fields.map((field) => {
    const raw = row?.[field.key];
    if (raw !== undefined && raw !== null) {
      if (field.kind === "datetime" && typeof raw === "string") return [field.key, toLocalDateTimeInput(raw)];
      if (field.kind === "tags" && Array.isArray(raw)) return [field.key, raw.join(", ")];
      return [field.key, raw];
    }
    if (field.defaultValue !== undefined) return [field.key, field.defaultValue];
    if (field.kind === "checkbox") return [field.key, false];
    if (field.kind === "multirelation") return [field.key, []];
    if (field.required && field.kind === "date") return [field.key, today];
    if (field.required && field.kind === "month") return [field.key, today.slice(0, 7)];
    if (field.required && field.kind === "datetime") return [field.key, toLocalDateTimeInput(now.toISOString())];
    return [field.key, ""];
  }));
}

function payloadFromForm(config: ResourceConfig, form: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(config.fields.map((field) => {
    const value = form[field.key];
    if (field.kind === "number") return [field.key, value === "" || value === null || value === undefined ? null : Number(value)];
    if (field.kind === "datetime") return [field.key, typeof value === "string" && value ? new Date(value).toISOString() : null];
    if (field.kind === "tags") return [field.key, typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : []];
    return [field.key, value === "" && !field.required ? null : value];
  }));
}

function payloadFromRow(config: ResourceConfig, row: Row): Record<string, unknown> {
  const form = Object.fromEntries(config.fields.map((field) => [field.key, row[field.key] ?? field.defaultValue ?? (field.kind === "checkbox" ? false : field.kind === "multirelation" ? [] : "")]));
  return payloadFromForm(config, form);
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  try {
    return await response.json() as ApiEnvelope<T>;
  } catch {
    return { ok: false, error: { code: "INVALID_RESPONSE", message: "Réponse serveur invalide." } };
  }
}

function rowLabel(config: ResourceConfig, row: Row): string {
  const primary = row[config.primaryField];
  if (typeof primary === "string" && primary.trim()) return primary;
  if (typeof primary === "number") return `${config.singular} ${primary}`;
  if (config.key === "quran_items" && typeof row.surah_number === "number") return `Sourate ${row.surah_number}`;
  return `${capitalize(config.singular)} sans titre`;
}

function formatValue(value: unknown, field: FieldConfig, relations: Record<string, OptionRow[]>): string {
  if (field.kind === "checkbox") return value ? "Oui" : "Non";
  if ((field.kind === "relation" || field.kind === "multirelation") && field.relation) {
    const values = Array.isArray(value) ? value.map(String) : [String(value)];
    return values.map((item) => relations[field.relation!]?.find((option) => option.value === item)?.label ?? "Élément lié").join(", ");
  }
  if (field.kind === "select") return field.options?.find((option) => option.value === String(value))?.label ?? String(value);
  if (field.kind === "date" || field.kind === "datetime" || field.kind === "month") return formatDate(String(value), field.kind === "datetime");
  if (field.kind === "tags" && Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "number") return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
  return String(value);
}

function formatDate(value: string, withTime = false): string {
  const date = new Date(value.length === 7 ? `${value}-01T12:00:00` : value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

function toLocalDateTimeInput(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function StatusBadge({ value }: { value: string }) {
  const danger = ["blocked", "at_risk", "critical", "cancelled"].includes(value);
  const success = ["done", "achieved", "completed", "active", "focus"].includes(value);
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${danger ? "bg-red-100 text-red-800" : success ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{value.replaceAll("_", " ")}</span>;
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 md:flex-row md:items-center md:justify-between" role="alert"><span className="flex items-start gap-2"><CircleAlert className="mt-0.5 shrink-0" size={17} />{message}</span><button className="button-secondary shrink-0" onClick={onRetry}>Réessayer</button></div>;
}

function calculateDisplayedScore(row: Row): string | null {
  const values = [row.impact, row.urgency, row.confidence, row.effort];
  if (!values.every((value) => typeof value === "number")) return null;
  const [impact, urgency, confidence, effort] = values as number[];
  if (!effort) return null;
  return ((impact! * urgency! * confidence!) / effort).toFixed(2);
}

function capitalize(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }
function article(value: string): string { return /^[aeiouyhàâéèêëîïôùûü]/i.test(value) ? `un·e ${value}` : `un ${value}`; }
