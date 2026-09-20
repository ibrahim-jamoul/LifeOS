# LifeOS — User Guide

## 1. First launch

### Step 1 — Create the account
Use email/password authentication. Email verification may be enabled in Supabase.

### Step 2 — Initialize LifeOS
On first login, LifeOS creates the 9 branches automatically.

### Step 3 — Set the planning horizon
Complete:
- 1-year direction;
- 3-year direction;
- optional 5-year direction;
- current quarter focus.

Do not attempt to make the vision perfect. It can be edited.

### Step 4 — Import or create current objectives
Start with the objectives in `08_INITIAL_2026_PORTFOLIO.md`, edit them, and archive those that are not relevant.

### Step 5 — Choose the active portfolio
Mark at most:
- 3 projects as `FOCUS`;
- 3–5 projects as `ACTIVE`;
- the rest as `BACKLOG`, `PAUSED`, `DONE` or `CANCELLED`.

The system may warn when focus is overloaded but must not block the user.

---

## 2. Dashboard

The dashboard is the default operating screen.

It should show:

### Today
- tasks due today;
- overdue tasks;
- reminders;
- habits due today.

### This week
- top project milestones;
- upcoming deadlines;
- KPI targets due for update;
- planned study/sport activity.

### Objective health
For each active objective:
- status;
- progress;
- deadline;
- linked project count;
- latest KPI state;
- warning if off track.

### Portfolio
Show active projects ordered by:
1. manual focus status;
2. priority;
3. nearest deadline.

Each project card should show:
- objective link;
- next task;
- deadline;
- progress;
- effort estimate;
- current risk.

### Alerts
Examples:
- goal deadline in 7 days;
- task overdue;
- document expires in 30 days;
- no KPI entry for 14 days;
- weekly review missing;
- budget threshold exceeded;
- Quran revision due.

### Quick capture
One universal button:
- task;
- note;
- metric;
- decision;
- transaction;
- study session;
- health entry.

---

## 3. Branch 1 — Religion

### Goal
Plan and record religious learning and optional routines.

### Main screen
Show:
- current study topics;
- this week's study target;
- recent sessions;
- optional routines;
- notes/reflections.

### Add a study topic
Fields:
- title;
- category: Islamic history / aqeedah / fiqh / seerah / hadith sciences / other;
- target date optional;
- source/resource optional;
- status;
- notes.

### Record a session
Fields:
- topic;
- date/time;
- duration;
- what was covered;
- takeaway/notes.

### Religious routines
User-defined only. Examples may be offered, but never assume or force a religious practice.

Track:
- target frequency;
- completion;
- notes.

### Completion
A topic is complete when manually marked completed. Time spent does not automatically imply mastery.

---

## 4. Branch 2 — Arabic

### Goal
Build measurable language progress.

### Dashboard
Show:
- current target;
- minutes studied this week;
- sessions completed;
- vocabulary indicator;
- latest level/self-assessment;
- next planned action.

### Record session
Fields:
- date;
- duration;
- skill: vocabulary / grammar / reading / listening / speaking / writing;
- resource;
- notes;
- optional number of new/reviewed words.

### Progress
Allow optional level tracking:
- custom;
- CEFR-style label if useful;
- no automatic claim that a level has been achieved.

---

## 5. Branch 3 — Quran

### Goal
Separate recitation, memorization and revision.

### Quran item
Fields:
- surah number/name;
- start ayah;
- end ayah;
- activity: recitation / memorization / revision;
- status;
- confidence 1–5 optional;
- next revision date;
- notes.

### Session
Record:
- date;
- duration;
- item;
- outcome;
- next revision.

### Alerts
A revision becomes `due` when `next_revision_at <= now`.

Do not use a single progress percentage as the only measure. Reading, memorization and revision are different.

---

## 6. Branch 4 — Goals, KPIs & Decisions

This is the most important branch.

### Objectives
Required:
- title;
- desired outcome;
- horizon;
- target date;
- status;
- priority;
- definition of done.

Optional:
- domain/category;
- reason;
- risk;
- notes.

### Projects
Required:
- title;
- linked objective;
- status;
- priority;
- next milestone.

Recommended:
- impact 1–5;
- urgency 1–5;
- confidence 1–5;
- effort 1–5;
- budget;
- target date.

LifeOS may calculate an indicative score:
`impact × urgency × confidence / effort`

This is advisory only. Manual priority remains authoritative.

