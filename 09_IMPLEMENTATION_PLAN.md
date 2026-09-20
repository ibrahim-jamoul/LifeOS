# LifeOS — Implementation Plan

This sequence is designed for Codex to keep the app deployable at every stage.

## Phase 0 — Repository bootstrap

Deliver:
- Next.js + TypeScript strict;
- Tailwind/component primitives;
- lint/typecheck/test scripts;
- `.env.example`;
- Supabase clients;
- basic protected shell.

Exit:
- app runs locally;
- unauthenticated routes work;
- no secrets committed.

## Phase 1 — Supabase foundation

Deliver:
- migration `001_initial_schema.sql`;
- Auth integration;
- RLS;
- initialization RPC;
- private Storage buckets/policies or setup script;
- profile/settings.

Exit:
- test users cannot access each other's rows;
- first login initializes branches.

## Phase 2 — Control plane

Deliver:
- vision;
- goals;
- projects;
- tasks;
- KPIs/entries;
- decisions;
- weekly reviews;
- dashboard;
- quick capture.

Exit:
- complete Vision → Goal → Project → Task → KPI → Review workflow.

## Phase 3 — Alerts

Deliver:
- deterministic overdue/upcoming queries;
- notifications table UI;
- reminders;
- daily materialization job;
- document/Quran/decision/review alert rules.

Exit:
- no duplicate persisted alerts;
- snooze/read/dismiss work.

## Phase 4 — Learning branches

Deliver:
- Religion;
- Arabic;
- Quran.

Exit:
- real sessions and progress can be entered;
- Quran revision alerts work.

## Phase 5 — Finance & Health

Deliver:
- finance accounts/transactions/goals/budgets/net worth;
- habits;
- health metrics;
- workouts;
- trend views.

Exit:
- monthly finance totals accurate;
- transfers excluded from income/expense;
- habit and metric entries persist correctly.

## Phase 6 — Documents & Memories

Deliver:
- private buckets;
- uploads;
- metadata;
- signed/private access;
- expiry;
- memory timeline.

Exit:
- unauthenticated direct access fails;
- delete removes metadata and object where intended.

## Phase 7 — AI assistant

Deliver:
- server-only provider abstraction;
- scope selector;
- structured context builder;
- read-only Q&A;
- write proposal preview optional.

Exit:
- application remains functional with no AI key;
- AI cannot mutate without confirmation.

## Phase 8 — Export, testing, deploy

Deliver:
- JSON export;
- E2E P0 tests;
- deployment docs;
- production env configuration;
- known limitations.

Exit:
- all P0 acceptance tests pass;
- Vercel production deployment works.

## What to postpone if time is constrained

Postpone in this order:
1. global full-text search;
2. AI write actions;
3. advanced charts;
4. CSV imports;
5. recurring task engine beyond reminders;
6. vocabulary spaced repetition;
7. map view for memories;
8. external wearable/bank integrations.

Do **not** postpone:
- RLS;
- private Storage;
- CRUD;
- alerts;
- weekly review;
- export;
- error handling.
