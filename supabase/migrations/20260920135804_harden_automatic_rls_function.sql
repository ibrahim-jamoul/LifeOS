-- The project-level "Automatic RLS" option installs this event-trigger
-- function in public with PostgreSQL's default EXECUTE grant to PUBLIC.
-- The event trigger itself continues to run as its owner; API roles do not
-- need to invoke the function directly.
revoke execute on function public.rls_auto_enable()
  from public, anon, authenticated;
