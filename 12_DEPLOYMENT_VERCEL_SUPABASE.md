# Deployment — Vercel + Supabase

## Supabase
1. Create project.
2. Apply migration.
3. Create private `documents` and `memories` buckets.
4. Confirm Storage policies.
5. Configure Auth site URL and redirect URLs for local, preview and production.
6. Test with two users.

## Vercel
1. Push code to Git provider.
2. Import repository into Vercel.
3. Configure environment variables for Production and Preview as appropriate.
4. Never expose service-role or AI secrets using a public/client prefix.
5. Deploy.
6. Update Supabase Auth redirect URLs to include production domain.
7. Run smoke tests.

## Cron
Prefer no cron dependency for basic dashboard correctness.

If using Vercel Cron:
- protect the endpoint using `CRON_SECRET`;
- remember cron execution behavior/limits vary by Vercel plan;
- treat the route as server-only infrastructure.

If using Supabase Cron:
- schedule the notification materialization function/Edge Function;
- monitor job run history.

## Production smoke tests
- login;
- create objective/project/task;
- refresh and confirm persistence;
- upload private document;
- open signed/authenticated file;
- logout and confirm file/app data inaccessible;
- create second test user and verify isolation;
- export JSON.
