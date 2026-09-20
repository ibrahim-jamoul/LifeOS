import { z } from "zod";

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "month"
  | "datetime"
  | "time"
  | "select"
  | "checkbox"
  | "tags"
  | "relation"
  | "multirelation";

export type FieldConfig = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: readonly { value: string; label: string }[];
  relation?: string;
  defaultValue?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
};

export type RelationCheck = {
  field: string;
  parentResource: string;
  multiple?: boolean;
};

export type ResourceConfig = {
  key: string;
  table: string;
  title: string;
  singular: string;
  description: string;
  primaryField: string;
  fields: readonly FieldConfig[];
  listFields: readonly string[];
  searchFields?: readonly string[];
  filterFields?: readonly string[];
  orderBy: string;
  ascending?: boolean;
  archive?: { field: string; value: string };
  singleton?: boolean;
  upsertConflict?: string;
  readOnly?: boolean;
  fixedValues?: Readonly<Record<string, string | number | boolean>>;
  relations?: readonly RelationCheck[];
  schema: z.ZodType;
};

const optionalText = (max = 5_000) =>
  z.preprocess((value) => (value === "" || value === undefined ? null : value), z.string().trim().max(max).nullable());
const requiredText = (label: string, max = 240) => z.string().trim().min(1, `${label} est requis.`).max(max);
const optionalUuid = z.preprocess((value) => (value === "" || value === undefined ? null : value), z.uuid().nullable());
const optionalDate = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
);
const optionalDateTime = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.iso.datetime({ offset: true }).nullable(),
);
const requiredDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const requiredDateTime = z.iso.datetime({ offset: true });
const optionalNumber = (min?: number, max?: number) =>
  z.preprocess((value) => (value === "" || value === undefined || value === null ? null : Number(value)),
    z.number().min(min ?? Number.NEGATIVE_INFINITY).max(max ?? Number.POSITIVE_INFINITY).nullable());
const requiredNumber = (min?: number, max?: number) =>
  z.coerce.number().min(min ?? Number.NEGATIVE_INFINITY).max(max ?? Number.POSITIVE_INFINITY);
