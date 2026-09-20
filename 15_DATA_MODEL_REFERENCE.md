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
