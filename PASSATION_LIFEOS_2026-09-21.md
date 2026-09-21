# Passation LifeOS — Référentiel PRO / PERSO / RELIGION

Dernière mise à jour : 21 septembre 2026

Statut : **finalisation technique en cours**

## 1. Objectif de la mission

Conserver l’architecture, la navigation, les données, l’authentification et le
design de LifeOS, puis compléter seulement les capacités manquantes afin de
transformer le document Word « Référentiel personnel — PRO / PERSO / RELIGION »
en données structurées, modifiables et suivables.

Principes appliqués :

- aucune refonte ni architecture parallèle ;
- aucune suppression de table, colonne ou donnée ;
- aucun reset Supabase ;
- aucune date, heure, cible ou priorité inventée ;
- import idempotent et sans écrasement des valeurs existantes ;
- document Word complet conservé comme référence privée.

## 2. État initial constaté

Le projet possédait déjà :

- une application Next.js avec navigation par domaines ;
- une authentification Supabase ;
- des pages et formulaires génériques ;
- des tables pour objectifs, projets, tâches, KPI, décisions, revues,
  habitudes, religion, documents, finances, santé et apprentissage ;
- des politiques RLS et des relations d’ownership ;
- un dashboard et un centre d’alertes ;
- un déploiement Vercel existant.

Données du compte personnel avant cette mission : 4 objectifs, 14 projets,
27 tâches, 3 KPI, 4 décisions, aucune revue hebdomadaire, aucune habitude,
aucune routine religieuse et un document PRO privé.

## 3. Travail réalisé

- Lecture intégrale du Word : 117 pages et 2 357 paragraphes.
- Inventaire du code, des routes, composants, tables et relations existants.
- Ajout du classement transversal `PRO / PERSO / RELIGION` aux moteurs existants.
- Ajout de champs opérationnels manquants : complétude, cible, unité, prochaine
  action, prochaine revue, date sans heure, contexte temporel et relations.
- Enrichissement des habitudes et routines religieuses existantes, sans créer
  de moteur parallèle.
- Ajout d’un suivi cochable des occurrences sur le dashboard.
- Gestion des routines quotidiennes, hebdomadaires, mensuelles, flexibles et
  contextuelles, avec historique et calcul de période.
- Ajout des rappels à date seule lorsqu’aucune heure n’est connue.
- Ajout d’une ressource `resources` reliée aux objectifs, projets et sujets
  d’étude, avec RLS.
- Ajout d’une valeur explicite `unset` pour les priorités inconnues et, en
  cours de finalisation, pour les cadences KPI inconnues.
- Ajout d’un importeur contrôlé, idempotent, propriétaire et non destructif.
- Ajout du jeu de données structuré et d’un rapport de mapping détaillé.

## 4. Données réellement importées

Premier import appliqué au compte personnel :

- 115 nouveaux enregistrements ;
- 52 enregistrements existants complétés uniquement dans leurs champs vides ;
- 16 nouvelles relations objectif ↔ projet ;
- 1 document Word complet uploadé dans le bucket privé `documents` ;
- 5 divergences historiques conservées sans écrasement.

État obtenu :

| Type | Total |
|---|---:|
| Objectifs | 18 |
| Projets | 22 |
| Tâches | 36 |
| KPI | 22 |
| Décisions | 16 |
| Habitudes | 10 |
| Routines religieuses | 13 |
| Ressources | 17 |
| Sujets d’étude | 10 |
| Rappels | 1 |
| Revues hebdomadaires | 1 |
| Relations objectif-projet | 26 |
| Documents privés | 2 |

Le second passage de l’importeur a prévu **0 insertion, 0 mise à jour et
0 relation supplémentaire**, confirmant l’idempotence.

## 5. Incertitudes conservées explicitement

- Les heures absentes restent vides ; aucun horaire arbitraire n’est créé.
- Les décisions indiquées seulement « septembre 2026 » gardent une date vide.
- « Fin octobre 2026 » est normalisé au 31 octobre 2026 pour la seule revue du
  homelab, avec le libellé source conservé.
