# 06 — Prompt d'implémentation pour GPT / Codex

Tu travailles sur le projet **LifeOS** existant.

Je te fournis ce package de spécifications pour enrichir **uniquement la branche Religion**, sans déconstruire ni réécrire inutilement l'architecture existante.

## Sources de vérité à lire AVANT de modifier le code

1. `README.md`
2. `01_SPEC_FONCTIONNELLE.md`
3. `02_UX_NAVIGATION.md`
4. `03_QURAN_POINTS_ATTENTION.md`
5. `04_DATA_MODEL_SUPABASE.md`
6. `05_ACCEPTANCE_TESTS.md`
7. `07_ETAT_SUPABASE_2026-09-24.md`
8. `08_JOINTURE_FUTURE_OBJECTIFS.md`
9. `references/Referentiel_Religion_extrait.md`
10. `references/vision_religion_v1.png`

Le document `references/Referentiel_perso_complet.docx` peut être consulté uniquement si davantage de contexte est nécessaire.

## Mission

Construire une première version réellement utilisable du module Religion de LifeOS en réutilisant au maximum l'existant.

### À faire

- inspecter d'abord le code et les migrations actuelles ;
- identifier les routes, composants et patterns existants ;
- conserver la charte graphique globale LifeOS ;
- connecter les écrans aux vraies tables Supabase ;
- ne pas afficher de mock data en production ;
- implémenter la navigation Religion décrite ;
- rendre fonctionnels Coran, Arabe, Étudier, Duʿāʾ/Adhkār, Bibliothèque et Progression ;
- ajouter le système de **points d'attention Coran** ;
- créer la migration minimale nécessaire pour ce nouveau concept ;
- ajouter les policies RLS correctes ;
- vérifier build, types, requêtes et sécurité.

## Feature obligatoire : point d'attention Coran

Je veux pouvoir, lorsque je remarque une erreur récurrente, ouvrir un drawer/menu depuis Coran et sélectionner :
- sourate ;
- verset ;
- type de difficulté ;
- note ;
- priorité.

Le point doit rester actif et être automatiquement mis en avant dans la semaine de révision tant qu'il n'est pas marqué maîtrisé.

Il doit conserver :
- historique ;
- nombre d'occurrences ;
- dernière occurrence ;
- prochaine révision ;
- statut.

Ne pas implémenter cette fonctionnalité comme une simple note dans `quran_sessions`.

## Contraintes

- aucune suppression de table/donnée existante ;
- aucune refonte générale non demandée ;
- pas de deuxième système d'objectifs ;
- ne pas dupliquer `resources`, `tasks`, `habits`, `kpis` ;
- respecter l'ownership `user_id`;
- RLS sur toute nouvelle table exposée ;
- ne jamais exposer `service_role` dans le frontend ;
- migration réversible ;
- préserver les fonctionnalités déjà en production.

## Méthode

1. Audit du code existant.
2. Mapping de la spec vers les composants/routes/tables.
3. Plan de modification minimal.
4. Migration DB si nécessaire.
5. Implémentation UI + data access.
6. Tests.
7. Rapport final :
   - fichiers modifiés ;
   - migrations ;
   - fonctionnalités réalisées ;
   - tests exécutés ;
   - points restant à faire ;
   - éventuels écarts justifiés par rapport à la spec.

Ne me redemande pas de redéfinir le besoin : ce package constitue le cahier des charges de la V1.
