# Validation RLS V5 — à exécuter en STAGING, pas en production

Préparer deux comptes tests `A` et `B`, puis appliquer la migration V5 sur un projet Supabase temporaire. Vérifier :

1. A crée un parcours, un module, une activité et une notion via `/api/learning/v5` (JWT A) ; toutes les lignes portent `user_id=A`.
2. B appelle GET `?view=path&id=<path_de_A>` : HTTP **404** ; ses GET `?view=home`, `?view=due` ne retournent aucune donnée de A.
3. B appelle POST `set_activity_completion` sur l'activité A : **404**, aucune modification côté A.
4. B appelle POST `record_session` avec `pathId=A` : refus, aucune session insérée.
5. B tente `initialize_learning_path` en RPC avec l'UUID du parcours A : **refus 42501**.
6. B tente `complete_learning_review` en RPC avec une notion A : **refus 42501**.
7. Une session de A liée à une activité de A située dans un AUTRE parcours est refusée par `learning_session_path_integrity` (23514).
8. A passe une notion de `fragile` à `correct` ; vérifier que l'historique existe, que la prochaine échéance est calculée et qu'aucun champ de B n'a changé.
9. Le certificat PSM peut relier un `project_id` appartenant à A. A ne peut pas renseigner le `project_id` d'un projet B (23503).
10. Désactiver le JWT et appeler POST `create_path` : HTTP **401**.

Conserver les captures de requêtes/réponses et les résultats RLS dans le rapport de validation. Ne jamais utiliser les identifiants de l'utilisateur principal pour les tests d'isolation.
