Je travaille actuellement sur mon application personnelle LifeOS.

Deux autres agents travaillent déjà en parallèle :

- un agent sur la visualisation, les objectifs, le dashboard et la restitution des données ;
- un agent sur le module Religion et mes attentes fonctionnelles concernant cette partie.

TON PÉRIMÈTRE EST DIFFÉRENT.

Tu dois travailler exclusivement sur la conception de la couche IA centrale de LifeOS.

Je ne veux pas simplement ajouter un chatbot dans mon application.

Je veux construire progressivement un véritable assistant personnel, formateur, guide et conseiller qui travaille POUR LifeOS.

L’architecture générale que j’imagine est :

IA
↓
analyse / recherche / génération / personnalisation
↓
Supabase
↓
LifeOS
↓
restitution, suivi, historique, progression, rappels

LifeOS constitue principalement la mémoire structurée, le moteur de suivi et l’interface de restitution.

L’IA constitue la couche d’intelligence.

À court terme, cette IA pourra fonctionner manuellement via ChatGPT GPT-5.6 avec un niveau de raisonnement élevé.

À moyen terme, les traitements répétitifs et suffisamment fiables pourront être automatisés via API.

Je veux donc que tu conçoives dès maintenant une architecture compatible avec ces deux modes :

1. fonctionnement manuel via ChatGPT ;
2. automatisation future via API.

---

# 1. VISION GÉNÉRALE

À terme, mon assistant IA doit pouvoir jouer plusieurs rôles simultanément.

## Formateur

Il doit pouvoir préparer mes apprentissages quotidiens selon les différents domaines de LifeOS.

Par exemple :

- Religion ;
- arabe ;
- Coran ;
- certifications ;
- connaissances professionnelles ;
- autres apprentissages futurs.

Il peut générer :

- une leçon ;
- une notion à apprendre ;
- un hadith sourcé ;
- une duʿāʾ ;
- du vocabulaire ;
- une explication ;
- un exercice ;
- un quiz ;
- une fiche de synthèse ;
- une fiche mémo ;
- une révision.

L’objectif n’est pas que LifeOS génère ces contenus lui-même.

L’IA génère les contenus puis les stocke sous une forme structurée exploitable par LifeOS.

---

# 2. MÉMOIRE D’APPRENTISSAGE

L’assistant doit conserver la trace de ce que j’ai réellement appris.

Il doit pouvoir savoir :

- ce qui m’a déjà été présenté ;
- ce que j’ai terminé ;
- ce que je maîtrise ;
- ce que je maîtrise mal ;
- ce que j’ai oublié ;
- ce qui nécessite une révision ;
- quand une notion a été vue ;
- combien de fois elle a été révisée ;
- mes résultats aux exercices ou quiz ;
- les notions liées entre elles.

Je ne veux pas qu’il recommence constamment les mêmes leçons comme si chaque conversation était indépendante.

LifeOS doit devenir sa mémoire long terme structurée.

---

# 3. RÉPÉTITION ET RÉVISION

L’assistant doit être capable de revenir intelligemment sur des connaissances anciennes.

Exemple :

Semaine 1 :
j’apprends une notion.

Quelques jours plus tard :
petite vérification.

Quelques semaines plus tard :
la notion revient dans une autre question ou un exercice.

Quelques mois plus tard :
révision longue durée si nécessaire.

Je veux donc intégrer une logique de répétition espacée ou un mécanisme similaire.

Cependant, la fréquence ne doit pas obligatoirement être identique pour toutes les informations.

L’IA doit pouvoir tenir compte :

- de la difficulté ;
- de mon niveau de maîtrise ;
- de mes résultats ;
- du temps écoulé ;
- de l’importance de la connaissance.

---

# 4. FICHES MÉMO

À partir de mes apprentissages, l’IA doit pouvoir générer automatiquement des fiches mémo.

Exemple :

Cette semaine j’ai étudié :

- notion A ;
- notion B ;
- notion C ;
- notion D.

L’IA peut produire une fiche :

« Ce que tu dois retenir cette semaine »

avec :

- éléments essentiels ;
- définitions ;
- exemples ;
- erreurs à éviter ;
- sources lorsque nécessaires ;
- questions de contrôle.

Ces fiches doivent être enregistrées dans LifeOS.

Je dois pouvoir les retrouver plusieurs mois plus tard.

---

# 5. ANALYSE DE MON ACTIVITÉ

L’IA doit également exploiter les données générées par mon utilisation de LifeOS.

Je veux par exemple qu’à la fin d’une semaine elle puisse analyser :

- tâches prévues ;
- tâches réalisées ;
- tâches reportées ;
- routines réalisées ;
- objectifs avancés ;
- apprentissages terminés ;
- temps passé ;
- sessions de travail ;
- éventuelles périodes sans activité ;
- progression par domaine.

Elle doit pouvoir produire des retours comme :

« Cette semaine tu as terminé X tâches sur Y. »

« Tu as étudié 4 nouvelles notions. »

« Tu as fait 3 sessions d’arabe. »

