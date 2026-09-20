# LifeOS — Acceptance Tests / Definition of Done

## P0 release gate

All items below must pass before calling LifeOS operational.

### Auth & isolation
- [ ] User A can sign up/sign in/sign out/reset password.
- [ ] Unauthenticated visitor cannot open `/app/*`.
- [ ] User A cannot read User B rows by changing IDs or query parameters.
- [ ] User A cannot update/delete User B rows.
- [ ] RLS remains effective even if client code is bypassed.

### Initialization
- [ ] First login creates exactly the 9 LifeOS branches.
- [ ] Initialization is idempotent.

### Goals / projects / tasks
- [ ] Create/edit/archive a goal.
- [ ] Link project to goal.
- [ ] Create task under project.
- [ ] Complete task.
- [ ] Overdue task appears on dashboard.
- [ ] Project with no next action is visibly warned.
- [ ] >3 focus projects produces a warning, not a hard block.

### KPI
- [ ] Create KPI.
- [ ] Add numeric entry.
- [ ] Latest state updates.
- [ ] Missing/insufficient data is not shown as success.

### Decisions/reviews
- [ ] Decision can be created with review date.
- [ ] Due decision review creates warning.
- [ ] One weekly review per week can be saved.
- [ ] Weekly review appears in history.

### Alerts
- [ ] Alerts link to their source.
- [ ] Read/unread works.
- [ ] Snooze works.
- [ ] Dismiss works where allowed.
- [ ] Re-running generator creates no duplicate alert for same dedupe key.

### Religion
- [ ] Create study topic.
- [ ] Log study session.
- [ ] Create user-defined routine and log it.

### Arabic
- [ ] Log session with skill and duration.
- [ ] Weekly minutes reflect entered sessions.

### Quran
- [ ] Create Quran item/range.
- [ ] Log recitation/memorization/revision session.
- [ ] Due revision is shown.

### Finance
- [ ] Create account.
- [ ] Add income and expense.
- [ ] Transfer does not inflate income/expense.
- [ ] Monthly totals are correct.
- [ ] Net-worth snapshot can be saved.

### Health / habits
- [ ] Create habit and log completion.
- [ ] Create metric and add entry.
- [ ] Log workout.
- [ ] Trend view displays real entered points.

### Documents
- [ ] Upload private document.
- [ ] Metadata searchable/filterable.
- [ ] Authenticated owner can retrieve it.
- [ ] Anonymous access fails.
- [ ] Other user access fails.
- [ ] Expiry alert appears.
- [ ] Delete workflow is consistent.

### Memories
- [ ] Create memory.
- [ ] Upload multiple photos.
- [ ] Timeline orders by date.
- [ ] Private media cannot be read anonymously.

### AI
- [ ] Without AI key, app works and assistant shows disabled/config-required state.
- [ ] With AI key, query is executed server-side.
- [ ] AI secret is absent from client JS.
- [ ] Selected scope changes context.
- [ ] No write occurs without explicit confirmation.

### Export
- [ ] User can export structured data as JSON.
- [ ] Export contains only that user's data.

### Deployment
- [ ] Local setup documented.
- [ ] Production deploys to Vercel.
- [ ] Production connects to Supabase.
- [ ] Required environment variables documented.
- [ ] No credentials committed to git.

## Quality gate

Run:
- lint;
- typecheck;
- unit tests;
- integration tests;
- P0 E2E tests.

No known P0 security bug may remain open.
