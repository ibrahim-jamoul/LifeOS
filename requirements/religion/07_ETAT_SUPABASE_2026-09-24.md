# 07 — État Supabase constaté le 24/09/2026

Projet vérifié : **LifeOS**.

## Volumétrie Religion constatée

| Table / scope | Lignes |
|---|---:|
| religion_routines | 13 |
| religion_logs | 10 |
| study_topics | 10 |
| study_sessions | 0 |
| arabic_profiles | 2 |
| arabic_sessions | 0 |
| quran_items | 0 |
| quran_sessions | 0 |
| resources avec `life_area='religion'` | 0 |
| goals Religion | 0 |
| tasks Religion | 0 |
| habits Religion | 0 |
| kpis Religion | 0 |

## Conclusion

La partie Religion n'est pas "vide" au sens strict :
- la structure existe ;
- certaines routines et sujets existent ;
- les logs de routines existent.

En revanche, le suivi de progression détaillé est encore largement vide :
- pas d'éléments Coran ;
- pas de sessions Coran ;
- pas de sessions Arabe ;
- pas de sessions d'étude ;
- pas de ressources Religion ;
- pas encore de jointure avec le système global objectifs/KPI.

Cette V1 doit donc **alimenter l'existant** plutôt que reconstruire toute la base.

## Schéma utile vérifié

`quran_items` :
- id, user_id, surah_number, surah_name, start_ayah, end_ayah,
  activity, status, confidence, next_revision_at, notes, created_at, updated_at.

`quran_sessions` :
- id, user_id, quran_item_id, occurred_at, duration_minutes,
  activity, confidence, outcome, next_revision_at, created_at.

`religion_routines` :
- inclut fréquence, count, durée, planning weekday/monthday, contexte temps,
  rappel, liens goal/project/kpi, statut.

`religion_logs` :
- routine_id, date/heure, count, note.

`study_topics` / `study_sessions` et `arabic_profiles` / `arabic_sessions`
sont déjà disponibles et doivent être réutilisés.