const optionalInteger = (min = 0, max = Number.MAX_SAFE_INTEGER) => optionalNumber(min, max).refine((value) => value === null || Number.isInteger(value), "Nombre entier attendu.");
const booleanValue = z.preprocess((value) => value === true || value === "true", z.boolean());
const priorities = [
  { value: "low", label: "Basse" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Haute" },
  { value: "critical", label: "Critique" },
] as const;

const goalStatuses = [
  { value: "draft", label: "Brouillon" },
  { value: "active", label: "Actif" },
  { value: "at_risk", label: "À risque" },
  { value: "achieved", label: "Atteint" },
  { value: "paused", label: "En pause" },
  { value: "cancelled", label: "Annulé" },
  { value: "archived", label: "Archivé" },
] as const;

const projectStatuses = [
  { value: "backlog", label: "Backlog" },
  { value: "focus", label: "Focus" },
  { value: "active", label: "Actif" },
  { value: "blocked", label: "Bloqué" },
  { value: "paused", label: "En pause" },
  { value: "done", label: "Terminé" },
  { value: "cancelled", label: "Annulé" },
  { value: "archived", label: "Archivé" },
] as const;

const taskStatuses = [
  { value: "todo", label: "À faire" },
  { value: "doing", label: "En cours" },
  { value: "blocked", label: "Bloquée" },
  { value: "done", label: "Terminée" },
  { value: "cancelled", label: "Annulée" },
] as const;

const resources: ResourceConfig[] = [
  {
    key: "vision",
    table: "life_vision",
    title: "Vision",
    singular: "vision",
    description: "Votre direction à un, trois et cinq ans, avec le cap du trimestre.",
    primaryField: "quarter_focus",
    singleton: true,
    upsertConflict: "user_id",
    fields: [
      { key: "one_year", label: "Direction à 1 an", kind: "textarea", rows: 4 },
      { key: "three_year", label: "Direction à 3 ans", kind: "textarea", rows: 4 },
      { key: "five_year", label: "Direction à 5 ans", kind: "textarea", rows: 4 },
      { key: "quarter_focus", label: "Focus du trimestre", kind: "textarea", rows: 3 },
      { key: "last_reviewed_at", label: "Dernière revue", kind: "datetime" },
    ],
    listFields: ["quarter_focus", "one_year", "last_reviewed_at"],
    orderBy: "updated_at",
    schema: z.object({ one_year: optionalText(), three_year: optionalText(), five_year: optionalText(), quarter_focus: optionalText(), last_reviewed_at: optionalDateTime }),
  },
  {
    key: "goals",
    table: "goals",
    title: "Objectifs",
    singular: "objectif",
    description: "Résultats recherchés, définition de DONE, échéance et avancement explicite.",
    primaryField: "title",
    fields: [
      { key: "title", label: "Titre", kind: "text", required: true },
      { key: "desired_outcome", label: "Résultat recherché", kind: "textarea", rows: 3 },
      { key: "definition_of_done", label: "Définition de DONE", kind: "textarea", required: true, rows: 3 },
      { key: "status", label: "Statut", kind: "select", required: true, options: goalStatuses, defaultValue: "draft" },
      { key: "priority", label: "Priorité", kind: "select", required: true, options: priorities, defaultValue: "medium" },
      { key: "horizon", label: "Horizon", kind: "text", placeholder: "2026, T4, 3 ans…" },
      { key: "start_date", label: "Début", kind: "date" },
      { key: "target_date", label: "Échéance", kind: "date" },
      { key: "progress_percent", label: "Avancement (%)", kind: "number", required: true, min: 0, max: 100, step: 1, defaultValue: 0 },
      { key: "reason", label: "Pourquoi", kind: "textarea" },
      { key: "risk_notes", label: "Risques", kind: "textarea" },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
    listFields: ["status", "priority", "target_date", "progress_percent", "desired_outcome"],
    searchFields: ["title", "desired_outcome", "definition_of_done"],
    filterFields: ["status", "priority"],
    orderBy: "updated_at",
    archive: { field: "status", value: "archived" },
    schema: z.object({
      title: requiredText("Le titre"), desired_outcome: optionalText(), definition_of_done: requiredText("La définition de DONE", 5_000),
      status: z.enum(["draft", "active", "at_risk", "achieved", "paused", "cancelled", "archived"]), priority: z.enum(["low", "medium", "high", "critical"]),
      horizon: optionalText(120), start_date: optionalDate, target_date: optionalDate, progress_percent: requiredNumber(0, 100), reason: optionalText(), risk_notes: optionalText(), notes: optionalText(),
    }).refine((data) => !data.start_date || !data.target_date || data.start_date <= data.target_date, { path: ["target_date"], message: "L’échéance doit suivre le début." }),
  },
  {
    key: "projects",
    table: "projects",
    title: "Projets",
    singular: "projet",
    description: "Portefeuille de travail relié aux objectifs. Le score reste indicatif.",
    primaryField: "title",
    fields: [
      { key: "title", label: "Titre", kind: "text", required: true },
      { key: "summary", label: "Résumé", kind: "textarea" },
      { key: "goal_ids", label: "Objectifs liés", kind: "multirelation", relation: "goals", help: "Un projet peut soutenir plusieurs objectifs." },
      { key: "status", label: "Statut", kind: "select", required: true, options: projectStatuses, defaultValue: "backlog" },
      { key: "priority", label: "Priorité manuelle", kind: "select", required: true, options: priorities, defaultValue: "medium" },
      { key: "target_date", label: "Échéance", kind: "date" },
      { key: "next_milestone", label: "Prochain jalon", kind: "text" },
      { key: "next_action", label: "Prochaine action", kind: "text" },
      { key: "progress_percent", label: "Avancement (%)", kind: "number", required: true, min: 0, max: 100, defaultValue: 0 },
      { key: "impact", label: "Impact (1–5)", kind: "number", min: 1, max: 5 },
      { key: "urgency", label: "Urgence (1–5)", kind: "number", min: 1, max: 5 },
      { key: "confidence", label: "Confiance (1–5)", kind: "number", min: 1, max: 5 },
      { key: "effort", label: "Effort (1–5)", kind: "number", min: 1, max: 5 },
      { key: "budget_planned", label: "Budget prévu", kind: "number", min: 0, step: 0.01 },
      { key: "budget_actual", label: "Budget réel", kind: "number", min: 0, step: 0.01 },
      { key: "blocker_note", label: "Blocage", kind: "textarea" },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
    listFields: ["status", "priority", "target_date", "next_action", "progress_percent", "impact", "urgency", "confidence", "effort"],
    searchFields: ["title", "summary", "next_action"],
    filterFields: ["status", "priority"],
    orderBy: "updated_at",
    archive: { field: "status", value: "archived" },
    relations: [{ field: "goal_ids", parentResource: "goals", multiple: true }],
    schema: z.object({
      title: requiredText("Le titre"), summary: optionalText(), goal_ids: z.array(z.uuid()).max(20).default([]),
      status: z.enum(["backlog", "focus", "active", "blocked", "paused", "done", "cancelled", "archived"]), priority: z.enum(["low", "medium", "high", "critical"]),
      target_date: optionalDate, next_milestone: optionalText(500), next_action: optionalText(500), progress_percent: requiredNumber(0, 100),
      impact: optionalInteger(1, 5), urgency: optionalInteger(1, 5), confidence: optionalInteger(1, 5), effort: optionalInteger(1, 5),
      budget_planned: optionalNumber(0), budget_actual: optionalNumber(0), blocker_note: optionalText(), notes: optionalText(),
    }),
  },
  {
    key: "tasks",
    table: "tasks",
    title: "Tâches",
    singular: "tâche",
    description: "Actions concrètes pour aujourd’hui, la semaine et les échéances à rattraper.",
    primaryField: "title",
    fields: [
      { key: "title", label: "Titre", kind: "text", required: true },
      { key: "project_id", label: "Projet", kind: "relation", relation: "projects" },
      { key: "status", label: "Statut", kind: "select", required: true, options: taskStatuses, defaultValue: "todo" },
      { key: "priority", label: "Priorité", kind: "select", required: true, options: priorities, defaultValue: "medium" },
      { key: "due_at", label: "Échéance", kind: "datetime" },
      { key: "estimate_minutes", label: "Estimation (minutes)", kind: "number", min: 0 },
      { key: "actual_minutes", label: "Réel (minutes)", kind: "number", min: 0 },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
    listFields: ["status", "priority", "due_at", "estimate_minutes", "project_id"],
    searchFields: ["title", "notes"], filterFields: ["status", "priority", "project_id"], orderBy: "due_at", ascending: true,
    relations: [{ field: "project_id", parentResource: "projects" }],
    schema: z.object({ title: requiredText("Le titre"), project_id: optionalUuid, status: z.enum(["todo", "doing", "blocked", "done", "cancelled"]), priority: z.enum(["low", "medium", "high", "critical"]), due_at: optionalDateTime, estimate_minutes: optionalInteger(), actual_minutes: optionalInteger(), notes: optionalText() }),
  },
  {
    key: "kpis",
    table: "kpis",
    title: "KPI",
    singular: "KPI",
    description: "Définitions de mesure et cibles; aucune valeur manquante n’est remplacée par zéro.",
    primaryField: "name",
    fields: [
      { key: "name", label: "Nom", kind: "text", required: true },
      { key: "goal_id", label: "Objectif lié", kind: "relation", relation: "goals" },
      { key: "unit", label: "Unité", kind: "text", required: true },
      { key: "target_type", label: "Type de cible", kind: "select", required: true, defaultValue: "none", options: [
        { value: "min", label: "Minimum" }, { value: "max", label: "Maximum" }, { value: "exact", label: "Valeur exacte" }, { value: "range", label: "Intervalle" }, { value: "none", label: "Sans cible" },
      ] },
      { key: "target_value", label: "Cible", kind: "number", step: 0.01 },
      { key: "target_min", label: "Borne basse", kind: "number", step: 0.01 },
      { key: "target_max", label: "Borne haute", kind: "number", step: 0.01 },
      { key: "cadence", label: "Cadence", kind: "select", required: true, defaultValue: "weekly", options: [
        { value: "daily", label: "Quotidienne" }, { value: "weekly", label: "Hebdomadaire" }, { value: "monthly", label: "Mensuelle" }, { value: "quarterly", label: "Trimestrielle" }, { value: "adhoc", label: "À la demande" },
      ] },
      { key: "direction", label: "Direction", kind: "select", required: true, defaultValue: "increase", options: [
        { value: "increase", label: "Augmenter" }, { value: "decrease", label: "Diminuer" }, { value: "maintain", label: "Maintenir" },
      ] },
      { key: "active", label: "Actif", kind: "checkbox", defaultValue: true },
    ],
    listFields: ["unit", "target_type", "target_value", "target_min", "target_max", "cadence", "goal_id", "active"],
    searchFields: ["name", "unit"], filterFields: ["cadence", "active"], orderBy: "updated_at",
    relations: [{ field: "goal_id", parentResource: "goals" }],
    schema: z.object({ name: requiredText("Le nom"), goal_id: optionalUuid, unit: z.string().trim().max(60), target_type: z.enum(["min", "max", "exact", "range", "none"]), target_value: optionalNumber(), target_min: optionalNumber(), target_max: optionalNumber(), cadence: z.enum(["daily", "weekly", "monthly", "quarterly", "adhoc"]), direction: z.enum(["increase", "decrease", "maintain"]), active: booleanValue }).superRefine((data, context) => {
      if (["min", "max", "exact"].includes(data.target_type) && data.target_value === null) context.addIssue({ code: "custom", path: ["target_value"], message: "Une cible est requise." });
      if (data.target_type === "range" && (data.target_min === null || data.target_max === null || data.target_min > data.target_max)) context.addIssue({ code: "custom", path: ["target_min"], message: "Indiquez un intervalle valide." });
    }),
  },
  {
    key: "kpi_entries",
    table: "kpi_entries",
    title: "Mesures KPI",
    singular: "mesure",
    description: "Historique horodaté de valeurs réellement observées.",
    primaryField: "value",
    fields: [
      { key: "kpi_id", label: "KPI", kind: "relation", relation: "kpis", required: true },
      { key: "measured_at", label: "Mesuré le", kind: "datetime", required: true },
      { key: "value", label: "Valeur", kind: "number", required: true, step: 0.01 },
      { key: "note", label: "Note", kind: "textarea" },
    ],
    listFields: ["kpi_id", "value", "measured_at", "note"], orderBy: "measured_at",
    relations: [{ field: "kpi_id", parentResource: "kpis" }],
    schema: z.object({ kpi_id: z.uuid(), measured_at: requiredDateTime, value: requiredNumber(), note: optionalText() }),
  },
  {
    key: "decisions",
    table: "decisions",
    title: "Journal de décisions",
    singular: "décision",
    description: "Contexte, alternatives, hypothèses et apprentissage réévalués dans le temps.",
    primaryField: "title",
    fields: [
      { key: "title", label: "Titre", kind: "text", required: true },
      { key: "decision_date", label: "Date de décision", kind: "date", required: true },
      { key: "goal_id", label: "Objectif", kind: "relation", relation: "goals" },
      { key: "project_id", label: "Projet", kind: "relation", relation: "projects" },
      { key: "context", label: "Contexte", kind: "textarea" },
      { key: "options_considered", label: "Options considérées", kind: "textarea" },
      { key: "selected_option", label: "Choix", kind: "textarea" },
      { key: "assumptions", label: "Hypothèses", kind: "textarea" },
      { key: "expected_outcome", label: "Résultat attendu", kind: "textarea" },
      { key: "review_date", label: "Date de réévaluation", kind: "date" },
      { key: "actual_outcome", label: "Résultat réel", kind: "textarea" },
      { key: "lesson", label: "Enseignement", kind: "textarea" },
    ],
    listFields: ["decision_date", "review_date", "selected_option", "actual_outcome", "project_id"], searchFields: ["title", "context", "selected_option"], orderBy: "decision_date",
    relations: [{ field: "goal_id", parentResource: "goals" }, { field: "project_id", parentResource: "projects" }],
    schema: z.object({ title: requiredText("Le titre"), decision_date: requiredDate, goal_id: optionalUuid, project_id: optionalUuid, context: optionalText(), options_considered: optionalText(), selected_option: optionalText(), assumptions: optionalText(), expected_outcome: optionalText(), review_date: optionalDate, actual_outcome: optionalText(), lesson: optionalText() }),
  },
  {
    key: "weekly_reviews",
    table: "weekly_reviews",
    title: "Weekly reviews",
    singular: "weekly review",
    description: "Une revue par semaine ISO pour transformer les constats en priorités.",
    primaryField: "week_start",
    upsertConflict: "user_id,week_start",
    fields: [
      { key: "week_start", label: "Semaine du", kind: "date", required: true, help: "Choisissez le lundi de la semaine." },
      { key: "wins", label: "Qu’est-ce qui a avancé ?", kind: "textarea", rows: 3 },
      { key: "misses", label: "Qu’est-ce qui n’a pas avancé ?", kind: "textarea", rows: 3 },
      { key: "causes", label: "Pourquoi ?", kind: "textarea", rows: 3 },
      { key: "risks", label: "Quels sont les risques ?", kind: "textarea", rows: 3 },
      { key: "pause_or_stop", label: "Que faut-il arrêter ou mettre en pause ?", kind: "textarea", rows: 3 },
      { key: "next_week_top3", label: "Top 3 de la semaine suivante", kind: "textarea", required: true, rows: 4 },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
    listFields: ["week_start", "wins", "risks", "next_week_top3", "completed_at"], orderBy: "week_start",
    schema: z.object({ week_start: requiredDate, wins: optionalText(), misses: optionalText(), causes: optionalText(), risks: optionalText(), pause_or_stop: optionalText(), next_week_top3: requiredText("Le top 3", 5_000), notes: optionalText() }),
  },
  {
    key: "religion_topics",
    table: "study_topics",
    title: "Sujets d’étude",
    singular: "sujet",
    description: "Apprentissages religieux définis par l’utilisateur, sans notation théologique.",
    primaryField: "title",
    fixedValues: { domain_slug: "religion" },
    fields: [
      { key: "title", label: "Sujet", kind: "text", required: true },
      { key: "category", label: "Catégorie", kind: "select", options: [
        { value: "islamic_history", label: "Histoire islamique" }, { value: "aqeedah", label: "Aqeedah" }, { value: "fiqh", label: "Fiqh" }, { value: "seerah", label: "Sîra" }, { value: "hadith_sciences", label: "Sciences du hadith" }, { value: "other", label: "Autre" },
      ] },
      { key: "resource", label: "Ressource", kind: "text" },
      { key: "status", label: "Statut", kind: "select", required: true, defaultValue: "active", options: [
        { value: "planned", label: "Planifié" }, { value: "active", label: "Actif" }, { value: "completed", label: "Terminé" }, { value: "paused", label: "En pause" }, { value: "archived", label: "Archivé" },
      ] },
      { key: "target_date", label: "Date cible", kind: "date" },
      { key: "progress_percent", label: "Avancement explicite (%)", kind: "number", min: 0, max: 100, defaultValue: 0, required: true },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
    listFields: ["category", "status", "target_date", "progress_percent", "resource"], searchFields: ["title", "notes", "resource"], filterFields: ["status", "category"], orderBy: "updated_at",
    archive: { field: "status", value: "archived" },
    schema: z.object({ title: requiredText("Le sujet"), category: optionalText(80), resource: optionalText(500), status: z.enum(["planned", "active", "completed", "paused", "archived"]), target_date: optionalDate, progress_percent: requiredNumber(0, 100), notes: optionalText() }),
  },
  {
    key: "religion_sessions",
    table: "study_sessions",
    title: "Sessions d’étude",
    singular: "session",
    description: "Temps réellement étudié, contenu couvert et enseignement retenu.",
    primaryField: "summary",
    fixedValues: { domain_slug: "religion" },
    fields: [
      { key: "topic_id", label: "Sujet", kind: "relation", relation: "religion_topics" },
      { key: "occurred_at", label: "Date et heure", kind: "datetime", required: true },
      { key: "duration_minutes", label: "Durée (minutes)", kind: "number", required: true, min: 0 },
      { key: "activity_type", label: "Type d’activité", kind: "text" },
      { key: "resource", label: "Ressource", kind: "text" },
      { key: "summary", label: "Contenu couvert", kind: "textarea", required: true },
      { key: "takeaway", label: "Point retenu", kind: "textarea" },
    ],
    listFields: ["occurred_at", "duration_minutes", "topic_id", "activity_type", "takeaway"], orderBy: "occurred_at",
    relations: [{ field: "topic_id", parentResource: "religion_topics" }],
    schema: z.object({ topic_id: optionalUuid, occurred_at: requiredDateTime, duration_minutes: requiredNumber(0, 1_440), activity_type: optionalText(120), resource: optionalText(500), summary: requiredText("Le contenu couvert", 5_000), takeaway: optionalText() }),
  },
  {
    key: "religion_routines",
    table: "religion_routines",
    title: "Routines personnelles",
    singular: "routine",
    description: "Routines facultatives créées par vous; aucune pratique n’est imposée.",
    primaryField: "name",
    fields: [
      { key: "name", label: "Nom", kind: "text", required: true },
      { key: "target_frequency", label: "Fréquence", kind: "select", required: true, defaultValue: "weekly", options: [
        { value: "daily", label: "Quotidienne" }, { value: "weekly", label: "Hebdomadaire" }, { value: "monthly", label: "Mensuelle" },
      ] },
      { key: "target_count", label: "Nombre cible", kind: "number", required: true, min: 1, defaultValue: 1 },
      { key: "active", label: "Active", kind: "checkbox", defaultValue: true },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
    listFields: ["target_frequency", "target_count", "active", "notes"], orderBy: "created_at",
    schema: z.object({ name: requiredText("Le nom"), target_frequency: z.enum(["daily", "weekly", "monthly"]), target_count: requiredNumber(1, 1_000), active: booleanValue, notes: optionalText() }),
  },
  {
    key: "religion_logs",
    table: "religion_logs",
    title: "Suivi des routines",
    singular: "accomplissement",
    description: "Historique factuel des routines choisies.",
    primaryField: "note",
    fields: [
      { key: "routine_id", label: "Routine", kind: "relation", relation: "religion_routines", required: true },
      { key: "occurred_at", label: "Réalisée le", kind: "datetime", required: true },
      { key: "note", label: "Note", kind: "textarea" },
    ],
    listFields: ["routine_id", "occurred_at", "note"], orderBy: "occurred_at",
    relations: [{ field: "routine_id", parentResource: "religion_routines" }],
    schema: z.object({ routine_id: z.uuid(), occurred_at: requiredDateTime, note: optionalText() }),
  },
  {
    key: "arabic_profile",
    table: "arabic_profiles",
    title: "Profil d’arabe",
    singular: "profil",
    description: "Cible hebdomadaire, niveau auto-évalué et prochain axe de travail.",
    primaryField: "current_focus",
    singleton: true,
    upsertConflict: "user_id",
    fields: [
      { key: "self_assessed_level", label: "Niveau auto-évalué", kind: "text", placeholder: "Débutant, A2, personnalisé…" },
      { key: "weekly_target_minutes", label: "Cible hebdomadaire (minutes)", kind: "number", required: true, min: 0, defaultValue: 0 },
      { key: "current_focus", label: "Focus actuel", kind: "textarea" },
      { key: "vocabulary_estimate", label: "Vocabulaire estimé", kind: "number", min: 0, help: "Optionnel, ne vaut pas certification de niveau." },
    ],
    listFields: ["self_assessed_level", "weekly_target_minutes", "current_focus", "vocabulary_estimate"], orderBy: "updated_at",
    schema: z.object({ self_assessed_level: optionalText(120), weekly_target_minutes: requiredNumber(0, 100_000), current_focus: optionalText(), vocabulary_estimate: optionalInteger() }),
  },
  {
    key: "arabic_sessions",
    table: "arabic_sessions",
    title: "Sessions d’arabe",
    singular: "session",
    description: "Durée, compétence travaillée, ressource et vocabulaire observé.",
    primaryField: "skill",
    fields: [
      { key: "occurred_at", label: "Date et heure", kind: "datetime", required: true },
      { key: "duration_minutes", label: "Durée (minutes)", kind: "number", required: true, min: 0 },
      { key: "skill", label: "Compétence", kind: "select", required: true, options: [
        { value: "vocabulary", label: "Vocabulaire" }, { value: "grammar", label: "Grammaire" }, { value: "reading", label: "Lecture" }, { value: "listening", label: "Écoute" }, { value: "speaking", label: "Expression orale" }, { value: "writing", label: "Écriture" }, { value: "mixed", label: "Mixte" },
      ] },
      { key: "resource", label: "Ressource", kind: "text" },
      { key: "new_words", label: "Mots nouveaux", kind: "number", min: 0 },
      { key: "reviewed_words", label: "Mots révisés", kind: "number", min: 0 },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
    listFields: ["occurred_at", "duration_minutes", "skill", "new_words", "reviewed_words", "resource"], orderBy: "occurred_at", filterFields: ["skill"],
    schema: z.object({ occurred_at: requiredDateTime, duration_minutes: requiredNumber(0, 1_440), skill: z.enum(["vocabulary", "grammar", "reading", "listening", "speaking", "writing", "mixed"]), resource: optionalText(500), new_words: optionalInteger(), reviewed_words: optionalInteger(), notes: optionalText() }),
  },
  {
    key: "quran_items",
    table: "quran_items",
    title: "Parcours Coran",
    singular: "élément",
    description: "Lecture, mémorisation et révision restent trois activités distinctes.",
    primaryField: "surah_name",
    fields: [
      { key: "surah_number", label: "Numéro de sourate", kind: "number", required: true, min: 1, max: 114 },
      { key: "surah_name", label: "Nom de sourate", kind: "text" },
      { key: "start_ayah", label: "Premier verset", kind: "number", min: 1 },
      { key: "end_ayah", label: "Dernier verset", kind: "number", min: 1 },
      { key: "activity", label: "Activité", kind: "select", required: true, options: [
        { value: "recitation", label: "Lecture" }, { value: "memorization", label: "Mémorisation" }, { value: "revision", label: "Révision" },
      ] },
      { key: "status", label: "Statut", kind: "select", required: true, defaultValue: "active", options: [
        { value: "planned", label: "Planifié" }, { value: "active", label: "Actif" }, { value: "completed", label: "Terminé" }, { value: "paused", label: "En pause" },
      ] },
      { key: "confidence", label: "Confiance (1–5)", kind: "number", min: 1, max: 5 },
      { key: "next_revision_at", label: "Prochaine révision", kind: "datetime" },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
    listFields: ["surah_number", "start_ayah", "end_ayah", "activity", "status", "confidence", "next_revision_at"], searchFields: ["surah_name", "notes"], filterFields: ["activity", "status"], orderBy: "next_revision_at", ascending: true,
    schema: z.object({ surah_number: requiredNumber(1, 114), surah_name: optionalText(120), start_ayah: optionalInteger(1, 500), end_ayah: optionalInteger(1, 500), activity: z.enum(["recitation", "memorization", "revision"]), status: z.enum(["planned", "active", "completed", "paused"]), confidence: optionalInteger(1, 5), next_revision_at: optionalDateTime, notes: optionalText() }).refine((data) => !data.start_ayah || !data.end_ayah || data.start_ayah <= data.end_ayah, { path: ["end_ayah"], message: "Le dernier verset doit suivre le premier." }),
  },
  {
    key: "quran_sessions",
    table: "quran_sessions",
    title: "Sessions Coran",
    singular: "session",
    description: "Journal de lecture, mémorisation ou révision avec prochaine échéance.",
    primaryField: "outcome",
    fields: [
      { key: "quran_item_id", label: "Élément", kind: "relation", relation: "quran_items" },
      { key: "occurred_at", label: "Date et heure", kind: "datetime", required: true },
      { key: "duration_minutes", label: "Durée (minutes)", kind: "number", min: 0 },
      { key: "activity", label: "Activité", kind: "select", required: true, options: [
        { value: "recitation", label: "Lecture" }, { value: "memorization", label: "Mémorisation" }, { value: "revision", label: "Révision" },
      ] },
      { key: "confidence", label: "Confiance (1–5)", kind: "number", min: 1, max: 5 },
      { key: "outcome", label: "Résultat", kind: "textarea" },
      { key: "next_revision_at", label: "Prochaine révision", kind: "datetime" },
    ],
    listFields: ["quran_item_id", "occurred_at", "activity", "duration_minutes", "confidence", "next_revision_at"], filterFields: ["activity"], orderBy: "occurred_at",
    relations: [{ field: "quran_item_id", parentResource: "quran_items" }],
    schema: z.object({ quran_item_id: optionalUuid, occurred_at: requiredDateTime, duration_minutes: optionalInteger(), activity: z.enum(["recitation", "memorization", "revision"]), confidence: optionalInteger(1, 5), outcome: optionalText(), next_revision_at: optionalDateTime }),
  },
  {
    key: "financial_accounts",
    table: "financial_accounts",
    title: "Comptes",
    singular: "compte",
    description: "Comptes d’actif ou de passif avec solde saisi explicitement.",
    primaryField: "name",
    fields: [
      { key: "name", label: "Nom", kind: "text", required: true },
      { key: "account_type", label: "Type", kind: "select", required: true, defaultValue: "cash", options: [
        { value: "current", label: "Compte courant" }, { value: "savings", label: "Épargne" }, { value: "brokerage", label: "Investissement" }, { value: "cash", label: "Espèces" }, { value: "liability", label: "Dette" }, { value: "other", label: "Autre" },
      ] },
      { key: "institution", label: "Établissement", kind: "text" },
      { key: "currency", label: "Devise", kind: "text", required: true, defaultValue: "EUR" },
      { key: "current_balance", label: "Solde actuel", kind: "number", required: true, step: 0.01, defaultValue: 0 },
      { key: "include_in_net_worth", label: "Inclure dans le patrimoine", kind: "checkbox", defaultValue: true },
      { key: "is_liability", label: "Passif / dette", kind: "checkbox" },
      { key: "active", label: "Actif", kind: "checkbox", defaultValue: true },
    ],
    listFields: ["account_type", "institution", "currency", "current_balance", "is_liability", "active"], searchFields: ["name", "institution"], filterFields: ["account_type", "active"], orderBy: "name", ascending: true,
    schema: z.object({ name: requiredText("Le nom"), account_type: z.enum(["current", "savings", "brokerage", "cash", "liability", "other"]), institution: optionalText(160), currency: z.string().trim().length(3).transform((value) => value.toUpperCase()), current_balance: requiredNumber(), include_in_net_worth: booleanValue, is_liability: booleanValue, active: booleanValue }),
  },
  {
    key: "financial_transactions",
    table: "financial_transactions",
    title: "Transactions",
    singular: "transaction",
    description: "Revenus, dépenses et transferts internes non comptés dans les totaux.",
    primaryField: "description",
    fields: [
      { key: "account_id", label: "Compte", kind: "relation", relation: "financial_accounts", required: true },
      { key: "destination_account_id", label: "Compte destinataire", kind: "relation", relation: "financial_accounts", help: "Requis uniquement pour un transfert." },
      { key: "occurred_on", label: "Date", kind: "date", required: true },
      { key: "amount", label: "Montant positif", kind: "number", required: true, min: 0.01, step: 0.01 },
      { key: "tx_type", label: "Type", kind: "select", required: true, options: [
        { value: "income", label: "Revenu" }, { value: "expense", label: "Dépense" }, { value: "transfer", label: "Transfert" },
      ] },
      { key: "category", label: "Catégorie", kind: "text" },
      { key: "description", label: "Description", kind: "text", required: true },
      { key: "currency", label: "Devise", kind: "text", required: true, defaultValue: "EUR" },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
    listFields: ["occurred_on", "account_id", "tx_type", "amount", "currency", "category"], searchFields: ["description", "category"], filterFields: ["tx_type", "account_id", "category"], orderBy: "occurred_on",
    relations: [{ field: "account_id", parentResource: "financial_accounts" }, { field: "destination_account_id", parentResource: "financial_accounts" }],
    schema: z.object({ account_id: z.uuid(), destination_account_id: optionalUuid, occurred_on: requiredDate, amount: requiredNumber(0.01), tx_type: z.enum(["income", "expense", "transfer"]), category: optionalText(120), description: requiredText("La description", 500), currency: z.string().trim().length(3).transform((value) => value.toUpperCase()), notes: optionalText() }).superRefine((data, context) => {
      if (data.tx_type === "transfer" && (!data.destination_account_id || data.destination_account_id === data.account_id)) context.addIssue({ code: "custom", path: ["destination_account_id"], message: "Choisissez un autre compte destinataire." });
      if (data.tx_type !== "transfer" && data.destination_account_id) context.addIssue({ code: "custom", path: ["destination_account_id"], message: "Le destinataire est réservé aux transferts." });
    }),
  },
  {
    key: "budget_items",
    table: "budget_items",
    title: "Budgets",
    singular: "budget",
    description: "Plafond mensuel par catégorie, comparé aux dépenses réelles.",
    primaryField: "category",
    upsertConflict: "user_id,month,category,currency",
    fields: [
      { key: "month", label: "Mois", kind: "month", required: true },
      { key: "category", label: "Catégorie", kind: "text", required: true },
      { key: "target_amount", label: "Budget cible", kind: "number", required: true, min: 0, step: 0.01 },
      { key: "currency", label: "Devise", kind: "text", required: true, defaultValue: "EUR" },
    ],
    listFields: ["month", "category", "target_amount", "currency"], searchFields: ["category"], filterFields: ["month", "currency"], orderBy: "month",
    schema: z.object({ month: z.string().regex(/^\d{4}-\d{2}(?:-01)?$/).transform((value) => `${value.slice(0, 7)}-01`), category: requiredText("La catégorie", 120), target_amount: requiredNumber(0), currency: z.string().trim().length(3).transform((value) => value.toUpperCase()) }),
  },
  {
    key: "financial_goals",
    table: "financial_goals",
    title: "Objectifs financiers",
    singular: "objectif financier",
    description: "Montant cible, montant réellement constitué et échéance.",
    primaryField: "name",
    fields: [
      { key: "name", label: "Nom", kind: "text", required: true },
      { key: "target_amount", label: "Montant cible", kind: "number", required: true, min: 0, step: 0.01 },
      { key: "current_amount", label: "Montant actuel", kind: "number", required: true, min: 0, step: 0.01, defaultValue: 0 },
      { key: "currency", label: "Devise", kind: "text", required: true, defaultValue: "EUR" },
      { key: "target_date", label: "Échéance", kind: "date" },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
    listFields: ["target_amount", "current_amount", "currency", "target_date"], searchFields: ["name", "notes"], orderBy: "target_date", ascending: true,
    schema: z.object({ name: requiredText("Le nom"), target_amount: requiredNumber(0), current_amount: requiredNumber(0), currency: z.string().trim().length(3).transform((value) => value.toUpperCase()), target_date: optionalDate, notes: optionalText() }),
  },
  {
    key: "net_worth_snapshots",
    table: "net_worth_snapshots",
    title: "Patrimoine",
    singular: "snapshot",
    description: "Photographie datée des actifs et passifs, sans conversion FX automatique.",
    primaryField: "snapshot_date",
    upsertConflict: "user_id,snapshot_date,currency",
    fields: [
      { key: "snapshot_date", label: "Date", kind: "date", required: true },
      { key: "assets", label: "Actifs", kind: "number", required: true, min: 0, step: 0.01 },
      { key: "liabilities", label: "Passifs", kind: "number", required: true, min: 0, step: 0.01, defaultValue: 0 },
      { key: "currency", label: "Devise", kind: "text", required: true, defaultValue: "EUR" },
      { key: "note", label: "Note", kind: "textarea" },
    ],
    listFields: ["snapshot_date", "assets", "liabilities", "currency", "note"], orderBy: "snapshot_date",
    schema: z.object({ snapshot_date: requiredDate, assets: requiredNumber(0), liabilities: requiredNumber(0), currency: z.string().trim().length(3).transform((value) => value.toUpperCase()), note: optionalText() }),
  },
  {
    key: "habits",
    table: "habits",
    title: "Habitudes",
    singular: "habitude",
    description: "Habitudes personnalisées, fréquence et cible sans interprétation médicale.",
    primaryField: "name",
    fields: [
      { key: "name", label: "Nom", kind: "text", required: true },
      { key: "frequency", label: "Fréquence", kind: "select", required: true, defaultValue: "daily", options: [
        { value: "daily", label: "Quotidienne" }, { value: "weekly", label: "Hebdomadaire" }, { value: "monthly", label: "Mensuelle" },
      ] },
      { key: "target_count", label: "Nombre cible", kind: "number", required: true, min: 1, defaultValue: 1 },
      { key: "reminder_time", label: "Heure de rappel", kind: "time" },
      { key: "active", label: "Active", kind: "checkbox", defaultValue: true },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
    listFields: ["frequency", "target_count", "reminder_time", "active"], searchFields: ["name", "notes"], filterFields: ["frequency", "active"], orderBy: "name", ascending: true,
    schema: z.object({ name: requiredText("Le nom"), frequency: z.enum(["daily", "weekly", "monthly"]), target_count: requiredNumber(1, 10_000), reminder_time: z.preprocess((value) => value === "" || value === undefined ? null : value, z.string().regex(/^\d{2}:\d{2}$/).nullable()), active: booleanValue, notes: optionalText() }),
  },
  {
    key: "habit_logs",
    table: "habit_logs",
    title: "Journal d’habitudes",
    singular: "entrée",
    description: "Accomplissements saisis jour par jour.",
    primaryField: "occurred_on",
    upsertConflict: "user_id,habit_id,occurred_on",
    fields: [
      { key: "habit_id", label: "Habitude", kind: "relation", relation: "habits", required: true },
      { key: "occurred_on", label: "Date", kind: "date", required: true },
      { key: "count", label: "Nombre", kind: "number", required: true, min: 0, defaultValue: 1 },
      { key: "note", label: "Note", kind: "textarea" },
    ],
    listFields: ["habit_id", "occurred_on", "count", "note"], orderBy: "occurred_on",
    relations: [{ field: "habit_id", parentResource: "habits" }],
    schema: z.object({ habit_id: z.uuid(), occurred_on: requiredDate, count: requiredNumber(0, 100_000), note: optionalText() }),
  },
  {
    key: "health_metrics",
    table: "health_metrics",
    title: "Métriques de santé",
    singular: "métrique",
    description: "Définitions libres de mesures; LifeOS affiche des tendances, pas des diagnostics.",
    primaryField: "name",
    fields: [
      { key: "name", label: "Nom", kind: "text", required: true },
      { key: "unit", label: "Unité", kind: "text", required: true },
      { key: "active", label: "Active", kind: "checkbox", defaultValue: true },
    ],
    listFields: ["unit", "active"], searchFields: ["name", "unit"], orderBy: "name", ascending: true,
    schema: z.object({ name: requiredText("Le nom"), unit: requiredText("L’unité", 60), active: booleanValue }),
  },
  {
    key: "health_entries",
    table: "health_entries",
    title: "Mesures de santé",
    singular: "mesure",
    description: "Points réels utilisés pour les tendances 7, 30 et 90 jours.",
    primaryField: "value",
    fields: [
      { key: "metric_id", label: "Métrique", kind: "relation", relation: "health_metrics", required: true },
      { key: "measured_at", label: "Mesuré le", kind: "datetime", required: true },
      { key: "value", label: "Valeur", kind: "number", required: true, step: 0.01 },
      { key: "note", label: "Note", kind: "textarea" },
    ],
    listFields: ["metric_id", "value", "measured_at", "note"], orderBy: "measured_at",
    relations: [{ field: "metric_id", parentResource: "health_metrics" }],
    schema: z.object({ metric_id: z.uuid(), measured_at: requiredDateTime, value: requiredNumber(), note: optionalText() }),
  },
  {
    key: "workouts",
    table: "workouts",
    title: "Entraînements",
    singular: "entraînement",
    description: "Activité, durée, intensité libre et notes factuelles.",
    primaryField: "activity",
    fields: [
      { key: "occurred_at", label: "Date et heure", kind: "datetime", required: true },
      { key: "activity", label: "Activité", kind: "text", required: true },
      { key: "duration_minutes", label: "Durée (minutes)", kind: "number", required: true, min: 0 },
      { key: "intensity", label: "Intensité", kind: "text" },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
    listFields: ["occurred_at", "duration_minutes", "intensity", "notes"], searchFields: ["activity", "notes"], orderBy: "occurred_at",
    schema: z.object({ occurred_at: requiredDateTime, activity: requiredText("L’activité"), duration_minutes: requiredNumber(0, 10_000), intensity: optionalText(120), notes: optionalText() }),
  },
  {
    key: "profile",
    table: "profiles",
    title: "Préférences",
    singular: "profil",
    description: "Fuseau horaire, semaine de référence, devise et jour de revue.",
    primaryField: "display_name",
    singleton: true,
    upsertConflict: "id",
    fields: [
      { key: "display_name", label: "Nom affiché", kind: "text" },
      { key: "timezone", label: "Fuseau IANA", kind: "text", required: true, defaultValue: "Europe/Paris" },
      { key: "default_currency", label: "Devise par défaut", kind: "text", required: true, defaultValue: "EUR" },
      { key: "week_starts_on", label: "Premier jour de semaine", kind: "select", required: true, defaultValue: 1, options: [
        { value: "1", label: "Lundi" }, { value: "0", label: "Dimanche" }, { value: "6", label: "Samedi" },
      ] },
      { key: "weekly_review_weekday", label: "Jour de weekly review", kind: "select", required: true, defaultValue: 0, options: [
        { value: "0", label: "Dimanche" }, { value: "1", label: "Lundi" }, { value: "2", label: "Mardi" }, { value: "3", label: "Mercredi" }, { value: "4", label: "Jeudi" }, { value: "5", label: "Vendredi" }, { value: "6", label: "Samedi" },
      ] },
    ],
    listFields: ["display_name", "timezone", "default_currency", "week_starts_on", "weekly_review_weekday"], orderBy: "updated_at",
    schema: z.object({ display_name: optionalText(80), timezone: requiredText("Le fuseau", 80), default_currency: z.string().trim().length(3).transform((value) => value.toUpperCase()), week_starts_on: requiredNumber(0, 6), weekly_review_weekday: requiredNumber(0, 6) }),
  },
];

export const resourceConfigs: Readonly<Record<string, ResourceConfig>> = Object.fromEntries(
  resources.map((resource) => [resource.key, resource]),
);

export function getResourceConfig(key: string): ResourceConfig | null {
  return resourceConfigs[key] ?? null;
}

export function getField(config: ResourceConfig, key: string): FieldConfig | null {
  return config.fields.find((field) => field.key === key) ?? null;
}
