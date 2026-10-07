# LifeOS V4 — changelog

## Objectif

V4 simplifie les surfaces de pilotage sans retirer les écrans avancés existants. Le parcours principal devient :

1. Aujourd’hui, avec la planification et le calendrier À venir
2. Objectifs
3. KPI
4. Revue
5. Vision

Les vues Progression, Insights et Explorer restent accessibles sous « Outils avancés ».

## UX

- Fond visuel subtil différent selon l’onglet principal afin de conserver le contexte.
- Indicateur d’onglet courant dans l’en-tête desktop.
- Navigation principale réduite à six surfaces.
- Geste retour mobile : glissement depuis le bord gauche vers la droite, ou depuis le bord droit vers la gauche.
- Les formulaires de création utilisent des consignes génériques et ne donnent plus en exemple le nom d’un élément déjà existant.

## Objectifs

- Deux portées : « Objectifs du jour » et « Tous les objectifs ».
- Filtres PRO / PERSO / RELIGION.
- Un objectif du jour est un objectif ayant au moins une mission réellement prévue aujourd’hui, y compris une occurrence récurrente.
- Création d’un objectif depuis l’écran simplifié.
- Ajout direct de missions depuis chaque objectif.
- Les fonctions CRUD avancées restent disponibles sous « Options avancées ».

## Planification dans Aujourd’hui

- La page dédiée a été retirée pour éviter le doublon avec Aujourd’hui.
- Le calendrier À venir et l’ajout de tâches conservent la date, l’heure, la durée, le domaine, l’objectif parent, le projet parent et la récurrence.

## KPI

- Support des KPI manuels et dérivés.
- Les KPI dérivés sont calculés depuis les données déjà présentes dans LifeOS : habitudes, routines Religion, projets, objectifs, weekly reviews ou ressources.
- La saisie rapide (+) n’est proposée que pour les KPI réellement manuels.
- Les KPI sont regroupés et filtrables par PRO / PERSO / RELIGION.
- Aucun objectif chiffré n’est inventé quand le référentiel ne fournit pas de cible.

## Données personnelles

Les données personnelles provenant du référentiel ne sont pas copiées dans ce dépôt. Elles sont synchronisées directement dans le projet Supabase privé. Le dépôt ne contient que le schéma générique et le code de calcul.
