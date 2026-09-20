-- LifeOS security and integrity hardening
-- Apply after 001_initial_schema.sql.

-- -----------------------------------------------------------------------------
-- Tenant-aware foreign keys
--
-- Each child row stores user_id directly. Referencing both the parent id and
-- user_id prevents a valid child owned by one user from pointing at another
-- user's parent row. The parent indexes are deliberately unique so PostgreSQL
-- can use them as composite foreign-key targets.
-- -----------------------------------------------------------------------------

create unique index if not exists ux_profiles_user_id
  on public.profiles(user_id);
create unique index if not exists ux_domains_owned_id
  on public.domains(id, user_id);
create unique index if not exists ux_goals_owned_id
  on public.goals(id, user_id);
create unique index if not exists ux_kpis_owned_id
  on public.kpis(id, user_id);
create unique index if not exists ux_projects_owned_id
  on public.projects(id, user_id);
create unique index if not exists ux_study_topics_owned_id
  on public.study_topics(id, user_id);
create unique index if not exists ux_religion_routines_owned_id
  on public.religion_routines(id, user_id);
create unique index if not exists ux_quran_items_owned_id
  on public.quran_items(id, user_id);
create unique index if not exists ux_financial_accounts_owned_id
  on public.financial_accounts(id, user_id);
create unique index if not exists ux_habits_owned_id
  on public.habits(id, user_id);
create unique index if not exists ux_health_metrics_owned_id
  on public.health_metrics(id, user_id);
create unique index if not exists ux_memories_owned_id
  on public.memories(id, user_id);
create unique index if not exists ux_ai_threads_owned_id
  on public.ai_threads(id, user_id);

alter table public.goals
  drop constraint if exists goals_domain_id_fkey,
  drop constraint if exists goals_domain_owner_fkey,
  add constraint goals_domain_owner_fkey
    foreign key (domain_id, user_id)
    references public.domains(id, user_id)
    on delete set null (domain_id);

alter table public.kpis
  drop constraint if exists kpis_goal_id_fkey,
  drop constraint if exists kpis_goal_owner_fkey,
  add constraint kpis_goal_owner_fkey
    foreign key (goal_id, user_id)
    references public.goals(id, user_id)
    on delete cascade;

alter table public.kpi_entries
  drop constraint if exists kpi_entries_kpi_id_fkey,
  drop constraint if exists kpi_entries_kpi_owner_fkey,
  add constraint kpi_entries_kpi_owner_fkey
    foreign key (kpi_id, user_id)
    references public.kpis(id, user_id)
    on delete cascade;

alter table public.projects
  drop constraint if exists projects_domain_id_fkey,
  drop constraint if exists projects_domain_owner_fkey,
  add constraint projects_domain_owner_fkey
    foreign key (domain_id, user_id)
    references public.domains(id, user_id)
    on delete set null (domain_id);

alter table public.goal_projects
  drop constraint if exists goal_projects_goal_id_fkey,
  drop constraint if exists goal_projects_goal_owner_fkey,
  add constraint goal_projects_goal_owner_fkey
    foreign key (goal_id, user_id)
    references public.goals(id, user_id)
    on delete cascade,
  drop constraint if exists goal_projects_project_id_fkey,
  drop constraint if exists goal_projects_project_owner_fkey,
  add constraint goal_projects_project_owner_fkey
    foreign key (project_id, user_id)
    references public.projects(id, user_id)
    on delete cascade;

alter table public.tasks
  drop constraint if exists tasks_project_id_fkey,
  drop constraint if exists tasks_project_owner_fkey,
  add constraint tasks_project_owner_fkey
    foreign key (project_id, user_id)
    references public.projects(id, user_id)
    on delete set null (project_id);

alter table public.decisions
  drop constraint if exists decisions_goal_id_fkey,
  drop constraint if exists decisions_goal_owner_fkey,
  add constraint decisions_goal_owner_fkey
    foreign key (goal_id, user_id)
    references public.goals(id, user_id)
    on delete set null (goal_id),
  drop constraint if exists decisions_project_id_fkey,
  drop constraint if exists decisions_project_owner_fkey,
  add constraint decisions_project_owner_fkey
    foreign key (project_id, user_id)
    references public.projects(id, user_id)
    on delete set null (project_id);

