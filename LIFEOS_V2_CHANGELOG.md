# LifeOS V2 — Core Experience

Cette version est une évolution additive du projet existant. Elle ne remplace pas le modèle de données et conserve les routes CRUD historiques comme couche d'administration.

## Expérience principale

- Navigation principale recentrée sur : **Aujourd'hui / Progression / Insights / Revue / Explorer**.
- Les anciens domaines (Religion, Arabe, Coran, Objectifs, Finances, Santé, Documents, Souvenirs) restent accessibles depuis **Explorer**.
- Ajout d'une **Capture rapide** accessible depuis la navigation et via `Ctrl+K` / `Cmd+K`.
- La capture V2 crée volontairement une tâche simple et sûre ; aucune classification IA n'est effectuée silencieusement.

## Aujourd'hui

- Le dashboard est recentré sur l'exécution : priorités, routines et suite de la journée.
- Les dashboards analytiques ont été retirés de l'écran quotidien pour réduire la charge cognitive.
- Les échéances réelles restent distinctes de `planned_on` ; reporter une tâche ne modifie jamais sa deadline.

## Progression

- Vue globale sélectionnable sur 7 jours, 30 jours, 90 jours ou 1 an, avec comparaison à la période précédente de même longueur.
- Synthèse PRO / PERSO / RELIGION.
- Courbe d'exécution sur huit semaines.
- Détection des routines solides et des routines peu réalisées.
- Les routines flexibles/contextuelles non planifiées ne sont pas comptées comme échecs.
- Une métrique absente n'est pas transformée en zéro.

## Insights

- Point fort / point d'amélioration par domaine mesurable.
- Détection des tâches reportées plusieurs fois.
- Détection des projets actifs sans activité récente (> 14 jours).
- Comparaison de tendance avec la période précédente.
- Les insights restent descriptifs : LifeOS ne modifie jamais les priorités automatiquement.

## Revue

- La revue hebdomadaire est préremplie à partir des données LifeOS.
- L'utilisateur ne saisit que les informations non déductibles : causes, éléments à arrêter/mettre en pause, top 3 suivant et note libre.
- L'enregistrement réutilise la ressource `weekly_reviews` existante.

## Historique

- La complétion d'une tâche continue d'alimenter `activity_log`.
- Une tâche terminée met maintenant à jour `projects.last_activity_at` lorsque la tâche appartient à un projet.
- Les validations/dévalidations de routines alimentent également `activity_log` en plus de leurs tables de logs existantes.

## Compatibilité / rollback

- Aucune migration Supabase supplémentaire n'est requise par cette version.
- Les tables et ressources existantes ne sont pas supprimées.
- Les anciennes pages détaillées restent accessibles via Explorer.
- Le rollback peut donc continuer à s'appuyer sur le commit/tag de référence réalisé avant cette V2.

## Limites intentionnelles

- Pas encore de synchronisation calendrier, banque, santé ou temps d'écran.
- Pas encore de classification IA automatique de la capture rapide.
- Les quotas métier complexes (ex. 10 candidatures/semaine) ne sont pas encore injectés automatiquement dans le moteur quotidien sauf s'ils sont représentés par des routines/tâches planifiées.
- Les graphiques reposent sur les données réellement présentes : l'historique ancien incomplet restera incomplet.
