# Validation LifeOS V2 — 22/09/2026

## Contrôles effectués

- Travail réalisé sur une copie du ZIP d'origine ; aucun accès ni changement sur Supabase/Vercel de production.
- Aucune table existante supprimée ou renommée.
- Aucune migration Supabase requise par le lot V2 Core Experience.
- Les écrans CRUD historiques restent accessibles via Explorer.
- Vérification de toutes les importations internes `@/…` : **0 import manquant**.
- Analyse syntaxique TypeScript/TSX de `src/` et `tests/` avec l'API TypeScript : **0 erreur syntaxique**.
- Assertions exécutées sur la logique analytics :
  - combinaison tâches planifiées + routines quotidiennes ;
  - routine hebdomadaire sans jour précis = une occurrence par semaine ;
  - détection des tâches replanifiées plusieurs fois.
  Résultat : **OK**.
- Capture rapide : une seule instance globale afin d'éviter un double déclenchement de `Ctrl/Cmd+K`.
- Les API de validation existantes sont conservées ; la complétion d'une tâche met en plus à jour l'activité de son projet et les routines historisent leurs validations/dévalidations.

## Validation automatisée non exécutable dans ce conteneur

`npm ci` n'a pas pu terminer dans l'environnement de génération. Le conteneur utilise Node.js `22.16.0`, alors que plusieurs dépendances résolues par le projet (notamment `jsdom`, `undici` et des paquets CSS) demandent une version Node.js 22 plus récente. `npm` termine en outre avec `Exit handler never called` dans ce conteneur.

Conséquence : le `typecheck`, la suite Vitest complète et `next build` n'ont pas pu être lancés ici avec un `node_modules` sain. Ce point est une limitation de l'environnement de génération et **ne doit pas être présenté comme une validation complète du build**.

## Validation à exécuter avant production

Sur une branche dédiée et avec une version Node compatible avec les dépendances du lockfile :

```bash
npm ci
npm run typecheck
npm run test
npm run build
```

Puis déployer en Vercel Preview et vérifier :

1. Aujourd'hui : Fait / Demain / +7 jours.
2. Capture rapide : création d'une tâche, domaine facultatif, affichage aujourd'hui facultatif.
3. Progression : 7 j / 30 j / 90 j / 1 an.
4. Insights : routines fortes/faibles, reports répétés, projets stagnants.
5. Revue : préremplissage automatique, sauvegarde, réouverture sans perte des champs humains.
6. Explorer : accès à tous les anciens écrans d'administration.
7. Alertes, documents, souvenirs et export : absence de régression.

## Rollback

Le rollback reste le commit/tag créé avant cette V2. Le lot n'effectue aucune transformation destructive des données.
