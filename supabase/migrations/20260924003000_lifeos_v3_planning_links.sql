-- LifeOS V3: minimal additive schema changes for operational planning.
-- No destructive changes; existing rows and relationships remain valid.

alter table public.tasks
  add column if not exists goal_id uuid,
  add column if not exists recurrence_rule text,
  add column if not exists recurrence_until date;

alter table public.tasks
  drop constraint if exists tasks_goal_owner_fkey,
  add constraint tasks_goal_owner_fkey
    foreign key (goal_id, user_id) references public.goals(id, user_id)
    on delete set null (goal_id);

create index if not exists idx_tasks_user_goal_active
  on public.tasks(user_id, goal_id)
  where status not in ('done', 'cancelled');

alter table public.profiles
  add column if not exists day_start_time time,
  add column if not exists day_end_time time,
  add column if not exists onboarding_completed_at timestamptz;

alter table public.goals
  add column if not exists progress_mode text,
  add column if not exists review_cadence text;

comment on column public.tasks.goal_id is
  'Optional direct parent goal for a mission. Project linkage remains available and is not replaced.';
comment on column public.tasks.recurrence_rule is
  'Optional compact recurrence descriptor for future task-level recurrence support; recurring routines should continue using habits/religion_routines where appropriate.';
