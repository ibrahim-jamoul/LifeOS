-- LifeOS Apprentissage V5 (lot 1). Additive: keep study_topics, quran_* and arabic_* unchanged.
-- All cross-table references include user_id to prevent linking to another account.
create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (domain in ('religion','arabic','english','certification','professional','finance','business','reading','practical','exploration')),
  title text not null check (char_length(trim(title)) between 1 and 160),
  purpose text,
  path_type text not null default 'strategic' check (path_type in ('strategic','maintenance','exploration','leisure')),
  status text not null default 'active' check (status in ('planned','active','paused','completed','abandoned','archived')),
  weekly_minutes int not null default 90 check (weekly_minutes between 0 and 1680),
  goal_id uuid,
  project_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,user_id),
  constraint learning_paths_goal_owner_fk foreign key (goal_id,user_id) references public.goals(id,user_id) on delete set null (goal_id),
  constraint learning_paths_project_owner_fk foreign key (project_id,user_id) references public.projects(id,user_id) on delete set null (project_id)
);

create table if not exists public.learning_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path_id uuid not null,
  title text not null check (char_length(trim(title)) between 1 and 160),
  position int not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique(id,user_id),
  foreign key (path_id,user_id) references public.learning_paths(id,user_id) on delete cascade
);

create table if not exists public.learning_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null,
  title text not null check (char_length(trim(title)) between 1 and 160),
  activity_type text not null default 'lesson' check (activity_type in ('lesson','reading','video','lab','exercise','quiz','writing','speaking','memorization','review','deliverable')),
  source_url text,
  estimated_minutes int not null default 15 check (estimated_minutes between 1 and 480),
  position int not null default 0 check (position >= 0),
  status text not null default 'planned' check (status in ('planned','completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(id,user_id),
  foreign key (module_id,user_id) references public.learning_modules(id,user_id) on delete cascade,
  constraint learning_activity_completion_ck check ((status='completed')=(completed_at is not null)),
  constraint learning_activity_source_url_ck check (source_url is null or (source_url ~* '^https://[^[:space:]]+$' and char_length(source_url)<=1500))
);

create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path_id uuid not null,
  activity_id uuid,
  duration_minutes int not null check (duration_minutes between 1 and 480),
  confidence smallint check (confidence between 1 and 4),
  result text not null default 'studied' check (result in ('studied','practiced','applied','blocked')),
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (path_id,user_id) references public.learning_paths(id,user_id) on delete cascade,
  foreign key (activity_id,user_id) references public.learning_activities(id,user_id) on delete set null (activity_id)
);

create table if not exists public.learning_knowledge (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path_id uuid not null,
  title text not null check (char_length(trim(title)) between 1 and 160),
  summary text,
  source_url text,
  review_step smallint not null default 0 check (review_step between 0 and 5),
  last_assessment text check (last_assessment in ('forgot','fragile','correct','mastered')),
  next_review_on date not null default current_date,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(id,user_id),
  foreign key (path_id,user_id) references public.learning_paths(id,user_id) on delete cascade,
  constraint learning_knowledge_source_url_ck check (source_url is null or (source_url ~* '^https://[^[:space:]]+$' and char_length(source_url)<=1500))
);

create table if not exists public.learning_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  knowledge_id uuid not null,
  assessment text not null check (assessment in ('forgot','fragile','correct','mastered')),
  previous_step smallint not null check (previous_step between 0 and 5),
  next_step smallint not null check (next_step between 0 and 5),
  next_review_on date not null,
  reviewed_at timestamptz not null default now(),
  foreign key (knowledge_id,user_id) references public.learning_knowledge(id,user_id) on delete cascade
);

create index if not exists learning_paths_user_status_idx on public.learning_paths(user_id,status,updated_at desc);
create index if not exists learning_modules_path_idx on public.learning_modules(user_id,path_id,position);
create index if not exists learning_activities_module_idx on public.learning_activities(user_id,module_id,position);
create index if not exists learning_sessions_path_idx on public.learning_sessions(user_id,path_id,occurred_at desc);
create index if not exists learning_knowledge_due_idx on public.learning_knowledge(user_id,next_review_on);
create index if not exists learning_reviews_knowledge_idx on public.learning_reviews(user_id,knowledge_id,reviewed_at desc);