- La contradiction sur le nombre de projets actifs est marquée `to_validate`.
- Les formulations sportives contradictoires n’ont produit aucune cible KPI.
- Les routines de contexte (« soir », « week-end », « lorsque possible »)
  conservent ce contexte sans heure précise.
- Les champs incomplets sont marqués `to_complete`, `to_validate` ou
  `to_configure`.

## 6. Problèmes rencontrés et traitement

1. **Échéances date seule** : l’ancien modèle imposait surtout des timestamps.
   Une colonne `due_on` a été ajoutée et les vues utilisent maintenant le
   fuseau du profil.
2. **Routines sans jour précis** : elles risquaient d’être invisibles ou
   impossibles à cocher. Elles sont maintenant actionnables une fois dans leur
   période sans inventer un jour.
3. **Validation sur un mauvais jour** : l’API refuse une occurrence datée dans
   le futur ou incompatible avec le calendrier exact.
4. **Valeurs techniques prises pour des données utilisateur** : les priorités
   et cadences inconnues utilisent un état explicite `unset`.
5. **Données déjà présentes différentes du Word** : l’importeur conserve les
   valeurs existantes et signale les conflits au lieu de les écraser.
6. **Dates de décision uniquement mensuelles** : les fausses dates au premier
   jour du mois ont été supprimées.
7. **Routines hebdomadaires incomplètes non modifiables** : correction finale
   en cours dans la validation des formulaires.
8. **Déduplication du Word par titre insuffisante** : vérification de contenu
   en cours d’ajout pour éviter de réutiliser un ancien fichier différent.

## 7. Sécurité et intégrité

- Les écritures sont rattachées au compte personnel ciblé.
- Les comptes techniques restent réservés aux tests.
- Les tables utilisent l’ownership par `user_id` et la RLS existante.
- La nouvelle table `resources` possède ses propres politiques RLS.
- Le bucket `documents` a été vérifié privé.
- Le fichier Word et sa ligne de métadonnées ont été vérifiés présents.
- Aucun secret n’a été ajouté au dépôt.
- Aucune donnée existante n’a été supprimée.

## 8. Validations déjà réussies

- ESLint : réussi sans avertissement.
- TypeScript : réussi.
- Tests Vitest : 46 réussis, 5 tests live ignorés par la suite standard.
- Build Next.js de production : réussi.
- Simulation Supabase : migrations additives uniquement.
- Migrations Supabase principales : appliquées avec succès.
- Import à blanc puis import réel : réussis.
- Second import : zéro mutation prévue.
- Contrôle des doublons par titre normalisé : aucun doublon détecté.

## 9. Actions restantes avant clôture

- [ ] Terminer les cinq corrections issues de la contre-revue finale.
- [ ] Appliquer et vérifier la migration de cadence KPI `unset`.
- [ ] Corriger les lignes KPI importées concernées sur le compte personnel.
- [ ] Relancer lint, typage, tests, tests Supabase live et build.
- [ ] Vérifier les principaux parcours dans l’interface.
- [ ] Mettre à jour la documentation de validation et les limites connues.
- [ ] Committer et pousser sur GitHub.
- [ ] Déployer et vérifier la production Vercel.
- [ ] Remplacer le statut de ce document par « terminé » avec le résultat final.

## 10. Fichiers de référence

- Données structurées : `initial_data/referentiel_2026-09-21.json`
- Mapping : `initial_data/REFERENTIEL_MAPPING_2026-09-21.md`
- Importeur : `scripts/import-referentiel.mjs`
- Migrations : `supabase/migrations/20260920234036_add_unset_priority.sql`
  et `supabase/migrations/20260920234042_extend_reference_model.sql`
- Rollback applicatif sûr : `ROLLBACK_REFERENCE_MODEL.md`

Ce document doit être mis à jour à la fin de la mission avec les résultats du
déploiement, les tests live et les éventuelles limites restantes.
