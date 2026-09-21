-- Additive operational model for the PRO / PERSO / RELIGION reference import.
-- The nine existing navigation domains remain unchanged.

-- ---------------------------------------------------------------------------
-- Cross-cutting classification and missing strategic fields
-- ---------------------------------------------------------------------------

alter table public.goals
  alter column definition_of_done drop not null,
  add column if not exists life_area text,
  add column if not exists target_value numeric,
  add column if not exists target_unit text,
  add column if not exists next_action text,
  add column if not exists next_review_date date,
  add column if not exists configuration_status text;

alter table public.goals
  drop constraint if exists goals_life_area_ck,
  add constraint goals_life_area_ck
    check (life_area is null or life_area in ('pro', 'perso', 'religion')),
  drop constraint if exists goals_configuration_status_ck,
  add constraint goals_configuration_status_ck
    check (configuration_status is null or configuration_status in ('ready', 'to_complete', 'to_validate', 'to_configure'));

alter table public.projects
  add column if not exists life_area text,
  add column if not exists project_type text,
  add column if not exists target_window text,
  add column if not exists configuration_status text;

alter table public.projects
  drop constraint if exists projects_life_area_ck,
  add constraint projects_life_area_ck
    check (life_area is null or life_area in ('pro', 'perso', 'religion')),
  drop constraint if exists projects_project_type_ck,
  add constraint projects_project_type_ck
    check (project_type is null or project_type in ('project', 'certification', 'portfolio', 'business', 'personal', 'other')),
  drop constraint if exists projects_configuration_status_ck,
  add constraint projects_configuration_status_ck
    check (configuration_status is null or configuration_status in ('ready', 'to_complete', 'to_validate', 'to_configure'));

alter table public.tasks
  add column if not exists life_area text,
  add column if not exists due_on date,
  add column if not exists configuration_status text;

alter table public.tasks
  drop constraint if exists tasks_life_area_ck,
  add constraint tasks_life_area_ck
    check (life_area is null or life_area in ('pro', 'perso', 'religion')),
  drop constraint if exists tasks_due_precision_ck,
  add constraint tasks_due_precision_ck
    check (due_on is null or due_at is null),
  drop constraint if exists tasks_configuration_status_ck,
  add constraint tasks_configuration_status_ck
    check (configuration_status is null or configuration_status in ('ready', 'to_complete', 'to_validate', 'to_configure'));

alter table public.kpis
  add column if not exists life_area text,
  add column if not exists notes text,
  add column if not exists configuration_status text;

alter table public.kpis
  drop constraint if exists kpis_life_area_ck,
  add constraint kpis_life_area_ck
    check (life_area is null or life_area in ('pro', 'perso', 'religion')),
  drop constraint if exists kpis_configuration_status_ck,
  add constraint kpis_configuration_status_ck
    check (configuration_status is null or configuration_status in ('ready', 'to_complete', 'to_validate', 'to_configure'));

alter table public.kpis
  alter column direction set default 'none',
  drop constraint if exists kpis_direction_check,
  add constraint kpis_direction_check
    check (direction in ('none', 'increase', 'decrease', 'maintain'));

alter table public.decisions
  add column if not exists life_area text,
  add column if not exists question text,
  add column if not exists rationale text,
  add column if not exists risks text,
  add column if not exists review_trigger text,
  add column if not exists configuration_status text;

alter table public.decisions
  alter column decision_date drop not null,
  alter column decision_date drop default;

alter table public.decisions
  drop constraint if exists decisions_life_area_ck,
  add constraint decisions_life_area_ck
    check (life_area is null or life_area in ('pro', 'perso', 'religion')),
  drop constraint if exists decisions_configuration_status_ck,
  add constraint decisions_configuration_status_ck
    check (configuration_status is null or configuration_status in ('ready', 'to_complete', 'to_validate', 'to_configure'));

-- ---------------------------------------------------------------------------
-- Existing routine engines, enriched rather than replaced
-- ---------------------------------------------------------------------------

