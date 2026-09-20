# LifeOS validation report

Validated locally on 2026-09-20.

## Automated results

- PASS — `npm run lint`
- PASS — `npm run typecheck`
- PASS — `npm test`: 27 tests passed; 3 live Supabase isolation tests skipped because no test credentials were configured
- PASS — `npm run test:e2e`: anonymous route protection passed on desktop Chromium and a Pixel 7 viewport; 2 authenticated journeys skipped because no E2E account was configured
- PASS — `npm run build`: Next.js 16.3.5 production build completed and emitted all expected application/API routes
- PASS — static secret scan found no committed provider, Supabase secret or production API key
- PASS — 37 public application tables and 37 RLS enable statements

## Pack and schema checks

- PASS — exactly nine domain slugs in `initialize_lifeos()`
- PASS — initialization uses conflict-safe inserts
- PASS — owner RLS policies exist for every application table
- PASS — owner-prefixed private Storage policies exist for `documents` and `memories`
- PASS — tenant-aware composite foreign keys cover parent/child ownership
- PASS — notification dedupe uniqueness and lifecycle fields exist
- PASS — financial transfer RPC creates a same-currency atomic pair
- PASS — weekly review normalization and uniqueness exist

## Requires configured external services

- PENDING LIVE — apply both migrations to a Supabase project
- PENDING LIVE — create the two private buckets
- PENDING LIVE — execute the two-user RLS/Storage suite with dedicated accounts
- PENDING LIVE — execute the authenticated Playwright journey
- PENDING LIVE — deploy to Vercel and run the production smoke test
- OPTIONAL — configure an OpenAI-compatible provider and validate one scoped read-only answer

These pending checks require credentials or external state and are documented in `README.md` and `KNOWN_LIMITATIONS.md`; they are not silently reported as passing.