alter table public.study_sessions
  drop constraint if exists study_sessions_topic_id_fkey,
  drop constraint if exists study_sessions_topic_owner_fkey,
  add constraint study_sessions_topic_owner_fkey
    foreign key (topic_id, user_id)
    references public.study_topics(id, user_id)
    on delete set null (topic_id);

alter table public.religion_logs
  drop constraint if exists religion_logs_routine_id_fkey,
  drop constraint if exists religion_logs_routine_owner_fkey,
  add constraint religion_logs_routine_owner_fkey
    foreign key (routine_id, user_id)
    references public.religion_routines(id, user_id)
    on delete cascade;

alter table public.quran_sessions
  drop constraint if exists quran_sessions_quran_item_id_fkey,
  drop constraint if exists quran_sessions_item_owner_fkey,
  add constraint quran_sessions_item_owner_fkey
    foreign key (quran_item_id, user_id)
    references public.quran_items(id, user_id)
    on delete set null (quran_item_id);

alter table public.financial_transactions
  drop constraint if exists financial_transactions_account_id_fkey,
  drop constraint if exists financial_transactions_account_owner_fkey,
  add constraint financial_transactions_account_owner_fkey
    foreign key (account_id, user_id)
    references public.financial_accounts(id, user_id)
    on delete cascade;

alter table public.habit_logs
  drop constraint if exists habit_logs_habit_id_fkey,
  drop constraint if exists habit_logs_habit_owner_fkey,
  add constraint habit_logs_habit_owner_fkey
    foreign key (habit_id, user_id)
    references public.habits(id, user_id)
    on delete cascade;

alter table public.health_entries
  drop constraint if exists health_entries_metric_id_fkey,
  drop constraint if exists health_entries_metric_owner_fkey,
  add constraint health_entries_metric_owner_fkey
    foreign key (metric_id, user_id)
    references public.health_metrics(id, user_id)
    on delete cascade;

alter table public.memory_assets
  drop constraint if exists memory_assets_memory_id_fkey,
  drop constraint if exists memory_assets_memory_owner_fkey,
  add constraint memory_assets_memory_owner_fkey
    foreign key (memory_id, user_id)
    references public.memories(id, user_id)
    on delete cascade;

alter table public.ai_messages
  drop constraint if exists ai_messages_thread_id_fkey,
  drop constraint if exists ai_messages_thread_owner_fkey,
  add constraint ai_messages_thread_owner_fkey
    foreign key (thread_id, user_id)
    references public.ai_threads(id, user_id)
    on delete cascade;

-- Referencing-side indexes for ownership checks, joins, and parent deletion.
create index if not exists idx_goals_user_domain
  on public.goals(user_id, domain_id);
create index if not exists idx_kpis_user_goal
  on public.kpis(user_id, goal_id);
create index if not exists idx_kpi_entries_user_kpi_measured
  on public.kpi_entries(user_id, kpi_id, measured_at desc);
create index if not exists idx_projects_user_domain
  on public.projects(user_id, domain_id);
create index if not exists idx_goal_projects_user_project
  on public.goal_projects(user_id, project_id);
create index if not exists idx_tasks_user_project
  on public.tasks(user_id, project_id);
create index if not exists idx_decisions_user_goal
  on public.decisions(user_id, goal_id);
create index if not exists idx_decisions_user_project
  on public.decisions(user_id, project_id);
create index if not exists idx_study_sessions_user_topic
  on public.study_sessions(user_id, topic_id);
create index if not exists idx_religion_logs_user_routine
  on public.religion_logs(user_id, routine_id);
create index if not exists idx_quran_sessions_user_item
  on public.quran_sessions(user_id, quran_item_id);
create index if not exists idx_financial_transactions_user_account_date
  on public.financial_transactions(user_id, account_id, occurred_on desc);
create index if not exists idx_financial_transactions_user_transfer_group
  on public.financial_transactions(user_id, transfer_group_id)
  where transfer_group_id is not null;
create unique index if not exists ux_financial_transactions_transfer_account
  on public.financial_transactions(user_id, transfer_group_id, account_id)
  where transfer_group_id is not null;
create index if not exists idx_health_entries_user_metric_measured
  on public.health_entries(user_id, metric_id, measured_at desc);
create index if not exists idx_memory_assets_user_memory_sort
  on public.memory_assets(user_id, memory_id, sort_order);
