# 08 — Jointure future avec Objectifs / Aujourd'hui / KPI

## Pourquoi ne pas tout fusionner maintenant

Une autre évolution de LifeOS travaille sur :
- Objectifs ;
- planification ;
- vue Aujourd'hui ;
- KPI ;
- revues.

La branche Religion doit donc être construite aujourd'hui de façon compatible, sans dépendre d'une architecture encore en évolution.

## Règle de séparation

### Module Religion
Responsable de :
- contenu religieux ;
- sessions ;
- progression spécifique ;
- Coran ;
- Arabe ;
- étude ;
- duʿāʾ/adhkār ;
- routines spécifiques ;
- points d'attention Coran.

### Système global
Responsable de :
- objectifs long terme ;
- tâches ;
- planification transversale ;
- KPI consolidés ;
- dashboard global ;
- revue hebdomadaire/mensuelle globale.

## Jointures prévues

Trois objectifs globaux Religion :
1. Coran — 3 pages/mois.
2. Arabe — ~30 min/jour.
3. Apprentissage religieux quotidien.

Ils pourront être créés dans `goals(life_area='religion')`.

Les `religion_routines` pourront ensuite être liées par `goal_id` / `kpi_id`.

Les données de domaine restent la source factuelle :
- Coran → quran_items/quran_sessions/quran_revision_points ;
- Arabe → arabic_sessions ;
- étude → study_sessions ;
- routines → religion_logs.

Le système global doit **agréger** ces données, pas les recopier.

## Exemples de KPI calculables

- Coran pages/mois.
- Arabe : jours >= 30 minutes.
- Apprentissage religieux : jours avec au moins un événement d'apprentissage.
- Seerah : sessions/semaine.
- Dhikr : respect de la routine.
- Sadaqa : vendredi réalisé.
- Points Coran : actifs / résolus / réapparus.