alter table public.habits
  alter column target_count drop not null,
  add column if not exists life_area text,
  add column if not exists goal_id uuid,
  add column if not exists project_id uuid,
  add column if not exists kpi_id uuid,
  add column if not exists duration_minutes integer,
  add column if not exists target_unit text,
  add column if not exists schedule_weekday smallint,
  add column if not exists schedule_day_of_month smallint,
  add column if not exists time_context text,
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists status text not null default 'active',
  add column if not exists configuration_status text not null default 'to_complete',
  add column if not exists start_on date,
  add column if not exists end_on date,
  add column if not exists paused_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table public.habits
  drop constraint if exists habits_life_area_ck,
  add constraint habits_life_area_ck
    check (life_area is null or life_area in ('pro', 'perso', 'religion')),
  drop constraint if exists habits_frequency_ck,
  add constraint habits_frequency_ck
    check (frequency in ('daily', 'weekly', 'monthly', 'flexible', 'contextual')),
  drop constraint if exists habits_duration_minutes_ck,
  add constraint habits_duration_minutes_ck
    check (duration_minutes is null or duration_minutes >= 0),
  drop constraint if exists habits_schedule_weekday_ck,
  add constraint habits_schedule_weekday_ck
    check (schedule_weekday is null or schedule_weekday between 1 and 7),
  drop constraint if exists habits_schedule_day_of_month_ck,
  add constraint habits_schedule_day_of_month_ck
    check (schedule_day_of_month is null or schedule_day_of_month between 1 and 31),
  drop constraint if exists habits_date_order_ck,
  add constraint habits_date_order_ck
    check (start_on is null or end_on is null or start_on <= end_on),
  drop constraint if exists habits_status_ck,
  add constraint habits_status_ck
    check (status in ('active', 'paused', 'archived')),
  drop constraint if exists habits_configuration_status_ck,
  add constraint habits_configuration_status_ck
    check (configuration_status in ('ready', 'to_complete', 'to_validate', 'to_configure')),
  drop constraint if exists habits_goal_owner_fkey,
  add constraint habits_goal_owner_fkey
    foreign key (goal_id, user_id) references public.goals(id, user_id)
    on delete set null (goal_id),
  drop constraint if exists habits_project_owner_fkey,
  add constraint habits_project_owner_fkey
    foreign key (project_id, user_id) references public.projects(id, user_id)
    on delete set null (project_id),
  drop constraint if exists habits_kpi_owner_fkey,
  add constraint habits_kpi_owner_fkey
    foreign key (kpi_id, user_id) references public.kpis(id, user_id)
    on delete set null (kpi_id);

alter table public.religion_routines
  alter column target_count drop not null,
  add column if not exists goal_id uuid,
  add column if not exists project_id uuid,
  add column if not exists kpi_id uuid,
  add column if not exists duration_minutes integer,
  add column if not exists target_unit text,
  add column if not exists schedule_weekday smallint,
  add column if not exists schedule_day_of_month smallint,
  add column if not exists time_context text,
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists reminder_time time,
  add column if not exists status text not null default 'active',
  add column if not exists configuration_status text not null default 'to_complete',
  add column if not exists start_on date,
  add column if not exists end_on date,
  add column if not exists paused_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table public.religion_routines
  drop constraint if exists religion_routines_frequency_ck,
  add constraint religion_routines_frequency_ck
    check (target_frequency in ('daily', 'weekly', 'monthly', 'flexible', 'contextual')),
  drop constraint if exists religion_routines_duration_minutes_ck,
  add constraint religion_routines_duration_minutes_ck
    check (duration_minutes is null or duration_minutes >= 0),
  drop constraint if exists religion_routines_schedule_weekday_ck,
  add constraint religion_routines_schedule_weekday_ck
    check (schedule_weekday is null or schedule_weekday between 1 and 7),
  drop constraint if exists religion_routines_schedule_day_of_month_ck,
  add constraint religion_routines_schedule_day_of_month_ck
    check (schedule_day_of_month is null or schedule_day_of_month between 1 and 31),
  drop constraint if exists religion_routines_date_order_ck,
  add constraint religion_routines_date_order_ck
    check (start_on is null or end_on is null or start_on <= end_on),
  drop constraint if exists religion_routines_status_ck,
  add constraint religion_routines_status_ck
    check (status in ('active', 'paused', 'archived')),
  drop constraint if exists religion_routines_configuration_status_ck,
  add constraint religion_routines_configuration_status_ck
    check (configuration_status in ('ready', 'to_complete', 'to_validate', 'to_configure')),
  drop constraint if exists religion_routines_goal_owner_fkey,
  add constraint religion_routines_goal_owner_fkey
    foreign key (goal_id, user_id) references public.goals(id, user_id)
    on delete set null (goal_id),
  drop constraint if exists religion_routines_project_owner_fkey,
  add constraint religion_routines_project_owner_fkey
    foreign key (project_id, user_id) references public.projects(id, user_id)
    on delete set null (project_id),
  drop constraint if exists religion_routines_kpi_owner_fkey,
  add constraint religion_routines_kpi_owner_fkey
    foreign key (kpi_id, user_id) references public.kpis(id, user_id)
    on delete set null (kpi_id);

