-- LifeOS initial schema
-- PostgreSQL / Supabase
-- Review against current Supabase docs before production migration.

create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type public.goal_status as enum ('draft','active','at_risk','achieved','paused','cancelled','archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.project_status as enum ('backlog','focus','active','blocked','paused','done','cancelled','archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.task_status as enum ('todo','doing','blocked','done','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.priority_level as enum ('low','medium','high','critical');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.alert_severity as enum ('info','warning','critical');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.finance_tx_type as enum ('income','expense','transfer');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.quran_activity as enum ('recitation','memorization','revision');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid generated always as (id) stored,
  display_name text,
  timezone text not null default 'Europe/Paris',
  default_currency text not null default 'EUR',
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6),
  weekly_review_weekday smallint not null default 0 check (weekly_review_weekday between 0 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.life_vision (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  one_year text,
  three_year text,
  five_year text,
  quarter_focus text,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  position smallint not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, slug)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_id uuid references public.domains(id) on delete set null,
  title text not null,
  desired_outcome text,
  definition_of_done text not null default '',
  status public.goal_status not null default 'draft',
  priority public.priority_level not null default 'medium',
  horizon text,
  start_date date,
  target_date date,
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  reason text,
  risk_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.kpis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete cascade,
  name text not null,
  unit text not null default '',
  target_type text not null default 'none' check (target_type in ('min','max','exact','range','none')),
  target_value numeric,
  target_min numeric,
  target_max numeric,
  cadence text not null default 'weekly' check (cadence in ('daily','weekly','monthly','quarterly','adhoc')),
  direction text not null default 'increase' check (direction in ('increase','decrease','maintain')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kpi_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kpi_id uuid not null references public.kpis(id) on delete cascade,
  measured_at timestamptz not null default now(),
  value numeric not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_id uuid references public.domains(id) on delete set null,
  title text not null,
  summary text,
  status public.project_status not null default 'backlog',
  priority public.priority_level not null default 'medium',
  target_date date,
  next_milestone text,
  next_action text,
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  impact smallint check (impact between 1 and 5),
  urgency smallint check (urgency between 1 and 5),
  confidence smallint check (confidence between 1 and 5),
  effort smallint check (effort between 1 and 5),
  budget_planned numeric(14,2),
  budget_actual numeric(14,2),
  blocker_note text,
  last_activity_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.goal_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, goal_id, project_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  status public.task_status not null default 'todo',
  priority public.priority_level not null default 'medium',
  due_at timestamptz,
  estimate_minutes integer check (estimate_minutes is null or estimate_minutes >= 0),
  actual_minutes integer check (actual_minutes is null or actual_minutes >= 0),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text,
  source_id uuid,
  title text not null,
  remind_at timestamptz not null,
  recurrence text not null default 'none' check (recurrence in ('none','daily','weekly','monthly')),
  timezone text not null default 'Europe/Paris',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text,
  source_id uuid,
  alert_code text not null,
  dedupe_key text not null,
  title text not null,
  body text,
  severity public.alert_severity not null default 'info',
  due_at timestamptz,
  read_at timestamptz,
  dismissed_at timestamptz,
  snoozed_until timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, dedupe_key)
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  decision_date date not null default current_date,
  context text,
  options_considered text,
  selected_option text,
  assumptions text,
  expected_outcome text,
  review_date date,
  actual_outcome text,
  lesson text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  wins text,
  misses text,
  causes text,
  risks text,
  pause_or_stop text,
  next_week_top3 text,
  notes text,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, week_start)
);

create table if not exists public.study_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_slug text not null check (domain_slug in ('religion','arabic','quran')),
  title text not null,
  category text,
  resource text,
  status text not null default 'active' check (status in ('planned','active','completed','paused','archived')),
  target_date date,
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references public.study_topics(id) on delete set null,
  domain_slug text not null check (domain_slug in ('religion','arabic','quran')),
  occurred_at timestamptz not null default now(),
  duration_minutes integer not null check (duration_minutes >= 0),
  activity_type text,
  resource text,
  summary text,
  takeaway text,
  created_at timestamptz not null default now()
);

