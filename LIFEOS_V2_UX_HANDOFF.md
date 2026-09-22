# LifeOS V2 — Core Experience

## Objectif

Cette évolution ne remplace pas le modèle de données existant. Elle transforme l'expérience quotidienne afin que LifeOS soit d'abord un gestionnaire de vie et un outil de revue : exécuter, mesurer, comprendre, ajuster.

## Nouvelles surfaces principales

- `/app/dashboard` — **Aujourd'hui** : exécution uniquement, sans mur de KPI.
- `/app/progression` — **Progression** : exécution globale, PRO/PERSO/RELIGION, périodes 7 j / 30 j / 90 j / 1 an, tendances récentes et routines fortes/faibles.
- `/app/insights` — **Insights** : routines fortes/faibles, tâches reportées à répétition, projets actifs qui stagnent, signaux de charge.
- `/app/review` — **Revue** : faits préremplis automatiquement + contexte et arbitrages humains.
- `/app/explorer` — **Explorer** : accès aux écrans CRUD historiques et aux modules détaillés.
- Capture rapide globale (`Ctrl/Cmd + K`) : création d'une tâche simple en un geste, avec domaine optionnel et planification aujourd'hui optionnelle.

## Compatibilité / rollback

- Aucune table existante n'est supprimée ou renommée.
- Aucune migration Supabase supplémentaire n'est nécessaire pour ce lot.
- Les routes CRUD historiques restent accessibles.
- Les API existantes de validation de tâche, replanification et routines restent conservées.
- En cas de problème UX, les données restent exploitables via Explorer.

## Calculs des dashboards

Les calculs utilisent uniquement des faits déjà stockés :

- `tasks.planned_on`, `tasks.due_on`, `tasks.completed_at` ;
- `habit_logs`, `religion_logs` ;
- `activity_log` pour les reports ;
- `projects.last_activity_at` / `updated_at` pour la stagnation ;
- objectifs actifs pour comparer les priorités déclarées à l’activité observée ;
- projets existants pour détecter la stagnation.

Une donnée absente n'est pas transformée en zéro. Les routines `flexible` ou `contextual` ne sont pas comptées comme obligations périodiques car leur occurrence ne peut pas être déduite sans invention. Une routine hebdomadaire sans jour précis compte comme une occurrence par semaine, et une routine mensuelle sans jour précis comme une occurrence par mois.

## Déploiement

1. Conserver le tag/commit de rollback actuel.
2. Remplacer le code par ce lot V2 sur une branche dédiée.
3. `npm ci`
4. `npm run typecheck`
5. `npm run test`
6. `npm run build`
7. Tester avec un compte de test Supabase.
8. Déployer sur Vercel en Preview.
9. Valider Aujourd'hui, Capture, Progression, Insights, Revue, Explorer.
10. Promouvoir en production seulement après validation.

## Limites volontaires de ce lot

- Pas de Web Push.
- Pas d'intégration Google Calendar / banque / santé.
- Pas d'IA exécutant des mutations automatiquement.
- Pas de second moteur de tâches ou de routines.
- Pas de "score de vie" opaque.
- Les KPI automatiques nécessitant une sémantique métier spécifique (ex. identifier automatiquement une candidature parmi toutes les tâches) restent à modéliser explicitement au lieu d'être devinés.