create index if not exists idx_ai_messages_user_thread_created
  on public.ai_messages(user_id, thread_id, created_at);
create index if not exists idx_activity_log_user_created
  on public.activity_log(user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Row-local business invariants
-- -----------------------------------------------------------------------------

alter table public.goals
  drop constraint if exists goals_date_order_ck,
  add constraint goals_date_order_ck
    check (start_date is null or target_date is null or start_date <= target_date);

alter table public.kpis
  drop constraint if exists kpis_target_shape_ck,
  add constraint kpis_target_shape_ck
    check (
      target_type = 'none'
      or (target_type in ('min', 'max', 'exact') and target_value is not null)
      or (
        target_type = 'range'
        and target_min is not null
        and target_max is not null
        and target_min <= target_max
      )
    );

alter table public.projects
  drop constraint if exists projects_budget_nonnegative_ck,
  add constraint projects_budget_nonnegative_ck
    check (
      (budget_planned is null or budget_planned >= 0)
      and (budget_actual is null or budget_actual >= 0)
    );

alter table public.quran_items
  drop constraint if exists quran_range_order_ck,
  add constraint quran_range_order_ck
    check (
      end_ayah is null
      or (start_ayah is not null and start_ayah <= end_ayah)
    );

alter table public.budget_items
  drop constraint if exists budget_items_month_first_day_ck,
  add constraint budget_items_month_first_day_ck
    check (extract(day from month) = 1);

alter table public.financial_accounts
  drop constraint if exists financial_accounts_currency_ck,
  add constraint financial_accounts_currency_ck
    check (currency ~ '^[A-Z]{3}$');

alter table public.financial_transactions
  drop constraint if exists financial_transactions_transfer_shape_ck,
  add constraint financial_transactions_transfer_shape_ck
    check (
      (
        tx_type = 'transfer'
        and transfer_group_id is not null
        and amount <> 0
      )
      or (
        tx_type in ('income', 'expense')
        and transfer_group_id is null
        and amount > 0
      )
    ),
  drop constraint if exists financial_transactions_currency_ck,
  add constraint financial_transactions_currency_ck
    check (currency ~ '^[A-Z]{3}$');

alter table public.budget_items
  drop constraint if exists budget_items_currency_ck,
  add constraint budget_items_currency_ck
    check (currency ~ '^[A-Z]{3}$');

alter table public.financial_goals
  drop constraint if exists financial_goals_amounts_ck,
  add constraint financial_goals_amounts_ck
    check (target_amount >= 0 and current_amount >= 0),
  drop constraint if exists financial_goals_currency_ck,
  add constraint financial_goals_currency_ck
    check (currency ~ '^[A-Z]{3}$');

alter table public.net_worth_snapshots
  drop constraint if exists net_worth_snapshots_amounts_ck,
  add constraint net_worth_snapshots_amounts_ck
    check (assets >= 0 and liabilities >= 0),
  drop constraint if exists net_worth_snapshots_currency_ck,
  add constraint net_worth_snapshots_currency_ck
    check (currency ~ '^[A-Z]{3}$');

alter table public.profiles
  drop constraint if exists profiles_default_currency_ck,
  add constraint profiles_default_currency_ck
    check (default_currency ~ '^[A-Z]{3}$');

alter table public.documents
  drop constraint if exists documents_date_order_ck,
  add constraint documents_date_order_ck
    check (issued_on is null or expires_on is null or issued_on <= expires_on),
  drop constraint if exists documents_file_size_ck,
  add constraint documents_file_size_ck
    check (file_size_bytes is null or file_size_bytes >= 0),
  drop constraint if exists documents_storage_owner_ck,
  add constraint documents_storage_owner_ck
    check (
      storage_path = btrim(storage_path)
      and storage_path like user_id::text || '/%'
      and storage_path not like '%//%'
      and storage_path !~ '(^|/)[.]{1,2}(/|$)'
    );

alter table public.memories
  drop constraint if exists memories_date_order_ck,
  add constraint memories_date_order_ck
    check (
      end_date is null
      or (start_date is not null and start_date <= end_date)
    );

alter table public.memory_assets
  drop constraint if exists memory_assets_file_size_ck,
  add constraint memory_assets_file_size_ck
    check (file_size_bytes is null or file_size_bytes >= 0),
  drop constraint if exists memory_assets_sort_order_ck,
  add constraint memory_assets_sort_order_ck
    check (sort_order >= 0),
  drop constraint if exists memory_assets_storage_owner_ck,
  add constraint memory_assets_storage_owner_ck
    check (
      storage_path = btrim(storage_path)
      and storage_path like user_id::text || '/%'
      and storage_path not like '%//%'
      and storage_path !~ '(^|/)[.]{1,2}(/|$)'
    );

create unique index if not exists ux_documents_storage_path
  on public.documents(user_id, storage_path);
create unique index if not exists ux_memory_assets_storage_path
  on public.memory_assets(user_id, storage_path);

-- Weekly-review identity is an ISO week, normalized to its Monday. This is
-- intentionally independent of display preferences so changing a profile's
-- first day of week cannot create two records for the same operating week.
create or replace function public.normalize_weekly_review_week_start()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.week_start := pg_catalog.date_trunc(
    'week',
    new.week_start::timestamp without time zone
  )::date;
  return new;
end;
$$;

drop trigger if exists normalize_weekly_review_week_start
  on public.weekly_reviews;
create trigger normalize_weekly_review_week_start
before insert or update on public.weekly_reviews
for each row execute function public.normalize_weekly_review_week_start();

alter table public.weekly_reviews
  drop constraint if exists weekly_reviews_iso_monday_ck,
  add constraint weekly_reviews_iso_monday_ck
    check (extract(isodow from week_start) = 1);

-- -----------------------------------------------------------------------------
-- Financial transfers
--
-- Direct Data API writes may create only income/expense rows. Transfers are
-- inserted as an atomic, same-currency pair by the RPC below. The source row is
-- negative and the destination row positive; both are excluded from income and
-- expense totals by tx_type.
-- -----------------------------------------------------------------------------

drop policy if exists "financial_transactions_insert_own"
  on public.financial_transactions;
create policy "financial_transactions_insert_own"
on public.financial_transactions
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and tx_type <> 'transfer'
  and transfer_group_id is null
);

