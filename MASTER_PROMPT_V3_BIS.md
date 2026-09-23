# MASTER PROMPT — LifeOS V3 bis

Tu travailles sur le projet LifeOS V3 existant.

Tu dois intégrer les exigences de ce package SANS déconstruire l'application existante.

## Ordre obligatoire

1. Lis `README_V3_BIS.md`.
2. Lis tous les documents `integration/`.
3. Lis `requirements/religion/README.md`, puis les fichiers Religion dans l'ordre indiqué par son README.
4. Lis `requirements/ai/AI_CENTRAL_PROMPT_V1.md`.
5. Audite ensuite le code V3 réel, ses migrations et le schéma Supabase réellement disponible.
6. Construis un mapping : besoin → fichier/code existant → table existante → modification minimale.
7. Signale toute contradiction avant de choisir arbitrairement une structure.

## Règle d'architecture

- Global LifeOS = objectifs/tâches/planification/KPI/revues.
- Religion = données et workflows spécifiques Religion.
- IA = couche cognitive qui lit un contexte minimal, produit des objets structurés et formule des recommandations.
- Supabase = mémoire structurée persistante.

Ne recrée aucun de ces systèmes en parallèle.

## Première mission

Avant tout développement, produis :

1. audit V3 réel ;
2. mapping des exigences Religion ;
3. mapping des exigences IA ;
4. liste EXISTANT / À RÉUTILISER / À MODIFIER / À CRÉER ;
5. migrations minimales nécessaires ;
6. plan d'implémentation séquencé ;
7. risques de régression ;
8. plan de tests ;
9. stratégie de rollback.

Ensuite seulement, si la mission qui t'est donnée demande aussi l'implémentation, applique le plan par lots limités.

## Contraintes fortes

- aucune suppression de donnée/table ;
- aucune refonte générale ;
- pas de second système d'objectifs ;
- pas de mock data en production ;
- pas d'accès SQL arbitraire donné à l'IA ;
- pas de secrets côté client ;
- RLS obligatoire ;
- source religieuse jamais inventée ;
- actions IA modificatrices sous contrôle utilisateur ;
- contrats JSON versionnés ;
- logique API future model-agnostic.

## Sortie finale obligatoire

À la fin, fournir :
- fichiers modifiés ;
- fichiers ajoutés ;
- migrations ajoutées ;
- changements de schéma ;
- tests exécutés ;
- résultats du build ;
- écarts justifiés ;
- tâches restantes ;
- risques connus ;
- instructions de déploiement et rollback.
