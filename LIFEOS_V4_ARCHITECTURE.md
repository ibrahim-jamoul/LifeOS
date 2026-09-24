# LifeOS V4 — architecture fonctionnelle

## Principe

LifeOS reste la source de vérité. Le référentiel sert de source de préparation et n’est pas embarqué dans le dépôt public.

## Modèle d’exécution

Vision → Objectif → Projet optionnel → Mission / tâche → Planning → Aujourd’hui → Mesure → Revue.

Un projet est facultatif. Une mission peut être liée directement à un objectif.

## KPI

`kpis.measurement_mode` :
- `manual` : valeurs saisies dans `kpi_entries` ;
- `derived` : valeurs calculées depuis une autre source LifeOS.

`source_type` et `source_id` définissent la source. `aggregation` définit le calcul : somme, nombre de jours, progression, ratio, etc.

Cette séparation évite de demander à l’utilisateur de ressaisir une donnée déjà connue par LifeOS.

## Navigation

Les six surfaces principales ont chacune un fond discret différent. Les écrans techniques ou d’administration sont conservés mais placés hors du chemin quotidien.

## Retour mobile

Le shell détecte uniquement un geste depuis un bord de l’écran pour ne pas gêner les interactions normales :
- bord gauche + glissement vers la droite ;
- bord droit + glissement vers la gauche.

Dans les deux cas, `router.back()` est utilisé.
