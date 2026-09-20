# Master Prompt for Codex

Use the following prompt when handing this pack to Codex.

---

You are the lead engineer for **LifeOS**.

Your job is to build the complete functional web application defined by this repository. Treat the Markdown files and Supabase migration as the product specification.

## Start

1. Read `AGENTS.md`.
2. Read files `01` through `10` in order.
3. Inspect `supabase/migrations/001_initial_schema.sql`.
4. Create an implementation checklist mapped to `10_ACCEPTANCE_TESTS.md`.
5. Begin implementation immediately. Do not redesign the product before coding.

## Technical target

- Next.js current stable, App Router, TypeScript strict.
- Vercel deployment.
- Supabase Auth/Postgres/Storage.
- Secure SSR-compatible Supabase integration.
- Tailwind + pragmatic UI components.
- Zod or equivalent validation.
- Tests for critical paths.

## Product priority

This is a personal operational system. Functionality and reliability are more important than distinctive visual branding.

Build an interface that is:
- clean;
- dense enough for real work;
- fast to navigate;
- responsive;
- not visually experimental.

## Critical workflows

Do not stop at static pages or mocked cards. The following must persist in Supabase:

Vision → Objectives → Projects → Tasks → KPIs → Weekly Review → Decisions

Then implement all 9 branches:
1. Religion
2. Arabic
3. Quran
4. Goals/KPIs/Decisions
5. AI Assistant
6. Finances
7. Health/Sport/Habits
8. Documents
9. Photos/Memories

## Security

RLS is mandatory.
Storage is private.
No service-role/AI secrets in client code.
All mutations validate inputs.
Test cross-user isolation.

## Alerts

Implement deterministic dashboard alerts even before scheduled jobs. Then add persisted notifications with idempotent dedupe keys.

## AI

The AI branch is optional at runtime:
- the app must work without a provider key;
- API calls happen only server-side;
- user selects data scope;
- no destructive write without preview and confirmation.

## Execution

Work incrementally and keep the project runnable.
After each phase:
- run typecheck/lint/tests;
- fix regressions;
- update implementation checklist.

When ambiguity exists, choose the simplest maintainable behavior consistent with the docs and log it in `DECISIONS.md`.

Do not ask for visual design confirmation unless the specification is technically impossible. Use sensible generic professional UI.

## Final definition of done

Do not declare completion until every applicable P0 item in `10_ACCEPTANCE_TESTS.md` passes or is explicitly listed in `KNOWN_LIMITATIONS.md` with a technical reason.

At the end provide:
- setup steps;
- Supabase migration instructions;
- Storage setup;
- Vercel environment variables;
- production deployment steps;
- test commands;
- list of remaining P1 items.

---
