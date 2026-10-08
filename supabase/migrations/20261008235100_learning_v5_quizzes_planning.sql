-- LifeOS Learning V5 · lot 2. Apply AFTER 20261008235000_learning_v5_foundation.sql.
-- Additive migration; no historic religion, Quran, Arabic or task rows are changed.

alter table public.learning_activities
  add column if not exists instructions text;
alter table public.learning_sessions
  add column if not exists session_kind text not null default 'general',
  add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.learning_sessions
  add constraint learning_sessions_kind_v5_check
  check (session_kind in ('general','lab','arabic','english','quran','certification','reading','business'));
alter table public.learning_sessions
  add constraint learning_sessions_details_v5_check
  check (jsonb_typeof(details)='object' and pg_column_size(details)<=8192);

create table public.learning_quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path_id uuid not null,
  activity_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 160),
  mode text not null default 'practice' check (mode in ('practice','mock')),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique(id,user_id),
  foreign key (path_id,user_id) references public.learning_paths(id,user_id) on delete cascade,
  foreign key (activity_id,user_id) references public.learning_activities(id,user_id) on delete set null (activity_id)
);

create table public.learning_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null,
  prompt text not null check (char_length(trim(prompt)) between 3 and 1200),
  choices jsonb not null check (
    jsonb_typeof(choices)='array' and jsonb_array_length(choices) between 2 and 6
    and pg_column_size(choices)<=4096
  ),
  correct_index smallint not null check (correct_index between 0 and 5),
  explanation text check (char_length(explanation)<=2000),
  source_url text check (source_url is null or (source_url ~* '^https://[^[:space:]]+$' and char_length(source_url)<=1500)),
  position integer not null default 0 check (position>=0),
  created_at timestamptz not null default now(),
  unique(id,user_id),
  foreign key (quiz_id,user_id) references public.learning_quizzes(id,user_id) on delete cascade,
  constraint learning_questions_index_bounds_ck check (correct_index < jsonb_array_length(choices))
);

create table public.learning_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null,
  correct integer not null check (correct >= 0),
  total integer not null check (total between 1 and 100),
  score_percent integer not null check (score_percent between 0 and 100),
  answers jsonb not null check (jsonb_typeof(answers) = 'object' and pg_column_size(answers)<=8192),
  submitted_at timestamptz not null default now(),
  foreign key (quiz_id,user_id) references public.learning_quizzes(id,user_id) on delete cascade
);

-- Exactly one LifeOS task can represent one explicitly planned learning activity.
-- No background task generation. Deleting that task removes its link, never the lesson.
create table public.learning_activity_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null,
  task_id uuid not null,
  planned_on date not null,
  created_at timestamptz not null default now(),
  unique(user_id,activity_id),
  unique(user_id,task_id),
  foreign key (activity_id,user_id) references public.learning_activities(id,user_id) on delete cascade,
  foreign key (task_id,user_id) references public.tasks(id,user_id) on delete cascade
);

create index learning_quizzes_path_idx on public.learning_quizzes(user_id,path_id,created_at desc);
create index learning_questions_quiz_idx on public.learning_questions(user_id,quiz_id,position);
create index learning_attempts_quiz_idx on public.learning_quiz_attempts(user_id,quiz_id,submitted_at desc);
create index learning_activity_plans_date_idx on public.learning_activity_plans(user_id,planned_on);

-- Data API access is user-scoped and RLS remains defense in depth.
do $$ declare t text; begin
  foreach t in array array['learning_quizzes','learning_questions','learning_quiz_attempts','learning_activity_plans'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid())=user_id)',t||'_select_own',t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid())=user_id)',t||'_insert_own',t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t||'_update_own',t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid())=user_id)',t||'_delete_own',t);
  end loop;
end $$;
-- The answer key is never selectable with a normal authenticated Data API client.
-- Server-side grading via SECURITY DEFINER can still access this owner-guarded table.
revoke select on public.learning_questions from authenticated;
grant select (id,user_id,quiz_id,prompt,choices,explanation,source_url,position,created_at)
  on public.learning_questions to authenticated;

-- Clients cannot forge exam scores or plan links. These writes go through guarded RPCs.
revoke insert,update,delete on public.learning_quiz_attempts from authenticated;
revoke insert,update,delete on public.learning_activity_plans from authenticated;

