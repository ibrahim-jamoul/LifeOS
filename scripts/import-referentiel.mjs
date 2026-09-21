#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const defaultDataPath = path.join(repositoryRoot, "initial_data", "referentiel_2026-09-21.json");

function parseArguments(argv) {
  const options = {
    apply: false,
    skipDocument: false,
    dataPath: defaultDataPath,
    documentPath: null,
    userId: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") options.apply = true;
    else if (argument === "--skip-document") options.skipDocument = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--user") options.userId = argv[++index] ?? null;
    else if (argument.startsWith("--user=")) options.userId = argument.slice("--user=".length);
    else if (argument === "--data") options.dataPath = path.resolve(argv[++index] ?? "");
    else if (argument.startsWith("--data=")) options.dataPath = path.resolve(argument.slice("--data=".length));
    else if (argument === "--document") options.documentPath = path.resolve(argv[++index] ?? "");
    else if (argument.startsWith("--document=")) options.documentPath = path.resolve(argument.slice("--document=".length));
    else throw new Error(`Argument inconnu : ${argument}`);
  }

  return options;
}

function printHelp() {
  console.log(`Import idempotent du référentiel personnel dans LifeOS.

Usage:
  node scripts/import-referentiel.mjs [options]

Options:
  --apply                 Effectue les écritures. Sans ce drapeau, le mode simulation est utilisé.
  --user <uuid>           Utilisateur cible (ou LIFEOS_IMPORT_USER_ID).
  --data <path>           Jeu de données JSON à importer.
  --document <path>       Fichier Word privé à conserver.
  --skip-document         Ignore explicitement l'upload du Word.
  --help                  Affiche cette aide.

Variables serveur attendues:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY
  LIFEOS_IMPORT_USER_ID
  LIFEOS_REFERENCE_DOCX (facultatif)
`);
}

function loadEnvironmentFile(filename) {
  if (!existsSync(filename)) return;
  const lines = readFileSync(filename, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const separator = trimmed.indexOf("=");
    const name = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[name] === undefined) process.env[name] = value;
  }
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`]/g, "'")
    .replace(/[–—]/g, "-")
    .toLocaleLowerCase("fr-FR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function deterministicUuid(namespace) {
  const bytes = Buffer.from(createHash("sha256").update(`lifeos:${namespace}`).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isBlank(value) {
  return value === null
    || value === undefined
    || (typeof value === "string" && value.trim() === "")
    || (Array.isArray(value) && value.length === 0);
}

function valuesEqual(left, right) {
  if (Array.isArray(left) && Array.isArray(right)) {
    return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
  }
  if (typeof left === "number" && typeof right === "number") return left === right;
  return String(left) === String(right);
}

function assertUuid(value, label) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value ?? "")) {
    throw new Error(`${label} doit être un UUID valide.`);
  }
}

function readDataset(filename) {
  if (!existsSync(filename)) throw new Error(`Jeu de données introuvable : ${filename}`);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(filename, "utf8"));
  } catch (error) {
    throw new Error(`JSON invalide dans ${filename}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!parsed.metadata?.dataset || !parsed.reference_document) throw new Error("Le jeu de données ne contient pas les métadonnées attendues.");
  return parsed;
}

const entitySpecs = [
  { collection: "goals", table: "goals", matchField: "title" },
  { collection: "projects", table: "projects", matchField: "title" },
  { collection: "kpis", table: "kpis", matchField: "name" },
  { collection: "study_topics", table: "study_topics", matchField: "title" },
  { collection: "tasks", table: "tasks", matchField: "title" },
  { collection: "habits", table: "habits", matchField: "name" },
  { collection: "religion_routines", table: "religion_routines", matchField: "name" },
  { collection: "decisions", table: "decisions", matchField: "title" },
  { collection: "resources", table: "resources", matchField: "title", sourceKeyField: "source_key" },
  { collection: "reminders", table: "reminders", matchField: "title" },
  { collection: "weekly_reviews", table: "weekly_reviews", matchField: "week_start" },
];

