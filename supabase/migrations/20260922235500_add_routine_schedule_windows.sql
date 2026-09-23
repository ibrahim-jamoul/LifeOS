-- Add explicit multi-day execution windows to the existing routine engines.
-- This is additive: existing single-day schedules remain valid and no rows are deleted.

alter table public.habits
  add column if not exists schedule_window_weekdays smallint[],
  add column if not exists schedule_month_weeks smallint[];

alter table public.religion_routines
  add column if not exists schedule_window_weekdays smallint[],
  add column if not exists schedule_month_weeks smallint[];

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'habits_schedule_window_weekdays_ck') then
    alter table public.habits add constraint habits_schedule_window_weekdays_ck check (
      schedule_window_weekdays is null
      or (
        cardinality(schedule_window_weekdays) between 1 and 7
        and schedule_window_weekdays <@ array[1,2,3,4,5,6,7]::smallint[]
      )
    );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'habits_schedule_month_weeks_ck') then
    alter table public.habits add constraint habits_schedule_month_weeks_ck check (
      schedule_month_weeks is null
      or (
        cardinality(schedule_month_weeks) between 1 and 5
        and schedule_month_weeks <@ array[1,2,3,4,5]::smallint[]
      )
    );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'religion_routines_schedule_window_weekdays_ck') then
    alter table public.religion_routines add constraint religion_routines_schedule_window_weekdays_ck check (
      schedule_window_weekdays is null
      or (
        cardinality(schedule_window_weekdays) between 1 and 7
        and schedule_window_weekdays <@ array[1,2,3,4,5,6,7]::smallint[]
      )
    );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'religion_routines_schedule_month_weeks_ck') then
    alter table public.religion_routines add constraint religion_routines_schedule_month_weeks_ck check (
      schedule_month_weeks is null
      or (
        cardinality(schedule_month_weeks) between 1 and 5
        and schedule_month_weeks <@ array[1,2,3,4,5]::smallint[]
      )
    );
  end if;
end $$;

comment on column public.habits.schedule_window_weekdays is
  'ISO weekdays (1=Monday..7=Sunday) forming one multi-day execution window for a single logical occurrence.';
comment on column public.habits.schedule_month_weeks is
  'Optional ordinal weekday/window occurrences within the month (1..5).';
comment on column public.religion_routines.schedule_window_weekdays is
  'ISO weekdays (1=Monday..7=Sunday) forming one multi-day execution window for a single logical occurrence.';
comment on column public.religion_routines.schedule_month_weeks is
  'Optional ordinal weekday/window occurrences within the month (1..5).';

-- Personal reference-model backfill. The names below come from the audited
-- LifeOS reference dataset; no free-text time_context parsing is performed at runtime.
update public.religion_routines
set
  schedule_window_weekdays = array[6,7]::smallint[],
  schedule_month_weeks = array[1,2,3]::smallint[]
where name in (
  'Travail approfondi d''une nouvelle page de Coran',
  'Tafsir de la page de Coran'
)
  and target_frequency = 'weekly'
  and schedule_weekday is null
  and schedule_window_weekdays is null;

update public.religion_routines
set
  schedule_window_weekdays = array[6,7]::smallint[],
  schedule_month_weeks = array[4,5]::smallint[]
where name = 'Révision mensuelle des trois pages de Coran'
  and target_frequency = 'monthly'
  and schedule_day_of_month is null
  and schedule_window_weekdays is null;
