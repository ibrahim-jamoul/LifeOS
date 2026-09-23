# Known limitations

This file reflects the completed implementation and verification. No limitation
is accepted silently.

- Les fenêtres Coran « semaines 1–3 » et « semaine 4/5 » sont désormais modélisées explicitement par les jours de fenêtre et les occurrences ordinales du mois.
- Une routine `flexible` ou `contextual` sans planification explicite reste hors d’Aujourd’hui et n’est pas comptée comme obligation quotidienne.
- Les rappels internes et échéances sont opérationnels. Les notifications push
  navigateur ne sont pas ajoutées dans cette mission.
- Les heures absentes du référentiel restent à configurer ; aucun rappel à une
  heure arbitraire n’est généré.
- Les valeurs historiques déjà présentes et différentes du Word sont
  conservées. Elles apparaissent comme conflits dans la simulation d’import et
  doivent être arbitrées manuellement si l’utilisateur souhaite les remplacer.
- L’IA reste facultative et désactivée tant que les variables serveur du
  fournisseur ne sont pas configurées.

## Manager Mode v1 — limites explicites

- La vue Aujourd’hui calcule et ordonne les tâches/routines déjà structurées ; elle ne transforme pas encore automatiquement un simple texte `project.next_action` en nouvelle tâche persistée.
- Le bouton de report agit sur `tasks.planned_on` et laisse volontairement les vraies échéances (`due_on` / `due_at`) inchangées. Une tâche reportée peut donc rester signalée en retard dans les alertes.
- Les routines possèdent actuellement une action `Fait`. Une occurrence non validée reste factuellement non réalisée ; un statut explicite `Ignorée volontairement` pourra être ajouté dans un lot séparé si nécessaire.
- La revue hebdomadaire exploite déjà l'historique existant, mais la génération d'un brouillon complet prérempli n'est pas encore automatisée dans ce lot.
- La base de connaissances massive Arabe + Religion hors Coran est volontairement différée. Elle ne doit pas être ajoutée avant stabilisation du moteur quotidien.
- L'ancienne page Assistant IA reste dans le code pour éviter une suppression risquée, mais elle n'est plus exposée dans la navigation principale.

## V2 Core Experience — 2026-09-22

- Progression et Insights sont calculés à partir des données déjà historisées. Une période sans logs ne peut pas être reconstruite rétroactivement.
- Les routines `flexible` / `contextual` sans calendrier explicite restent hors taux d'exécution global afin d'éviter de fabriquer des échecs.
- Le moteur quotidien n'optimise pas encore les quotas hebdomadaires complexes (par exemple candidatures/semaine) à partir des KPI ; il exploite les tâches/routines réellement planifiées.
- La capture rapide ne fait pas encore de parsing IA multi-entités (dépense, décision, séance, ressource). Elle privilégie une mutation sûre et réversible : création d'une tâche.
