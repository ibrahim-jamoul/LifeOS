-- Server-only jobs and administrative imports use the service role. The
-- initial migration intentionally granted Data API access only to signed-in
-- users, so explicitly restore the conventional Supabase service-role access
-- without changing anon/authenticated permissions or RLS policies.
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
