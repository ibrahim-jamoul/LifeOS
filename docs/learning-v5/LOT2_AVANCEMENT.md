# LifeOS — Apprentissage V5 / Lot 2

**Statut : code ajouté au snapshot du lot 1, non déployé.** 8 octobre 2026 (lot préparé à partir du snapshot du 8 octobre).

## Fonctionnalités codées

- QCM et examens blancs personnels : quiz de parcours, ajout de questions à 2–6 options, bonne réponse et explication, source HTTPS facultative, publication immuable, passage, score côté serveur, historique de dix derniers passages et correction après soumission.
- Séances spécialisées : domaine arabe (cinq étapes multiples en une séance), anglais (entretien/réunion/présentation…), certifications/labs, lecture, religieux général, business ; sélection rapide de durée, activité, résultat et confiance ; note facultative.
- Liaison explicite avec **Aujourd'hui** : une activité peut créer une unique tâche LifeOS, la replanification actualise la même tâche ; aucune création implicite depuis l'objectif ou le parcours. Les liens héritent de l'objectif/projet existant du parcours ; les routines historiques ne sont pas modifiées.
- Bilan 7 jours glissants : minutes et séances réellement enregistrées, applications explicites, erreurs, révisions, quiz, score moyen uniquement si des tentatives existent, parcours actifs sans séances.
- Recherche : titres des parcours, connaissances et ressources existantes, maximum 20 résultats par famille.
- Assistant pédagogique : micro-leçon, proposition de quiz, fiche mémo et révision **en lecture seule**, uniquement si `AI_API_KEY` et `AI_MODEL` sont configurés ; consentement explicite pour transmettre le périmètre limité du parcours. Aucune écriture automatique ; qualité dépend des sources fournies.
- Réglages de parcours (titre, budget hebdomadaire, raison). Correction d'un bug du KPI 30 jours qui ne sommait auparavant que les séances du jour.

## Choix de conception

- Une question de quiz ne peut plus être modifiée directement via Supabase après publication ; le verrou est en SQL, non seulement dans l'API.
- Le score d'une tentative est calculé par `submit_learning_quiz`, une transaction côté PostgreSQL. `authenticated` dispose du droit SELECT sur ses tentatives mais pas INSERT/UPDATE/DELETE.
- `plan_learning_activity` est transactionnelle et rattache tâche et activité du **même utilisateur** ; un autre utilisateur ne peut pas utiliser l'ID de l'activité.
- Le code générique V5 ne remplace ni `quran_*`, ni `arabic_sessions`, ni `religion_routines`. Aucun import historique n'est simulé.
- Une tâche cochée n'est **pas** interprétée comme une preuve de maîtrise pédagogique. Le lien entre planification et activité existe sans gonfler automatiquement les KPI de connaissances.
- Le module générique ne fabrique pas de syllabus officiel, questions d'examen ou références religieuses. Les quiz sont fournis par l'utilisateur, ou **proposés** en texte par l'IA sans enregistrement automatique.

## Validation réellement effectuée

- `npm run test:learning:smoke` : 18 vérifications autonomes réussies (logique des minutes, applications, score et espacement + présence de contrats SQL). Les vérifications des noms et extraits SQL sont **statiques**, pas une exécution de migration.
- Transpilation syntaxique TypeScript/TSX globale via TypeScript : 120 fichiers analysés sans erreur de syntaxe.
- `npm ci` sans accès fiable au registre n'a pas abouti ; Node v22.16.0 ne satisfait pas le moteur demandé par jsdom v30.1.0. En conséquence, **pas de `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` ni Playwright exécutés**.
- SQL et RLS n'ont pas été exécutés sur un PostgreSQL/Supabase réel. **Aucun déploiement ou mutation de la production**.

## Travaux non terminés

1. **Priorité bloquante avant production** : installation des dépendances dans Node >=22.22.2, lint, typecheck, Vitest, build et tests E2E avec un utilisateur authentifié ; exécuter les 2 migrations V5 sur staging et les tests à deux utilisateurs ; captures des écrans mobiles en conditions réelles.
2. **Édition avancée** des modules/activités et de toutes les ressources : API partielle seulement, UI d'édition des questions après création pas prévue pour un quiz publié.
3. **Contenu pédagogique** : imports de syllabus officiels versionnés, labs interactifs, chronomètre d'examen et anti-triche ; le score actuel est un score de révision personnelle, pas un examen surveillé.
4. **Coran** : parcours spécialisé historique conservé ; calendrier mensuel 3 pages, tafsir/sens avec provenance, fusion des statistiques historiques et V5 non implémentés.
5. **Langues** : arabe cinq étapes enregistrables dans une séance V5 mais pas de lecteur de texte vocalisé natif, audio, STT ou dictionnaire ; l'historique `arabic_sessions` n'est pas fusionné automatiquement.
6. **IA** : réponses non persistantes, aucune auto-création de cartes ni QCM ; vérification humaine des sources obligatoire. Chaque génération peut coûter de l'API si configurée.
7. **Aujourd’hui** : création/replanification de tâche fonctionnelle en logique SQL, mais pas de synchronisation réciproque du statut de tâche vers la complétion de l'activité, ni d'export/import hors ligne.
8. **Recherche** : recherche simple par titres uniquement, sans index plein texte / notes / erreurs / pagination au-delà des limites.

## Sécurité et confidentialité

- En RLS, les 4 nouvelles tables portent `user_id` et des clés étrangères `(id,user_id)` vers les objets parents ; accès rôles `anon` révoqué, `authenticated` restreint par `auth.uid()`.
- Le fournisseur IA ne reçoit que le titre/raison du parcours, ses modules, ses vingt dernières connaissances et quinze dernières séances si l'utilisateur consent ; aucun fichier, document ni autre domaine n'est envoyé.
- Le champ `correct_index` des questions n’est pas accessible en `SELECT` au rôle `authenticated`. Le serveur renvoie la correction après la soumission. Un administrateur SQL de la base peut naturellement consulter ses données : ce module n’est pas un examen surveillé.
- Les environnements serveur `AI_API_KEY`/Supabase ne sont pas inclus dans l'archive. Ne pas appliquer les migrations en production avant vérification de la base de staging.

## Commandes de reprise pour Codex

```bash
# Node >=22.22.2, dans LifeOS-V5
npm ci
npm run test:learning:smoke
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Consulter `tests/integration/learning-v5-lot2-rls.md` et la migration `supabase/migrations/20261008235100_learning_v5_quizzes_planning.sql` avant toute opération sur Supabase.
