# LifeOS — Security & Privacy Requirements

LifeOS contains private financial, health, religious, document and personal-memory data. Security is a core feature.

## Threat model

Protect against:
- unauthenticated access;
- one user reading another user's rows;
- leaked public storage URLs;
- accidental exposure of service-role/AI keys;
- insecure direct object references;
- cross-site scripting through notes/descriptions;
- destructive actions without confirmation;
- sensitive data leaking into logs;
- AI context oversharing.

## Authentication

P0:
- Supabase Auth;
- email/password;
- password reset;
- protected routes.

Recommended:
- email verification in production;
- optional MFA later.

## RLS

Every table exposed through the Data API and containing user data:
- `ENABLE ROW LEVEL SECURITY`;
- ownership policy on SELECT/INSERT/UPDATE/DELETE;
- explicit grants consistent with intended roles.

Application code must not treat client-side filtering as authorization.

## Service role

`SUPABASE_SERVICE_ROLE_KEY`:
- server only;
- never in browser bundles;
- never in `NEXT_PUBLIC_*`;
- avoid unless necessary;
- never log.

## Storage

Buckets `documents` and `memories` are private.

Rules:
- user path begins with their auth UID;
- users may only operate on their own prefix;
- use signed/authenticated retrieval;
- validate file size/type;
- sanitize display filename;
- generate storage object name using UUID;
- do not trust MIME type alone for high-risk future processing.

Do not write directly to Supabase `storage` schema tables. Use Storage API.

## Sensitive application logs

Do not log:
- transaction descriptions if avoidable;
- health values;
- religious notes;
- document contents;
- signed URLs;
- access tokens;
- LLM context payloads.

Log IDs and error classes instead.

## AI

Default data minimization:
- send only selected scope;
- summarize structured records where possible;
- no binary documents/photos by default;
- no hidden background ingestion;
- display when AI is enabled;
- user confirmation before AI-proposed writes.

## Validation

All mutations validated server-side or at a trusted boundary using schemas.

Validate:
- enums;
- numeric ranges;
- dates;
- user ownership;
- file size/type;
- URL format where accepted.

## XSS / rendering

Treat all user notes as plain text unless a sanitized Markdown renderer is intentionally added.

Do not render arbitrary HTML from notes.

## CSRF/session

Use the currently supported Supabase SSR/Next.js auth pattern. Do not implement custom token storage in localStorage if the supported SSR flow avoids it.

## Data deletion

Provide:
- record deletion/archive;
- file deletion;
- full account-delete procedure.

For full account delete:
- remove or cascade application rows;
- remove user Storage objects;
- delete auth user through trusted server/admin flow;
- require explicit confirmation.

## Export

Allow JSON export so the user can retain data independently of LifeOS.

## Backups

Structured database backup does not automatically mean media/document objects are protected. Document a separate backup/export strategy for Storage.

## Security acceptance

Before production:
- test RLS for a second test user;
- verify private file URLs cannot be accessed unauthenticated;
- inspect built JS for service-role/AI secrets;
- test direct URL access to another user's record;
- test delete confirmation;
- test expired/invalid auth sessions.

## References for the implementer

Verify the current official documentation at implementation time:

- Supabase Auth
- Supabase Row Level Security
- Supabase Storage access control
- Supabase API security
- Vercel environment variables
- Vercel cron security if Vercel Cron is used
