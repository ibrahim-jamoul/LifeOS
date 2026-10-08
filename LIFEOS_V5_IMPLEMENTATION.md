> **Note V5 lot 2 (plus récent)** : ce fichier documente le lot 1. Lire d’abord `docs/learning-v5/LOT2_AVANCEMENT.md` et `tests/integration/learning-v5-lot2-rls.md`. Le lot 2 est un développement non déployé qui nécessite validations SQL, RLS, build et mobile.

# LifeOS Apprentissage V5 — Lot 1 réellement implémenté

Date : 08/10/2026. **État : prototype technique à intégrer / tester, non déployé.**

## Source de vérité

1. L'application source exportée par Codex (snapshot joint au ZIP HANDOFF).
2. `DESCRIPTIF_FONCTIONNEL_LIFEOS_APPRENTISSAGE_2026-10-08.md` (cible fonctionnelle).
3. `lifeos_apprentissage_planches/LIFEOS_APPRENTISSAGE_UX_SPEC.md` (UX mobile cible).
4. Écran existant Coran/Religion et schéma Supabase existant à préserver.

## Réalisé dans ce lot

- 5 rubriques mobile : Accueil / Parcours / Réviser / Ressources / Bilan.
- Création d'un parcours sur titre + boutons de choix de domaine, type et budget de temps ; lien facultatif vers objectif/projet LifeOS **existant**.
- Vue détail avec modules, activités (lecture, lab, vidéo, quiz, mémorisation, etc.), complétion réversible, journalisation de sessions et temps réellement étudié.
- Génération atomique de modules indicatifs à partir d'un modèle par domaine via PostgreSQL (`initialize_learning_path`) sans générer de prétendu cours complet.
- Création d'une connaissance durable avec source HTTPS facultative, synthèse et échéance.
- Révision en 4 réponses : oublié, fragile, correct, maîtrisé ; échéances 1/3/7/14/30/60 jours ; historique en transaction (`complete_learning_review`).
- Accueil factuel et bilan 30 jours. Aucune statistique inventée si les enregistrements sont vides.
- Écrans historiques Coran, routines et sujets conservés ; ancien accueil Religion restauré sous `/app/learning/religion` afin de conserver son programme du jour. Journal d'arabe existant rendu accessible dans l'espace Apprentissage. Bibliothèque transversale réutilise la table `resources` actuelle.
- Alerte anti-dispersion dès 3 parcours actifs (informatif, non bloquant).
- Une nouvelle migration **additive** (6 tables, fonctions, RLS, FK composées, index, contrôle cohérence session/activity).
- Route GET/POST `/api/learning/v5` avec validation Zod, authentification Supabase, contrôles d'ownership et erreurs normalisées.

## Exigences non terminées (ne pas prétendre à une V5 finale)

- Éditeur complet de programme/module, import de syllabus officiel, contenu enrichi, édition/suppression des fiches, recherche transversale et versionnage de contenu.
- Quiz interactifs avec score, QCM évalués, vrais examens blancs, preuves de maîtrise spécifiques à chaque certification et lecteur de labs.
- Scénarios guidés pour l'anglais, lecture audio / reconnaissance vocale, séances d'arabe multi-étapes natives.
- Programme Coran mensuel spécialisé, tafsir intégré, évaluation source vérifiée ; les anciens modules Coran sont conservés, non migrés en doublon.
- Planification explicite d'une séance V5 dans Aujourd'hui et unification de l'affichage des routines Religion.
- Assistant IA pédagogique (sources validées, consentement, leçons/quiz/mémos, règles de mutation), revue hebdomadaire IA.
- Notifications automatiques, consultation hors ligne, tests E2E authentifiés et tests RLS **environnement réel**.

## Validation effectuée sur la copie

- 12 fichiers TypeScript/TSX changés ont passé l'analyse syntaxique de TypeScript (`parseDiagnostics: 0`).
- 7 assertions du moteur pur de révision et du ratio de progression sont passées via Node expérimental.
- **Non exécutés :** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, migrations SQL. `npm ci` n'a pas abouti (dépendances absentes du cache ; environnement Node 22.16.0 alors que jsdom nécessite 22.22.2+). Des erreurs de compilation ou d'intégration restent possibles.

## Première utilisation après intégration

1. Créer un projet Supabase de staging (ou sauvegarde contrôlée). Appliquer les migrations présentes dans `supabase/migrations` dans l'ordre chronologique uniquement si elles ne sont pas déjà présentes. Sur un projet LifeOS existant, appliquer **uniquement** `20261008235000_learning_v5_foundation.sql` après comparaison à l'historique des migrations.
2. Mettre les variables d'environnement déjà utilisées par LifeOS (sans inclure `.env.local` dans des archives ou commits).
3. Exécuter sous Node compatible : `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
4. Exécuter `tests/integration/learning-v5-rls.md` sur deux comptes factices puis tester l'ensemble du parcours de bout en bout dans un navigateur mobile.
5. Déployer une PREVIEW Vercel avec Supabase staging et comparer aux 10 planches. Déployer la production uniquement après validation.

## Réversibilité / restauration

- Migration additive : aucune table existante n'est supprimée ni renommée. Les anciennes routes Coran / routines / leçons restent présentes.
- En cas de dysfonctionnement après migration : revenir au déploiement applicatif précédent ; les nouvelles tables V5 resteront inutilisées sans casser les écrans historiques.
- Ne jamais supprimer directement les tables V5 de production ; cela détruirait les nouvelles données. Sauvegarder et utiliser un plan de restauration testé uniquement si indispensable.

## Décisions de conception

- L'effort (temps/sessions) n'est **pas** assimilé à la maîtrise ; la complétion d'une activité n'ajoute pas automatiquement de connaissance « acquise ».
- La révision générique s'ajoute aux révisions Coran spécialisées sans modifier les historiques.
- Aucune création automatique de mission dans Aujourd'hui depuis un parcours.
- L'IA n'est jamais nécessaire pour les actions métier de base.
- Les templates de programmes sont des **structures d'activités**, pas un curriculum officiellement vérifié.
