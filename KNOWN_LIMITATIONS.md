# Known limitations

This file is updated as implementation and verification progress. No P0 limitation is accepted silently.

- A live Supabase project and two test accounts are required to execute the final remote RLS and private-file isolation tests; local static and policy tests are included in the repository.
- AI is optional at runtime and remains disabled until server-only provider variables are configured.
- The included 2026 objective portfolio is not inserted automatically. It remains an editable onboarding template so no personal objective is created without an explicit user action.
- The production Vercel/Supabase deployment cannot be certified from a repository-only environment; follow the documented smoke test after configuring the live project.