« Tu as avancé sur tels objectifs. »

« Cette notion doit être révisée la semaine prochaine. »

Attention :

je ne veux pas uniquement de longs textes générés.

Une grande partie de ces informations doit pouvoir être stockée comme données structurées et affichée dans LifeOS sous forme de KPI, cartes, listes ou éléments cliquables.

L’IA pourra ensuite ajouter une courte interprétation de ces données.

---

# 6. ASSISTANT / GUIDE

L’assistant doit progressivement devenir capable de me guider à partir de mes propres données.

Exemples :

« Tu n’as pas travaillé cet objectif depuis trois semaines. »

« Tu as maintenant suffisamment avancé sur cette notion pour passer à la suivante. »

« Cette semaine tu as prévu trop de tâches par rapport à ton historique. »

« Tu maîtrises bien ces sujets mais tu as encore des difficultés sur ceux-ci. »

« Je te propose de revoir cette notion demain. »

« Ton objectif X n’a actuellement aucune mission planifiée. »

Je veux donc distinguer :

NIVEAU 1 — observation
L’IA analyse et explique les données.

NIVEAU 2 — recommandation
L’IA propose une action.

NIVEAU 3 — action
L’IA modifie LifeOS uniquement lorsque cela est explicitement autorisé.

Exemple :

IA :
« Je te propose de déplacer cette révision à jeudi. »

Moi :
« Oui. »

Alors seulement LifeOS est modifié.

---

# 7. GÉNÉRATION DU CONTENU DU JOUR

À terme, l’IA doit pouvoir préparer automatiquement certains contenus.

Par exemple :

chaque soir ou chaque semaine :

LifeOS fournit :

- mes objectifs ;
- mes apprentissages récents ;
- les notions à revoir ;
- mon historique ;
- les contenus déjà vus ;
- mes disponibilités éventuelles.

L’IA prépare ensuite :

- apprentissage du jour ;
- révision ;
- exercices ;
- contenu complémentaire.

Puis ces éléments sont enregistrés dans LifeOS.

Lorsque j’ouvre LifeOS le lendemain, ils sont déjà présents.

Je n’ai donc pas nécessairement besoin de discuter directement avec l’IA.

---

# 8. LE CHAT N’EST PAS LE CENTRE DU SYSTÈME

Je peux éventuellement avoir plus tard une interface de conversation dans LifeOS.

Mais ce n’est pas l’objectif principal.

Le véritable objectif est :

IA
→ travaille en arrière-plan ou manuellement
→ produit des informations structurées
→ alimente LifeOS
→ LifeOS organise, mémorise et restitue.

Le chat n’est qu’une interface possible parmi d’autres.

---

# 9. IMPORT MANUEL AVANT API

Je veux commencer simplement.

PHASE 1

ChatGPT fonctionne manuellement.

Il produit des objets structurés JSON compatibles avec LifeOS.

Je peux ensuite importer ces données.

Exemple :

{
"module": "religion",
"type": "dua",
"title": "...",
"content": "...",
"source": "...",
"scheduled_for": "...",
"difficulty": 2,
"estimated_minutes": 5
}

LifeOS doit pouvoir :

- vérifier le format ;
- vérifier les champs obligatoires ;
- détecter les doublons ;
- importer le contenu.

PHASE 2

Une fois les usages stabilisés, certains traitements pourront être automatisés par l’API OpenAI.

Je veux donc que le format développé aujourd’hui soit directement réutilisable demain.

---

# 10. SOURCES ET FIABILITÉ

Tous les contenus ne doivent pas être traités de la même manière.

Pour certains domaines, notamment Religion, les sources sont importantes.

Je veux donc pouvoir distinguer :

- contenu généré ;
- contenu provenant d’une source ;
- contenu vérifié ;
- contenu validé ;
- contenu personnel ;
- contenu appris.

Les informations importantes doivent pouvoir contenir :

- source ;
- URL éventuelle ;
- référence ;
- auteur ;
- niveau de confiance ou statut ;
- date de récupération ;
- date de validation.

L’IA ne doit jamais inventer une source.

---

# 11. ARCHITECTURE DES DONNÉES

Analyse la base Supabase existante avant de proposer de nouvelles tables.

Je dispose déjà d’un nombre important de tables.

Je ne veux PAS que tu recrées une seconde architecture parallèle sans vérifier ce qui existe.

Pour chaque besoin IA :

1. identifier les tables existantes utilisables ;
2. identifier les colonnes existantes ;
3. identifier les relations existantes ;
4. expliquer ce qui manque ;
5. proposer une extension uniquement lorsque nécessaire.

Distingue clairement :

EXISTANT

À RÉUTILISER

À MODIFIER

À CRÉER

Ne modifie aucune structure tant que cette analyse n’est pas terminée.

---

# 12. CONTRAT IA → LIFEOS

Je veux que tu définisses un véritable contrat d’échange entre l’IA et LifeOS.

Pour chaque objet produit par l’IA, définir :

