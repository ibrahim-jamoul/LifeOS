# AGENTS.md — Instructions for Codex

You are implementing **LifeOS**, a private personal operating system.

## Priority order

1. Correctness and data integrity.
2. Security and privacy.
3. Complete core workflows.
4. Maintainability.
5. Usability.
6. Visual polish.

Do not sacrifice items 1–4 for animation or styling.

## Mandatory stack direction

- Next.js, current stable version at implementation time.
- TypeScript with strict mode.
- App Router.
- Vercel deployment.
- Supabase Auth + PostgreSQL + Storage.
- Supabase SSR-compatible auth integration.
- Tailwind CSS; a component library such as shadcn/ui is allowed.
- Zod or equivalent schema validation.
- A chart library may be used only when it improves decisions; do not over-chart.

If current official documentation makes a specific implementation obsolete, use the supported current approach and document the deviation.

## Source of truth

When files conflict, follow this order:

1. `AGENTS.md`
2. `17_MANAGER_MODE.md` for daily UX / automation / planning semantics
3. `03_FUNCTIONAL_SPEC.md`
4. `07_SECURITY_PRIVACY.md`
5. `supabase/migrations/*.sql`
6. `10_ACCEPTANCE_TESTS.md`
7. remaining product documents.

If a requirement is ambiguous, choose the simplest implementation that preserves the product intent. Record the choice in `DECISIONS.md` instead of stopping the build.

## Coding rules

- Prefer boring, explicit code over clever abstractions.
- No `any` unless justified with a comment.
- Server-only secrets must never be imported into client bundles.
- Centralize Supabase clients.
- Centralize date/time handling.
- Every mutation validates input.
- Every async mutation exposes loading, success and error states.
- No silent failures.
- Use optimistic UI only where rollback is safe.
- Pagination or sensible limits for long lists.
- Do not store binary files directly in PostgreSQL.
- Do not bypass RLS from normal user actions.
- Service-role usage, if needed for a server job, must be isolated to a server-only module and documented.

## UX rules

- Main navigation exposes **Aujourd’hui + Progression + Insights + Revue + Explorer**. The historical branch CRUD screens remain accessible through Explorer as an administration path.
- Global quick capture is part of the main shell; it must prefer safe deterministic mutations over silent AI classification.
- Daily usage should require near-zero data entry: prefer computed actions and one-tap validation. CRUD creation remains available as a secondary administration path.
- A branch home page must always show: current state, next action, recent activity.
- Empty states must offer a direct CTA.
- Forms use sensible defaults.
- Never hide core functionality behind hover-only UI.
- "Archive" is preferred to hard delete for strategic objects; hard delete remains available where appropriate.

## Data rules

All user-owned rows must include `user_id uuid not null references auth.users(id) on delete cascade`.

For exposed tables:
- enable RLS;
- policies must isolate by `auth.uid() = user_id`;
- create indexes on `user_id` and common filter/sort columns.

## Testing rules

Implement:
- unit tests for pure scoring/date/status helpers;
- integration tests for critical server actions;
- RLS allow/deny tests or a documented Supabase test procedure;
- Playwright or equivalent E2E tests for the P0 workflows in `10_ACCEPTANCE_TESTS.md`.

A feature is not complete if its happy path works but unauthorized access, validation and errors are untested.

## Do not do

- Do not invent health, financial, religious or career data.
- Do not create social/community functionality.
- Do not add gamification.
- Do not add billing.
- Do not make the AI assistant capable of executing destructive changes without explicit confirmation.
- Do not expose document/photo buckets publicly.
- Do not create a microservices architecture.
- Do not block the build on visual assets.

## End-of-build deliverables

The resulting codebase must include:

- `README.md` with local setup;
- `.env.example`;
- Supabase migrations;
- seed/initialization logic;
- tests;
- Vercel deployment instructions;
- a short `DECISIONS.md`;
- a `KNOWN_LIMITATIONS.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
