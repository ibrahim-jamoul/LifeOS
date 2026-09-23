# 05 — Modèle d'action et sécurité IA

## Trois niveaux

### Niveau 1 — observation
Lecture et analyse. Aucun changement de données métier.

### Niveau 2 — recommandation
Création éventuelle d'une recommandation structurée, sans exécution de la modification proposée.

### Niveau 3 — action
Exécution uniquement après autorisation explicite ou règle d'automatisation préalablement validée.

## Interdictions

- accès SQL libre du modèle ;
- `service_role` dans le frontend ;
- clé OpenAI dans le navigateur ;
- requête arbitraire construite par le modèle ;
- mutation sans validation de schéma ;
- mutation inter-utilisateur.

## Pattern recommandé

```text
Frontend
  ↓
Server Action / API route / Edge Function
  ↓
validation + auth + policy applicative
  ↓
fonction métier contrôlée
  ↓
Supabase
```

Exemples de fonctions autorisées à terme :
- `create_learning_item()`
- `schedule_revision()`
- `create_memo()`
- `create_recommendation()`
- `get_learning_history()`

Chaque fonction doit définir exactement les champs modifiables et vérifier `user_id` côté serveur.