alter table public.religion_logs
  add column if not exists occurred_on date,
  add column if not exists count integer not null default 1;

update public.religion_logs as log
set occurred_on = (
  log.occurred_at at time zone coalesce(
    (select profile.timezone from public.profiles as profile where profile.id = log.user_id),
    'UTC'
  )
)::date
where occurred_on is null;

alter table public.religion_logs
  alter column occurred_on set default current_date,
  alter column occurred_on set not null,
  drop constraint if exists religion_logs_count_ck,
  add constraint religion_logs_count_ck check (count >= 0);

do $$
begin
  if exists (
    select 1
    from public.religion_logs
    group by user_id, routine_id, occurred_on
    having count(*) > 1
  ) then
    raise exception 'Duplicate religion routine logs must be resolved before daily uniqueness can be enabled.';
  end if;
end
$$;

create unique index if not exists ux_religion_logs_routine_day
  on public.religion_logs(user_id, routine_id, occurred_on);

-- ---------------------------------------------------------------------------
-- Configurable reminders without fabricated times
-- ---------------------------------------------------------------------------

alter table public.reminders
  alter column remind_at drop not null,
  add column if not exists life_area text,
  add column if not exists remind_on date,
  add column if not exists reminder_time time,
  add column if not exists configuration_status text not null default 'to_complete',
  add column if not exists last_triggered_at timestamptz;

alter table public.reminders
  drop constraint if exists reminders_life_area_ck,
  add constraint reminders_life_area_ck
    check (life_area is null or life_area in ('pro', 'perso', 'religion')),
  drop constraint if exists reminders_configuration_status_ck,
  add constraint reminders_configuration_status_ck
    check (configuration_status in ('ready', 'to_complete', 'to_validate', 'to_configure')),
  drop constraint if exists reminders_schedule_ck,
  add constraint reminders_schedule_ck
    check (
      (remind_at is not null and remind_on is null and reminder_time is null)
      or (remind_at is null and remind_on is not null)
      or (
        remind_at is null
        and remind_on is null
        and reminder_time is null
        and (configuration_status = 'to_configure' or active = false)
      )
    );

-- ---------------------------------------------------------------------------
-- Named resources linked to the existing strategic model
-- ---------------------------------------------------------------------------

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  life_area text,
  source_key text,
  title text not null,
  resource_type text not null default 'other',
  status text not null default 'planned',
  url text,
  provider text,
  goal_id uuid,
  project_id uuid,
  study_topic_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint resources_life_area_ck
    check (life_area is null or life_area in ('pro', 'perso', 'religion')),
  constraint resources_type_ck
    check (resource_type in ('certification', 'book', 'course', 'tool', 'article', 'website', 'document', 'other')),
  constraint resources_status_ck
    check (status in ('planned', 'active', 'completed', 'paused', 'archived')),
  constraint resources_goal_owner_fkey
    foreign key (goal_id, user_id) references public.goals(id, user_id)
    on delete set null (goal_id),
  constraint resources_project_owner_fkey
    foreign key (project_id, user_id) references public.projects(id, user_id)
    on delete set null (project_id),
  constraint resources_topic_owner_fkey
    foreign key (study_topic_id, user_id) references public.study_topics(id, user_id)
    on delete set null (study_topic_id),
  unique(user_id, source_key)
);

