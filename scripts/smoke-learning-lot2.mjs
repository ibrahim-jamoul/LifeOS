// Dependency-free sanity checks. These do NOT validate SQL against PostgreSQL or typecheck React.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { totalLearningMinutes, learningMinutesByPath, evidenceOfApplication, quizPercentage } from '../src/lib/domain/learning-metrics.ts';
import { nextReviewStep } from '../src/lib/domain/learning.ts';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let count=0;
function test(name, fn) { fn(); count++; console.log('OK', name); }
test('30-day sum includes multiple recorded sessions', () => assert.equal(totalLearningMinutes([{duration_minutes:10},{duration_minutes:30},{duration_minutes:20}]),60));
test('empty sessions yield measured zero, not fake mastery', () => assert.equal(totalLearningMinutes([]),0));
test('negative invalid time never inflates KPI', () => assert.equal(totalLearningMinutes([{duration_minutes:-2},{duration_minutes:15}]),15));
test('path minutes separated', () => assert.deepEqual(learningMinutesByPath([{path_id:'a',duration_minutes:20},{path_id:'b',duration_minutes:10},{path_id:'a',duration_minutes:15}]),{a:35,b:10}));
test('only explicit applications count', () => assert.equal(evidenceOfApplication([{duration_minutes:10,result:'studied'},{duration_minutes:30,result:'applied'}]),1));
test('quiz correct score', () => assert.equal(quizPercentage(3,4),75));
test('quiz zero total is unknown', () => assert.equal(quizPercentage(0,0),null));
test('quiz impossible score rejected', () => assert.equal(quizPercentage(9,4),null));
test('forgotten knowledge revision moves to day 1', () => assert.equal(nextReviewStep(4,'forgot').afterDays,1));
test('good review advances spaced recall', () => assert.equal(nextReviewStep(1,'correct').afterDays,7));
const sql = readFileSync(join(root,'supabase/migrations/20261008235100_learning_v5_quizzes_planning.sql'),'utf8');
for(const name of ['learning_quizzes','learning_questions','learning_quiz_attempts','learning_activity_plans']) test(`migration includes table ${name}`,()=>assert.ok(sql.includes(`create table public.${name}`)));
for(const rpc of ['submit_learning_quiz','plan_learning_activity']) test(`migration includes guarded RPC ${rpc}`,()=>assert.ok(sql.includes(`revoke all on function public.${rpc}`)));
test('RLS provisioned for new tables',()=>assert.ok(sql.includes("'learning_quizzes','learning_questions','learning_quiz_attempts','learning_activity_plans'")));
test('immutable published questions guarded by a trigger',()=>assert.ok(sql.includes('create trigger learning_questions_publication_guard')));
console.log(`SMOKE_CHECKS ${count} passed / 0 failed`);
