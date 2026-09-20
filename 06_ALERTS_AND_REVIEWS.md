# LifeOS — Alerts, Reminders and Review Engine

## Design objective

The alert engine should surface actionable exceptions, not create notification fatigue.

## Alert types

| Code | Trigger | Default severity | Default lead |
|---|---|---:|---:|
| TASK_OVERDUE | incomplete task past due date | WARNING | immediate |
| TASK_DUE_SOON | task due soon | INFO | 24h |
| GOAL_DUE_SOON | active goal approaching target | WARNING | 7d |
| GOAL_OVERDUE | active goal past target date | CRITICAL | immediate |
| PROJECT_STALE | active/focus project no activity | WARNING | 14d |
| PROJECT_NO_NEXT_ACTION | active/focus project without open task | WARNING | immediate |
| KPI_STALE | active KPI no recent entry | WARNING | based on cadence |
| WEEKLY_REVIEW_MISSING | current/previous weekly review missing | WARNING | configured |
| DECISION_REVIEW_DUE | decision review date reached and outcome empty | WARNING | immediate |
| DOCUMENT_EXPIRY | document approaching expiry | INFO/WARNING/CRITICAL | 90/30/7d |
| QURAN_REVISION_DUE | revision date reached | INFO | immediate |
| REMINDER | explicit user reminder | INFO | configured |
| BUDGET_THRESHOLD | category actual > configured limit | WARNING | immediate |

## Notification lifecycle

```text
created -> unread -> read
                 -> snoozed -> unread when due
                 -> dismissed
```

Fields:
- source_type
- source_id
- alert_code
- title
- body
- severity
- due_at
- read_at
- dismissed_at
- snoozed_until
- dedupe_key

## Idempotency

Persisted alerts must use a deterministic `dedupe_key`.

Example:
`DOCUMENT_EXPIRY:<document_id>:30d:<expiry_date>`

Unique by `(user_id, dedupe_key)`.

Never generate duplicates every cron run.

## Dashboard alerts vs persisted notifications

Not every warning needs a notification row.

Use query-derived dashboard state for:
- overdue tasks;
- goals at risk;
- project missing next action.

Use persisted notifications for:
- time-specific reminder;
- expiry windows;
- review dates;
- explicit reminders.

## Reminder object

A reminder may link to:
- goal
- project
- task
- document
- Quran item
- decision
- generic note

P0 recurrence:
- none
- daily
- weekly
- monthly

Store timezone and next occurrence.

Advanced RRULE is P1.

## Weekly review engine

User setting:
- preferred review weekday;
- local timezone.

The app should:
- show a dashboard prompt on/after review day;
- allow completion for an ISO week;
- create a warning when the review remains missing.

## Project health heuristic

Display, do not overstate.

`GREEN`
- active/focus;
- has next action;
- no overdue milestone;
- activity within 14d.

`AMBER`
- one warning condition.

`RED`
- blocked;
- target overdue;
- multiple warning conditions.

Manual status remains authoritative.

## Goal health heuristic

Inputs:
- target date;
- progress;
- latest KPI classification;
- linked project health.

Display:
- on track;
- watch;
- at risk;
- unknown.

If insufficient data, show `unknown`; never infer false precision.

## Priority scoring

Optional decision support:
`score = (impact * urgency * confidence) / max(effort, 1)`

Use only for comparison. Never auto-start, auto-stop or auto-cancel a project.

## Scheduling recommendation

First deployment:
- deterministic dashboard checks on every authenticated load;
- one daily scheduled notification generation job.

This works even under conservative hosting limits.

If higher timing precision is needed later, use Supabase Cron/Edge Functions or a higher-frequency supported scheduler.