-- Avoid unbounded privilege on tables before enabling RLS.
do $$ declare t text; begin
  foreach t in array array['learning_paths','learning_modules','learning_activities','learning_sessions','learning_knowledge','learning_reviews'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t||'_select_own',t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',t||'_insert_own',t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',t||'_update_own',t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',t||'_delete_own',t);
  end loop;
end $$;

drop trigger if exists learning_paths_updated_at on public.learning_paths;
create trigger learning_paths_updated_at before update on public.learning_paths for each row execute function public.set_updated_at();

-- Atomic review: lock the knowledge row, store the answer and move the due date.
-- Dates are supplied by the authenticated application using the profile timezone.
create or replace function public.complete_learning_review(p_knowledge_id uuid, p_assessment text, p_today date)
returns jsonb
language plpgsql security definer set search_path=public,pg_temp
as $$
declare
  current_row public.learning_knowledge%rowtype;
  next_step int;
  next_due date;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_assessment not in ('forgot','fragile','correct','mastered') or p_today is null then
    raise exception 'Invalid review input' using errcode='22023';
  end if;
  select * into current_row from public.learning_knowledge
  where id=p_knowledge_id and user_id=auth.uid() for update;
  if not found then raise exception 'Knowledge not found' using errcode='42501'; end if;
  next_step := case p_assessment
    when 'forgot' then 0
    when 'fragile' then greatest(current_row.review_step-1,0)
    when 'correct' then least(current_row.review_step+1,5)
    else least(current_row.review_step+2,5) end;
  next_due := p_today + (array[1,3,7,14,30,60])[next_step+1];
  update public.learning_knowledge
    set review_step=next_step,last_assessment=p_assessment,last_reviewed_at=now(),next_review_on=next_due
    where id=current_row.id and user_id=auth.uid();
  insert into public.learning_reviews(user_id,knowledge_id,assessment,previous_step,next_step,next_review_on)
    values(auth.uid(),current_row.id,p_assessment,current_row.review_step,next_step,next_due);
  return jsonb_build_object('id',current_row.id,'reviewStep',next_step,'nextReviewOn',next_due);
end;
$$;
revoke all on function public.complete_learning_review(uuid,text,date) from public,anon;
grant execute on function public.complete_learning_review(uuid,text,date) to authenticated;

-- Optional lightweight syllabus templates. One atomic operation; no invented course material.
create or replace function public.initialize_learning_path(p_path_id uuid)
returns integer
language plpgsql security definer set search_path=public,pg_temp
as $$
declare
  row_path public.learning_paths%rowtype;
  module_titles text[];
  activity_titles text[];
  activity_types text[];
  i int;
  new_module uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into row_path from public.learning_paths where id=p_path_id and user_id=auth.uid() for update;
  if not found then raise exception 'Path not found' using errcode='42501'; end if;
  if exists (select 1 from public.learning_modules where path_id=row_path.id and user_id=auth.uid()) then
    raise exception 'Path already contains modules' using errcode='23505';
  end if;
  if row_path.domain='arabic' then
    module_titles:=array['Lire le texte voyellé','Comprendre','Relire sans voyelles','Mémoriser le vocabulaire','Écrire et réutiliser'];
    activity_titles:=array['Lire un texte réel','Identifier les mots inconnus','Relire sans assistance','Réviser les mots rencontrés','Écrire quelques phrases'];
    activity_types:=array['reading','lesson','reading','memorization','writing'];
  elsif row_path.domain='certification' then
    module_titles:=array['Comprendre le programme officiel','Étudier les fondamentaux','Pratiquer sur un lab','Évaluer ses connaissances','Prouver par un projet'];
    activity_titles:=array['Consulter les sources officielles','Étudier un domaine','Réaliser un laboratoire','Effectuer un test blanc','Réaliser un livrable'];
    activity_types:=array['reading','lesson','lab','quiz','deliverable'];
  elsif row_path.domain='english' then
    module_titles:=array['Écouter','Parler','Rédiger','Appliquer en contexte'];
    activity_titles:=array['Comprendre un contenu réel','Simuler un entretien ou une réunion','Rédiger un message professionnel','Présenter un projet'];
    activity_types:=array['lesson','speaking','writing','deliverable'];
  elsif row_path.domain='religion' then
    module_titles:=array['Découvrir','Comprendre','Mémoriser','Réviser','Appliquer'];
    activity_titles:=array['Consulter une source vérifiée','Étudier le sens','Mémoriser un enseignement','Tester sa mémorisation','Réutiliser en contexte'];
    activity_types:=array['reading','lesson','memorization','review','deliverable'];
  else
    module_titles:=array['Découvrir','Comprendre','S’exercer','Appliquer','Vérifier'];
    activity_titles:=array['Étudier une source','Résumer une idée clé','S’entraîner','Réaliser une application','Tester ses acquis'];
    activity_types:=array['reading','lesson','exercise','deliverable','quiz'];
  end if;
  for i in 1..array_length(module_titles,1) loop
    insert into public.learning_modules(user_id,path_id,title,position)
      values(auth.uid(),row_path.id,module_titles[i],i) returning id into new_module;
    insert into public.learning_activities(user_id,module_id,title,activity_type,position,estimated_minutes)
      values(auth.uid(),new_module,activity_titles[i],activity_types[i],1,15);
  end loop;
  return array_length(module_titles,1);
end;
$$;
revoke all on function public.initialize_learning_path(uuid) from public,anon;
grant execute on function public.initialize_learning_path(uuid) to authenticated;

-- A learning session may only refer to an activity from the same path.
-- Enforce this in PostgreSQL as well as in the application API.
create or replace function public.assert_learning_session_activity_path()
returns trigger language plpgsql security invoker set search_path=public,pg_temp
as $$
begin
  if new.activity_id is not null and not exists (
    select 1 from public.learning_activities a
    join public.learning_modules m on m.id=a.module_id and m.user_id=a.user_id
    where a.id=new.activity_id and a.user_id=new.user_id and m.path_id=new.path_id
  ) then
    raise exception 'Activity and session must belong to the same path' using errcode='23514';
  end if;
  return new;
end;
$$;
drop trigger if exists learning_session_path_integrity on public.learning_sessions;
create trigger learning_session_path_integrity before insert or update on public.learning_sessions
for each row execute function public.assert_learning_session_activity_path();

-- Review history is append-only to clients: only the atomic RPC may insert reviews.
revoke insert,update,delete on public.learning_reviews from authenticated;
