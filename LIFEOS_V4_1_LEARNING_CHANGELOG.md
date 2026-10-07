# LifeOS V4.1 — Fusion Apprentissage

## Objectif

Ajouter à la V4 existante un second univers d'interface, **Apprentissage**, sans mélanger l'interface quotidienne de LifeOS avec l'interface de formation.

- LifeOS principal = Aujourd’hui et ses tâches datées, objectifs, KPI, revue, vision.
- Apprentissage = leçons, révisions, Coran, routines d'apprentissage, ressources, progression.
- Les deux univers restent connectés au même Supabase et peuvent partager les données utiles.

## Changements visibles

- Nouvelle entrée `Apprentissage` (icône livre) dans la navigation LifeOS.
- Swap réel vers une sidebar dédiée quand l'utilisateur entre dans `/app/learning`.
- Navigation mobile dédiée en bas de l'écran dans Apprentissage.
- Bouton `Retour à LifeOS` toujours visible dans l'univers Apprentissage.
- Accueil Apprentissage séparé du dashboard `Aujourd'hui` LifeOS.
- Pages dédiées :
  - `/app/learning`
  - `/app/learning/lessons`
  - `/app/learning/revisions`
  - `/app/learning/quran`
  - `/app/learning/routines`
  - `/app/learning/resources`
  - `/app/learning/progress`

## Données réutilisées

Aucune duplication des modèles existants pour :

- `study_topics`
- `study_sessions`
- `religion_routines`
- `religion_logs`
- `quran_items`
- `quran_sessions`
- `resources` avec `life_area='religion'`

## Points d'attention Coran

Ajout du modèle dédié `quran_revision_points` avec :

- création depuis l'interface Révisions ;
- lien optionnel vers `quran_items` ;
- sourate + verset obligatoires ;
- type de difficulté ;
- note ;
- priorité ;
- compteur d'occurrences ;
- statut actif / maîtrisé / archivé ;
- prochaine révision ;
- actions rapides `Toujours fragile`, `Maîtrisé`, `Réouvrir` ;
- RLS utilisateur.

## Règles d'interface

L'accueil Apprentissage ne reprend pas les objectifs annuels et missions de LifeOS. Il ne remonte que :

- routines d'apprentissage réellement dues aujourd'hui ;
- sujets d'étude explicitement datés aujourd'hui ;
- révisions Coran arrivées à échéance ;
- points d'attention dus.

Les statistiques Apprentissage restent dans `/app/learning/progress`.

## Évolutivité

Religion est le premier domaine actif. Le shell Apprentissage est conçu pour accueillir ensuite d'autres domaines (arabe, certifications, culture pro, etc.) sans les mélanger avec LifeOS principal.
