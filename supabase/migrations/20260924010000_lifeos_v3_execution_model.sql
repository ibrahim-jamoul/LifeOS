-- LifeOS V3 execution model. Additive only; existing rows are preserved.

alter table public.tasks
  add column if not exists goal_id uuid,
  add column if not exists planned_time time,
  add column if not exists recurrence_rule text,
  add column if not exists recurrence_until date;

create unique index if not exists ux_tasks_owned_id on public.tasks(id, user_id);

alter table public.tasks
  drop constraint if exists tasks_goal_owner_fkey,
  add constraint tasks_goal_owner_fkey
    foreign key (goal_id, user_id)
    references public.goals(id, user_id)
    on delete set null (goal_id);

create index if not exists idx_tasks_user_goal_active
  on public.tasks(user_id, goal_id)
  where status not in ('done', 'cancelled');

create index if not exists idx_tasks_goal_owner_fk
  on public.tasks(goal_id, user_id);

create index if not exists idx_tasks_user_planning_active
  on public.tasks(user_id, planned_on, planned_time)
  where status not in ('done', 'cancelled');

create table if not exists public.task_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  occurrence_on date not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, task_id, occurrence_on),
  constraint task_occurrences_task_owner_fkey
    foreign key (task_id, user_id)
    references public.tasks(id, user_id)
    on delete cascade
);

create index if not exists idx_task_occurrences_user_date on public.task_occurrences(user_id, occurrence_on);
create index if not exists idx_task_occurrences_user_task on public.task_occurrences(user_id, task_id, occurrence_on);
create index if not exists idx_task_occurrences_task_owner_fk on public.task_occurrences(task_id, user_id);

alter table public.task_occurrences enable row level security;

drop policy if exists "task_occurrences_select_own" on public.task_occurrences;
create policy "task_occurrences_select_own" on public.task_occurrences
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "task_occurrences_insert_own" on public.task_occurrences;
create policy "task_occurrences_insert_own" on public.task_occurrences
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "task_occurrences_update_own" on public.task_occurrences;
create policy "task_occurrences_update_own" on public.task_occurrences
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "task_occurrences_delete_own" on public.task_occurrences;
create policy "task_occurrences_delete_own" on public.task_occurrences
for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.task_occurrences to authenticated;

alter table public.profiles
  add column if not exists day_start_time time,
  add column if not exists day_end_time time,
  add column if not exists onboarding_completed_at timestamptz;

alter table public.goals
  add column if not exists progress_mode text,
  add column if not exists review_cadence text;
