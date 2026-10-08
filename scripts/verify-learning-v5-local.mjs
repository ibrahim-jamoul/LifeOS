// Dependency-free preflight for environments without npm registry/Postgres.
// Static checks cannot replace integration tests on a real Supabase staging DB.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { nextReviewStep, REVIEW_INTERVAL_DAYS, completedRatio } from '../src/lib/domain/learning.ts';
import { totalLearningMinutes, learningMinutesByPath, evidenceOfApplication, quizPercentage } from '../src/lib/domain/learning-metrics.ts';
const require = createRequire(import.meta.url);
let ts;
try { ts = require('typescript'); } catch {
  // Fallback for the offline testing image; normal local installs use node_modules.
  ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
}
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sql1 = readFileSync(join(root,'supabase/migrations/20261008235000_learning_v5_foundation.sql'),'utf8');
const sql2 = readFileSync(join(root,'supabase/migrations/20261008235100_learning_v5_quizzes_planning.sql'),'utf8');
let checks=0;
const check=(label,fn)=>{fn();checks++;process.stdout.write('PASS '+label+'\n');};
const sources=[];
const walk=(dir)=>{for(const name of readdirSync(dir)){const path=join(dir,name);if(statSync(path).isDirectory())walk(path);else if(/\.(tsx?|mts|cts)$/.test(name))sources.push(path)}};
walk(join(root,'src'));
walk(join(root,'tests'));
let syntaxProblems=[];let missingImports=[];
for(const file of sources){
 const text=readFileSync(file,'utf8');
 const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 if(ast.parseDiagnostics.length)syntaxProblems.push(...ast.parseDiagnostics.map(d=>`${file}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`));
 const imports=ts.preProcessFile(text).importedFiles;
 for(const imp of imports){
  const spec=imp.fileName;
  let local = spec.startsWith('@/') ? join(root,'src',spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(file),spec) : null;
  if(local && ![local,local+'.ts',local+'.tsx',local+'.js',local+'.mjs',join(local,'index.ts'),join(local,'index.tsx')].some(existsSync))missingImports.push(`${file}: ${spec}`);
 }
}
check(`TypeScript/TSX parser: ${sources.length} files`,()=>assert.deepEqual(syntaxProblems,[]));
check('relative/alias source imports resolve',()=>assert.deepEqual(missingImports,[]));
const tables=['learning_paths','learning_modules','learning_activities','learning_sessions','learning_knowledge','learning_reviews','learning_quizzes','learning_questions','learning_quiz_attempts','learning_activity_plans'];
for(const table of tables) check(`table ${table}`,()=>assert.match(sql1+'\n'+sql2,new RegExp(`create table (?:if not exists )?public\\.${table}\\s*\\(`)));
check('six RLS policies installed for each foundation table',()=>assert.ok(sql1.includes("'learning_paths','learning_modules','learning_activities','learning_sessions','learning_knowledge','learning_reviews'")));
check('RLS configured on all four quiz/planning tables',()=>assert.ok(sql2.includes("'learning_quizzes','learning_questions','learning_quiz_attempts','learning_activity_plans'")));
check('review queue excludes paused and abandoned paths',()=>{
 const api=readFileSync(join(root,'src/app/api/learning/v5/route.ts'),'utf8');
 assert.ok(api.includes('["active", "completed"].includes(path.status)'));
 assert.ok(api.includes('.in("status", ["active", "completed"])'));
 assert.ok(api.includes('.in("path_id", reviewableIds)'));
});
check('quiz answer index private before submission',()=>{
 const g=sql2.match(/grant select \(([^)]+)\)\s+on public\.learning_questions to authenticated;/i);
 assert.ok(g); assert.ok(!g[1].includes('correct_index')); assert.ok(!g[1].includes('explanation'));
});
check('quiz submission calculates score server-side',()=>assert.match(sql2,/round\(100\.0\*correct_count\/question_count\)::int/));
check('quiz publication requires questions server-side',()=>assert.match(sql2,/question_count < 1 or question_count > 100/));
check('published quiz questions frozen at DB level',()=>assert.match(sql2,/create trigger learning_questions_publication_guard/));
check('question mutations serialize with quiz publication',()=>assert.match(sql2,/where id=referenced_quiz and user_id=\(select auth\.uid\(\)\) for update/));
check('submission bounds answer to number of options',()=>assert.match(sql2,/given::int >= question\.choice_count/));
check('review date bounded to local calendar/UTC ±1 day',()=>assert.match(sql1,/Review date out of range/));
check('null review assessment cannot be treated as mastered',()=>assert.match(sql1,/p_assessment is null or p_assessment not in/));
check('quiz attempts protected from direct write',()=>assert.match(sql2,/revoke insert,update,delete on public\.learning_quiz_attempts from authenticated/));
check('planning links protected from direct write',()=>assert.match(sql2,/revoke insert,update,delete on public\.learning_activity_plans from authenticated/));
check('auth owner checked in all SECURITY DEFINER entry points',()=>{
 for(const fn of ['complete_learning_review','initialize_learning_path','submit_learning_quiz','plan_learning_activity']){
  const text=sql1+'\n'+sql2; const start=text.indexOf('function public.'+fn+'(');assert.ok(start>0,fn);
  const body=text.slice(start,text.indexOf('$$;',start)+3);
  assert.match(body,/auth\.uid\(\)/,fn);
  assert.match(text,new RegExp(`revoke all on function public\\.${fn}\\(`),fn);
 }
});
check('review step algorithm matches SQL 6-stage intervals',()=>{
 assert.deepEqual([...REVIEW_INTERVAL_DAYS],[1,3,7,14,30,60]);
 assert.ok(sql1.includes('(array[1,3,7,14,30,60])[next_step+1]'));
 const answers=['forgot','fragile','correct','mastered'];
 for(let step=0;step<=5;step++) for(const answer of answers){
  const v=nextReviewStep(step,answer);
  const expected=answer==='forgot'?0:answer==='fragile'?Math.max(0,step-1):answer==='correct'?Math.min(5,step+1):Math.min(5,step+2);
  assert.equal(v.step,expected);assert.equal(v.afterDays,REVIEW_INTERVAL_DAYS[expected]);
 }
});
check('learning metrics positive example',()=>{
 assert.equal(totalLearningMinutes([{duration_minutes:12},{duration_minutes:-2},{duration_minutes:23}]),35);
 assert.deepEqual(learningMinutesByPath([{path_id:'a',duration_minutes:15},{path_id:'b',duration_minutes:10},{path_id:'a',duration_minutes:20}]),{a:35,b:10});
 assert.equal(evidenceOfApplication([{result:'applied',duration_minutes:10},{result:'studied',duration_minutes:10}]),1);
});
check('quiz percentage and path ratio edge cases',()=>{
 assert.equal(quizPercentage(2,4),50);assert.equal(quizPercentage(0,0),null);assert.equal(quizPercentage(5,4),null);
 assert.equal(completedRatio(0,0),null);assert.equal(completedRatio(6,5),100);
});
check('learning APIs owner filter/authorization',()=>{
 for(const file of ['src/app/api/learning/v5/route.ts','src/app/api/learning/v5/advanced/route.ts','src/app/api/learning/v5/coach/route.ts']){
  const code=readFileSync(join(root,file),'utf8');
  assert.match(code,/requireUser\(\)/);assert.match(code,/\.eq\("user_id",/);
 }
});
check('coach requires explicit consent and does not persist automatically',()=>{
 const coach=readFileSync(join(root,'src/app/api/learning/v5/coach/route.ts'),'utf8');
 assert.match(coach,/consent: z\.literal\(true\)/); assert.match(coach,/persisted: false/);
});
console.log(`LOCAL_V5_PREFLIGHT ${checks} passed, ${sources.length} source files parsed; NO PostgreSQL runtime or Next.js build executed.`);
