# LifeOS — Manager Mode (source produit courante)

Dernière mise à jour : 22 septembre 2026.

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
- ne retient que les tâches temporellement éligibles (planification / échéance / retard) et utilise FOCUS uniquement comme facteur secondaire de priorité ;
- utilise le contexte temporel des routines (matin / journée / soir) pour l'ordre ;
- limite la file visible à dix éléments ;
- permet de valider une tâche/routine en un geste ;
- permet de reporter une tâche à demain ou +7 jours sans modifier son échéance ;
- garde les vues détaillées et CRUD comme administration exceptionnelle.


## Définition normative de « Aujourd’hui »

La vue **Aujourd’hui** représente exclusivement ce que l’utilisateur est réellement censé exécuter à la date courante. La chaîne de dérivation est :

`OBJECTIF -> PROJET -> ACTION -> PLANIFICATION -> AUJOURD’HUI`

Un objectif, une certification ou un projet `FOCUS` ne crée jamais directement une action du jour. `FOCUS` peut seulement départager/prioriser des tâches déjà éligibles.

### Tâches

Une tâche est éligible lorsque :

- `planned_on = today` ;
- une occurrence récurrente tombe aujourd’hui ou a été reportée aujourd’hui via `task_occurrences.rescheduled_on` ;
- `planned_on < today` et la tâche n’est toujours pas terminée : elle est alors affichée comme **En retard · à replanifier**.

Une tâche avec `planned_on > today` est exclue de la file d’exécution, même si son échéance réelle est déjà dépassée ; l’alerte d’échéance reste indépendante. Une échéance `due_on` / `due_at` ne crée jamais à elle seule une planification dans Aujourd’hui. Une tâche sans planification est exclue, même si son projet est `FOCUS`.

### Routines

Le moteur de calendrier utilise les champs structurés, jamais `time_context` comme source principale :

- `daily` : occurrence quotidienne pendant la période active ;
- `weekly` + `schedule_weekday` : uniquement le jour ISO configuré ;
- `weekly` sans jour ni fenêtre : hors Aujourd’hui, à planifier ;
- `monthly` + `schedule_day_of_month` : uniquement le jour configuré ;
- `monthly` sans jour ni fenêtre : hors Aujourd’hui, à planifier ;
- `flexible` / `contextual` : hors Aujourd’hui tant qu’aucune planification opérationnelle explicite n’existe.

`configuration_status` reste un indicateur global de complétude. Il ne bloque pas mécaniquement une occurrence dont le calendrier est déjà déterministe : une heure de rappel ou une durée facultative manquante ne suffit pas à retirer une routine quotidienne ou un vendredi explicitement configuré. À l’inverse, `ready` ne peut pas fabriquer un jour manquant.

### Fenêtres multi-jours

Les colonnes additives `schedule_window_weekdays smallint[]` et `schedule_month_weeks smallint[]` représentent les contraintes qui ne tiennent pas dans `schedule_weekday` :

- `[6,7]` = fenêtre samedi + dimanche ;
- une fenêtre représente **une seule occurrence logique** ;
- une validation sur l’un des jours clôt l’occurrence pour les autres jours de la même fenêtre ;
- `schedule_month_weeks` limite la fenêtre aux occurrences ordinales du mois (1 à 5) sans parser `time_context`.

Le programme Coran du référentiel est donc représenté explicitement : nouvelle page + Tafsir sur les trois premières fenêtres week-end du mois ; révision mensuelle sur les quatrième et cinquième fenêtres lorsqu’elles existent. Aucune préférence arbitraire samedi/dimanche n’est introduite.

### Libellés dans l’UX

La justification affichée doit venir de la règle qui a créé l’éligibilité : `Planifié aujourd’hui`, `Reporté aujourd’hui`, `En retard · à replanifier`, `Routine quotidienne`, `Prévu ce vendredi`, `Prévu ce week-end`, etc. `Projet FOCUS` et `Échéance aujourd’hui` ne sont jamais des motifs de planification. `time_context` reste utilisable pour l’ordre (matin / journée / soir) et la présentation.

## Impératifs et objectifs hebdomadaires

Les impératifs de semaine ne créent pas un deuxième moteur d’actions. Ils restent rattachés aux objets existants (`goals`, `projects`, `tasks`, `routines`). Une intention comme « avancer PSM » ou « avancer LifeQuest » peut structurer la semaine, mais elle ne devient jamais automatiquement une action quotidienne.

Lorsqu’une action concrète est assignée à un jour, elle est portée par une tâche existante avec `planned_on`. Exemple : une « session PSM » planifiée jeudi n’entre dans **Aujourd’hui** que le jeudi. La future vue « Cette semaine / À planifier » pourra exposer les impératifs encore non positionnés sans modifier ces règles d’éligibilité.

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


## V2 — boucle complète de pilotage

La navigation opérationnelle est désormais structurée ainsi :

`Aujourd’hui -> Progression -> Insights -> Revue -> ajustement`

- **Aujourd’hui** reste volontairement minimal et centré sur l’exécution.
- **Progression** agrège l’historique sur des périodes comparables et montre PRO / PERSO / RELIGION sans score opaque unique.
- **Insights** détecte notamment les reports répétés, routines peu réalisées et projets actifs sans mouvement.
- **Revue** préremplit les faits observables ; l’utilisateur ne saisit que les causes et décisions impossibles à déduire.
- **Explorer** conserve tous les écrans CRUD historiques pour administration et correction.

Les taux globaux ne doivent utiliser que des occurrences réellement mesurables. Une donnée absente n’est jamais interprétée comme zéro. Les routines flexibles/contextuelles sans calendrier explicite ne doivent pas créer artificiellement des échecs.
