# LifeOS — Technical Architecture

## Recommended architecture

```text
Browser
  │
  ▼
Next.js on Vercel
  ├── Server Components / Route Handlers / Server Actions
  ├── Supabase SSR auth integration
  └── Optional AI provider calls (server only)
          │
          ▼
Supabase
  ├── Auth
  ├── PostgreSQL
  │    ├── RLS
  │    ├── functions/views
  │    └── optional Cron jobs
  └── Storage
       ├── private documents bucket
       └── private memories bucket
```

## Why this architecture

- One deployable web application.
- Supabase provides the relational model required for goals/projects/KPIs/finance.
- RLS keeps user data isolated at database level.
- Storage handles documents/media without putting binaries in PostgreSQL.
- Vercel is appropriate for Next.js deployment.
- AI can be added server-side without changing the data layer.

## Application structure recommendation

```text
src/
├── app/
│   ├── (auth)/
│   └── app/
├── components/
│   ├── ui/
│   ├── dashboard/
│   └── forms/
├── features/
│   ├── goals/
│   ├── projects/
│   ├── tasks/
│   ├── kpis/
│   ├── religion/
│   ├── arabic/
│   ├── quran/
│   ├── finance/
│   ├── health/
│   ├── documents/
│   ├── memories/
│   └── assistant/
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── dates/
│   ├── validation/
│   └── alerts/
└── types/
```

Use feature folders for domain logic; do not create one giant `utils.ts`.

## Environment variables

Client-safe:
- `NEXT_PUBLIC_SUPABASE_URL`
- Supabase publishable/anon key appropriate to the current SDK/documentation

Server-only:
- `SUPABASE_SERVICE_ROLE_KEY` only if a server job genuinely needs it
- `AI_API_KEY`
- optional `AI_BASE_URL`
- optional `CRON_SECRET`
- optional email provider secret

Never prefix a secret with `NEXT_PUBLIC_`.

## Authentication

Use Supabase Auth with email/password first.

Required flows:
- sign up;
- sign in;
- sign out;
- reset password;
- authenticated route protection.

## Database access

Default:
- authenticated user operations go through the Supabase client under the user's JWT;
- RLS enforces row ownership.

Use service role only for trusted server jobs that cannot operate under user context.

## Storage

Private buckets:
- `documents`
- `memories`

Path convention:
`<user_id>/<yyyy>/<uuid>-<sanitized_filename>`

Metadata remains in application tables.

Use Storage API for upload/delete. Do not manipulate `storage` schema metadata directly.

## Alerts architecture

Two layers:

### Layer 1 — deterministic on read
Dashboard queries determine:
- overdue tasks;
- upcoming deadlines;
- due revisions;
- expiring documents.

This guarantees alerts remain useful even if scheduled jobs fail.

### Layer 2 — persisted notifications
A scheduled job can materialize notification rows for:
- reminders;
- decision review dates;
- weekly review missing;
- document expiry windows.

Preferred first implementation:
- Supabase Cron calling a Postgres function or Edge Function.

Alternative:
- Vercel Cron route protected by `CRON_SECRET`.

Do not require cron for basic dashboard correctness.

## AI architecture

P1:
1. User sends prompt and selects data scope.
2. Server builds a bounded structured context.
3. Server calls configured AI provider.
4. Store prompt/response metadata if the user chooses.
5. Write actions return proposed mutations.
6. User confirms.
7. Normal validated app mutation executes under authorization.

No direct model access to service-role credentials.

## Data export

Create a server route/action that:
- authenticates user;
- queries all user-owned tables;
- serializes JSON;
- excludes secrets;
- returns a downloadable export.

## Observability

Minimum:
- structured server errors;
- request/action correlation ID optional;
- no health/finance/document contents in logs.

## Performance

For a personal app, correctness beats premature optimization.

Still:
- index `user_id`;
- index due dates/status on task/reminder-heavy tables;
- paginate transaction/memory/document lists;
- avoid selecting large text or media metadata when not needed.

## Backups

Database and file storage are separate concerns. Provide a documented periodic export strategy for structured data and uploaded files; do not assume a database backup alone protects Storage objects.
