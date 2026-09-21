# Passation finale LifeOS — Référentiel PRO / PERSO / RELIGION

Dernière mise à jour : 21 septembre 2026

Statut : **mission terminée, poussée sur GitHub et vérifiée en production**

## 1. Objectif et résultat

L’architecture, la navigation, les données personnelles, l’authentification et
le design existants de LifeOS ont été conservés. Les capacités manquantes ont
été ajoutées de façon additive pour transformer le document Word
« Référentiel personnel — PRO / PERSO / RELIGION » en données structurées,
modifiables, cochables et suivables.

Principes respectés :

- aucune refonte ni architecture parallèle ;
- aucun reset Supabase, `DROP TABLE` ou suppression de colonne ;
- aucune date, heure, cible, priorité ou cadence inventée ;
- réutilisation des moteurs et relations existants ;
- import reproductible, idempotent et sans écrasement des valeurs existantes ;
- document Word complet conservé comme référence privée ;
- comptes techniques réservés aux tests.

## 2. État initial constaté

Le projet possédait déjà :

- une application Next.js avec navigation par domaines ;
- une authentification Supabase et un compte personnel ;
- des pages et formulaires génériques ;
- des tables pour objectifs, projets, tâches, KPI, décisions, revues,
  habitudes, religion, documents, finances, santé et apprentissage ;
- des politiques RLS et des relations d’ownership ;
- un dashboard, un centre d’alertes et un déploiement Vercel.

Avant cette mission, le compte personnel contenait 4 objectifs, 14 projets,
27 tâches, 3 KPI, 4 décisions, aucune revue hebdomadaire, aucune habitude,
aucune routine religieuse et un document PRO privé.

## 3. Analyse du référentiel

- Lecture intégrale du Word : **117 pages et 2 357 paragraphes**.
- Vérification des paragraphes, tableaux, en-têtes, pieds de page, commentaires,
  zones de texte et révisions suivies.
- Extraction sélective des éléments opérationnels uniquement : objectifs,
  projets, tâches, KPI, habitudes, routines, décisions, certifications,
  ressources, échéances, récurrences et revues.
- Le texte brut des 117 pages n’a pas été dupliqué dans les tables métiers.
- Le Word complet a été envoyé dans le bucket Supabase privé `documents` et
  relié au compte personnel comme document de référence.

## 4. Fonctionnalités existantes conservées

- navigation et routes existantes ;
- dashboard et vues par ressource ;
- authentification Supabase actuelle ;
- ownership par `user_id` et RLS ;
- formulaires génériques de création et modification ;
- tables et relations métier existantes ;
- centre d’alertes et rappels internes ;
- design et composants visuels actuels.

## 5. Capacités complétées

- Classement transversal `PRO / PERSO / RELIGION` sur les moteurs existants.
- Champs opérationnels manquants : complétude, cible, unité, prochaine action,
  prochaine revue, échéance sans heure, contexte temporel et relations.
- Valeur explicite `unset` pour une priorité ou une cadence KPI inconnue.
- Ressources reliables aux objectifs, projets et sujets d’étude, avec RLS.
- Vue des routines du jour sur le dashboard, avec fait/restant/manqué.
- Occurrences cochables et historisées pour habitudes et routines religieuses.
- Récurrences quotidiennes, hebdomadaires et mensuelles avec calcul de période ;
  les contextes flexibles restent informatifs sans calendrier fictif.
- Routines hebdomadaires ou mensuelles sans jour précis cochables une fois dans
  la période, sans inventer un jour.
- Rappels à date seule lorsque l’heure est inconnue.
- Dates de tâches calculées dans le fuseau horaire du profil.
- Compatibilité maintenue avec les anciens payloads API des habitudes et logs
  religieux.
- Importeur contrôlé par propriétaire, vérification SHA-256 avant toute
  réutilisation ou tout téléversement du Word, déduplication et mise à jour
  limitée aux champs vides.

## 6. Données réellement créées ou complétées

Premier import appliqué au compte personnel :

- **115** nouveaux enregistrements ;
- **52** enregistrements existants complétés uniquement dans leurs champs vides ;
- **16** nouvelles relations objectif ↔ projet ;
- **1** Word complet envoyé dans le stockage privé ;
- divergences avec l’existant conservées au lieu d’être écrasées.

État final du compte personnel :

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