drop policy if exists "financial_transactions_update_own"
  on public.financial_transactions;
create policy "financial_transactions_update_own"
on public.financial_transactions
for update to authenticated
using (
  (select auth.uid()) = user_id
  and tx_type <> 'transfer'
)
with check (
  (select auth.uid()) = user_id
  and tx_type <> 'transfer'
  and transfer_group_id is null
);

create or replace function public.create_financial_transfer(
  p_source_account_id uuid,
  p_destination_account_id uuid,
  p_occurred_on date,
  p_amount numeric,
  p_currency text,
  p_description text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_currency text := pg_catalog.upper(pg_catalog.btrim(p_currency));
  v_source_currency text;
  v_destination_currency text;
  v_description text := nullif(pg_catalog.btrim(p_description), '');
  v_notes text := nullif(pg_catalog.btrim(p_notes), '');
  v_amount numeric;
  v_owned_account_count integer;
  v_transfer_group_id uuid := pg_catalog.gen_random_uuid();
  v_source_transaction_id uuid := pg_catalog.gen_random_uuid();
  v_destination_transaction_id uuid := pg_catalog.gen_random_uuid();
begin
  if v_uid is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication required';
  end if;

  if p_source_account_id is null or p_destination_account_id is null then
    raise exception using
      errcode = '22023',
      message = 'Both transfer accounts are required';
  end if;

  if p_source_account_id = p_destination_account_id then
    raise exception using
      errcode = '22023',
      message = 'Source and destination accounts must differ';
  end if;

  if p_occurred_on is null then
    raise exception using
      errcode = '22023',
      message = 'Transfer date is required';
  end if;

  if p_amount is null
     or p_amount <= 0
     or p_amount > 99999999999999.99
     or pg_catalog.round(p_amount, 2) <> p_amount then
    raise exception using
      errcode = '22023',
      message = 'Transfer amount must be positive with at most two decimal places';
  end if;
  v_amount := pg_catalog.round(p_amount, 2);

  if v_currency is null or v_currency !~ '^[A-Z]{3}$' then
    raise exception using
      errcode = '22023',
      message = 'Transfer currency must be a three-letter uppercase code';
  end if;

  if v_description is null or pg_catalog.char_length(v_description) > 500 then
    raise exception using
      errcode = '22023',
      message = 'Transfer description is required and must not exceed 500 characters';
  end if;

  if v_notes is not null and pg_catalog.char_length(v_notes) > 5000 then
    raise exception using
      errcode = '22023',
      message = 'Transfer notes must not exceed 5000 characters';
  end if;

  -- Lock in UUID order so concurrent opposite-direction transfers cannot
  -- acquire the same two account locks in opposite order.
  perform account.id
  from public.financial_accounts as account
  where account.user_id = v_uid
    and account.id in (p_source_account_id, p_destination_account_id)
  order by account.id
  for update;

  select pg_catalog.count(*)::integer
  into v_owned_account_count
  from public.financial_accounts as account
  where account.user_id = v_uid
    and account.id in (p_source_account_id, p_destination_account_id);

  if v_owned_account_count <> 2 then
    -- Deliberately identical for an unknown account and another user's account.
    raise exception using
      errcode = 'P0002',
      message = 'One or more transfer accounts are unavailable';
  end if;

  select pg_catalog.upper(pg_catalog.btrim(account.currency))
  into v_source_currency
  from public.financial_accounts as account
  where account.id = p_source_account_id
    and account.user_id = v_uid;

  select pg_catalog.upper(pg_catalog.btrim(account.currency))
  into v_destination_currency
  from public.financial_accounts as account
  where account.id = p_destination_account_id
    and account.user_id = v_uid;

  if v_source_currency <> v_destination_currency
     or v_source_currency <> v_currency then
    raise exception using
      errcode = '22023',
      message = 'P0 transfers require two accounts in the same currency';
  end if;

  insert into public.financial_transactions (
    id,
    user_id,
    account_id,
    occurred_on,
    amount,
    tx_type,
    category,
    description,
    transfer_group_id,
    currency,
    notes
  )
  values
    (
      v_source_transaction_id,
      v_uid,
      p_source_account_id,
      p_occurred_on,
      -v_amount,
      'transfer',
      null,
      v_description,
      v_transfer_group_id,
      v_currency,
      v_notes
    ),
    (
      v_destination_transaction_id,
      v_uid,
      p_destination_account_id,
      p_occurred_on,
      v_amount,
      'transfer',
      null,
      v_description,
      v_transfer_group_id,
      v_currency,
      v_notes
    );

  return pg_catalog.jsonb_build_object(
    'transfer_group_id', v_transfer_group_id,
    'source_transaction_id', v_source_transaction_id,
    'destination_transaction_id', v_destination_transaction_id
  );
end;
$$;

comment on function public.create_financial_transfer(
  uuid, uuid, date, numeric, text, text, text
) is 'Creates an authenticated user-owned, same-currency transfer pair atomically.';

-- -----------------------------------------------------------------------------
-- Least privilege
-- -----------------------------------------------------------------------------

revoke create on schema public from public;
revoke all privileges on all tables in schema public from public;
revoke all privileges on all tables in schema public from anon;

revoke execute on function public.initialize_lifeos() from public;
revoke execute on function public.initialize_lifeos() from anon;
grant execute on function public.initialize_lifeos() to authenticated;

revoke execute on function public.create_financial_transfer(
  uuid, uuid, date, numeric, text, text, text
) from public;
revoke execute on function public.create_financial_transfer(
  uuid, uuid, date, numeric, text, text, text
) from anon;
grant execute on function public.create_financial_transfer(
  uuid, uuid, date, numeric, text, text, text
) to authenticated;

-- Trigger functions are not application RPCs.
revoke execute on function public.handle_new_user()
  from public, anon, authenticated;
revoke execute on function public.set_updated_at()
  from public, anon, authenticated;
revoke execute on function public.normalize_weekly_review_week_start()
  from public, anon, authenticated;

-- Harden objects created by later migrations executed by the same owner.
alter default privileges in schema public
  revoke all privileges on tables from public;
alter default privileges in schema public
  revoke all privileges on tables from anon;
alter default privileges in schema public
  revoke execute on functions from public;
alter default privileges in schema public
  revoke execute on functions from anon;

-- Buckets must be provisioned through the Supabase Storage API as private
-- buckets. Do not INSERT/UPDATE storage.buckets or storage.objects directly.
