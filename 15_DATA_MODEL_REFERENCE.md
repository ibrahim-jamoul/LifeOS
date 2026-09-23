# Data Model Reference

## Control plane
`life_vision`
→ `goals`
→ `goal_projects`
→ `projects`
→ `tasks`

`goals`
→ `kpis`
→ `kpi_entries`

`goals/projects`
→ `decisions`

`weekly_reviews` summarizes the operating cycle.

## Learning
Religion:
- `study_topics`
- `study_sessions`
- `religion_routines`
- `religion_logs`

Arabic:
- `arabic_profiles`
- `arabic_sessions`

Quran:
- `quran_items`
- `quran_sessions`

## Finance
- `financial_accounts`
- `financial_transactions`
- `budget_items`
- `financial_goals`
- `net_worth_snapshots`

## Health
- `habits`
- `habit_logs`
- `health_metrics`
- `health_entries`
- `workouts`

## Private content
Documents:
- metadata `documents`
- binary Storage bucket `documents`

Memories:
- metadata `memories`, `memory_assets`
- binary Storage bucket `memories`

## AI
- `ai_threads`
- `ai_messages`

## System
- `profiles`
- `domains`
- `reminders`
- `notifications`
- `activity_log`

## Ownership

Every application row directly stores `user_id` even where it is technically derivable from a parent row.

Reason:
- simpler RLS;
- simpler security review;
- easier export;
- easier direct ownership checks.

Application mutations must ensure child and parent records belong to the same authenticated user.

## Additive routine scheduling windows (Manager Mode — 2026-09-22)

`habits` and `religion_routines` keep their existing frequency and single-day fields. Two additive columns represent multi-day execution windows without parsing descriptive text:

- `schedule_window_weekdays smallint[]`: ISO weekdays `1..7` belonging to one logical occurrence (for example `{6,7}` for a weekend window);
- `schedule_month_weeks smallint[]`: optional ordinal occurrences `1..5` of that weekday/window inside the month.

These fields do not replace `schedule_weekday` / `schedule_day_of_month`. They are used only when a real execution window is explicitly known. `time_context` remains descriptive. No RLS policy changes are required because the columns belong to the existing user-owned tables.