function validateDataset(dataset) {
  const allKeys = new Set();
  const knownRefs = new Set();
  for (const spec of entitySpecs) {
    const items = dataset[spec.collection] ?? [];
    if (!Array.isArray(items)) throw new Error(`${spec.collection} doit être une liste.`);
    for (const item of items) {
      if (!item.key || !item.data || typeof item.data !== "object") throw new Error(`Entrée invalide dans ${spec.collection}.`);
      if (allKeys.has(item.key)) throw new Error(`Clé dupliquée dans le jeu de données : ${item.key}`);
      allKeys.add(item.key);
      knownRefs.add(item.key);
      if (isBlank(item.data[spec.matchField])) throw new Error(`${item.key} n'a pas de ${spec.matchField}.`);
    }
  }
  for (const item of dataset.life_vision ?? []) {
    if (!item.key || !item.data) throw new Error("Entrée life_vision invalide.");
    if (allKeys.has(item.key)) throw new Error(`Clé dupliquée : ${item.key}`);
    allKeys.add(item.key);
    knownRefs.add(item.key);
  }
  for (const relation of dataset.goal_projects ?? []) {
    if (!knownRefs.has(relation.goal_ref) || !knownRefs.has(relation.project_ref)) {
      throw new Error(`Relation goal_projects invalide : ${JSON.stringify(relation)}`);
    }
  }
  for (const spec of entitySpecs) {
    for (const item of dataset[spec.collection] ?? []) {
      for (const refField of ["goal_ref", "project_ref", "kpi_ref", "study_topic_ref", "source_ref"]) {
        if (item[refField] && !knownRefs.has(item[refField])) throw new Error(`${item.key} référence une clé inconnue : ${item[refField]}`);
      }
    }
  }
}

function createSummary(mode) {
  return {
    mode,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    relationsInserted: 0,
    documentUploaded: 0,
    documentReused: 0,
    conflicts: [],
    warnings: [],
    planned: [],
    touchedByTable: new Map(),
  };
}

function rememberTouched(summary, table, id) {
  const ids = summary.touchedByTable.get(table) ?? new Set();
  ids.add(id);
  summary.touchedByTable.set(table, ids);
}

function describeConflict(summary, table, key, fields) {
  if (fields.length === 0) return;
  summary.conflicts.push({ table, key, fields });
}

function buildFillOnlyPatch(existing, desired, ignoredFields = new Set()) {
  const patch = {};
  const conflicts = [];
  for (const [field, wanted] of Object.entries(desired)) {
    if (ignoredFields.has(field) || isBlank(wanted)) continue;
    const current = existing[field];
    if (isBlank(current)) patch[field] = wanted;
    else if (!valuesEqual(current, wanted)) conflicts.push(field);
  }
  return { patch, conflicts };
}

function findExistingRow(rows, item, spec, deterministicId) {
  const directId = rows.find((row) => row.id === deterministicId);
  if (directId) return directId;
  if (spec.sourceKeyField && item.data[spec.sourceKeyField]) {
    const sourceMatch = rows.find((row) => row[spec.sourceKeyField] === item.data[spec.sourceKeyField]);
    if (sourceMatch) return sourceMatch;
  }
  const candidates = item.dedupe_titles?.length ? item.dedupe_titles : [item.data[spec.matchField]];
  const normalizedCandidates = new Set(candidates.map(normalizeText));
  return rows.find((row) => normalizedCandidates.has(normalizeText(row[spec.matchField])));
}

function resolveEntityData(item, references) {
  const data = { ...item.data };
  const mapping = [
    ["goal_ref", "goal_id"],
    ["project_ref", "project_id"],
    ["kpi_ref", "kpi_id"],
    ["study_topic_ref", "study_topic_id"],
    ["source_ref", "source_id"],
  ];
  for (const [referenceField, databaseField] of mapping) {
    if (!item[referenceField]) continue;
    const resolved = references.get(item[referenceField]);
    if (!resolved) throw new Error(`Référence non résolue pour ${item.key}: ${item[referenceField]}`);
    data[databaseField] = resolved;
  }
  return data;
}

async function selectOwnedRows(client, table, userId) {
  const { data, error } = await client.from(table).select("*").eq("user_id", userId).limit(5000);
  if (error) {
    throw new Error(`Lecture de ${table} impossible (${error.code ?? "sans code"}): ${error.message}. Vérifiez que les migrations additives ont été appliquées.`);
  }
  return data ?? [];
}

