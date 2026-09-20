# LifeOS implementation checklist

This checklist maps delivery work to `10_ACCEPTANCE_TESTS.md`. A checked item must be backed by code and an automated test or a documented two-user Supabase verification step.

## Foundation

- [x] Next.js App Router, strict TypeScript, responsive shell and validated mutations
- [x] Supabase SSR auth: sign-up, sign-in/out, password reset and protected routes
- [x] Idempotent first-login initialization of exactly nine domains
- [x] RLS and private Storage policies, including cross-user parent/child integrity

## Control plane

- [x] Vision create/update
- [x] Goals create/edit/archive with progress and overdue state
- [x] Projects link to one or more goals, all statuses and >3 FOCUS warning
- [x] Tasks CRUD, completion and today/week/overdue views
- [x] KPI definitions, entries, history, trend and honest status classification
- [x] Weekly review unique per ISO week with history
- [x] Decision journal and due-review warning
- [x] Dashboard with actionable real-data widgets and recent activity

## Alerts

- [x] Deterministic due/overdue checks work without cron
- [x] Idempotent persisted alerts with source links
- [x] Read, unread, snooze and dismiss lifecycle
- [x] Secured daily materialization endpoint

## Nine branches

- [x] Religion topics, sessions, routines and logs
- [x] Arabic profile, sessions and weekly minutes
- [x] Quran items, sessions and revision queue
- [x] Goals/KPIs/Decisions control plane
- [x] AI assistant is server-only, scoped and optional at runtime
- [x] Finance accounts, transactions, budgets, goals and net worth; transfers excluded
- [x] Health habits/logs, custom metrics/entries, workouts and real trends
- [x] Private documents upload/search/retrieve/delete and expiry alerts
- [x] Memories timeline with private multi-file assets

## Portability and release

- [x] User-scoped JSON export
- [x] Unit tests for scores, dates, KPI status and finance totals
- [x] Critical API/server integration tests
- [x] Two-user RLS and Storage test procedure/scripts
- [x] Playwright P0 workflow tests
- [x] README, `.env.example`, Supabase and Vercel instructions
- [x] Lint, typecheck, tests and production build pass
