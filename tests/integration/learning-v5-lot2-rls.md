# Checklist d'intégration Supabase — Apprentissage V5 lot 2

À exécuter sur **staging**, avec deux comptes de tests A et B. Les résultats ne sont PAS prévalidés par le présent ZIP.

## Préparation

- Sauvegarde de staging, relevé de `supabase_migrations.schema_migrations`, vérifier d'abord la migration lot 1 `20261008235000_learning_v5_foundation.sql`, puis appliquer `20261008235100_learning_v5_quizzes_planning.sql` une seule fois.
- Vérifier quatre tables nouvelles (`learning_quizzes`, `learning_questions`, `learning_quiz_attempts`, `learning_activity_plans`) et RLS activée.
- Vérifier les autorisations des RPC `submit_learning_quiz`, `plan_learning_activity` : exécution pour `authenticated`, pas `anon`.

## Scénario fonctionnel A

1. A crée un parcours avec un objectif/projet A déjà existant ; génère un module et une activité.
2. A crée un quiz brouillon, ajoute deux questions à choix multiples (avec explication/source), publie et répond aux deux questions.
3. Vérifier un score exact (0 %, 50 % ou 100 %), tentative persistée, correction retournée uniquement après passage.
4. Refaire le quiz et vérifier deux tentatives dans l'historique, sans modification des connaissances maîtrisées.
5. Modifier une question publiée par l'API SQL directement : rejet `23514` attendu.
6. Tenter un INSERT direct dans `learning_quiz_attempts` en tant qu'utilisateur A : erreur de privilège attendue.
7. Planifier l'activité à J+2 ; vérifier UNE tâche dans `tasks`, le même `user_id`, les liens `goal_id` et `project_id` hérités et le lien dans `learning_activity_plans`.
8. Replanifier à J+3 : **même task_id**, `planned_on` modifié, pas de nouveau doublon. Tester le report depuis Aujourd'hui et documenter la cohérence de `learning_activity_plans.planned_on` avec la date effective (limitation lot 2 si le report vient de l'écran tâches).
9. Consigner une session arabe en cochant deux des cinq étapes ; vérifier `details.stages` et les minutes, sans créer de doublon dans `arabic_sessions`.
10. Calcul du bilan 7 jours : comparer les agrégats aux lignes `learning_sessions`, `learning_reviews` et `learning_quiz_attempts`.

## Isolation B (IDOR / BOLA)

1. B tente GET quiz A (`view=quiz&id=<uuid A>`), attend 404.
2. B tente POST `submit_quiz` sur l'UUID du quiz A, attend 403/404 ; aucun résultat ne doit être créé.
3. B tente POST `plan_activity` sur une activité A ; rejet 403/404 et aucune tâche créée.
4. B tente d'ajouter une question à un quiz A, de créer une session sur un parcours A, ou de modifier un titre d'activité A : rejet ; aucune modification chez A.
5. Tester la même isolation directement via client Supabase authentifié B, sans passer par Next.js.

## IA et données privées

1. Sans `AI_API_KEY` : appel IA renvoie une erreur de configuration propre, le reste du module fonctionne.
2. Sans `consent:true` : requête refusée avant toute sortie vers le fournisseur.
3. Vérifier qu'aucun `storage path`, fichier binaire, compte financier, historique santé ou données de B ne figure dans le corps du provider.
4. Le texte généré ne doit pas être automatiquement enregistré en fiche, quiz ou leçon.

## Régression

- Réviser un passage Coran historique, journaliser une routine Religion et consulter un profil arabe préexistant : pas de modification inattendue des tables anciennes.
- Vérifier un parcours actif dans Accueil, puis son édition, suspension et remise en activité.
- Sur un mobile 390 × 844, vérifier clavier, zone de tap, overflow horizontal, messages d'erreur et confirmation de création.

Documenter en capture les résultats, l'heure du test, les IDs factices et le hash de migration appliquée. Sans preuves de ces scénarios, le projet reste candidat staging uniquement.
