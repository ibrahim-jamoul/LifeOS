# LifeOS technical decisions

## 2026-09-20 — Isolated application directory

LifeOS is implemented inside this extracted pack directory because the parent Git repository is an unrelated BudgetFlow project containing other untracked work. This avoids modifying or absorbing unrelated files.

## 2026-09-20 — Server-owned mutations

Application CRUD goes through authenticated Next.js route handlers. Handlers derive `user_id` from the verified Supabase session, validate all payloads with Zod and rely on RLS as defense in depth. The browser never supplies authoritative ownership.

## 2026-09-20 — Generic, configured CRUD surfaces

Repeated P0 record workflows use a metadata-driven resource workspace backed by an explicit server allowlist. Domain-specific calculations, file workflows and multi-record transactions remain dedicated code. This keeps all branches functional without hiding authorization in generic client code.

## 2026-09-20 — Alerts remain useful without cron

Due/overdue state is derived on reads. Persisted notifications are additionally materialized with deterministic deduplication keys. A protected daily job improves reminders but is not required for dashboard correctness.

## 2026-09-20 — Tenant integrity is enforced below RLS

`002_security_integrity.sql` adds composite owner-aware foreign keys for every child relationship. RLS prevents row access while the foreign keys independently prevent an owned child from referencing another account’s parent, including through a bypassed client.

## 2026-09-20 — Private files use direct authenticated uploads

Binary files travel from the authenticated browser directly to private Supabase Storage, under `<user_id>/<year>/<uuid>-<sanitized-name>`. The server validates the path, MIME, size and stored object before creating metadata. Retrieval uses five-minute signed URLs. Delete operations remove Storage first and preserve metadata if that removal fails.

## 2026-09-20 — Transfers are atomic pairs

A transfer is created only through a security-definer RPC that verifies ownership and equal currency for both accounts, locks them in deterministic order, and inserts a negative source plus positive destination row sharing one group ID. Both rows have type `transfer` and are excluded from income/expense totals.

## 2026-09-20 — Honest KPI watch band

The UI uses an explicit watch margin of 10% of the target reference (minimum 0.01). Missing entries, missing targets and invalid ranges remain `insufficient_data`; no missing value is treated as zero or success.

## 2026-09-20 — Optional AI is read-only

The AI adapter is server-only and OpenAI-compatible. It receives at most 75 structured rows per allowlisted table in the user-selected scope, never binary content or Storage paths, and exposes no mutation tools. Changing scope starts a separate conversation context.

## 2026-09-20 — Export separates data from binaries

The authenticated JSON export paginates every user-owned table and includes private file metadata, but not binary objects. This keeps the structured export portable without turning a single response into an unbounded media archive.

## 2026-09-21 — The three life areas remain cross-cutting metadata

PRO, PERSO and RELIGION are stored as `life_area` on the existing strategic
engines. They do not create three applications or duplicate the nine navigation
branches. Existing rows may remain unclassified until an audited import or a
user edit assigns them.

## 2026-09-21 — Unknown values are first-class states

Unknown priorities and KPI cadences use `unset`; incomplete records use
`to_complete`, `to_validate` or `to_configure`. A month-only source date remains
textual context instead of being coerced to the first day of the month. A date
without a source time is stored as `date`, not an invented timestamp.

## 2026-09-21 — Period routines do not invent calendar days

A weekly or monthly routine with no explicit weekday or month-day remains
actionable once during its current period. Exact-day routines are actionable
only on that day. Flexible and contextual routines can be recorded but are not
classified as missed.

## 2026-09-21 — Reference import is fill-only and content-verified

The importer uses deterministic IDs and normalized-title matching. It inserts
missing records, fills blank fields and reports conflicts without overwriting
existing user values. The private reference document is reused only when its
SHA-256 content matches the supplied Word file.
