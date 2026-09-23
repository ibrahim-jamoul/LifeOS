# LifeOS — Module Religion V1

## But du package

Ce package décrit la V1 fonctionnelle du module **Religion** de LifeOS.

Il doit servir de référence à GPT/Codex pour :
- enrichir le module Religion sans déconstruire le reste de LifeOS ;
- exploiter les tables Supabase existantes avant d'en créer de nouvelles ;
- transformer les routines religieuses en expérience réellement utilisable au quotidien ;
- préparer une future jointure avec le système global Objectifs / Aujourd'hui / KPI ;
- ajouter un système persistant de **points d'attention Coran** pour les versets régulièrement mal récités ou mal mémorisés.

## Principe non négociable

LifeOS reste la **source de vérité**.

Le module Religion ne doit pas créer un deuxième gestionnaire d'objectifs parallèle.
Les objectifs globaux seront reliés ensuite au système central `goals / tasks / habits / kpis`.

## Sources incluses

- `references/Referentiel_perso_complet.docx` : document complet fourni par l'utilisateur.
- `references/Referentiel_Religion_extrait.md` : extraction de la partie Religion.
- `references/vision_religion_v1.png` : direction UX/UI validée conceptuellement.

## Ordre de lecture recommandé

1. `01_SPEC_FONCTIONNELLE.md`
2. `02_UX_NAVIGATION.md`
3. `03_QURAN_POINTS_ATTENTION.md`
4. `04_DATA_MODEL_SUPABASE.md`
5. `05_ACCEPTANCE_TESTS.md`
6. `06_PROMPT_IMPLEMENTATION_GPT_CODEX.md`
7. `07_ETAT_SUPABASE_2026-09-24.md`
8. `08_JOINTURE_FUTURE_OBJECTIFS.md`

## Important

La maquette visuelle est une **direction produit**, pas un pixel-perfect à recopier aveuglément.
Le développeur doit conserver la charte, les composants, la navigation et les conventions actuelles de LifeOS.

Ne jamais supprimer des données ou tables existantes pour simplifier l'implémentation.
