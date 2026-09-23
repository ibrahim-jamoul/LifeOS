# Mapping du référentiel personnel vers LifeOS

Source : `D:\Referentiel perso.docx`

Jeu de données : `initial_data/referentiel_2026-09-21.json`
Date d'analyse : 21 septembre 2026

Ce rapport décrit la transformation du Word en données opérationnelles. Le texte complet reste un document privé ; LifeOS ne reçoit que les éléments structurés et modifiables. Les valeurs absentes ne sont pas complétées silencieusement.

Le schéma actuel initialise obligatoirement certains champs `progress_percent` à `0`. Cette valeur est technique et ne signifie pas qu'une mesure de progression a été trouvée dans le Word ; les éléments concernés restent signalés `to_complete` ou `to_configure`.

## Légende des statuts

| Statut | Signification |
| --- | --- |
| `ready` | Les informations nécessaires sont explicites dans le Word. |
| `to_complete` | Un champ requis ou utile n'est pas défini dans le Word. |
| `to_validate` | Le Word contient une ambiguïté ou une contradiction à arbitrer. |
| `to_configure` | L'élément est exploitable mais un jour, une heure, une cadence de mesure ou un rappel reste à configurer. |

## Objectifs et projets

| WORD | TYPE LIFEOS | DOMAINE | FRÉQUENCE / ÉCHÉANCE | RAPPEL | STATUT |
| --- | --- | --- | --- | --- | --- |
| Obtenir un CDI Consultant / Chef de projet IT junior | Objectif + projet existants | PRO | Aucune date exacte | Non | `ready` |
| PSM I | Projet certification existant | PRO | Octobre / novembre 2026, sans jour exact | À configurer | `to_configure` |
| CCNA | Projet certification existant | PRO | Décembre 2026 / janvier 2027, sans jour exact | À configurer | `to_configure` |
| AWS Solutions Architect Associate | Projet certification | PRO | Premier trimestre 2027, sans jour exact | À configurer | `to_configure` |
| Terraform Associate | Projet certification | PRO | 2027 après pratique sur un projet réel | Déclencheur conservé, pas de date inventée | `to_configure` |
| Azure AZ-104 | Projet certification | PRO | 2027 après AWS | Déclencheur conservé, pas de date inventée | `to_configure` |
| CEH | Projet certification en pause | PRO | Pas de date ; dépend du futur poste | Non | `to_validate` |
| Portfolio de 3 à 4 projets riches | Objectif existant | PRO | Progressif | Non | `ready` |
| PFE Orange / Dataiku | Projet portfolio existant | PRO | Aucune date exacte | Non | `ready` |
| LifeOS | Projet portfolio existant + objectif personnel | PRO / PERSO | Projet continu ; première version à terminer rapidement | Non | `ready` |
| Homelab réseaux / systèmes / cybersécurité | Projet portfolio existant | PRO | Construction progressive sur plusieurs mois | Réévaluation d'achat au 31/10/2026, heure à configurer | `ready` |
| Cloud Lab AWS + Terraform + IAM | Projet portfolio existant | PRO | Aucune date exacte | Non | `ready` |
| LifeQuest | Objectif + projet business existants | PRO | Court / moyen terme, sans date exacte | Non | `ready` |
| Plusieurs sources de revenus | Objectif relié aux projets business | PRO | Moyen / long terme | Non | `to_complete` |
| Immobilier / patrimoine | Projet personnel | PERSO | Long terme | Non | `to_complete` |
| Bonne hygiène de vie | Objectif | PERSO | Continu | Non | `to_complete` |
| Situation financière confortable | Objectif | PERSO | Continu | Non | `to_complete` |
| Fonds de sécurité | Objectif | PERSO | Cible explicite : environ 6 mois de dépenses essentielles | Non | `to_complete` |
| Réduire le temps d'écran inutile | Objectif | PERSO | Continu ; aucun seuil chiffré | Non | `to_complete` |
| Sport régulier | Objectif | PERSO | Cible contradictoire dans le Word | Non | `to_validate` |
| Maintenir et améliorer l'anglais | Objectif | PERSO | Aucune fréquence précise | Non | `to_complete` |
| Lire et apprendre régulièrement | Objectif | PERSO | Fréquence non chiffrée | Non | `to_complete` |
| Voyager régulièrement | Objectif | PERSO | Une ou plusieurs expériences par an selon les moyens | Non | `to_complete` |
| Construire progressivement le patrimoine | Objectif | PERSO | Long terme ; pas d'échéance opérationnelle | Non | `to_complete` |
| Documents personnels | Projet personnel | PERSO | Quelques sessions initiales puis maintenance | Non | `ready` |
| Photos et souvenirs | Projet personnel | PERSO | Progressif | Non | `ready` |
| Système personnel d'organisation | Projet personnel | PERSO | Mise en place progressive puis utilisation quotidienne | Non | `ready` |
| Coran | Objectif | RELIGION | 3 pages par mois | Occurrences sans heure | `ready` |
| Arabe | Objectif | RELIGION | Environ 30 minutes par jour | Heure à configurer | `to_complete` |
| Apprentissage religieux | Objectif | RELIGION | Au moins un apprentissage par jour | Heure à configurer | `ready` |

