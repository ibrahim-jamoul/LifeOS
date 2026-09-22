# LifeOS — Manager Mode (source produit courante)

Dernière mise à jour : 21 septembre 2026.

Ce document complète et, en cas de conflit UX sur l'usage quotidien, **prend le pas sur les anciennes spécifications de dashboard/capture**.

## Rôle principal

LifeOS est un **manager opérationnel personnel** : il transforme les données déjà connues en ordre du jour dynamique. L'utilisateur ne doit pas administrer quotidiennement une base de tâches.

Boucle cible :

`référentiel + données + règles -> calcul du jour -> exécution -> validation -> historique -> prochaine occurrence / revue`

L'utilisateur agit surtout avec :

- Fait ;
- Reporter / replanifier ;
- Ignorer une occurrence lorsque cette capacité sera activée ;
- Modifier exceptionnellement via les écrans d'administration existants.

## Principes non négociables

1. Ne jamais demander une ressaisie d'une information déjà connue.
2. Les écrans CRUD restent disponibles mais deviennent une voie secondaire.
3. Aucun deuxième système de tâches ou routines.
4. Le cockpit est calculé depuis les tables existantes.
5. Une date de travail opérationnelle est distincte d'une échéance réelle.
6. Reporter une action ne supprime jamais silencieusement son échéance.
7. Les décisions importantes restent soumises à confirmation humaine.
8. Le référentiel Word est une référence historique ; Supabase est la source de vérité opérationnelle.
9. Les données personnelles, financières et religieuses restent privées.
10. La grosse base de connaissances Arabe + Religion hors Coran est une phase ultérieure, pas une dépendance du Manager Mode.

## Implémentation actuelle

Le cockpit `/app/dashboard` est désormais la vue **Aujourd'hui**. Il :

- calcule jusqu'à trois actions prioritaires ;
- combine tâches et routines sans duplication ;
- tient compte des échéances, dates planifiées, priorités et projets FOCUS ;
- utilise le contexte temporel des routines (matin / journée / soir) pour l'ordre ;
- limite la file visible à dix éléments ;
- permet de valider une tâche/routine en un geste ;
- permet de reporter une tâche à demain ou +7 jours sans modifier son échéance ;
- garde les vues détaillées et CRUD comme administration exceptionnelle.

## Règle de planification

La colonne `tasks.planned_on` représente **quand travailler sur une tâche**.

Les colonnes `tasks.due_on` / `tasks.due_at` représentent **l'échéance réelle**.

Exemple : une tâche échue le 21/09 peut être replanifiée au 22/09. Son échéance reste le 21/09 ; elle peut donc rester visible dans les alertes de retard, même si elle n'est plus dans la file d'exécution du 21/09.

## Ce qui n'est volontairement pas fait dans cette version

- aucune migration destructive ;
- aucune génération IA obligatoire ;
- aucune refonte des modules métiers ;
- aucun système de gamification ;
- aucune base de connaissances web Arabe/Religion ;
- aucun moteur opaque qui invente des heures ou des objectifs.

Les prochains lots doivent rester additifs et testables.
