alter table public.task_occurrences
  add column if not exists rescheduled_on date;

comment on column public.task_occurrences.rescheduled_on is
  'Replacement execution date for this single recurrence occurrence. occurrence_on remains the stable series occurrence identity.';

create index if not exists task_occurrences_user_rescheduled_idx
  on public.task_occurrences (user_id, rescheduled_on)
  where rescheduled_on is not null;