## Actions

| WORD | TYPE LIFEOS | DOMAINE | FRÉQUENCE / ÉCHÉANCE | RAPPEL | STATUT |
| --- | --- | --- | --- | --- | --- |
| Candidater et contacter des recruteurs | Routines hebdomadaires + KPI | PRO | Environ 10 candidatures et 5 à 10 contacts par semaine | Jours/heures non définis | `to_configure` / `to_validate` |
| Préparer / passer PSM I | Tâches existantes | PRO | Fenêtre oct./nov. 2026 | À configurer | `to_configure` |
| Pratiquer et documenter les labs CCNA | Tâches existantes | PRO | Régulier, sans jours définis | Non | `to_configure` |
| Préparer AWS SAA | Tâche | PRO | T1 2027, sans jour exact | À configurer | `to_configure` |
| Pratiquer Terraform sur un vrai projet | Tâche | PRO | Avant la certification, sans date | Non | `ready` |
| Réaliser un petit projet Azure | Tâche | PRO | Avant AZ-104, sans date | Non | `ready` |
| Définir l'architecture du Homelab | Tâche existante | PRO | Sans date exacte | Non | `ready` |
| Construire le prototype LifeQuest | Tâche existante | PRO | Sans date exacte | Non | `ready` |
| Faire l'inventaire des documents | Tâche | PERSO | Sans date exacte | Non | `ready` |
| Définir l'arborescence documentaire | Tâche | PERSO | Sans date exacte | Non | `ready` |
| Centraliser les photos existantes | Tâche | PERSO | Sans date exacte | Non | `ready` |
| Sélectionner des textes religieux | Tâche | RELIGION | Sans cadence précise | Non | `to_complete` |
| Choisir une ressource Seerah | Tâche | RELIGION | Sans date ; ressource explicitement « à définir » | Non | `to_complete` |

Les 27 tâches PRO déjà présentes sont reconnues par leur titre et uniquement enrichies avec le domaine PRO quand ce champ est vide. Elles ne sont ni recréées ni réinitialisées.

## KPI