La simulation finale de l’importeur prévoit **0 insertion, 0 mise à jour et
0 relation supplémentaire**. Elle reconnaît 193 éléments conformes et conserve
8 divergences historiques explicites : l’import est idempotent.

## 7. Routines, récurrences et rappels

Les principales récurrences explicites du Word ont été créées, notamment :

- revue LifeOS quotidienne et revue hebdomadaire du dimanche ;
- suivi financier mensuel, sport, lecture et réduction du temps d’écran ;
- arabe 30 minutes par jour ;
- apprentissage religieux quotidien et révision du Coran ;
- nouvelle page de Coran et Tafsir, avec les semaines du mois conservées comme
  contexte source ;
- Seerah une fois par semaine ;
- dhikr quotidien, adhkar contextuels et sadaqa le vendredi ;
- revue religieuse mensuelle.

Les heures absentes restent vides et les rappels de routine correspondants
restent désactivés/configurables. Le rappel de réévaluation du homelab est créé
pour le 31 octobre 2026, sans heure inventée, avec le statut `to_configure`.

## 8. Décisions et certifications

Les 16 décisions du compte couvrent notamment le positionnement professionnel,
l’ordre des certifications, LifeQuest, le homelab, le véhicule, les finances et
les règles de progression religieuse. Les dates exactes n’existent que lorsque
le Word les permet ; les dates mensuelles ou déclenchées par un événement sont
restées sans fausse échéance.

La roadmap de certifications est représentée avec les objectifs/projets
existants : PSM I, CCNA, AWS Solutions Architect Associate, Terraform Associate,
Azure AZ-104 et CEH lorsque pertinent. Les priorités, fenêtres et statuts ne
sont renseignés que lorsqu’ils sont explicites dans le Word.

## 9. Incertitudes et conflits volontairement conservés

- Les heures absentes restent vides.
- Les décisions indiquées seulement « septembre 2026 » gardent une date vide.
- « Fin octobre 2026 » est normalisé au 31 octobre uniquement pour la
  réévaluation explicite du homelab ; le libellé source reste conservé.
- La contradiction sur le nombre de projets actifs est `to_validate`.
- Les formulations sportives contradictoires n’ont produit aucune cible KPI.
- Les contextes « soir », « week-end » ou « lorsque possible » ne deviennent
  pas des heures arbitraires.
- Les champs incomplets restent `to_complete`, `to_validate` ou `to_configure`.
- Les 8 conflits avec les valeurs historiques du compte ont été signalés et
  préservés ; ils ne sont pas des échecs d’import.

## 10. Problèmes rencontrés et corrections

1. Les échéances sans heure étaient mal représentées : ajout de `due_on` et
   calcul selon le fuseau du profil.
2. Les routines sans jour précis pouvaient être invisibles : elles sont
   désormais actionnables une fois dans leur période.
3. Une occurrence pouvait être cochée au mauvais jour : l’API refuse le futur,
   un jour incompatible ou une date hors période active.
4. Les inconnues étaient parfois matérialisées par une valeur technique : les
   priorités et cadences inconnues utilisent maintenant `unset`.
5. Les fausses dates au premier jour du mois ont été supprimées.
6. Les routines `to_validate`/`to_complete` sans jour restent modifiables.
7. Les stubs KPI PRO du seed ont reçu uniquement leurs cibles explicites.
8. Le chargement des logs du dashboard respecte maintenant le fuseau du profil.
9. La réutilisation du Word vérifie son contenu SHA-256 avant tout import.
10. Les anciens payloads API ont été rendus compatibles avec les nouveaux
    champs, après détection par les tests de parcours.
11. Sept anciens artefacts E2E appartenant aux comptes techniques ont été
    supprimés par identifiants explicites. Aucune donnée personnelle ou métier
    du compte principal n’a été supprimée.

## 11. Migrations Supabase

Trois migrations additives ont été appliquées ; l’historique local et distant
est identique :

1. `20260920234036_add_unset_priority.sql`
2. `20260920234042_extend_reference_model.sql`
3. `20260921150000_add_unset_kpi_cadence.sql`

Le rollback applicatif sûr est documenté dans
`ROLLBACK_REFERENCE_MODEL.md`. Aucun reset ni migration destructive n’a été
utilisé.

## 12. Sécurité et intégrité

