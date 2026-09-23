# LifeOS V3 — Changelog

Date: 2026-09-24
Base: `LifeOS-main-ui-list-style-2026-09-22.zip`
Référence fonctionnelle: `Referentiel perso.docx`

## Principes conservés

- La base Next.js/Supabase existante est conservée.
- Aucun module existant n'est supprimé.
- Authentification, routes, RLS, tables et mécanismes de logs existants restent en place.
- `planned_on` reste la date opérationnelle d'exécution; `due_on` / `due_at` restent les vraies échéances.
- Les routines existantes (`habits`, `religion_routines`) restent le moteur principal de récurrence régulière.

## Fichiers ajoutés

- `src/components/dashboard-panels.tsx`
- `src/app/app/kpis/page.tsx`
- `supabase/migrations/20260924003000_lifeos_v3_planning_links.sql`
- `LIFEOS_V3_CHANGELOG.md`
- `LIFEOS_V3_ARCHITECTURE.md`

## Fichiers modifiés

- `src/app/app/dashboard/page.tsx`
- `src/app/app/review/page.tsx`
- `src/components/today-manager.tsx`
- `src/components/app-shell.tsx`
- `src/lib/resources.ts`

## Fonctionnalités ajoutées

### Aujourd'hui

- Conserve uniquement les tâches réellement planifiées, dues ou en retard et les routines actionnables du jour.
- Ajout d'une action rapide `Replanifier` en plus de `Fait`, `Demain` et `+7 jours`.
- Les objectifs/projets restent exclus de l'éligibilité quotidienne.

### À venir

- Nouveau panneau compact directement sous Aujourd'hui.
- Liste les prochaines tâches ayant un `planned_on` futur.
- Une tâche future n'est pas injectée dans Aujourd'hui avant sa date.
- Groupement par date et affichage du domaine et de la durée estimée.

### Objectifs 2026

- Nouveau panneau stratégique distinct du bloc quotidien.
- Affiche titre, domaine, progression, échéance, statut et nombre de missions restantes calculables via les projets liés.
- Les objectifs ne sont jamais traités comme des actions du jour.

### Missions / tâches

- Ajout d'un lien direct optionnel `goal_id` en plus de `project_id`.
- Ajout des champs `recurrence_rule` et `recurrence_until` pour préparer les missions récurrentes ponctuelles.
- Les routines fréquentes doivent continuer à utiliser les tables dédiées afin d'éviter de générer des centaines de tâches.

### KPI Dashboard

- Nouvelle route `/app/kpis`.
- Vue séparée par PRO / PERSO / RELIGION.
- Affichage de la valeur actuelle, cible, tendance, progression et statut lorsque les données le permettent.
- Les KPI ne sont pas injectés sur l'écran Aujourd'hui.

### Weekly Review

- Ajout d'une synthèse structurée avant la zone de décision:
  - exécution globale;
  - actions par domaine;
  - routines réalisées / attendues;
  - reports répétés;
  - projets stagnants;
  - objectifs actifs.
- Les faits sont dérivés des données existantes. Les champs manuels restent limités aux arbitrages et à la préparation de la semaine suivante.

## Migration Supabase requise

Appliquer:

`supabase/migrations/20260924003000_lifeos_v3_planning_links.sql`

Cette migration est additive et ajoute:

- `tasks.goal_id`
- `tasks.recurrence_rule`
- `tasks.recurrence_until`
- `profiles.day_start_time`
- `profiles.day_end_time`
- `profiles.onboarding_completed_at`
- `goals.progress_mode`
- `goals.review_cadence`

Un FK propriétaire `(goal_id, user_id)` est créé vers `goals(id, user_id)` et un index partiel est ajouté sur les tâches actives liées à un objectif.

## Modèle de données

Aucune table existante n'est remplacée. La V3 conserve la chaîne:

`VISION -> GOALS -> PROJECTS -> TASKS/ROUTINES -> PLANNING -> TODAY -> LOGS/KPI -> WEEKLY REVIEW`

Les tâches peuvent maintenant être reliées directement à un objectif ou indirectement via un projet. Le lien direct reste optionnel pour conserver la compatibilité avec les données existantes.

## Fonctionnalités conservées

- objectifs;
- projets;
- tâches;
- KPI et mesures;
- alertes;
- décisions;
- finances;
- religion;
- arabe;
- Coran;
- santé et habitudes;
- documents;
- souvenirs;
- ressources;
- assistant;
- export;
- progression;
- insights;
- authentification Supabase;
- RLS et contrôles existants.

## Fonctionnalités supprimées

Aucune.

## Récurrence

- Le moteur `habits` / `religion_routines` reste prioritaire pour les routines quotidiennes, hebdomadaires et mensuelles.
- `tasks.recurrence_rule` prépare une extension pour les missions récurrentes ponctuelles, sans créer artificiellement des occurrences futures en masse.
- Aucun générateur massif de tâches futures n'est introduit.

## Limitations restantes

- La migration de `life_vision` vers un modèle multi-lignes compact par domaine/horizon n'est pas imposée dans cette version afin d'éviter une migration destructive de la table singleton existante.
- Le moteur générique de récurrence de tâches n'instancie pas encore automatiquement des occurrences; les routines existantes restent la solution opérationnelle.
- Les rendez-vous externes ne sont pas synchronisés avec un calendrier tiers dans ce ZIP.
- Le nombre de missions restantes d'un objectif est calculé à partir des tâches des projets liés; les missions liées uniquement via `tasks.goal_id` seront pleinement comptabilisées après extension du calcul serveur.
- Aucun déploiement Supabase/Vercel n'est effectué par ce ZIP: la migration doit être appliquée avant mise en production.

## Validation locale

Le projet a été audité et modifié sans réécriture globale. L'installation des dépendances a été tentée pour exécuter la suite complète, mais `npm ci` n'a pas pu se terminer dans l'environnement de génération (timeout de transport), empêchant l'exécution fiable de `typecheck`, `test` et `build` ici. La validation de production reste donc à exécuter après extraction avec `npm ci && npm run check`, puis les tests E2E avec un environnement Supabase configuré.
