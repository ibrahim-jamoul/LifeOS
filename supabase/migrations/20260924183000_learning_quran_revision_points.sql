create table if not exists public.quran_revision_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quran_item_id uuid null,
  surah_number smallint not null check (surah_number between 1 and 114),
  ayah_number integer not null check (ayah_number > 0),
  issue_type text not null default 'memorization' check (issue_type in ('hesitation','confusion','memorization','pronunciation','tajwid','other')),
  note text null,
  priority smallint not null default 1 check (priority between 1 and 3),
  status text not null default 'active' check (status in ('active','resolved','archived')),
  occurrence_count integer not null default 1 check (occurrence_count >= 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  next_review_at timestamptz null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quran_revision_points_item_owner_fkey
    foreign key (quran_item_id, user_id)
    references public.quran_items(id, user_id)
    on delete set null (quran_item_id)
);

create index if not exists quran_revision_points_due_idx on public.quran_revision_points(user_id, status, next_review_at);
create index if not exists quran_revision_points_ayah_idx on public.quran_revision_points(user_id, surah_number, ayah_number);
create index if not exists quran_revision_points_item_owner_idx on public.quran_revision_points(quran_item_id, user_id) where quran_item_id is not null;

alter table public.quran_revision_points enable row level security;

drop policy if exists "quran_revision_points_select_own" on public.quran_revision_points;
create policy "quran_revision_points_select_own" on public.quran_revision_points for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "quran_revision_points_insert_own" on public.quran_revision_points;
create policy "quran_revision_points_insert_own" on public.quran_revision_points for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "quran_revision_points_update_own" on public.quran_revision_points;
create policy "quran_revision_points_update_own" on public.quran_revision_points for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "quran_revision_points_delete_own" on public.quran_revision_points;
create policy "quran_revision_points_delete_own" on public.quran_revision_points for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists set_quran_revision_points_updated_at on public.quran_revision_points;
create trigger set_quran_revision_points_updated_at before update on public.quran_revision_points for each row execute function public.set_updated_at();

revoke all privileges on table public.quran_revision_points from anon;
revoke all privileges on table public.quran_revision_points from authenticated;
grant select, insert, update, delete on table public.quran_revision_points to authenticated;
grant all on table public.quran_revision_points to service_role;