async function importLifeVision({ client, dataset, userId, apply, summary, references }) {
  const items = dataset.life_vision ?? [];
  if (items.length === 0) return;
  const { data: existing, error } = await client.from("life_vision").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`Lecture de life_vision impossible: ${error.message}`);

  for (const item of items) {
    const deterministicId = deterministicUuid(`${dataset.metadata.dataset}:life_vision:${item.key}:${userId}`);
    if (existing) {
      references.set(item.key, existing.id);
      const { patch, conflicts } = buildFillOnlyPatch(existing, item.data, new Set(["id", "user_id", "created_at", "updated_at"]));
      describeConflict(summary, "life_vision", item.key, conflicts);
      if (Object.keys(patch).length === 0) {
        summary.unchanged += 1;
        continue;
      }
      summary.planned.push({ action: "fill-empty", table: "life_vision", key: item.key, fields: Object.keys(patch) });
      if (apply) {
        const { error: updateError } = await client.from("life_vision").update(patch).eq("id", existing.id).eq("user_id", userId);
        if (updateError) throw new Error(`Mise à jour de life_vision impossible: ${updateError.message}`);
        rememberTouched(summary, "life_vision", existing.id);
      }
      summary.updated += 1;
    } else {
      references.set(item.key, deterministicId);
      summary.planned.push({ action: "insert", table: "life_vision", key: item.key });
      if (apply) {
        const { error: insertError } = await client.from("life_vision").insert({ id: deterministicId, user_id: userId, ...item.data });
        if (insertError) throw new Error(`Insertion de life_vision impossible: ${insertError.message}`);
        rememberTouched(summary, "life_vision", deterministicId);
      }
      summary.inserted += 1;
    }
  }
}

async function importEntities({ client, dataset, userId, apply, summary, references }) {
  for (const spec of entitySpecs) {
    const items = dataset[spec.collection] ?? [];
    if (items.length === 0) continue;
    const existingRows = await selectOwnedRows(client, spec.table, userId);

    for (const item of items) {
      const deterministicId = deterministicUuid(`${dataset.metadata.dataset}:${spec.table}:${item.key}:${userId}`);
      const desired = resolveEntityData(item, references);
      const existing = findExistingRow(existingRows, item, spec, deterministicId);

      if (existing) {
        references.set(item.key, existing.id);
        const { patch, conflicts } = buildFillOnlyPatch(
          existing,
          desired,
          new Set(["id", "user_id", "created_at", "updated_at", "archived_at", "completed_at"]),
        );
        describeConflict(summary, spec.table, item.key, conflicts);
        if (Object.keys(patch).length === 0) {
          summary.unchanged += 1;
          continue;
        }
        summary.planned.push({ action: "fill-empty", table: spec.table, key: item.key, fields: Object.keys(patch) });
        if (apply) {
          const { error } = await client.from(spec.table).update(patch).eq("id", existing.id).eq("user_id", userId);
          if (error) throw new Error(`Mise à jour de ${spec.table}/${item.key} impossible (${error.code ?? "sans code"}): ${error.message}`);
          rememberTouched(summary, spec.table, existing.id);
        }
        summary.updated += 1;
      } else {
        references.set(item.key, deterministicId);
        const payload = { id: deterministicId, user_id: userId, ...desired };
        summary.planned.push({ action: "insert", table: spec.table, key: item.key });
        if (apply) {
          const { error } = await client.from(spec.table).insert(payload);
          if (error) throw new Error(`Insertion de ${spec.table}/${item.key} impossible (${error.code ?? "sans code"}): ${error.message}`);
          rememberTouched(summary, spec.table, deterministicId);
          existingRows.push(payload);
        }
        summary.inserted += 1;
      }
    }
  }
}

async function importGoalProjects({ client, dataset, userId, apply, summary, references }) {
  const relations = dataset.goal_projects ?? [];
  if (relations.length === 0) return;
  const existingRows = await selectOwnedRows(client, "goal_projects", userId);
  const existingPairs = new Set(existingRows.map((row) => `${row.goal_id}:${row.project_id}`));

  for (const relation of relations) {
    const goalId = references.get(relation.goal_ref);
    const projectId = references.get(relation.project_ref);
    if (!goalId || !projectId) throw new Error(`Relation non résolue : ${JSON.stringify(relation)}`);
    const pair = `${goalId}:${projectId}`;
    if (existingPairs.has(pair)) {
      summary.unchanged += 1;
      continue;
    }
    const id = deterministicUuid(`${dataset.metadata.dataset}:goal_projects:${relation.goal_ref}:${relation.project_ref}:${userId}`);
    summary.planned.push({ action: "insert", table: "goal_projects", key: `${relation.goal_ref}:${relation.project_ref}` });
    if (apply) {
      const { error } = await client.from("goal_projects").insert({ id, user_id: userId, goal_id: goalId, project_id: projectId });
      if (error) throw new Error(`Insertion goal_projects impossible (${error.code ?? "sans code"}): ${error.message}`);
      rememberTouched(summary, "goal_projects", id);
    }
    existingPairs.add(pair);
    summary.relationsInserted += 1;
  }
}

