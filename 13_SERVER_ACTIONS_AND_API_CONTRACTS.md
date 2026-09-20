# Server Actions / API Contracts

This document is conceptual; Codex may implement Server Actions or Route Handlers according to the current stable Next.js pattern.

## Mutation contract

Every mutation returns a typed result:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string,string[]> } }
```

Do not pass raw Postgres errors to the client.

## Core operations

### Goals
- createGoal(input)
- updateGoal(id, input)
- archiveGoal(id)
- deleteGoal(id) — secondary/destructive

### Projects
- createProject(input)
- updateProject(id, input)
- setProjectStatus(id, status)
- linkProjectToGoal(projectId, goalId)
- archiveProject(id)

### Tasks
- createTask(input)
- updateTask(id, input)
- completeTask(id)
- deleteTask(id)

### KPI
- createKpi(input)
- addKpiEntry(kpiId, value, measuredAt, note)
- updateKpi(id, input)

### Review / decisions
- saveWeeklyReview(input)
- createDecision(input)
- updateDecisionOutcome(id, input)

### Files
- requestUpload / upload using Supabase Storage client under user auth
- createDocumentMetadata
- deleteDocumentAndObject
- createMemory
- attachMemoryAsset
- deleteMemoryAsset

### Export
- exportLifeOSJson()

## Authorization rule

Never authorize using a client-provided `user_id`.

Resolve the authenticated user on the trusted side and set/verify ownership from session/JWT.

## Idempotency

Use idempotent behavior for:
- initialization;
- notification generation;
- Storage metadata reconciliation where possible.