-- Score the actual questions on the server, inside one transaction.
create function public.submit_learning_quiz(p_quiz_id uuid, p_answers jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  q record;
  question record;
  correct_count integer := 0;
  question_count integer := 0;
  given text;
  results jsonb := '[]'::jsonb;
  attempt_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated' using errcode='42501'; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' or pg_column_size(p_answers)>8192 then
    raise exception 'Invalid answers' using errcode='22023';
  end if;
  select id, published into q from public.learning_quizzes
    where id=p_quiz_id and user_id=(select auth.uid());
  if not found then raise exception 'Quiz not found' using errcode='42501'; end if;
  if not q.published then raise exception 'Quiz not published' using errcode='22023'; end if;
  for question in
    select id, correct_index, explanation, source_url from public.learning_questions
    where quiz_id=p_quiz_id and user_id=(select auth.uid()) order by position,id limit 100
  loop
    question_count := question_count+1;
    given := p_answers ->> (question.id::text);
    if given is not null and given !~ '^[0-5]$' then raise exception 'Invalid choice' using errcode='22023'; end if;
    if given is not null and given::int = question.correct_index then correct_count:=correct_count+1; end if;
    results:=results||jsonb_build_array(jsonb_build_object('questionId',question.id,'correctIndex',question.correct_index,
      'givenIndex',case when given is null then null else given::int end,
      'correct',coalesce(given::int=question.correct_index,false),'explanation',question.explanation,'sourceUrl',question.source_url));
  end loop;
  if question_count=0 then raise exception 'Empty quiz' using errcode='22023'; end if;
  insert into public.learning_quiz_attempts(user_id,quiz_id,correct,total,score_percent,answers)
    values ((select auth.uid()),p_quiz_id,correct_count,question_count,round(100.0*correct_count/question_count)::int,p_answers)
    returning id into attempt_id;
  return jsonb_build_object('attemptId',attempt_id,'correct',correct_count,'total',question_count,
    'scorePercent',round(100.0*correct_count/question_count)::int,'results',results);
end;
$$;
revoke all on function public.submit_learning_quiz(uuid,jsonb) from public,anon;
grant execute on function public.submit_learning_quiz(uuid,jsonb) to authenticated;

-- An activity can only link to a quiz or task of the same path & owner.
create function public.assert_learning_quiz_activity_path()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.activity_id is not null and not exists (
    select 1 from public.learning_activities a join public.learning_modules m
      on m.id=a.module_id and m.user_id=a.user_id
    where a.id=new.activity_id and a.user_id=new.user_id and m.path_id=new.path_id
  ) then raise exception 'Quiz activity does not belong to path' using errcode='23514'; end if;
  return new;
end;
$$;
create trigger learning_quiz_activity_path_guard before insert or update on public.learning_quizzes
for each row execute function public.assert_learning_quiz_activity_path();

-- Atomic idempotent task creation/rescheduling. Path goal/project links are inherited.
create function public.plan_learning_activity(p_activity_id uuid, p_planned_on date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  row_activity record;
  existing record;
  current_task_status text;
  new_task_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated' using errcode='42501'; end if;
  if p_planned_on is null or p_planned_on < current_date-7 or p_planned_on > current_date+365 then
    raise exception 'Invalid planning date' using errcode='22023';
  end if;
  select a.id,a.title,a.estimated_minutes,p.project_id,p.goal_id,p.domain into row_activity
  from public.learning_activities a
  join public.learning_modules m on m.id=a.module_id and m.user_id=a.user_id
  join public.learning_paths p on p.id=m.path_id and p.user_id=a.user_id
  where a.id=p_activity_id and a.user_id=(select auth.uid());
  if not found then raise exception 'Activity not found' using errcode='42501'; end if;
  select task_id into existing from public.learning_activity_plans
  where user_id=(select auth.uid()) and activity_id=p_activity_id for update;
  if found then
    select status::text into current_task_status from public.tasks
      where id=existing.task_id and user_id=(select auth.uid()) for update;
    if current_task_status in ('done','cancelled') then
      raise exception 'Reopen the existing completed or cancelled task before replanning' using errcode='23514';
    end if;
    update public.tasks set planned_on=p_planned_on where id=existing.task_id and user_id=(select auth.uid());
    update public.learning_activity_plans set planned_on=p_planned_on where activity_id=p_activity_id and user_id=(select auth.uid());
    return jsonb_build_object('taskId',existing.task_id,'plannedOn',p_planned_on,'created',false);
  end if;
  insert into public.tasks(user_id,title,project_id,goal_id,planned_on,estimate_minutes,life_area,configuration_status)
  values ((select auth.uid()),row_activity.title,row_activity.project_id,row_activity.goal_id,
    p_planned_on,row_activity.estimated_minutes,
    case when row_activity.domain='religion' then 'religion' when row_activity.domain in ('certification','professional','business') then 'pro' else 'perso' end,
    'ready') returning id into new_task_id;
  insert into public.learning_activity_plans(user_id,activity_id,task_id,planned_on)
  values ((select auth.uid()),p_activity_id,new_task_id,p_planned_on);
  return jsonb_build_object('taskId',new_task_id,'plannedOn',p_planned_on,'created',true);
end;
$$;
revoke all on function public.plan_learning_activity(uuid,date) from public,anon;
grant execute on function public.plan_learning_activity(uuid,date) to authenticated;

-- Quiz evidence must remain reproducible: freeze the question set once published,
-- including calls made directly to PostgREST (not only through the Next.js API).
create function public.guard_published_quiz_questions()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  referenced_quiz uuid;
  is_published boolean;
begin
  referenced_quiz := case when tg_op='DELETE' then old.quiz_id else new.quiz_id end;
  select published into is_published from public.learning_quizzes
  where id=referenced_quiz and user_id=(select auth.uid());
  if is_published then raise exception 'Published quiz questions are immutable' using errcode='23514'; end if;
  if tg_op='UPDATE' and old.quiz_id <> new.quiz_id then
    raise exception 'Moving a question between quizzes is not allowed' using errcode='23514';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
create trigger learning_questions_publication_guard
before insert or update or delete on public.learning_questions
for each row execute function public.guard_published_quiz_questions();

create function public.guard_learning_quiz_published_state()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.published and (not new.published or old.path_id <> new.path_id
    or old.mode <> new.mode or old.activity_id is distinct from new.activity_id) then
    raise exception 'Published quiz configuration is immutable' using errcode='23514';
  end if;
  return new;
end;
$$;
create trigger learning_quiz_state_guard before update on public.learning_quizzes
for each row execute function public.guard_learning_quiz_published_state();
