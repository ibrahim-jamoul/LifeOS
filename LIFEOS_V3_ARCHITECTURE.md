# LifeOS V3 — Architecture fonctionnelle

## Principe

LifeOS V3 sépare strictement le **cap** de l’**exécution** :

```text
VISION
  ↓
OBJECTIFS
  ↓
PROJETS (facultatifs)
  ↓
MISSIONS / TÂCHES
  ↓
PLANIFICATION + RÉCURRENCE DANS AUJOURD’HUI / À VENIR
  ↓
LOGS + KPI
  ↓
WEEKLY REVIEW
```

Un objectif actif ne devient jamais automatiquement une tâche du jour. Pour apparaître dans `Aujourd’hui`, il faut une **action opérationnelle** : tâche planifiée aujourd’hui, occurrence récurrente prévue aujourd’hui, routine prévue aujourd’hui ou rappel arrivé à échéance.

## 1. Vision

La route `/app/goals/vision` est une vue synthétique. Elle n’utilise pas de gros paragraphes comme écran principal : elle résume les horizons existants et récupère dynamiquement le nombre d’objectifs, projets et KPI par domaine PRO / PERSO / RELIGION.

L’administration brute reste accessible via `/app/goals/vision-admin` afin de ne pas supprimer la fonctionnalité existante.

## 2. Objectifs et missions

La route `/app/goals/objectives` est désormais une vue métier dédiée :

- carte par objectif ;
- progression, statut et échéance ;
- liste des missions directement rattachées ;
- bouton `Ajouter une mission` sur chaque objectif ;
- création d’une mission avec date, heure, durée, priorité, domaine, projet parent et récurrence.

Le lien direct est stocké dans `tasks.goal_id`. Le lien historique `tasks.project_id` reste disponible : une mission peut donc appartenir à un objectif avec ou sans projet intermédiaire.

L’ancien CRUD objectifs est conservé sous `/app/goals/objectives-admin`.

## 3. Planification intégrée à Aujourd’hui

Une tâche dispose de deux notions distinctes :

- `planned_on` + `planned_time` : quand je compte réellement l’exécuter ;
- `due_on` / `due_at` : échéance réelle éventuelle.

Il n’existe plus de page Planning dédiée. La date d’exécution, l’heure facultative et la récurrence restent portées par les tâches, puis sont exploitées par `Aujourd’hui`, son calendrier `À venir` et les missions rattachées aux objectifs.

## 4. Aujourd’hui

Le dashboard `/app/dashboard` est le centre opérationnel mobile-first.

`À faire aujourd’hui` contient uniquement :

- tâches avec `planned_on = aujourd’hui` ;
- tâches sans date de travail mais avec échéance aujourd’hui ;
- occurrences de tâches récurrentes prévues aujourd’hui ;
- routines réellement actionnables aujourd’hui ;
- rappels arrivés à échéance.

Une ancienne tâche simplement active ou une tâche future n’est pas injectée dans cette liste.

Actions rapides :

- Fait ;
- Reporter à demain ;
- Reporter à +7 jours ;
- Replanifier à une date précise ;
- modifier la récurrence pour une série récurrente.

Sous la liste figurent `À venir` puis `Objectifs 2026`, séparés visuellement et fonctionnellement.

## 5. Récurrence

Les tâches utilisent une règle compacte dans `tasks.recurrence_rule` :

- `daily` ;
- `weekly:1,3,5` (jours ISO, lundi = 1) ;
- `monthly:15`.

`recurrence_until` est facultatif.

LifeOS **ne crée pas des centaines de tâches futures**. Les occurrences sont calculées à la demande. Lorsqu’une occurrence récurrente est terminée, seule sa validation est enregistrée dans `task_occurrences`; la tâche mère reste active pour les occurrences suivantes.

Les routines existantes continuent d’utiliser `habits` et `religion_routines`, ce qui évite de dupliquer les concepts.

## 6. KPI

`/app/kpis` reste séparé du dashboard quotidien. Il lit `kpis` et `kpi_entries` et présente les mesures PRO / PERSO / RELIGION avec valeur courante, cible, tendance et progression lorsqu’elles sont disponibles.

## 7. Weekly Review

La revue `/app/review` est calculée depuis les données :

- exécution globale ;
- actions par domaine ;
- routines ;
- KPI ;
- reports répétés ;
- projets sans activité ;
- objectifs avec activité ;
- objectifs sans activité.

La saisie manuelle est réduite à ce que LifeOS ne peut pas déduire : contexte éventuel, éléments à ralentir et priorités de la semaine suivante.

## 8. Conservation de l’existant

Aucun module existant n’est supprimé : objectifs, projets, tâches, alertes, décisions, finances, religion, arabe, Coran, santé, documents, souvenirs, ressources, assistant, export et progression restent disponibles.

Le nouveau tableau de bord s’appuie sur les tables existantes et ajoute uniquement les éléments de schéma nécessaires à l’exécution V3.