create table if not exists public.religion_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_frequency text not null default 'weekly',
  target_count integer not null default 1 check (target_count > 0),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.religion_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null references public.religion_routines(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.arabic_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  self_assessed_level text,
  weekly_target_minutes integer not null default 0 check (weekly_target_minutes >= 0),
  current_focus text,
  vocabulary_estimate integer check (vocabulary_estimate is null or vocabulary_estimate >= 0),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.arabic_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  duration_minutes integer not null check (duration_minutes >= 0),
  skill text not null check (skill in ('vocabulary','grammar','reading','listening','speaking','writing','mixed')),
  resource text,
  new_words integer check (new_words is null or new_words >= 0),
  reviewed_words integer check (reviewed_words is null or reviewed_words >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.quran_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  surah_number smallint not null check (surah_number between 1 and 114),
  surah_name text,
  start_ayah integer check (start_ayah is null or start_ayah > 0),
  end_ayah integer check (end_ayah is null or end_ayah > 0),
  activity public.quran_activity not null,
  status text not null default 'active' check (status in ('planned','active','completed','paused')),
  confidence smallint check (confidence between 1 and 5),
  next_revision_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quran_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quran_item_id uuid references public.quran_items(id) on delete set null,
  occurred_at timestamptz not null default now(),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  activity public.quran_activity not null,
  confidence smallint check (confidence between 1 and 5),
  outcome text,
  next_revision_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  account_type text not null default 'cash',
  institution text,
  currency text not null default 'EUR',
  current_balance numeric(16,2) not null default 0,
  include_in_net_worth boolean not null default true,
  is_liability boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.financial_accounts(id) on delete cascade,
  occurred_on date not null default current_date,
  amount numeric(16,2) not null,
  tx_type public.finance_tx_type not null,
  category text,
  description text,
  transfer_group_id uuid,
  currency text not null default 'EUR',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  category text not null,
  target_amount numeric(16,2) not null check (target_amount >= 0),
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  unique(user_id, month, category, currency)
);

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(16,2) not null,
  current_amount numeric(16,2) not null default 0,
  currency text not null default 'EUR',
  target_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null default current_date,
  assets numeric(16,2) not null,
  liabilities numeric(16,2) not null default 0,
  currency text not null default 'EUR',
  note text,
  created_at timestamptz not null default now(),
  unique(user_id, snapshot_date, currency)
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  frequency text not null default 'daily',
  target_count integer not null default 1 check (target_count > 0),
  active boolean not null default true,
  reminder_time time,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  occurred_on date not null default current_date,
  count integer not null default 1 check (count >= 0),
  note text,
  created_at timestamptz not null default now(),
  unique(user_id, habit_id, occurred_on)
);