async function ensurePrivateDocument({ client, dataset, userId, apply, summary, documentPath, skipDocument }) {
  if (skipDocument) {
    summary.warnings.push("Upload du document ignoré explicitement avec --skip-document.");
    return;
  }

  const source = path.resolve(documentPath ?? dataset.reference_document.source_path);
  if (!existsSync(source)) throw new Error(`Document Word introuvable : ${source}. Utilisez --document ou --skip-document.`);
  const fileStats = await stat(source);
  if (!fileStats.isFile() || fileStats.size <= 0) throw new Error(`Document Word vide ou invalide : ${source}`);
  if (fileStats.size > 25 * 1024 * 1024) throw new Error("Le Word dépasse la limite LifeOS de 25 Mo.");
  const contents = await readFile(source);
  const sourceHash = createHash("sha256").update(contents).digest("hex");

  const bucketName = "documents";
  const { data: bucket, error: bucketError } = await client.storage.getBucket(bucketName);
  if (bucketError) throw new Error(`Bucket privé ${bucketName} inaccessible: ${bucketError.message}`);
  if (bucket.public) throw new Error(`Refus d'upload : le bucket ${bucketName} est public.`);

  const objectUuid = deterministicUuid(`${dataset.metadata.dataset}:reference-document:${userId}`);
  const safeFilename = `${objectUuid}-referentiel-personnel-pro-perso-religion.docx`;
  let storagePath = `${userId}/2026/${safeFilename}`;
  const folder = `${userId}/2026`;
  const { data: listed, error: listError } = await client.storage.from(bucketName).list(folder, { limit: 100, search: safeFilename });
  if (listError) throw new Error(`Vérification Storage impossible: ${listError.message}`);
  let objectExists = (listed ?? []).some((entry) => entry.name === safeFilename && entry.id !== null);

  const { data: documentRows, error: documentReadError } = await client
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .limit(5000);
  if (documentReadError) throw new Error(`Lecture de documents impossible: ${documentReadError.message}`);

  const expectedTitle = dataset.reference_document.title;
  let metadataExisting = (documentRows ?? []).find((row) => row.storage_path === storagePath);
  const sameTitleRows = (documentRows ?? []).filter(
    (row) => row.storage_path && normalizeText(row.title) === normalizeText(expectedTitle),
  );

  if (!metadataExisting) {
    for (const row of sameTitleRows) {
      const { data: existingFile, error: downloadError } = await client.storage
        .from(bucketName)
        .download(row.storage_path);
      if (downloadError || !existingFile) continue;
      const existingHash = createHash("sha256")
        .update(Buffer.from(await existingFile.arrayBuffer()))
        .digest("hex");
      if (existingHash === sourceHash) {
        metadataExisting = row;
        storagePath = row.storage_path;
        objectExists = true;
        break;
      }
    }

    if (!metadataExisting && sameTitleRows.length > 0) {
      summary.warnings.push("Un document porte déjà le même titre, mais son contenu diffère ou son objet est absent ; le Word fourni sera conservé séparément.");
    }
  }

  if (objectExists) {
    const { data: existingFile, error: downloadError } = await client.storage.from(bucketName).download(storagePath);
    if (downloadError || !existingFile) throw new Error(`Objet privé ${storagePath} illisible: ${downloadError?.message ?? "contenu absent"}`);
    const existingHash = createHash("sha256")
      .update(Buffer.from(await existingFile.arrayBuffer()))
      .digest("hex");
    if (existingHash !== sourceHash) {
      throw new Error(`Le chemin privé déterministe ${storagePath} contient un document différent ; l'import refuse de l'écraser.`);
    }
    summary.documentReused += 1;
  } else {
    summary.planned.push({ action: "upload-private", table: "storage.objects", key: storagePath });
    if (apply) {
      const { error: uploadError } = await client.storage.from(bucketName).upload(storagePath, contents, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: false,
      });
      if (uploadError) throw new Error(`Upload privé du Word impossible: ${uploadError.message}`);
    }
    summary.documentUploaded += 1;
  }

  const desiredMetadata = {
    title: expectedTitle,
    category: dataset.reference_document.category,
    storage_path: storagePath,
    original_filename: dataset.reference_document.original_filename,
    mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    file_size_bytes: fileStats.size,
    issued_on: dataset.reference_document.issued_on,
    tags: dataset.reference_document.tags,
    notes: dataset.reference_document.notes,
  };

  if (metadataExisting) {
    const { patch, conflicts } = buildFillOnlyPatch(
      metadataExisting,
      desiredMetadata,
      new Set(["id", "user_id", "created_at", "updated_at"]),
    );
    describeConflict(summary, "documents", "reference-document", conflicts);
    if (Object.keys(patch).length === 0) {
      summary.unchanged += 1;
      return;
    }
    summary.planned.push({ action: "fill-empty", table: "documents", key: "reference-document", fields: Object.keys(patch) });
    if (apply) {
      const { error } = await client.from("documents").update(patch).eq("id", metadataExisting.id).eq("user_id", userId);
      if (error) throw new Error(`Mise à jour des métadonnées du Word impossible: ${error.message}`);
      rememberTouched(summary, "documents", metadataExisting.id);
    }
    summary.updated += 1;
  } else {
    const documentId = deterministicUuid(`${dataset.metadata.dataset}:documents:reference-document:${userId}`);
    summary.planned.push({ action: "insert", table: "documents", key: "reference-document" });
    if (apply) {
      const { error } = await client.from("documents").insert({ id: documentId, user_id: userId, ...desiredMetadata });
      if (error) throw new Error(`Insertion des métadonnées du Word impossible: ${error.message}`);
      rememberTouched(summary, "documents", documentId);
    }
    summary.inserted += 1;
  }
}

