-- READ ONLY. Execute AFTER both V5 migrations on LOCAL PostgreSQL/Supabase.
-- 'ready' must be true for the release gate.
with required(name) as (values
 ('learning_paths'), ('learning_modules'), ('learning_activities'),
 ('learning_sessions'), ('learning_knowledge'), ('learning_reviews'),
 ('learning_quizzes'), ('learning_questions'),
 ('learning_quiz_attempts'), ('learning_activity_plans')
), table_audit as (
 select r.name, c.oid is not null as exists_table, coalesce(c.relrowsecurity,false) as has_rls
 from required r
 left join pg_class c on c.relname=r.name and c.relnamespace='public'::regnamespace and c.relkind='r'
)
select count(*) as expected_tables,
 count(*) filter (where exists_table) as existing_tables,
 count(*) filter (where exists_table and has_rls) as tables_with_rls,
 bool_and(exists_table and has_rls) as ready
from table_audit;

-- Privileged quiz fields must not be selectable by a normal authenticated role.
select
 not has_column_privilege('authenticated', 'public.learning_questions', 'correct_index', 'SELECT') as answer_key_private,
 not has_column_privilege('authenticated', 'public.learning_questions', 'explanation', 'SELECT') as explanation_private,
 has_column_privilege('authenticated', 'public.learning_questions', 'prompt', 'SELECT') as prompt_readable;

-- Functions should be callable only by authenticated users, not anonymous clients.
select p.proname,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
 ('complete_learning_review', 'initialize_learning_path', 'submit_learning_quiz', 'plan_learning_activity')
order by p.proname;
