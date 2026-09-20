# LifeOS — Functional Specification

## A. Authentication

### P0
- Sign up with email/password.
- Sign in/out.
- Password reset.
- Protected app routes.
- First-login initialization of 9 branches.

### Acceptance
An unauthenticated visitor cannot access app data or authenticated pages.

---

## B. Global shell

### P0
Left sidebar on desktop, compact navigation on mobile:
- Dashboard
- Religion
- Arabic
- Quran
- Goals
- AI Assistant
- Finances
- Health
- Documents
- Memories
- Settings

Top bar:
- quick capture;
- alert count;
- search optional P1;
- profile menu.

---

## C. Dashboard

### P0 widgets
1. Today tasks.
2. Overdue items.
3. Upcoming 7 days.
4. Active objectives.
5. Focus projects.
6. KPI signals.
7. Alerts.
8. Recent activity.

### P1
- configurable widgets;
- 30/90-day trend cards.

---

## D. Vision and planning

### P0
Single user-editable Life Vision record:
- one-year;
- three-year;
- five-year optional;
- current-quarter focus;
- last review date.

---

## E. Goals

### Status
`draft`, `active`, `at_risk`, `achieved`, `paused`, `cancelled`, `archived`

### Required fields
- title
- desired_outcome
- target_date optional but strongly recommended
- status
- priority
- definition_of_done

### Behavior
- create/read/update/archive;
- link KPIs;
- link projects;
- compute progress from explicit `progress_percent` or linked project state;
- overdue flag when target date has passed and not terminal.

---

## F. Projects

### Status
`backlog`, `focus`, `active`, `blocked`, `paused`, `done`, `cancelled`, `archived`

### Fields
- title
- summary
- goal link(s)
- status
- priority
- target date
- next milestone
- impact 1–5
- urgency 1–5
- confidence 1–5
- effort 1–5
- budget planned/actual optional
- progress 0–100
- next action

### Advisory score
`round((impact * urgency * confidence) / effort, 2)`

Never automatically reorder manual `focus` based solely on this score.

### Warnings
- >3 focus projects;
- active project with no open task;
- project untouched for 14 days;
- blocked project without blocker note.

---

## G. Tasks

### Status
`todo`, `doing`, `blocked`, `done`, `cancelled`

### P0
- create/edit/complete/delete;
- project optional;
- due date/time;
- priority;
- estimate minutes;
- notes;
- recurring flag optional P1.

### Views
- today;
- this week;
- overdue;
- by project.

---

## H. KPIs

### Fields
- name
- unit
- target type: `min`, `max`, `exact`, `range`, `none`
- target value(s)
- cadence
- objective
- direction
- active

### Entry
- timestamp/date
- numeric value
- note

### State
A helper classifies latest value as:
- `on_track`
- `watch`
- `off_track`
- `insufficient_data`

Do not claim statistical significance.

---

## I. Decision Journal

### Fields
- title
- decision date
- context
- options considered
- selected option
- assumptions
- expected outcome
- review date
- actual outcome
- lesson
- linked project/goal

### Behavior
When review date is due and actual outcome is empty, create warning.

---

## J. Weekly Review

### Fields
- week start
- wins
- misses
- causes
- risks
- pause_or_stop
- next_week_top3
- notes
- completed_at

### Behavior
One review per user per ISO week.
If missing after configurable weekly deadline, create warning.

---

## K. Religion

P0:
- study topics CRUD;
- study sessions CRUD;
- user-defined routines;
- routine logs;
- branch dashboard.

P1:
- resource links;
- topic progress.

No theological auto-grading.

---

## L. Arabic

P0:
- sessions;
- skill category;
- duration;
- words new/reviewed optional;
- current self-assessed level;
- weekly target minutes;
- notes/resources.

P1:
- vocabulary item list;
- spaced review.

---

## M. Quran

P0:
- Quran items/ranges;
- activity type;
- sessions;
- confidence;
- next revision date;
- revision alerts.

P1:
- revision queue view;
- statistics per activity type.

---

## N. AI Assistant

### P1 but designed from start

Provider abstraction:
- OpenAI-compatible adapter;
- optional second provider later.

Required:
- API calls only from server;
- user chooses scope;
- context is generated from structured LifeOS records;
- limit data volume;
- no secrets logged;
- no binary files automatically transmitted.

Tools/actions:
- read-only first.
- write proposals produce a diff/preview.
- explicit user confirmation required before write.

If no API key:
show a clear disabled state; rest of LifeOS works normally.

---

## O. Finance

P0:
- accounts;
- transactions;
- categories;
- monthly summary;
- financial goals;
- net-worth snapshots.

Rules:
- transfers should not count as income/expense totals;
- currency stored per account/transaction;
- no automatic FX conversion in P0.

P1:
- CSV import;
- recurring transactions;
- multi-currency conversion with external FX provider.

---

## P. Health / Sport / Habits

P0:
- habit definition;
- daily habit log;
- health metric definition;
- metric entries;
- workout log;
- trend charts.

P1:
- import adapters.

No medical diagnosis.

---

## Q. Documents

P0:
- private upload;
- metadata;
- search/filter;
- signed/private retrieval;
- delete;
- expiry reminders.

Supported first-pass types:
PDF, common images, Office documents where Storage accepts them.
Do not parse/OCR by default.

---

## R. Memories

P0:
- create memory;
- date/date range;
- location text;
- description/tags;
- multi-file media upload;
- timeline;
- view/delete.

P1:
- albums;
- cover image;
- map integration.

---

## S. Alerts/Notifications

Sources:
- tasks;
- goals;
- document expiries;
- Quran revisions;
- decision reviews;
- weekly reviews;
- user reminders.

Required:
- idempotent generation;
- source link;
- severity;
- read;
- dismissed;
- snoozed_until.

See `06_ALERTS_AND_REVIEWS.md`.

---

## T. Settings

P0:
- timezone;
- week start;
- weekly review day;
- default currency;
- alert lead times;
- export data;
- account delete path/instructions.

P1:
- AI provider settings;
- import settings.

---

## U. Export / portability

P0:
- JSON export of structured LifeOS data.
- file export can be handled separately.

P1:
- CSV per module.

Do not intentionally create data lock-in.

---

## V. Audit / activity

P0 minimal activity log for:
- goal/project created/changed;
- decision created;
- review completed;
- document uploaded/deleted.

No need to log every text edit.