async function verifyTouchedRows(client, summary, userId) {
  for (const [table, idSet] of summary.touchedByTable.entries()) {
    const ids = [...idSet];
    if (ids.length === 0) continue;
    const ownerColumn = table === "profiles" ? "id" : "user_id";
    const { data, error } = await client.from(table).select("id").eq(ownerColumn, userId).in("id", ids);
    if (error) throw new Error(`Vérification de ${table} impossible: ${error.message}`);
    if ((data ?? []).length !== ids.length) {
      throw new Error(`Vérification de ${table} incomplète : ${data?.length ?? 0}/${ids.length} lignes retrouvées.`);
    }
  }
}

function printSummary(summary) {
  console.log(`\nMode : ${summary.mode}`);
  console.log(`Inserts ${summary.mode === "SIMULATION" ? "prévus" : "réalisés"} : ${summary.inserted}`);
  console.log(`Compléments de champs vides ${summary.mode === "SIMULATION" ? "prévus" : "réalisés"} : ${summary.updated}`);
  console.log(`Relations nouvelles : ${summary.relationsInserted}`);
  console.log(`Éléments déjà conformes : ${summary.unchanged}`);
  console.log(`Document privé à uploader / uploadé : ${summary.documentUploaded}`);
  console.log(`Document privé réutilisé : ${summary.documentReused}`);
  console.log(`Conflits non écrasés : ${summary.conflicts.length}`);
  console.log(`Avertissements : ${summary.warnings.length}`);

  if (summary.conflicts.length > 0) {
    console.log("\nConflits conservés sans écrasement :");
    for (const conflict of summary.conflicts) {
      console.log(`- ${conflict.table}/${conflict.key}: ${conflict.fields.join(", ")}`);
    }
  }
  if (summary.warnings.length > 0) {
    console.log("\nAvertissements :");
    for (const warning of summary.warnings) console.log(`- ${warning}`);
  }
  if (summary.mode === "SIMULATION") {
    console.log("\nAucune donnée n'a été modifiée. Relancez avec --apply après vérification de ce résumé.");
  }
}

async function main() {
  loadEnvironmentFile(path.join(repositoryRoot, ".env.local"));
  loadEnvironmentFile(path.join(repositoryRoot, ".env"));

  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const dataset = readDataset(options.dataPath);
  validateDataset(dataset);

  const userId = options.userId ?? process.env.LIFEOS_IMPORT_USER_ID;
  assertUuid(userId, "L'utilisateur cible (--user ou LIFEOS_IMPORT_USER_ID)");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serverKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!supabaseUrl || !serverKey) {
    throw new Error("Configuration Supabase serveur absente. Renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY.");
  }

  const client = createClient(supabaseUrl, serverKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { "x-client-info": "lifeos-reference-import/1.0" } },
  });
  const summary = createSummary(options.apply ? "APPLICATION" : "SIMULATION");
  const references = new Map();

  console.log(`Jeu de données : ${dataset.metadata.dataset}`);
  console.log(`Utilisateur cible : ${userId}`);
  console.log(`Mode : ${summary.mode}`);

  await importLifeVision({ client, dataset, userId, apply: options.apply, summary, references });
  await importEntities({ client, dataset, userId, apply: options.apply, summary, references });
  await importGoalProjects({ client, dataset, userId, apply: options.apply, summary, references });
  await ensurePrivateDocument({
    client,
    dataset,
    userId,
    apply: options.apply,
    summary,
    documentPath: options.documentPath ?? process.env.LIFEOS_REFERENCE_DOCX,
    skipDocument: options.skipDocument,
  });

  if (options.apply) await verifyTouchedRows(client, summary, userId);
  printSummary(summary);
}

main().catch((error) => {
  console.error(`Import interrompu : ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
