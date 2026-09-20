# Supabase Setup

## 1. Create project
Create a Supabase project and save:
- project URL;
- publishable/anon key according to current SDK;
- service role key only if required for trusted server jobs.

## 2. Run migrations
Apply in this exact order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_security_integrity.sql`

Prefer Supabase CLI migrations for reproducibility.

## 3. Auth
Enable email/password.
For production, configure the correct site URL and redirect URLs.

## 4. Storage
Create private buckets (Public bucket must be OFF):
- `documents`
- `memories`

Suggested per-object limits are 25 MB for `documents` and 50 MB for `memories`. The application also validates MIME types and memory batch size. Owner-path RLS policies are applied by `001_initial_schema.sql`; verify them with two test users after the buckets exist.

## 5. First login
The app should call:
`select public.initialize_lifeos();`
under authenticated user context.

It must be safe to call more than once.

## 6. Cron
Cron is optional for basic correctness.
If used, schedule a daily notification generation job.
Dashboard due/overdue queries must work without cron.

## 7. Test RLS
At minimum verify:
- anon denied;
- authenticated owner allowed;
- authenticated non-owner denied;
for select/insert/update/delete.

Set the `SUPABASE_TEST_USER_A_*` and `SUPABASE_TEST_USER_B_*` variables described in the root README, then run `npm test` for the executable isolation suite. Never point those credentials at personal production accounts.

## 8. Trusted cron key

The ordinary application uses only the publishable key. A current Supabase secret key is required only by `/api/cron/alerts`, which iterates through profiles. Store it as `SUPABASE_SECRET_KEY` in Vercel; never expose it to the browser.
