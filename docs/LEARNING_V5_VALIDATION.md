# LifeOS V5 — Validation locale et critères de déploiement

## Résultat des vérifications dans l’environnement de génération

- **Exécutés et réussis** : `npm run test:learning:smoke` (18/18), `npm run test:learning:preflight` (30/30), analyse syntaxique TypeScript/TSX (134 fichiers), contrôle des imports locaux, typage strict des modules pédagogiques purs.
- **Non exécutés** : `npm ci` (registre npm inaccessible en DNS et archive absente du cache), ESLint et typage intégral, tests Vitest, build Next.js, Playwright authentifié, exécution SQL dans une instance PostgreSQL/Supabase locale, vérification RLS à deux comptes. **Ne pas conclure que tout est validé.**
- **Production** : aucun script ni donnée modifiés. Ne pas déployer les deux migrations sur la base de production sans autorisation explicite.

## Corrections du candidat de test

1. `learning_questions` ne donne pas `SELECT` sur `correct_index` ni `explanation` avant remise d'une tentative ; les corrections sont renvoyées par la RPC uniquement après soumission.
2. Publication d'un quiz sans question bloquée au niveau PostgreSQL, même en contournant Next.js.
3. Modification concurrente de questions/pub bloquée par verrouillage du quiz parent dans le trigger, pour assurer l'immuabilité des questionnaires publiés.
4. Réponses hors nombre de choix rejetées par la RPC de correction.
5. Révision avec date forgée trop ancienne / trop future rejetée ; la date locale du profil reste autorisée à J-1/J/J+1 par rapport à UTC.
6. File des révisions et compteurs : parcours en pause/abandonnés non inclus ; les parcours terminés restent révisables ; aucune suppression des données.

## Étapes sur un poste disposant de Node/npm et Docker

1. Travailler dans une **branche Git** de validation. Vérifier que les migrations V5 n'ont pas déjà été appliquées sur l'environnement cible.
2. Installer les dépendances avec `npm ci` (depuis la racine LifeOS-V5).
3. Exécuter `npm run test:learning:smoke`, puis `npm run test:learning:preflight`, `npm run lint`, `npm run typecheck`, `npm run test`, et `npm run build`.
4. Installer la **Supabase CLI** version prise en charge et Docker. Examiner les commandes disponibles avec `supabase --help` et `supabase db --help` avant de démarrer l'environnement local et d'y jouer **toutes** les migrations dans l'ordre, dont les 2 V5.
5. Sur la base **locale uniquement**, exécuter `scripts/learning-v5-assert-schema.sql` avec psql/éditeur SQL et obtenir `ready=true`. Vérifier aussi les fonctions RPC, les clés étrangères, les RLS et les permissions de colonnes.
6. Créer deux identités locales A/B. Suivre `tests/integration/learning-v5-lot2-rls.md` (y compris la lecture interdite des réponses de quiz, les tentatives intercomptes et l'accès anonyme refusé).
7. Tester mobile 390×844 (après authentification) : parcours, correction, révision, suspension/reprise, planification, ressources et erreur du fournisseur IA.
8. Si l'un de ces contrôles échoue, corriger avant toute application en production. Effectuer une sauvegarde vérifiée et demander **une nouvelle validation explicite** avant les migrations en production.

## Limites connues de cette version

- Le déplacement d'une tâche directement depuis l'interface « Aujourd'hui » peut laisser `learning_activity_plans.planned_on` obsolète ; la date opérationnelle reste `tasks.planned_on`. Ne pas interpréter la table de liaison comme source de vérité de la date.
- La V5 ne récupère pas automatiquement les historiques Coran/Arabe préexistants dans ses KPI transversaux ; ils restent accessibles dans leurs écrans historiques.
- Le coach IA nécessite une clé API serveur, un modèle configuré et le consentement avant partage ; il ne se substitue pas à la vérification des sources.
- Le dossier de base source peut différer du commit GitHub actuellement publié. Comparer les fichiers avant remplacement ; ne jamais écraser aveuglément un travail Codex plus récent.