- Les écritures sont rattachées au compte personnel ciblé.
- Les comptes techniques restent réservés aux tests.
- Les nouvelles données utilisent l’ownership et la RLS.
- La table `resources` possède ses propres politiques RLS.
- Le bucket `documents` est privé ; le Word est inaccessible à un autre compte
  authentifié et à un client anonyme.
- Aucun secret, mot de passe ou adresse de compte n’a été ajouté au dépôt.
- Aucun doublon de titre normalisé n’a été détecté.

## 13. Tests et résultats

- ESLint : réussi, zéro avertissement.
- TypeScript : réussi.
- Vitest : **47 tests réussis**, 5 tests live ignorés par la commande standard.
- Supabase live : **5 tests RLS/Storage réussis** avec deux comptes dédiés.
- Playwright local : **4/4** parcours desktop/mobile, anonyme et authentifié.
- Playwright production : **4/4** parcours réussis.
- Build Next.js 16.3.5 de production : réussi.
- Contrôle navigateur de la page de connexion : rendu interactif, aucune
  erreur de page ni overlay framework.
- `git diff --check` et syntaxe de l’importeur : réussis.
- Après les parcours de production : **0 artefact E2E résiduel**.

## 14. GitHub et production

- Commit fonctionnel : `b4f8ccb feat: operationalize personal reference data`.
- Branche `main` poussée sur GitHub.
- Déploiement Vercel de production : `Ready` en 31 secondes.
- URL publique vérifiée : `https://lifeos-delta-three.vercel.app`.
- Page de connexion : HTTP 200.
- Aucun log d’erreur ni réponse HTTP 500 détecté après le déploiement.

## 15. Mapping de contrôle

Le rapport détaillé ligne par ligne se trouve dans
`initial_data/REFERENTIEL_MAPPING_2026-09-21.md` et suit le format demandé :

| WORD | TYPE LIFEOS | DOMAINE | FRÉQUENCE | RAPPEL | STATUT |
|---|---|---|---|---|---|
| Arabe — environ 30 min/jour | Routine religieuse | RELIGION | Quotidienne, 30 min | Désactivé, heure à configurer | `to_configure` |
| Seerah — une séance/semaine | Routine religieuse | RELIGION | Hebdomadaire | Désactivé, jour/heure à configurer | `to_configure` |
| Sadaqa chaque vendredi | Routine religieuse | RELIGION | Vendredi | Désactivé, heure à configurer | `to_configure` |
| 3 nouvelles pages de Coran/mois | Objectif + KPI + routines | RELIGION | Mensuelle | Selon routines, sans heure inventée | `ready`/`to_configure` |
| Homelab — réévaluer fin octobre | Décision + rappel | PERSO, lié à un projet PRO | 31 octobre 2026 | Interne, sans heure | `to_configure` |

## 16. Limites et actions utilisateur optionnelles

La mission technique est terminée. Les prochaines actions relèvent des choix
personnels, pas d’un blocage :

- examiner les 8 conflits historiques avant de décider si une valeur doit être
  remplacée manuellement ;
- choisir, si souhaité, les heures/jours encore `to_configure` ;
- trancher les ambiguïtés sur le sport et le nombre de projets actifs ;
- les indications Coran « semaines 1–3 » et « semaines 4–5 » restent des
  contextes à suivre, sans règle calendaire automatique ;
- les routines `flexible` ou `contextual` restent cochables lorsqu’elles sont
  réalisées, mais ne produisent pas de prochaine occurrence et ne sont pas
  comptées comme manquées ;
- les rappels internes sont opérationnels ; les notifications push navigateur
  n’ont pas été ajoutées dans cette mission ;
- commencer à cocher les routines et enregistrer les mesures KPI ;
- configurer ultérieurement un fournisseur IA compatible si les fonctions IA
  optionnelles doivent être utilisées.

## 17. Fichiers de référence

- Données structurées : `initial_data/referentiel_2026-09-21.json`
- Mapping : `initial_data/REFERENTIEL_MAPPING_2026-09-21.md`
- Importeur : `scripts/import-referentiel.mjs`
- Rapport de validation : `VALIDATION_REPORT.md`
- Limites connues : `KNOWN_LIMITATIONS.md`
- Décisions techniques : `DECISIONS.md`
- Rollback : `ROLLBACK_REFERENCE_MODEL.md`