| WORD | TYPE LIFEOS | DOMAINE | FRÉQUENCE / CIBLE | RAPPEL | STATUT |
| --- | --- | --- | --- | --- | --- |
| Candidatures ciblées | KPI existant | PRO | ≥ 10 / semaine | Non | `ready` |
| Contacts recruteurs | KPI existant | PRO | 5 à 10 / semaine | Non | `ready` |
| Entretiens obtenus | KPI | PRO | Cible et cadence absentes | Non | `to_configure` |
| Progression PSM I | KPI | PRO | Unité, cible et cadence absentes | Non | `to_configure` |
| Progression CCNA | KPI | PRO | Unité, cible et cadence absentes | Non | `to_configure` |
| Progression des projets portfolio | KPI | PRO | Unité, cible et cadence absentes | Non | `to_configure` |
| Avancement LifeQuest | KPI | PRO | Unité, cible et cadence absentes | Non | `to_configure` |
| Séances de sport | KPI | PERSO | Hebdomadaire ; cible non enregistrée car contradictoire | Non | `to_validate` |
| Respect des routines | KPI | PERSO | Méthode, cible et cadence absentes | Non | `to_configure` |
| Temps d'écran inutile | KPI | PERSO | Unité, cible et cadence absentes | Non | `to_configure` |
| Épargne mensuelle | KPI | PERSO | Mensuel ; aucun montant cible | Non | `to_configure` |
| Fonds de sécurité | KPI | PERSO | ≥ 6 mois de dépenses essentielles, mesure mensuelle | Non | `ready` |
| Revues hebdomadaires réalisées | KPI | PERSO | 1 / semaine | Non | `ready` |
| Livres / contenus terminés | KPI | PERSO | Aucune cible ni cadence | Non | `to_configure` |
| Pages de Coran travaillées | KPI | RELIGION | 3 / mois | Non | `ready` |
| Jours avec 30 minutes d'arabe | KPI | RELIGION | Routine quotidienne explicite ; cadence de mesure et cible KPI non définies | Non | `to_configure` |
| Jours avec apprentissage religieux | KPI | RELIGION | Routine quotidienne explicite ; cadence de mesure et cible KPI non définies | Non | `to_configure` |
| Séances Seerah | KPI | RELIGION | 1 / semaine | Non | `ready` |
| Du'a apprises | KPI | RELIGION | « Une par jour lorsque possible » ; pas de cible rigide | Non | `to_validate` |
| Dhikr | KPI | RELIGION | Minimum personnel de 1 000 / jour | Non | `ready` |
| Sadaqa | KPI | RELIGION | 1 / semaine | Non | `ready` |

## Routines et récurrences

| WORD | TYPE LIFEOS | DOMAINE | FRÉQUENCE | RAPPEL | STATUT |
| --- | --- | --- | --- | --- | --- |
| Revue quotidienne LifeOS | Habitude | PERSO | Quotidienne, 5 minutes, le soir | Heure non définie | `to_configure` |
| Candidatures ciblées | Habitude | PRO | Environ 10 / semaine | Jours/heures non définis | `to_configure` |
| Contacts recruteurs ciblés | Habitude | PRO | Environ 5 à 10 / semaine | Jours/heures non définis | `to_validate` |
| Revue hebdomadaire | Habitude | PERSO | Hebdomadaire, idéalement dimanche, durée 15 à 30 min | Heure non définie | `to_configure` |
| Revue mensuelle LifeOS | Habitude | PERSO | Mensuelle | Jour et heure non définis | `to_configure` |
| Sport régulier | Habitude | PERSO | Hebdomadaire | Créneaux non définis | `to_validate` |
| Réduction du temps d'écran | Habitude | PERSO | Quotidienne, déclenchement contextuel | Pas d'heure | `to_complete` |
| Sommeil régulier | Habitude | PERSO | Quotidienne | Heure et durée absentes | `to_complete` |
| Lecture régulière | Habitude | PERSO | Flexible | Non | `to_complete` |
| Revue financière | Habitude | PERSO | Mensuelle | Jour et heure non définis | `to_configure` |
| Arabe | Routine | RELIGION | Quotidienne, environ 30 min | Heure non définie | `to_configure` |
| Apprentissage religieux | Routine | RELIGION | Quotidienne, minimum 1 apprentissage | Heure non définie | `to_configure` |
| Révision du Coran | Routine | RELIGION | Quotidienne | Durée et heure absentes | `to_configure` |
| Nouvelle page de Coran | Routine | RELIGION | Fenêtre samedi + dimanche, 1re à 3e occurrence week-end du mois | Heure non définie | `to_configure` |
| Tafsir de la page | Routine | RELIGION | Fenêtre samedi + dimanche, 1re à 3e occurrence week-end du mois | Heure non définie | `to_configure` |
| Consolidation des 3 pages | Routine | RELIGION | Fenêtre samedi + dimanche, 4e et 5e occurrence week-end lorsqu’elle existe | Heure non définie | `to_configure` |
| Seerah | Routine | RELIGION | 1 séance / semaine | Jour/heure non définis | `to_configure` |
| Dhikr | Routine | RELIGION | Quotidienne, minimum personnel 1 000 | Heure non définie | `to_configure` |
| Nouvelle du'a | Routine flexible | RELIGION | Une par jour lorsque possible | Pas de rappel rigide | `to_validate` |
| Adhkar | Routine contextuelle | RELIGION | Selon les situations du quotidien | Non | `ready` |
| Sadaqa du vendredi | Routine | RELIGION | Chaque vendredi | Heure et montant non définis | `to_configure` |
| Lecture / apprentissage du soir | Routine flexible | RELIGION | Le plus régulièrement possible, environ 22 h–00 h | Pas d'heure exacte | `to_validate` |
| Revue religieuse | Routine | RELIGION | Mensuelle | Jour/heure non définis | `to_configure` |