- type ;
- module ;
- contenu ;
- métadonnées ;
- sources ;
- état ;
- date ;
- planification ;
- progression ;
- liens avec d’autres objets ;
- informations nécessaires pour les révisions.

Je veux des formats JSON standardisés.

Exemples de types possibles :

lesson
learning_item
revision
quiz
quiz_result
memo
recommendation
weekly_summary
monthly_summary
resource
dua
hadith
vocabulary
concept

Cette liste doit être analysée et améliorée.

---

# 13. CONTEXTE À FOURNIR À L’IA

Je ne veux jamais envoyer toute ma base Supabase à un modèle à chaque requête.

Conçois une stratégie permettant de sélectionner uniquement le contexte nécessaire.

Exemple :

pour créer la leçon d’arabe du jour :

envoyer uniquement :

- niveau actuel ;
- objectifs d’arabe ;
- dernières notions étudiées ;
- notions à revoir ;
- difficultés identifiées.

Pas :

- finances ;
- santé ;
- tâches professionnelles sans rapport ;
- intégralité de l’historique LifeOS.

Définis donc une logique de « Context Builder ».

---

# 14. SÉCURITÉ

L’architecture future doit respecter plusieurs principes.

La clé OpenAI ne doit jamais être exposée côté navigateur.

Architecture future probable :

Frontend LifeOS
↓
backend sécurisé / fonction serveur
↓
OpenAI API
↓
Supabase

Les opérations d’écriture doivent être contrôlées.

L’IA ne doit pas disposer arbitrairement d’un accès SQL complet.

Préférer des fonctions contrôlées telles que :

create_learning_item()
schedule_revision()
create_memo()
create_recommendation()
get_learning_history()

Analyse également :

- authentification ;
- Row Level Security Supabase ;
- journalisation ;
- validation des données ;
- prévention des doublons ;
- gestion des erreurs ;
- retour arrière.

---

# 15. COÛT

L’utilisation de l’API OpenAI devra rester raisonnable.

L’architecture doit limiter :

- le contexte inutile ;
- les appels répétitifs ;
- les très gros prompts ;
- les régénérations inutiles.

Prévoir la possibilité d’utiliser différents modèles selon la tâche :

petit modèle :
classification, extraction, structuration.

modèle intermédiaire :
résumés, quiz, fiches.

modèle plus puissant :
analyse complexe, plan pédagogique, recommandations importantes.

Ne choisis pas définitivement les modèles maintenant si les tarifs ou modèles disponibles peuvent évoluer.

L’architecture doit être model-agnostic autant que possible.

---

# 16. NE PAS DÉTRUIRE L’EXISTANT

RÈGLE ABSOLUE :

LifeOS existe déjà et fonctionne.

Les autres agents travaillent actuellement sur certains modules.

Tu ne dois donc pas :

- refaire toute l’architecture ;
- remplacer arbitrairement les tables ;
- modifier le frontend ;
- supprimer les fonctionnalités existantes ;
- recréer les modules existants ;
- interférer avec les travaux Visualisation ou Religion.

Ton rôle est de concevoir une couche complémentaire compatible avec l’existant.

---

# 17. LIVRABLE ATTENDU

Je veux d’abord une ANALYSE ET UNE SPÉCIFICATION.

Pas de développement immédiat.

Produis les livrables suivants.

## A. Vision fonctionnelle

Explique précisément quel sera le rôle de l’IA dans LifeOS.

## B. Cas d’usage

Liste les principaux cas d’usage avec des exemples concrets.

## C. Architecture

Propose l’architecture :

ChatGPT manuel actuellement ;

puis API plus tard.

## D. Analyse Supabase

Associe chaque besoin aux tables actuellement disponibles.

## E. Modèle de données IA

Indique ce qu’il faut réutiliser, modifier ou ajouter.

## F. Contrat JSON

Définis les formats standardisés permettant à ChatGPT de produire du contenu directement importable dans LifeOS.

## G. Moteur d’apprentissage

Conçois la logique :

apprentissage
→ exercice
→ maîtrise
→ révision
→ répétition espacée
→ consolidation.

## H. Fiches mémo

Définis leur génération, stockage et réutilisation.

## I. Weekly Review

Définis précisément comment LifeOS collecte les données de la semaine et comment l’IA les interprète.

## J. Recommandations

Définis comment l’IA peut proposer des actions sans les exécuter automatiquement.

## K. Context Builder

Explique comment sélectionner uniquement les informations utiles pour chaque appel IA.

## L. Sécurité

Définis les limites d’accès et les opérations autorisées.

## M. Roadmap

Découpe le projet en versions :

V0 — conception

V1 — ChatGPT manuel + JSON

V2 — import IA LifeOS

V3 — premières automatisations API

V4 — assistant adaptatif

Ne commence pas à coder tant que cette architecture n’est pas cohérente.

Lorsque plusieurs solutions sont possibles, compare-les et recommande celle qui s’intègre le mieux à l’architecture LifeOS existante.

Ne fabrique aucune information sur le projet.

En cas de contradiction entre tes hypothèses et les documents fournis, les documents constituent la source de vérité.