create table if not exists public.health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  unit text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.health_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_id uuid not null references public.health_metrics(id) on delete cascade,
  measured_at timestamptz not null default now(),
  value numeric not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  activity text not null,
  duration_minutes integer not null check (duration_minutes >= 0),
  intensity text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'other',
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  file_size_bytes bigint,
  issuer text,
  issued_on date,
  expires_on date,
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  start_date date,
  end_date date,
  location_text text,
  description text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memory_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_id uuid not null references public.memories(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  file_size_bytes bigint,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  scope text not null default 'goals',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid not null references public.ai_threads(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  summary text,
  created_at timestamptz not null default now()
);

-- Updated-at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_life_vision_updated_at on public.life_vision;
create trigger set_life_vision_updated_at
before update on public.life_vision
for each row execute function public.set_updated_at();

drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

drop trigger if exists set_kpis_updated_at on public.kpis;
create trigger set_kpis_updated_at
before update on public.kpis
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_decisions_updated_at on public.decisions;
create trigger set_decisions_updated_at
before update on public.decisions
for each row execute function public.set_updated_at();

drop trigger if exists set_study_topics_updated_at on public.study_topics;
create trigger set_study_topics_updated_at
before update on public.study_topics
for each row execute function public.set_updated_at();

drop trigger if exists set_arabic_profiles_updated_at on public.arabic_profiles;
create trigger set_arabic_profiles_updated_at
before update on public.arabic_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_quran_items_updated_at on public.quran_items;
create trigger set_quran_items_updated_at
before update on public.quran_items
for each row execute function public.set_updated_at();

drop trigger if exists set_financial_accounts_updated_at on public.financial_accounts;
create trigger set_financial_accounts_updated_at
before update on public.financial_accounts
for each row execute function public.set_updated_at();

drop trigger if exists set_financial_goals_updated_at on public.financial_goals;
create trigger set_financial_goals_updated_at
before update on public.financial_goals
for each row execute function public.set_updated_at();

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

drop trigger if exists set_memories_updated_at on public.memories;
create trigger set_memories_updated_at
before update on public.memories
for each row execute function public.set_updated_at();

drop trigger if exists set_ai_threads_updated_at on public.ai_threads;
create trigger set_ai_threads_updated_at
before update on public.ai_threads
for each row execute function public.set_updated_at();


-- Profile bootstrap from auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Initialize 9 domains for the authenticated user.
create or replace function public.initialize_lifeos()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Authentication required';
  end if;

  insert into public.profiles (id) values (uid) on conflict (id) do nothing;

  insert into public.domains (user_id, slug, name, position, description) values
    (uid,'religion','Religion',1,'Religious learning, routines and reflections'),
    (uid,'arabic','Arabic',2,'Arabic language learning and progress'),
    (uid,'quran','Quran',3,'Recitation, memorization and revision'),
    (uid,'goals','Goals, KPIs & Decisions',4,'Objectives, projects, tasks, KPIs, reviews and decisions'),
    (uid,'assistant','Personal AI Assistant',5,'Scoped AI assistance over LifeOS data'),
    (uid,'finances','Finances',6,'Accounts, transactions, budgets and financial goals'),
    (uid,'health','Health, Sport & Habits',7,'Habits, workouts and health metrics'),
    (uid,'documents','Personal Documents',8,'Private document vault and expiry tracking'),
    (uid,'memories','Photos & Memories',9,'Private timeline of memories and media')
  on conflict (user_id, slug) do nothing;

  insert into public.life_vision (user_id) values (uid)
  on conflict (user_id) do nothing;

  insert into public.arabic_profiles (user_id) values (uid)
  on conflict (user_id) do nothing;
end;
$$;

-- Useful indexes
create index if not exists idx_life_vision_user_id on public.life_vision(user_id);
create index if not exists idx_domains_user_id on public.domains(user_id);
create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_kpis_user_id on public.kpis(user_id);
create index if not exists idx_kpi_entries_user_id on public.kpi_entries(user_id);
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_goal_projects_user_id on public.goal_projects(user_id);
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_reminders_user_id on public.reminders(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_decisions_user_id on public.decisions(user_id);
create index if not exists idx_weekly_reviews_user_id on public.weekly_reviews(user_id);
create index if not exists idx_study_topics_user_id on public.study_topics(user_id);
create index if not exists idx_study_sessions_user_id on public.study_sessions(user_id);
create index if not exists idx_religion_routines_user_id on public.religion_routines(user_id);
create index if not exists idx_religion_logs_user_id on public.religion_logs(user_id);
create index if not exists idx_arabic_profiles_user_id on public.arabic_profiles(user_id);
create index if not exists idx_arabic_sessions_user_id on public.arabic_sessions(user_id);
create index if not exists idx_quran_items_user_id on public.quran_items(user_id);
create index if not exists idx_quran_sessions_user_id on public.quran_sessions(user_id);
create index if not exists idx_financial_accounts_user_id on public.financial_accounts(user_id);
create index if not exists idx_financial_transactions_user_id on public.financial_transactions(user_id);
create index if not exists idx_budget_items_user_id on public.budget_items(user_id);
create index if not exists idx_financial_goals_user_id on public.financial_goals(user_id);
create index if not exists idx_net_worth_snapshots_user_id on public.net_worth_snapshots(user_id);
create index if not exists idx_habits_user_id on public.habits(user_id);
create index if not exists idx_habit_logs_user_id on public.habit_logs(user_id);
create index if not exists idx_health_metrics_user_id on public.health_metrics(user_id);
create index if not exists idx_health_entries_user_id on public.health_entries(user_id);
create index if not exists idx_workouts_user_id on public.workouts(user_id);
create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_memories_user_id on public.memories(user_id);
create index if not exists idx_memory_assets_user_id on public.memory_assets(user_id);
create index if not exists idx_ai_threads_user_id on public.ai_threads(user_id);
create index if not exists idx_ai_messages_user_id on public.ai_messages(user_id);
create index if not exists idx_activity_log_user_id on public.activity_log(user_id);

create index if not exists idx_tasks_due_at on public.tasks(user_id, due_at) where status not in ('done','cancelled');
create index if not exists idx_goals_target_date on public.goals(user_id, target_date) where status in ('active','at_risk');
create index if not exists idx_projects_status on public.projects(user_id, status);
create index if not exists idx_notifications_unread on public.notifications(user_id, created_at desc) where read_at is null and dismissed_at is null;
create index if not exists idx_documents_expires on public.documents(user_id, expires_on) where expires_on is not null;
create index if not exists idx_quran_revision on public.quran_items(user_id, next_revision_at) where next_revision_at is not null;
create index if not exists idx_financial_transactions_date on public.financial_transactions(user_id, occurred_on desc);
create index if not exists idx_memories_date on public.memories(user_id, start_date desc);

-- RLS

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
for delete to authenticated
using (auth.uid() = user_id);

alter table public.life_vision enable row level security;

drop policy if exists "life_vision_select_own" on public.life_vision;
create policy "life_vision_select_own" on public.life_vision
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "life_vision_insert_own" on public.life_vision;
create policy "life_vision_insert_own" on public.life_vision
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "life_vision_update_own" on public.life_vision;
create policy "life_vision_update_own" on public.life_vision
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "life_vision_delete_own" on public.life_vision;
create policy "life_vision_delete_own" on public.life_vision
for delete to authenticated
using (auth.uid() = user_id);

alter table public.domains enable row level security;

drop policy if exists "domains_select_own" on public.domains;
create policy "domains_select_own" on public.domains
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "domains_insert_own" on public.domains;
create policy "domains_insert_own" on public.domains
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "domains_update_own" on public.domains;
create policy "domains_update_own" on public.domains
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "domains_delete_own" on public.domains;
create policy "domains_delete_own" on public.domains
for delete to authenticated
using (auth.uid() = user_id);

alter table public.goals enable row level security;

drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals
for delete to authenticated
using (auth.uid() = user_id);

alter table public.kpis enable row level security;

drop policy if exists "kpis_select_own" on public.kpis;
create policy "kpis_select_own" on public.kpis
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "kpis_insert_own" on public.kpis;
create policy "kpis_insert_own" on public.kpis
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "kpis_update_own" on public.kpis;
create policy "kpis_update_own" on public.kpis
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "kpis_delete_own" on public.kpis;
create policy "kpis_delete_own" on public.kpis
for delete to authenticated
using (auth.uid() = user_id);

alter table public.kpi_entries enable row level security;

drop policy if exists "kpi_entries_select_own" on public.kpi_entries;
create policy "kpi_entries_select_own" on public.kpi_entries
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "kpi_entries_insert_own" on public.kpi_entries;
create policy "kpi_entries_insert_own" on public.kpi_entries
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "kpi_entries_update_own" on public.kpi_entries;
create policy "kpi_entries_update_own" on public.kpi_entries
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "kpi_entries_delete_own" on public.kpi_entries;
create policy "kpi_entries_delete_own" on public.kpi_entries
for delete to authenticated
using (auth.uid() = user_id);

alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
for delete to authenticated
using (auth.uid() = user_id);

alter table public.goal_projects enable row level security;

drop policy if exists "goal_projects_select_own" on public.goal_projects;
create policy "goal_projects_select_own" on public.goal_projects
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "goal_projects_insert_own" on public.goal_projects;
create policy "goal_projects_insert_own" on public.goal_projects
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "goal_projects_update_own" on public.goal_projects;
create policy "goal_projects_update_own" on public.goal_projects
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "goal_projects_delete_own" on public.goal_projects;
create policy "goal_projects_delete_own" on public.goal_projects
for delete to authenticated
using (auth.uid() = user_id);

alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
for delete to authenticated
using (auth.uid() = user_id);

alter table public.reminders enable row level security;

drop policy if exists "reminders_select_own" on public.reminders;
create policy "reminders_select_own" on public.reminders
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "reminders_insert_own" on public.reminders;
create policy "reminders_insert_own" on public.reminders
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "reminders_update_own" on public.reminders;
create policy "reminders_update_own" on public.reminders
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "reminders_delete_own" on public.reminders;
create policy "reminders_delete_own" on public.reminders
for delete to authenticated
using (auth.uid() = user_id);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own" on public.notifications
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
for delete to authenticated
using (auth.uid() = user_id);

alter table public.decisions enable row level security;

drop policy if exists "decisions_select_own" on public.decisions;
create policy "decisions_select_own" on public.decisions
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "decisions_insert_own" on public.decisions;
create policy "decisions_insert_own" on public.decisions
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "decisions_update_own" on public.decisions;
create policy "decisions_update_own" on public.decisions
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "decisions_delete_own" on public.decisions;
create policy "decisions_delete_own" on public.decisions
for delete to authenticated
using (auth.uid() = user_id);

alter table public.weekly_reviews enable row level security;

drop policy if exists "weekly_reviews_select_own" on public.weekly_reviews;
create policy "weekly_reviews_select_own" on public.weekly_reviews
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "weekly_reviews_insert_own" on public.weekly_reviews;
create policy "weekly_reviews_insert_own" on public.weekly_reviews
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "weekly_reviews_update_own" on public.weekly_reviews;
create policy "weekly_reviews_update_own" on public.weekly_reviews
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "weekly_reviews_delete_own" on public.weekly_reviews;
create policy "weekly_reviews_delete_own" on public.weekly_reviews
for delete to authenticated
using (auth.uid() = user_id);

alter table public.study_topics enable row level security;

drop policy if exists "study_topics_select_own" on public.study_topics;
create policy "study_topics_select_own" on public.study_topics
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "study_topics_insert_own" on public.study_topics;
create policy "study_topics_insert_own" on public.study_topics
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "study_topics_update_own" on public.study_topics;
create policy "study_topics_update_own" on public.study_topics
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "study_topics_delete_own" on public.study_topics;
create policy "study_topics_delete_own" on public.study_topics
for delete to authenticated
using (auth.uid() = user_id);

alter table public.study_sessions enable row level security;

drop policy if exists "study_sessions_select_own" on public.study_sessions;
create policy "study_sessions_select_own" on public.study_sessions
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "study_sessions_insert_own" on public.study_sessions;
create policy "study_sessions_insert_own" on public.study_sessions
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "study_sessions_update_own" on public.study_sessions;
create policy "study_sessions_update_own" on public.study_sessions
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "study_sessions_delete_own" on public.study_sessions;
create policy "study_sessions_delete_own" on public.study_sessions
for delete to authenticated
using (auth.uid() = user_id);

alter table public.religion_routines enable row level security;

drop policy if exists "religion_routines_select_own" on public.religion_routines;
create policy "religion_routines_select_own" on public.religion_routines
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "religion_routines_insert_own" on public.religion_routines;
create policy "religion_routines_insert_own" on public.religion_routines
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "religion_routines_update_own" on public.religion_routines;
create policy "religion_routines_update_own" on public.religion_routines
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "religion_routines_delete_own" on public.religion_routines;
create policy "religion_routines_delete_own" on public.religion_routines
for delete to authenticated
using (auth.uid() = user_id);

alter table public.religion_logs enable row level security;

drop policy if exists "religion_logs_select_own" on public.religion_logs;
create policy "religion_logs_select_own" on public.religion_logs
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "religion_logs_insert_own" on public.religion_logs;
create policy "religion_logs_insert_own" on public.religion_logs
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "religion_logs_update_own" on public.religion_logs;
create policy "religion_logs_update_own" on public.religion_logs
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "religion_logs_delete_own" on public.religion_logs;
create policy "religion_logs_delete_own" on public.religion_logs
for delete to authenticated
using (auth.uid() = user_id);

alter table public.arabic_profiles enable row level security;

drop policy if exists "arabic_profiles_select_own" on public.arabic_profiles;
create policy "arabic_profiles_select_own" on public.arabic_profiles
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "arabic_profiles_insert_own" on public.arabic_profiles;
create policy "arabic_profiles_insert_own" on public.arabic_profiles
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "arabic_profiles_update_own" on public.arabic_profiles;
create policy "arabic_profiles_update_own" on public.arabic_profiles
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "arabic_profiles_delete_own" on public.arabic_profiles;
create policy "arabic_profiles_delete_own" on public.arabic_profiles
for delete to authenticated
using (auth.uid() = user_id);

alter table public.arabic_sessions enable row level security;

drop policy if exists "arabic_sessions_select_own" on public.arabic_sessions;
create policy "arabic_sessions_select_own" on public.arabic_sessions
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "arabic_sessions_insert_own" on public.arabic_sessions;
create policy "arabic_sessions_insert_own" on public.arabic_sessions
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "arabic_sessions_update_own" on public.arabic_sessions;
create policy "arabic_sessions_update_own" on public.arabic_sessions
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "arabic_sessions_delete_own" on public.arabic_sessions;
create policy "arabic_sessions_delete_own" on public.arabic_sessions
for delete to authenticated
using (auth.uid() = user_id);

alter table public.quran_items enable row level security;

drop policy if exists "quran_items_select_own" on public.quran_items;
create policy "quran_items_select_own" on public.quran_items
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "quran_items_insert_own" on public.quran_items;
create policy "quran_items_insert_own" on public.quran_items
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "quran_items_update_own" on public.quran_items;
create policy "quran_items_update_own" on public.quran_items
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "quran_items_delete_own" on public.quran_items;
create policy "quran_items_delete_own" on public.quran_items
for delete to authenticated
using (auth.uid() = user_id);

alter table public.quran_sessions enable row level security;

drop policy if exists "quran_sessions_select_own" on public.quran_sessions;
create policy "quran_sessions_select_own" on public.quran_sessions
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "quran_sessions_insert_own" on public.quran_sessions;
create policy "quran_sessions_insert_own" on public.quran_sessions
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "quran_sessions_update_own" on public.quran_sessions;
create policy "quran_sessions_update_own" on public.quran_sessions
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "quran_sessions_delete_own" on public.quran_sessions;
create policy "quran_sessions_delete_own" on public.quran_sessions
for delete to authenticated
using (auth.uid() = user_id);

alter table public.financial_accounts enable row level security;

drop policy if exists "financial_accounts_select_own" on public.financial_accounts;
create policy "financial_accounts_select_own" on public.financial_accounts
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "financial_accounts_insert_own" on public.financial_accounts;
create policy "financial_accounts_insert_own" on public.financial_accounts
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "financial_accounts_update_own" on public.financial_accounts;
create policy "financial_accounts_update_own" on public.financial_accounts
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "financial_accounts_delete_own" on public.financial_accounts;
create policy "financial_accounts_delete_own" on public.financial_accounts
for delete to authenticated
using (auth.uid() = user_id);

alter table public.financial_transactions enable row level security;

drop policy if exists "financial_transactions_select_own" on public.financial_transactions;
create policy "financial_transactions_select_own" on public.financial_transactions
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "financial_transactions_insert_own" on public.financial_transactions;
create policy "financial_transactions_insert_own" on public.financial_transactions
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "financial_transactions_update_own" on public.financial_transactions;
create policy "financial_transactions_update_own" on public.financial_transactions
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "financial_transactions_delete_own" on public.financial_transactions;
create policy "financial_transactions_delete_own" on public.financial_transactions
for delete to authenticated
using (auth.uid() = user_id);

alter table public.budget_items enable row level security;

drop policy if exists "budget_items_select_own" on public.budget_items;
create policy "budget_items_select_own" on public.budget_items
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "budget_items_insert_own" on public.budget_items;
create policy "budget_items_insert_own" on public.budget_items
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "budget_items_update_own" on public.budget_items;
create policy "budget_items_update_own" on public.budget_items
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "budget_items_delete_own" on public.budget_items;
create policy "budget_items_delete_own" on public.budget_items
for delete to authenticated
using (auth.uid() = user_id);

alter table public.financial_goals enable row level security;

drop policy if exists "financial_goals_select_own" on public.financial_goals;
create policy "financial_goals_select_own" on public.financial_goals
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "financial_goals_insert_own" on public.financial_goals;
create policy "financial_goals_insert_own" on public.financial_goals
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "financial_goals_update_own" on public.financial_goals;
create policy "financial_goals_update_own" on public.financial_goals
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "financial_goals_delete_own" on public.financial_goals;
create policy "financial_goals_delete_own" on public.financial_goals
for delete to authenticated
using (auth.uid() = user_id);

alter table public.net_worth_snapshots enable row level security;

drop policy if exists "net_worth_snapshots_select_own" on public.net_worth_snapshots;
create policy "net_worth_snapshots_select_own" on public.net_worth_snapshots
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "net_worth_snapshots_insert_own" on public.net_worth_snapshots;
create policy "net_worth_snapshots_insert_own" on public.net_worth_snapshots
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "net_worth_snapshots_update_own" on public.net_worth_snapshots;
create policy "net_worth_snapshots_update_own" on public.net_worth_snapshots
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "net_worth_snapshots_delete_own" on public.net_worth_snapshots;
create policy "net_worth_snapshots_delete_own" on public.net_worth_snapshots
for delete to authenticated
using (auth.uid() = user_id);

alter table public.habits enable row level security;

drop policy if exists "habits_select_own" on public.habits;
create policy "habits_select_own" on public.habits
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own" on public.habits
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own" on public.habits
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own" on public.habits
for delete to authenticated
using (auth.uid() = user_id);

alter table public.habit_logs enable row level security;

drop policy if exists "habit_logs_select_own" on public.habit_logs;
create policy "habit_logs_select_own" on public.habit_logs
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "habit_logs_insert_own" on public.habit_logs;
create policy "habit_logs_insert_own" on public.habit_logs
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "habit_logs_update_own" on public.habit_logs;
create policy "habit_logs_update_own" on public.habit_logs
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "habit_logs_delete_own" on public.habit_logs;
create policy "habit_logs_delete_own" on public.habit_logs
for delete to authenticated
using (auth.uid() = user_id);

alter table public.health_metrics enable row level security;

drop policy if exists "health_metrics_select_own" on public.health_metrics;
create policy "health_metrics_select_own" on public.health_metrics
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "health_metrics_insert_own" on public.health_metrics;
create policy "health_metrics_insert_own" on public.health_metrics
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "health_metrics_update_own" on public.health_metrics;
create policy "health_metrics_update_own" on public.health_metrics
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "health_metrics_delete_own" on public.health_metrics;
create policy "health_metrics_delete_own" on public.health_metrics
for delete to authenticated
using (auth.uid() = user_id);

alter table public.health_entries enable row level security;

drop policy if exists "health_entries_select_own" on public.health_entries;
create policy "health_entries_select_own" on public.health_entries
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "health_entries_insert_own" on public.health_entries;
create policy "health_entries_insert_own" on public.health_entries
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "health_entries_update_own" on public.health_entries;
create policy "health_entries_update_own" on public.health_entries
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "health_entries_delete_own" on public.health_entries;
create policy "health_entries_delete_own" on public.health_entries
for delete to authenticated
using (auth.uid() = user_id);

alter table public.workouts enable row level security;

drop policy if exists "workouts_select_own" on public.workouts;
create policy "workouts_select_own" on public.workouts
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "workouts_insert_own" on public.workouts;
create policy "workouts_insert_own" on public.workouts
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "workouts_update_own" on public.workouts;
create policy "workouts_update_own" on public.workouts
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "workouts_delete_own" on public.workouts;
create policy "workouts_delete_own" on public.workouts
for delete to authenticated
using (auth.uid() = user_id);

alter table public.documents enable row level security;

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own" on public.documents
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own" on public.documents
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own" on public.documents
for delete to authenticated
using (auth.uid() = user_id);

alter table public.memories enable row level security;

drop policy if exists "memories_select_own" on public.memories;
create policy "memories_select_own" on public.memories
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "memories_insert_own" on public.memories;
create policy "memories_insert_own" on public.memories
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "memories_update_own" on public.memories;
create policy "memories_update_own" on public.memories
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "memories_delete_own" on public.memories;
create policy "memories_delete_own" on public.memories
for delete to authenticated
using (auth.uid() = user_id);

alter table public.memory_assets enable row level security;

drop policy if exists "memory_assets_select_own" on public.memory_assets;
create policy "memory_assets_select_own" on public.memory_assets
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "memory_assets_insert_own" on public.memory_assets;
create policy "memory_assets_insert_own" on public.memory_assets
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "memory_assets_update_own" on public.memory_assets;
create policy "memory_assets_update_own" on public.memory_assets
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "memory_assets_delete_own" on public.memory_assets;
create policy "memory_assets_delete_own" on public.memory_assets
for delete to authenticated
using (auth.uid() = user_id);

alter table public.ai_threads enable row level security;

drop policy if exists "ai_threads_select_own" on public.ai_threads;
create policy "ai_threads_select_own" on public.ai_threads
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "ai_threads_insert_own" on public.ai_threads;
create policy "ai_threads_insert_own" on public.ai_threads
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "ai_threads_update_own" on public.ai_threads;
create policy "ai_threads_update_own" on public.ai_threads
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ai_threads_delete_own" on public.ai_threads;
create policy "ai_threads_delete_own" on public.ai_threads
for delete to authenticated
using (auth.uid() = user_id);

alter table public.ai_messages enable row level security;

drop policy if exists "ai_messages_select_own" on public.ai_messages;
create policy "ai_messages_select_own" on public.ai_messages
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "ai_messages_insert_own" on public.ai_messages;
create policy "ai_messages_insert_own" on public.ai_messages
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "ai_messages_update_own" on public.ai_messages;
create policy "ai_messages_update_own" on public.ai_messages
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ai_messages_delete_own" on public.ai_messages;
create policy "ai_messages_delete_own" on public.ai_messages
for delete to authenticated
using (auth.uid() = user_id);

alter table public.activity_log enable row level security;

drop policy if exists "activity_log_select_own" on public.activity_log;
create policy "activity_log_select_own" on public.activity_log
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "activity_log_insert_own" on public.activity_log;
create policy "activity_log_insert_own" on public.activity_log
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "activity_log_update_own" on public.activity_log;
create policy "activity_log_update_own" on public.activity_log
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "activity_log_delete_own" on public.activity_log;
create policy "activity_log_delete_own" on public.activity_log
for delete to authenticated
using (auth.uid() = user_id);

-- Grants: authenticated users may operate on application tables, with RLS enforcing ownership.
-- Adjust/revoke further according to current Supabase project defaults and API exposure settings.
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.life_vision to authenticated;
grant select, insert, update, delete on table public.domains to authenticated;
grant select, insert, update, delete on table public.goals to authenticated;
grant select, insert, update, delete on table public.kpis to authenticated;
grant select, insert, update, delete on table public.kpi_entries to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.goal_projects to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.reminders to authenticated;
grant select, insert, update, delete on table public.notifications to authenticated;
grant select, insert, update, delete on table public.decisions to authenticated;
grant select, insert, update, delete on table public.weekly_reviews to authenticated;
grant select, insert, update, delete on table public.study_topics to authenticated;
grant select, insert, update, delete on table public.study_sessions to authenticated;
grant select, insert, update, delete on table public.religion_routines to authenticated;
grant select, insert, update, delete on table public.religion_logs to authenticated;
grant select, insert, update, delete on table public.arabic_profiles to authenticated;
grant select, insert, update, delete on table public.arabic_sessions to authenticated;
grant select, insert, update, delete on table public.quran_items to authenticated;
grant select, insert, update, delete on table public.quran_sessions to authenticated;
grant select, insert, update, delete on table public.financial_accounts to authenticated;
grant select, insert, update, delete on table public.financial_transactions to authenticated;
grant select, insert, update, delete on table public.budget_items to authenticated;
grant select, insert, update, delete on table public.financial_goals to authenticated;
grant select, insert, update, delete on table public.net_worth_snapshots to authenticated;
grant select, insert, update, delete on table public.habits to authenticated;
grant select, insert, update, delete on table public.habit_logs to authenticated;
grant select, insert, update, delete on table public.health_metrics to authenticated;
grant select, insert, update, delete on table public.health_entries to authenticated;
grant select, insert, update, delete on table public.workouts to authenticated;
grant select, insert, update, delete on table public.documents to authenticated;
grant select, insert, update, delete on table public.memories to authenticated;
grant select, insert, update, delete on table public.memory_assets to authenticated;
grant select, insert, update, delete on table public.ai_threads to authenticated;
grant select, insert, update, delete on table public.ai_messages to authenticated;
grant select, insert, update, delete on table public.activity_log to authenticated;


-- Storage policy template.
-- Create PRIVATE buckets named 'documents' and 'memories' before using these policies.
-- Object path MUST begin with auth.uid() as the first folder.
-- Verify helper function behavior against current Supabase Storage docs before production.

drop policy if exists "lifeos_storage_select_own" on storage.objects;
create policy "lifeos_storage_select_own"
on storage.objects for select to authenticated
using (
  bucket_id in ('documents','memories')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "lifeos_storage_insert_own" on storage.objects;
create policy "lifeos_storage_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('documents','memories')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "lifeos_storage_update_own" on storage.objects;
create policy "lifeos_storage_update_own"
on storage.objects for update to authenticated
using (
  bucket_id in ('documents','memories')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('documents','memories')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "lifeos_storage_delete_own" on storage.objects;
create policy "lifeos_storage_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id in ('documents','memories')
  and (storage.foldername(name))[1] = auth.uid()::text
);