Le schéma hebdomadaire du Coran est maintenant représenté explicitement par `schedule_window_weekdays=[6,7]` et `schedule_month_weeks` : `[1,2,3]` pour nouvelle page/Tafsir, `[4,5]` pour la révision mensuelle. `time_context` reste descriptif et aucune heure n’est inventée.

## Décisions et rappels

| WORD | TYPE LIFEOS | DOMAINE | RÉÉVALUATION | RAPPEL | STATUT |
| --- | --- | --- | --- | --- | --- |
| Orientation Consultant / Chef de projet IT | Décision existante enrichie | PRO | Après 6 à 12 mois dans le premier CDI | Déclencheur, pas de date inventée | `to_configure` |
| ESN / conseil au début de carrière | Décision existante enrichie | PRO | Après les premières missions | Déclencheur, pas de date inventée | `to_configure` |
| Roadmap PSM I → CCNA → AWS → Terraform / Azure | Décision existante enrichie | PRO | Premier CDI ou offre changeant les priorités | Déclencheur, pas de date inventée | `to_configure` |
| Objectif professionnel long terme | Décision existante enrichie | PRO | Revue annuelle | Date annuelle non précisée | `to_configure` |
| Conserver un socle technique | Décision | PRO | Date non définie | Non | `to_complete` |
| LifeQuest prioritaire | Décision | PRO | Date non définie | Non | `to_complete` |
| Stratégie freelance à moyen terme | Décision | PRO | Lorsque l'expérience et l'expertise sont réellement valorisables | Déclencheur, pas de date réelle disponible | `to_complete` |
| LifeOS source de vérité | Décision | PERSO | Après plusieurs mois d'usage réel | Déclencheur, pas de date inventée | `to_configure` |
| Reporter l'achat du homelab | Décision | PERSO | Fin octobre 2026 | 31/10/2026, heure à configurer | `to_complete` |
| Choix du véhicule | Décision | PERSO | Signature du prochain CDI ou changement de besoin | Déclencheur, pas de date inventée | `to_complete` |
| Structurer les finances avant gros investissements | Décision | PERSO | Revue financière mensuelle | Récurrence portée par la routine | `to_complete` |
| Ne pas multiplier les projets | Décision ambiguë | PERSO | Chaque revue mensuelle | Non | `to_validate` |
| Apprentissage religieux quotidien | Décision | RELIGION | Non définie | Routine associée | `to_complete` |
| Programme Coran | Décision | RELIGION | Revue mensuelle | Routine associée | `to_complete` |
| Programme arabe | Décision | RELIGION | Non définie | Routine associée | `to_complete` |
| Textes religieux pour l'arabe | Décision | RELIGION | Non définie | Non | `to_complete` |

Pour les décisions indiquées uniquement comme « septembre 2026 », `decision_date` reste vide. La précision mensuelle est conservée dans le contexte et l’élément reste `to_complete` : aucun jour artificiel n’est enregistré.

## Certifications et ressources nommées

