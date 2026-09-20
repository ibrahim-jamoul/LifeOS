# LifeOS — Information Architecture

## Route map

```text
/
└── redirect to /app or /login

/login
/signup
/reset-password

/app
├── /dashboard
├── /religion
│   ├── /topics
│   ├── /sessions
│   └── /routines
├── /arabic
│   ├── /sessions
│   └── /progress
├── /quran
│   ├── /items
│   ├── /sessions
│   └── /revision
├── /goals
│   ├── /objectives
│   ├── /projects
│   ├── /tasks
│   ├── /kpis
│   ├── /decisions
│   └── /reviews
├── /assistant
├── /finances
│   ├── /accounts
│   ├── /transactions
│   ├── /budgets
│   ├── /goals
│   └── /net-worth
├── /health
│   ├── /habits
│   ├── /metrics
│   └── /workouts
├── /documents
├── /memories
├── /alerts
└── /settings
```

## Dashboard information hierarchy

1. Critical alerts
2. Today
3. Top 3 focus projects
4. Active objectives health
5. This week
6. KPI signals
7. Branch snapshots
8. Recent activity

## Universal record conventions

Every important record should expose:
- title/name;
- status;
- created/updated timestamp;
- notes where relevant;
- edit action;
- delete/archive action.

## Search

P1 global search across:
- goal titles;
- projects/tasks;
- decision titles;
- study topics;
- document titles/metadata;
- memory titles/descriptions.

Do not index private binary file contents in P0.

## Interaction patterns

### Create
Use modal or sheet for short forms; full page for complex records.

### Edit
Prefill current values. Validate before save.

### Delete
Confirmation required. For goals/projects, archive should be more prominent than delete.

### Empty state
Explain the purpose in one sentence and show one primary CTA.

### Errors
Never show raw database errors to the user. Log server-side details and show actionable user-facing text.

## Responsive behavior

Desktop:
- persistent sidebar;
- two/three-column dashboards.

Mobile:
- bottom nav or compact drawer;
- single-column;
- quick capture always accessible.

## Accessibility baseline

- semantic labels;
- keyboard navigation for forms/dialogs;
- visible focus;
- sufficient contrast;
- do not encode status only by color.
