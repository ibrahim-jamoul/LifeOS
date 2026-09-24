# LifeOS V3 — Changelog

## Base utilisée

Cette V3 est reconstruite à partir de `LifeOS-main-ui-list-style-2026-09-22.zip`. Elle ne repart pas de zéro et ne supprime pas les modules existants.

## Fonctionnalités ajoutées

### Dashboard Aujourd’hui

- refonte mobile-first inspirée de la maquette validée ;
- progression globale de la journée ;
- compteurs PRO / PERSO / RELIGION ;
- liste `À faire aujourd’hui` réellement filtrée par date ;
- validation rapide ;
- report demain / +7 jours ;
- replanification sur une date arbitraire ;
- bloc `À venir` ;
- bloc `Objectifs 2026` totalement séparé des tâches ;
- création d’une tâche/mission depuis le dashboard.

### Objectifs → missions

- nouvelle vue `/app/goals/objectives` ;
- chaque objectif affiche ses missions ;
- bouton `Ajouter une mission` sur chaque objectif ;
- rattachement direct via `tasks.goal_id` ;
- projet parent toujours facultatif ;
- l’administration historique reste disponible sous `/app/goals/objectives-admin`.

### Planning

- nouvelle route `/app/planning` ;
- groupes En retard / Aujourd’hui / Demain / Cette semaine / Plus tard / À planifier ;
- création d’une action à une date choisie ;
- heure et durée facultatives ;
- séparation date de travail / échéance réelle.

### Récurrence

- règles quotidiennes, hebdomadaires et mensuelles ;
- pas de génération massive de tâches futures ;
- nouvelle table `task_occurrences` pour mémoriser les validations d’occurrences ;
- une occurrence terminée ne clôt pas la série entière.

### KPI / revue / vision

- navigation directe vers le dashboard KPI ;
- Weekly Review enrichie par données structurées ;
- objectifs avec / sans activité calculés ;
- vue Vision synthétique avec compteurs dynamiques.

## Migration Supabase V3

Fichier : `supabase/migrations/20260924010000_lifeos_v3_execution_model.sql`

Ajouts principaux :

### `tasks`

- `goal_id uuid` ;
- `planned_time time` ;
- `recurrence_rule text` ;
- `recurrence_until date` ;
- FK propriétaire vers `goals` ;
- index planning et objectif.

### `task_occurrences`

Nouvelle table de journalisation des occurrences récurrentes avec :

- ownership par utilisateur ;
- RLS ;
- policies SELECT / INSERT / UPDATE / DELETE ;
- accès accordé au rôle `authenticated` ;
- unicité utilisateur + tâche + date.

### `profiles` / `goals`

Les colonnes V3 déjà envisagées sont créées de manière additive et idempotente lorsqu’elles n’existent pas.

Le projet contient aussi la migration antérieure `20260922235500_add_routine_schedule_windows.sql`, nécessaire au moteur de routines calendrier.

## Fichiers principaux ajoutés

- `src/components/life-dashboard.tsx`
- `src/components/goals-mission-board.tsx`
- `src/components/planning-board.tsx`
- `src/components/vision-overview.tsx`
- `src/app/app/planning/page.tsx`
- `src/app/app/kpis/page.tsx`
- `src/lib/domain/task-recurrence.ts`
- `tests/unit/task-recurrence.test.ts`
- `LIFEOS_V3_ARCHITECTURE.md`
- `LIFEOS_V3_CHANGELOG.md`

## Fichiers principaux modifiés

- `src/app/app/dashboard/page.tsx`
- `src/app/app/[section]/[[...path]]/page.tsx`
- `src/components/app-shell.tsx`
- `src/components/resource-workspace.tsx`
- `src/components/weekly-review-composer.tsx`
- `src/lib/resources.ts`
- `src/lib/domain/life-analytics.ts`
- `src/lib/life-overview-server.ts`
- `src/app/api/tasks/[id]/complete/route.ts`
- `src/app/api/data/[resource]/route.ts`
- `src/app/api/export/route.ts`
- `src/app/app/review/page.tsx`
- `tests/e2e/p0.spec.ts`

## Fonctionnalités supprimées

Aucune fonctionnalité métier existante n’a été supprimée. Les anciens écrans d’administration sont conservés lorsque la V3 ajoute une nouvelle vue métier.

## Tests et contrôles

- contrôle syntaxique TypeScript de tous les fichiers TS/TSX : effectué ;
- tests runtime du moteur de récurrence : effectués ;
- migration Supabase appliquée et schéma vérifié sur le projet LifeOS ;
- test E2E mis à jour pour vérifier qu’une mission future est visible dans À venir / Planning / objectif mais pas dans À faire aujourd’hui.

Le build Next.js complet doit toujours être rejoué dans l’environnement Vercel final après publication. L’environnement de génération local ne peut pas restaurer toutes les dépendances npm depuis son cache (un paquet n’est pas disponible hors ligne), ce qui empêche ici un `next build` reproductible complet. Ce point n’est pas présenté comme validé.
