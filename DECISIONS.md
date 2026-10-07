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

## 2026-09-22 — V2 Core Experience

- La navigation quotidienne est réduite à Aujourd'hui, Progression, Insights, Revue et Explorer.
- Les CRUD existants sont conservés comme administration secondaire pour protéger le modèle actuel et le rollback.
- Les analytics globaux ne considèrent que des occurrences mesurables ; aucune donnée absente n'est convertie en zéro.
- Les routines flexibles/contextuelles sans calendrier explicite ne sont pas utilisées dans le taux d'exécution.
- La capture rapide V2 reste déterministe et crée une tâche ; une future classification IA devra afficher une proposition avant toute mutation.
- Aucun score unique de « qualité de vie » n'est créé : LifeOS expose des indicateurs explicables et séparés.

## 2026-09-22 — Aujourd’hui uses temporal eligibility only

- `FOCUS` is a ranking signal only; it never makes an undated task eligible for Aujourd’hui.
- Undated weekly/monthly and flexible/contextual routines remain outside Aujourd’hui until a deterministic calendar rule exists.
- Multi-day routine windows are represented additively with `schedule_window_weekdays` and optional `schedule_month_weeks`; `{6,7}` is one weekend occurrence, not two.
- `time_context` is presentation/ordering metadata, not the primary calendar engine.
- `configuration_status` is not a blanket calendar gate: the engine checks whether the fields required for the occurrence are actually present.

## 2026-10-07 — Daily validation remains reversible until the day changes

- Aujourd’hui groups missions by `life_area` (PRO, PERSO, RELIGION) without creating another task system.
- A completed mission remains visible at the end of its group for the rest of the user's calendar day and can be unchecked there.
- At the next midnight in the profile time zone, the dashboard refreshes: daily recurring occurrences start a new day, while a non-recurring task remains permanently completed unless it was explicitly unchecked before midnight.
- Rows without a life area are preserved in a conditional “À classer” group instead of being hidden or assigned arbitrarily.

## 2026-10-07 — Upcoming work uses a calendar without changing its source of truth

- The dashboard “À venir” section remains derived from existing tasks, routines, and reminders; the calendar is a presentation layer, not a new planning system.
- The initial calendar window covers the next 120 days so monthly navigation can show recurring work without another database query or table.
- Calendar indicators reuse the existing PRO, PERSO, and RELIGION life areas, while selecting a date reveals its complete agenda.