create index if not exists idx_goals_user_life_area_status
  on public.goals(user_id, life_area, status);
create index if not exists idx_projects_user_life_area_status
  on public.projects(user_id, life_area, status);
create index if not exists idx_tasks_user_life_area_status_due_on
  on public.tasks(user_id, life_area, status, due_on);
create index if not exists idx_kpis_user_life_area_active
  on public.kpis(user_id, life_area, active);
create index if not exists idx_decisions_user_life_area_review
  on public.decisions(user_id, life_area, review_date);
create index if not exists idx_habits_user_schedule
  on public.habits(user_id, active, frequency, schedule_weekday, schedule_day_of_month);
create index if not exists idx_habits_user_goal
  on public.habits(user_id, goal_id);
create index if not exists idx_habits_user_project
  on public.habits(user_id, project_id);
create index if not exists idx_habits_user_kpi
  on public.habits(user_id, kpi_id);
create index if not exists idx_religion_routines_user_schedule
  on public.religion_routines(user_id, active, target_frequency, schedule_weekday, schedule_day_of_month);
create index if not exists idx_religion_routines_user_goal
  on public.religion_routines(user_id, goal_id);
create index if not exists idx_religion_routines_user_project
  on public.religion_routines(user_id, project_id);
create index if not exists idx_religion_routines_user_kpi
  on public.religion_routines(user_id, kpi_id);
create index if not exists idx_reminders_user_schedule
  on public.reminders(user_id, active, remind_on, remind_at);
create index if not exists idx_resources_user_life_area_status
  on public.resources(user_id, life_area, status);
create index if not exists idx_resources_user_goal
  on public.resources(user_id, goal_id);
create index if not exists idx_resources_user_project
  on public.resources(user_id, project_id);
create index if not exists idx_resources_user_topic
  on public.resources(user_id, study_topic_id);

drop trigger if exists set_resources_updated_at on public.resources;
create trigger set_resources_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

alter table public.resources enable row level security;

drop policy if exists "resources_select_own" on public.resources;
create policy "resources_select_own"
on public.resources for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "resources_insert_own" on public.resources;
create policy "resources_insert_own"
on public.resources for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "resources_update_own" on public.resources;
create policy "resources_update_own"
on public.resources for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "resources_delete_own" on public.resources;
create policy "resources_delete_own"
on public.resources for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all privileges on public.resources from public, anon;
grant select, insert, update, delete on public.resources to authenticated;
grant select, insert, update, delete on public.resources to service_role;

-- Existing strategic rows remain unclassified until the audited importer fills
-- them. New rows created after this migration start ready, while unknown
-- priorities stay explicitly unset.
alter table public.goals
  alter column priority set default 'unset',
  alter column configuration_status set default 'ready';
alter table public.projects
  alter column priority set default 'unset',
  alter column project_type set default 'project',
  alter column configuration_status set default 'ready';
alter table public.tasks
  alter column priority set default 'unset',
  alter column configuration_status set default 'ready';
alter table public.kpis
  alter column configuration_status set default 'ready';
alter table public.decisions
  alter column configuration_status set default 'ready';
alter table public.habits
  alter column configuration_status set default 'ready';
alter table public.religion_routines
  alter column configuration_status set default 'ready';
alter table public.reminders
  alter column configuration_status set default 'ready';

comment on table public.resources is
  'User-owned named resources linked to goals, projects, or study topics.';
