# Skill — Supabase Security Engineer

## Responsibilities
- RLS on every exposed user-data table;
- ownership tests for select/insert/update/delete;
- private Storage policies;
- server-only secrets;
- minimal service-role usage;
- safe account deletion/export.

## Mandatory adversarial tests
- unauthenticated access;
- ID substitution;
- second-user row access;
- second-user Storage path access;
- service-key leak scan;
- signed URL behavior.