Les certifications réutilisent les projets ; aucun système parallèle n'est créé. Les ressources ci-dessous sont les seules entrées créées, car elles sont nommées explicitement dans le Word. Aucun lien web n'est inventé.

| Certification | Ressources créées | STATUT |
| --- | --- | --- |
| PSM I | Scrum Guide ; Scrum.org ; Scrum Open Assessments | `planned` |
| CCNA | Cisco Networking Academy ; Cisco U. ; Exam Topics officiels 200-301 ; Packet Tracer | `planned` |
| AWS SAA | AWS Skill Builder ; Exam Guide officiel SAA-C03 ; AWS Well-Architected Framework | `planned` |
| Terraform Associate | HashiCorp Developer ; Learning Path officiel Terraform Associate 004 ; Documentation Terraform | `planned` |
| Azure AZ-104 | Microsoft Learn ; Guide officiel AZ-104 ; Practice Assessments Microsoft | `planned` |
| CEH | Programme officiel EC-Council | `planned` |

Les catégories générales « livres », « ressources religieuses », « ressources arabe » et « ressources Seerah » ne deviennent pas de fausses ressources. La ressource Seerah reste explicitement à définir et génère seulement une prochaine action.

## Sujets d'étude

| WORD | TYPE LIFEOS | DOMAINE | ORDRE / FRÉQUENCE | STATUT |
| --- | --- | --- | --- | --- |
| Juz Tabarak | Sujet d'étude | RELIGION / Coran | Premier à reprendre | `active` |
| Juz Amma | Sujet d'étude | RELIGION / Coran | Après Juz Tabarak | `planned` |
| Juz 28 | Sujet d'étude | RELIGION / Coran | Après les deux précédents | `planned` |
| Seerah | Sujet d'étude | RELIGION | Chronologique, 1 séance / semaine | `active` |
| Aqida, Fiqh, Hadith, Histoire, Biographies | Sujets d'étude | RELIGION | Progression complémentaire, cadence non imposée | `planned` |
| Tafsir | Sujet d'étude | RELIGION | Avec la page de Coran le week-end | `active` |

## Revue importée

La revue hebdomadaire datée du 21 septembre 2026 est transformée en un enregistrement `weekly_reviews` avec avancées, éléments non avancés, causes, risques et trois priorités suivantes. Aucune autre revue historique n'est inventée.

## Éléments volontairement non créés

- Aucune ressource religieuse ou Seerah sans titre explicite.
- Aucun horaire de rappel lorsqu'une formulation indique seulement « le soir », « le week-end », « dimanche » ou « autour de Jumu'ah ».
- Aucun montant de sadaqa, d'épargne ou de budget non fixé.
- Aucun objectif rigide de sport tant que les formulations 3–4, minimum 4 et 5–6 activités ne sont pas arbitrées.
- Aucun objectif rigide d'une du'a par jour : la mention « lorsque possible » est conservée.
- Aucun jour précis pour les certifications exprimées sous forme de mois, fenêtre ou trimestre.
- Aucun item Coran exigeant un numéro de sourate tant que le référentiel ne le donne pas.
- Aucun KPI inventé au-delà de la liste explicitement demandée dans la section « À transférer dans LifeOS » et des mesures chiffrées déjà présentes.
- Aucun faux choix pour la décision contradictoire sur le nombre de projets actifs.

## Garanties de l'import

- Mode simulation par défaut ; écriture uniquement avec `--apply`.
- Rattachement explicite à l'utilisateur indiqué par `LIFEOS_IMPORT_USER_ID` ou `--user`.
- Identifiants déterministes pour les nouveaux éléments.
- Déduplication par `source_key`, date unique ou titre normalisé selon la table.
- Aucun `delete`, aucun reset, aucun `DROP`.
- Aucun remplacement d'une valeur utilisateur non vide ; les divergences sont signalées comme conflits.
- Document Word uploadé seulement dans le bucket privé `documents`, sans écraser un objet existant.
- Relance sûre après une erreur partielle grâce aux identifiants et correspondances déterministes.