### Tasks
Fields:
- title;
- project optional;
- due date;
- priority;
- status;
- estimated minutes;
- actual minutes optional;
- notes.

### KPIs
Fields:
- name;
- unit;
- direction: increase / decrease / target range;
- target;
- cadence;
- linked objective;
- data points.

### Decisions
Use the decision journal for decisions that cost time, money or strategic optionality.

### Weekly review
Every review should answer:
1. What moved forward?
2. What did not move?
3. Why?
4. What is at risk?
5. What should be stopped/paused?
6. Top 3 outcomes for next week.
7. Any decision to log?

---

## 7. Branch 5 — Personal AI Assistant

### What it can do
Examples:
- "What are my 3 most urgent projects?"
- "Summarize the last 4 weekly reviews."
- "Which objectives have no activity this month?"
- "Compare LifeQuest and SaaS LSS based on the data I entered."
- "Summarize my Arabic activity this week."

### Scopes
The user selects context:
- all LifeOS;
- objectives/projects;
- finance;
- health;
- learning;
- documents metadata;
- memories metadata.

Default: do not send binary document/photo contents to an external AI provider.

### Write actions
AI-generated proposed updates must appear as a preview. User confirms before any database mutation.

---

## 8. Branch 6 — Finances

### Accounts
Examples:
- current account;
- savings;
- brokerage;
- cash;
- liability.

Track:
- current balance;
- currency;
- institution/name;
- include in net worth yes/no.

### Transactions
Fields:
- date;
- account;
- amount;
- category;
- merchant/description;
- type: income / expense / transfer;
- notes.

### Budget
Monthly category target vs actual.

### Net worth
Snapshot:
`assets - liabilities`

### Financial goals
Examples:
- Australia fund;
- emergency fund;
- project budget.

LifeOS provides tracking, not investment recommendations.

---

## 9. Branch 7 — Health, Sport & Habits

### Habits
Fields:
- name;
- frequency;
- target;
- active dates;
- optional reminder.

### Health metrics
User-defined metrics:
- weight;
- sleep duration;
- steps;
- workout duration;
- resting HR;
- custom.

### Workouts
At minimum record:
- date;
- activity;
- duration;
- notes;
- optional intensity.

### Trends
Prefer 7/30/90-day trends. Avoid medical interpretation.

---

## 10. Branch 8 — Personal Documents

### Upload
Each file:
- category;
- title;
- file;
- issue date optional;
- expiry date optional;
- issuer optional;
- notes/tags.

### Categories
Default examples:
- identity;
- education;
- employment;
- finance;
- insurance;
- travel;
- housing;
- vehicle;
- administrative;
- other.

### Security
Files are private. Access through authenticated requests/signed URLs only.

### Alerts
Expiry:
- 90 days;
- 30 days;
- 7 days;
configurable.

---

## 11. Branch 9 — Photos & Memories

### Memory
Fields:
- title;
- date/date range;
- location free text;
- description;
- tags;
- attached photos/videos.

### Views
- timeline;
- albums/tags;
- search.

The first version is not a Google Photos clone. It needs reliable private organization and retrieval.

---

## 12. Alerts

Alerts are generated from data, not manually duplicated.

Severity:
- `INFO`;
- `WARNING`;
- `CRITICAL`.

Examples:
- overdue task: warning;
- objective deadline passed and incomplete: critical;
- document expiry within 7 days: critical;
- no weekly review: warning;
- routine reminder: info.

Alert center supports:
- unread/read;
- snooze;
- dismiss where appropriate;
- direct link to source record.

---

## 13. Review cadence

### Daily — 2 to 5 minutes
- open Dashboard;
- process alerts;
- confirm today tasks;
- quick capture.

### Weekly — 20 to 40 minutes
- complete weekly review;
- update KPIs;
- reorder active projects;
- select top 3 outcomes;
- log strategic decisions.

### Monthly — 30 to 60 minutes
- objective review;
- finance snapshot;
- health trend;
- learning progress;
- archive stale projects;
- adjust next month.

### Quarterly
- revisit vision;
- challenge portfolio;
- cancel projects that no longer justify resources.

---

## 14. Data quality rules

- Avoid vague tasks such as "work on LifeQuest".
- Use a definition of done for objectives.
- Enter actual values, not aspirational values, in KPI entries.
- Archive abandoned projects instead of deleting history.
- Record decisions before outcome is known.
- Do not fabricate missing financial/health values.
