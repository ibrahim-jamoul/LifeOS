-- Separate the day on which an action should be worked from its real deadline.
-- This is additive: existing due_on/due_at values keep their current meaning.
alter table public.tasks
  add column if not exists planned_on date;

comment on column public.tasks.planned_on is
  'Operational work date chosen by LifeOS/user. Does not replace due_on/due_at deadlines.';

create index if not exists idx_tasks_user_planned_on_active
  on public.tasks(user_id, planned_on)
  where status not in ('done', 'cancelled');
