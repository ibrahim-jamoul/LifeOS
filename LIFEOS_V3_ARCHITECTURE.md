# LifeOS V3 — Architecture fonctionnelle

## Chaîne principale

```text
VISION
  ↓
GOALS
  ↓
PROJECTS
  ↓
TASKS / ROUTINES
  ↓
PLANNING
  ↓
TODAY
  ↓
LOGS / KPI
  ↓
WEEKLY REVIEW
```

## 1. Vision

La vision décrit une direction et ne produit jamais directement des éléments quotidiens. Elle sert à cadrer les objectifs.

## 2. Goals

Les objectifs représentent des résultats à obtenir. Ils portent notamment un domaine, un statut, une progression, un horizon et une échéance. Ils ne doivent jamais apparaître dans Aujourd'hui uniquement parce qu'ils sont actifs.

## 3. Projects

Les projets regroupent le travail permettant de faire progresser un ou plusieurs objectifs. La table `goal_projects` conserve la relation plusieurs-à-plusieurs existante.

## 4. Tasks / routines

Deux moteurs complémentaires:

- `tasks`: actions/missions concrètes et planifiables;
- `habits` / `religion_routines`: actions récurrentes régulières.

Une tâche peut maintenant avoir un `goal_id` direct et/ou un `project_id`.

## 5. Planning

`planned_on` est la date de travail opérationnelle.

`due_on` / `due_at` représentent l'échéance réelle et ne sont pas modifiés lors d'un report opérationnel.

Une tâche future appartient à À venir. Elle bascule dans Aujourd'hui lorsque `planned_on` correspond à la date courante.

## 6. Today

Critères d'éligibilité:

- `planned_on = aujourd'hui`;
- vraie échéance aujourd'hui;
- échéance ou planification passée non terminée;
- routine dont une occurrence est actionnable aujourd'hui.

Sont exclus:

- visions;
- objectifs;
- projets;
- KPI;
- tâches futures.

## 7. Logs / KPI

Les logs enregistrent les réalisations. Les KPI mesurent les tendances et les objectifs mesurables. Ils sont consultés dans un dashboard séparé afin de garder Aujourd'hui opérationnel.

## 8. Weekly Review

La revue exploite les données structurées:

- taux d'exécution;
- répartition PRO / PERSO / RELIGION;
- routines attendues/réalisées;
- reports répétés;
- projets stagnants;
- objectifs actifs.

Le texte manuel ne sert qu'aux informations que LifeOS ne peut pas déduire et à la préparation de la semaine suivante.

## Principe de source de vérité

`Referentiel perso.docx` est une source de préparation et de réflexion. Les données définitives doivent être stockées dans LifeOS; le référentiel ne doit pas devenir une seconde base durable.
