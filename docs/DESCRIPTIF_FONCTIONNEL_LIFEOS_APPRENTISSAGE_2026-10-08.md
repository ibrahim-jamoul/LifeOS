# Descriptif fonctionnel de LifeOS et cible Apprentissage

Date de référence : 8 octobre 2026

## 1. Objet du document

Ce document décrit d'abord ce que l'application LifeOS fait réellement dans sa version actuelle, puis définit ce que l'espace Apprentissage doit devenir au regard du référentiel personnel. Il distingue systématiquement trois niveaux :

- **Existant** : fonctionnalité déjà présente et vérifiable dans l'application actuelle.
- **À compléter** : base déjà présente, mais expérience encore incomplète par rapport au besoin réel.
- **Cible** : fonctionnalité attendue pour que l'espace Apprentissage corresponde au projet personnel global.

La conclusion principale est simple : LifeOS dispose déjà d'un socle solide de pilotage personnel et d'un premier espace Apprentissage centré sur la Religion et le Coran. En revanche, l'espace Apprentissage ne couvre pas encore l'ensemble du besoin personnel. Il doit devenir un système transversal capable d'accompagner les certifications, les langues, les apprentissages professionnels, la lecture, la culture générale, la finance, l'entrepreneuriat et les compétences pratiques, tout en conservant le parcours religieux déjà engagé.

L'objectif n'est pas de créer une plateforme de cours, une seconde liste de tâches ou une bibliothèque où l'on accumule des contenus. L'objectif est de transformer une intention d'apprendre en parcours concret : choisir ce qui compte, travailler régulièrement, mémoriser, appliquer, réviser, mesurer la progression réelle et décider de la suite.

## 2. Sources prises en compte

Le présent descriptif croise les sources suivantes :

- l'application actuelle dans `LifeOS-v2-git-sync` ;
- les routes, composants, contrats de données et migrations Supabase actuellement présents ;
- les documents fonctionnels LifeOS V2, V3 bis, V4 et V4.1 ;
- le fichier `requirements/religion/references/Referentiel_perso_complet.docx`, qui constitue la Bible personnelle ;
- le mapping structuré `initial_data/REFERENTIEL_MAPPING_2026-09-21.md` ;
- le jeu de données `initial_data/referentiel_2026-09-21.json` ;
- les tests et le build de production exécutés le 8 octobre 2026.

La chaîne de validation actuelle passe intégralement : lint, vérification TypeScript, 81 tests réussis, 5 tests volontairement ignorés et build Next.js de production réussi.

## 3. Vision globale de LifeOS

LifeOS est un système privé de pilotage personnel. Il relie la vision de vie, les objectifs, les projets, les actions, les routines, les mesures, les revues et les décisions. Son rôle n'est pas uniquement de stocker des informations. Il doit calculer ce qui mérite l'attention, faciliter l'exécution quotidienne, conserver l'historique et aider à ajuster les priorités.

La boucle générale de LifeOS est la suivante :

`Vision -> Objectif -> Projet optionnel -> Mission ou routine -> Exécution -> Mesure -> Revue -> Décision`

L'espace Apprentissage ajoute une boucle pédagogique spécialisée :

`Besoin d'apprendre -> Parcours -> Leçon ou activité -> Session réelle -> Connaissance acquise -> Révision -> Application -> Bilan`

Ces deux boucles doivent être connectées sans se confondre. Un objectif ou un projet peut expliquer pourquoi un apprentissage existe. Le module Apprentissage gère comment cet apprentissage se déroule. La vue Aujourd'hui décide quand une action concrète doit être exécutée.

## 4. Ce que LifeOS fait déjà

### 4.1 Compte personnel et sécurité

**Statut : Existant**

LifeOS permet de créer un compte, se connecter, se déconnecter, demander une réinitialisation de mot de passe et mettre à jour le mot de passe. L'authentification repose sur Supabase avec une intégration serveur compatible Next.js.

Toutes les données personnelles sont rattachées à l'utilisateur connecté. Les politiques RLS isolent les comptes et les mutations serveur recalculent l'identité du propriétaire à partir de la session, sans faire confiance à un identifiant envoyé par le navigateur.

Les documents et médias restent dans des buckets privés. Leur ouverture passe par des URL temporaires signées. Les secrets serveur ne sont pas exposés au navigateur.

### 4.2 Navigation principale

**Statut : Existant**

Le parcours principal comprend :

- Aujourd'hui ;
- Apprentissage ;
- Objectifs ;
- KPI ;
- Revue ;
- Vision.

Les fonctions plus administratives restent accessibles dans les outils avancés : Progression, Insights et Explorer les données.

Sur mobile, l'application propose une navigation adaptée et un geste de retour depuis les bords de l'écran. Un bouton de synchronisation permet de rafraîchir les données affichées depuis LifeOS. Il s'agit d'un rafraîchissement applicatif, pas d'un moteur de synchronisation hors ligne.

### 4.3 Aujourd'hui

**Statut : Existant**

La page Aujourd'hui constitue le cockpit d'exécution. Elle regroupe les éléments réellement applicables à la date courante :

- tâches planifiées aujourd'hui ;
- occurrences récurrentes prévues aujourd'hui ;
- occurrences récurrentes reportées sur aujourd'hui ;
- tâches planifiées dans le passé et encore ouvertes ;
- habitudes dues aujourd'hui ;
- routines Religion dues aujourd'hui ;
- rappels arrivés à échéance.

Les éléments sont regroupés par domaine PRO, PERSO, RELIGION et, si nécessaire, À classer. Les éléments terminés restent visibles en fin de groupe pendant la journée. Une validation peut être annulée avant le changement de jour.

Pour une tâche, l'utilisateur peut :

- la marquer comme faite ;
- annuler la validation ;
- la reporter à demain ;
- la reporter à la semaine suivante ;
- choisir une autre date.

La date de planification correspond au moment où l'utilisateur prévoit de travailler. Elle reste distincte de l'échéance réelle. Reporter une tâche ne déplace donc pas silencieusement sa date limite.

La page affiche également un calendrier À venir sur une fenêtre de 120 jours. Ce calendrier agrège les tâches, routines et rappels existants, y compris les récurrences, sans créer un second système de planification.

### 4.4 Capture rapide

**Statut : Existant**

La capture rapide permet d'enregistrer une idée ou une action en quelques secondes. L'utilisateur saisit un titre, choisit éventuellement PRO, PERSO ou RELIGION et indique si l'élément doit être planifié aujourd'hui.

La capture crée actuellement une tâche déterministe. Elle ne tente pas de deviner silencieusement s'il s'agit d'une dépense, d'une décision, d'une note, d'une ressource ou d'un apprentissage.

### 4.5 Objectifs

**Statut : Existant**

La surface Objectifs propose deux lectures : les objectifs concernés par les missions du jour et l'ensemble des objectifs. Les objectifs sont regroupés par PRO, PERSO et RELIGION.

Pour chaque objectif, LifeOS peut conserver :

- le résultat recherché ;
- la définition de terminé ;
- le statut ;
- la priorité ;
- l'horizon ;
- les dates ;
- une cible et son unité ;
- un pourcentage d'avancement ;
- la prochaine action ;
- la prochaine revue ;
- la raison, les risques et les notes.

L'utilisateur peut créer rapidement un objectif, lui ajouter directement une mission et ouvrir les options avancées. Une mission peut être liée directement à un objectif ou passer par un projet. LifeOS n'invente pas une définition de terminé lorsqu'elle n'existe pas ; l'objectif est alors marqué comme à compléter.

### 4.6 Projets et missions

**Statut : Existant**

Les projets peuvent soutenir plusieurs objectifs. Ils possèdent un type, un statut, une priorité, une fenêtre cible, un prochain jalon, une prochaine action, un avancement, des critères d'impact, d'urgence, de confiance et d'effort, ainsi que des informations budgétaires.

Les missions ou tâches disposent notamment de :

- leur objectif et leur projet parents ;
- leur domaine de vie ;
- leur priorité ;
- leur date et heure de planification ;
- leur règle de récurrence ;
- leur échéance réelle ;
- une estimation et un temps réel ;
- un statut et des notes.

Les occurrences d'une tâche récurrente peuvent être terminées, rouvertes ou reportées individuellement sans casser la série d'origine.

### 4.7 Vision

**Statut : Existant**

La Vision conserve les directions à un an, trois ans et cinq ans, ainsi que le focus du trimestre. Elle présente également, pour chaque domaine PRO, PERSO et RELIGION, l'objectif principal, le nombre d'objectifs, de projets et de KPI associés.

Cette surface donne le cap. Elle ne remplace ni les objectifs opérationnels ni les missions du jour.

### 4.8 KPI

**Statut : Existant**

LifeOS gère deux catégories de KPI :

- les KPI manuels, alimentés par des mesures saisies ;
- les KPI dérivés, calculés depuis des données que LifeOS possède déjà.

Les sources dérivées peuvent notamment être les habitudes, les routines Religion, les projets, les objectifs, les revues hebdomadaires ou les ressources. Les agrégations permettent de compter, sommer, calculer une progression ou établir un ratio.

Chaque KPI peut définir une unité, une cible minimale, maximale, exacte ou sous forme de plage, une cadence, une direction et un objectif parent. En l'absence de mesure ou de cible, LifeOS affiche un manque de données au lieu de transformer artificiellement l'absence en zéro.

### 4.9 Revue hebdomadaire

**Statut : Existant**

La revue hebdomadaire préremplit les faits observables :

- taux d'exécution ;
- actions attendues et réalisées ;
- activité par domaine ;
- routines réalisées ;
- KPI ;
- objectifs ayant progressé ;
- objectifs sans activité ;
- tâches reportées plusieurs fois ;
- projets sans activité récente.

L'utilisateur complète surtout ce que le système ne peut pas déduire : les causes, les éléments à arrêter ou mettre en pause, les trois priorités de la semaine suivante et les notes.

### 4.10 Progression globale

**Statut : Existant**

La page Progression compare l'activité réelle sur 7, 30 ou 90 jours. Elle présente l'évolution récente, les routines les plus solides, les activités rarement réalisées et le détail des occurrences mesurables.

Les routines flexibles ou contextuelles sans calendrier explicite ne sont pas comptées comme des échecs. Une absence de données historiques n'est pas reconstruite artificiellement.

### 4.11 Insights

**Statut : Existant**

La page Insights transforme les données en signaux explicables. Elle peut faire ressortir :

- les routines qui tiennent bien ;
- les routines sous 50 % lorsque suffisamment d'occurrences existent ;
- les tâches reportées à répétition ;
- les projets actifs qui stagnent ;
- l'évolution du taux d'exécution ;
- la dispersion entre projets ;
- l'écart entre les priorités déclarées et l'activité réelle.

Ces constats ne prétendent pas établir une vérité psychologique. Ils servent de matière à décision.

### 4.12 Alertes et rappels

**Statut : Existant**

LifeOS génère des alertes liées aux tâches, objectifs, projets, KPI, décisions, documents, révisions Coran et revues hebdomadaires. Une alerte peut être lue, ignorée ou reportée. Les générations persistées utilisent des clés de déduplication.

Les notifications web peuvent être activées sur un appareil compatible et une notification de test peut être envoyée. La règle d'envoi automatique des rappels vers les notifications natives n'est toutefois pas encore configurée. L'infrastructure existe, mais l'automatisation métier reste à définir.

### 4.13 Explorer et administration détaillée

**Statut : Existant**

Explorer donne accès aux écrans complets de gestion :

- objectifs, projets, tâches, décisions et rappels ;
- Religion, Arabe et Coran ;
- finances ;
- santé, sport et habitudes ;
- documents ;
- souvenirs ;
- réglages.

Ces écrans permettent la création, la modification, la recherche, les filtres, l'archivage et, selon l'objet, la suppression. Ils constituent une voie d'administration, tandis que le parcours quotidien doit rester plus léger.

### 4.14 Finances

**Statut : Existant**

LifeOS suit :

- les comptes d'actif et de passif ;
- les revenus, dépenses et transferts ;
- les budgets mensuels par catégorie ;
- les objectifs financiers ;
- les photographies de patrimoine.

Les transferts internes ne sont pas comptés comme revenus ou dépenses. Les devises sont conservées explicitement et aucune conversion automatique n'est inventée.

### 4.15 Santé, sport et habitudes

**Statut : Existant**

L'application permet de définir des habitudes, journaliser leur réalisation, définir des métriques de santé, saisir des mesures et enregistrer des entraînements. Les tendances reposent uniquement sur les points enregistrés et ne produisent aucun diagnostic médical.

### 4.16 Documents

**Statut : Existant**

Le coffre Documents permet l'envoi privé de fichiers, la conservation de métadonnées, la recherche, le filtrage, l'ouverture via une URL signée temporaire et la suppression cohérente du fichier et de sa métadonnée. Les échéances documentaires peuvent produire des alertes.

### 4.17 Souvenirs

**Statut : Existant**

LifeOS peut créer des souvenirs avec date ou période, lieu, description, tags et plusieurs médias. Les souvenirs sont présentés dans une chronologie privée et peuvent être consultés ou supprimés.

### 4.18 Assistant IA

**Statut : Existant mais limité**

L'assistant IA est optionnel, accessible par une route dédiée et non exposé dans la navigation principale. Il fonctionne uniquement si la configuration serveur du fournisseur est présente.

L'assistant lit un périmètre choisi parmi les données structurées. Il ne reçoit ni les fichiers binaires ni les chemins privés de stockage. Il ne dispose d'aucun outil de mutation et ne peut donc pas modifier LifeOS.

Il s'agit aujourd'hui d'un assistant de lecture et d'analyse, pas encore d'un coach d'apprentissage capable de préparer des leçons, des quiz ou des révisions persistantes.

### 4.19 Import, export et portabilité

**Statut : Existant**

Le référentiel personnel peut être importé de manière reproductible. L'import utilise des identifiants déterministes, rapproche les titres, complète les champs vides et signale les conflits sans écraser les valeurs déjà présentes.

L'utilisateur peut exporter les données structurées LifeOS au format JSON. Les métadonnées des fichiers sont incluses, mais pas les fichiers binaires eux-mêmes.

### 4.20 Installation mobile

**Statut : Partiel**

LifeOS possède un manifeste d'application web et peut fonctionner en mode autonome après ajout à l'écran d'accueil. Un service worker gère les notifications push et leur ouverture.

L'application ne propose pas encore un véritable fonctionnement hors ligne avec cache des écrans, file locale de mutations et résolution de conflits.

## 5. Ce que l'espace Apprentissage fait déjà

### 5.1 Univers visuel séparé

**Statut : Existant**

L'entrée Apprentissage ouvre un univers distinct avec sa propre barre latérale, sa propre navigation mobile et un bouton permanent de retour à LifeOS.

Les rubriques disponibles sont :

- Accueil ;
- Leçons ;
- Révisions ;
- Coran ;
- Routines ;
- Ressources ;
- Progression.

La Religion est le seul domaine activé dans ce shell. L'interface annonce que l'Arabe, les certifications et d'autres apprentissages pourront être intégrés ultérieurement.

### 5.2 Accueil Apprentissage

**Statut : Existant**

L'accueil calcule un programme du jour à partir de :

- routines Religion réellement dues ;
- sujets d'étude dont la date cible est aujourd'hui ;
- éléments Coran dont la prochaine révision est arrivée ;
- points d'attention Coran dont la révision est due.

Il affiche également :

- le nombre d'éléments du programme du jour ;
- le temps des sessions d'étude Religion sur les sept derniers jours ;
- le nombre de points d'attention actifs ;
- le nombre de sujets d'étude actifs ;
- jusqu'à quatre sujets actuellement en cours.

Limite importante : le temps affiché sur l'accueil compte les sessions d'étude Religion, mais pas les sessions Coran ni les sessions d'arabe.

### 5.3 Leçons et sujets d'étude

**Statut : Existant mais limité**

La rubrique Leçons gère actuellement deux objets :

- les sujets d'étude ;
- les sessions d'étude.

Un sujet peut contenir un titre, une catégorie religieuse, une ressource libre, un statut, une date cible, un pourcentage d'avancement et des notes.

Une session conserve le sujet, la date et l'heure, la durée, le type d'activité, la ressource, le contenu couvert et le principal enseignement retenu.

Cette base permet de journaliser l'apprentissage réel. En revanche, le terme « Leçons » est plus ambitieux que la fonctionnalité actuelle : il n'existe pas encore de contenu de leçon structuré, de plan en étapes, de prérequis, d'exercices, de quiz, de résultat ou de prochaine révision générique.

### 5.4 Parcours Coran

**Statut : Existant**

Le parcours Coran sépare la lecture, la mémorisation et la révision. Un élément peut définir la sourate, la plage de versets, l'activité, le statut, la confiance, la prochaine révision et des notes.

Les sessions Coran enregistrent ce qui a été réellement travaillé. Le système permet donc de distinguer le programme prévu de l'activité réalisée.

### 5.5 Points d'attention Coran

**Statut : Existant**

L'utilisateur peut signaler une difficulté persistante en indiquant :

- la sourate et le verset ;
- un élément Coran lié ;
- le type de difficulté : mémorisation, hésitation, confusion, prononciation, tajwid ou autre ;
- une note ;
- une priorité ;
- une prochaine date de révision.

Un point peut être marqué Toujours fragile, Maîtrisé ou Réouvrir. Le nombre d'occurrences et la dernière apparition sont conservés. Les difficultés restent visibles jusqu'à leur résolution.

### 5.6 File de révisions

**Statut : Existant pour le Coran uniquement**

La page Révisions donne d'abord la priorité aux points d'attention, puis affiche les passages Coran dont la prochaine révision est arrivée.

Il n'existe pas encore de file de révision générique pour les connaissances, le vocabulaire, les livres, les certifications, l'anglais, l'arabe ou les notions professionnelles.

### 5.7 Routines d'apprentissage

**Statut : Existant pour la Religion**

Une routine peut définir sa fréquence, son nombre cible, son unité, sa durée, son jour, sa fenêtre de jours, ses semaines du mois, son contexte temporel, ses dates d'activité, son rappel, son statut et ses liens vers un objectif, un projet ou un KPI.

Les réalisations sont journalisées. Les fenêtres de week-end permettent notamment de représenter une seule occurrence logique réalisable le samedi ou le dimanche.

### 5.8 Bibliothèque de ressources

**Statut : Existant mais limité**

La bibliothèque Religion gère des livres, cours, articles, sites, documents, outils et autres ressources. Chaque ressource peut conserver son titre, son type, son statut, son auteur ou intervenant, son lien, le sujet d'étude associé et des notes.

La Bible personnelle demandait également de préciser pourquoi une ressource est utilisée et quels points restent à vérifier. Ces informations peuvent être placées dans les notes, mais ne possèdent pas encore de champs séparés ni de workflow spécifique.

### 5.9 Progression Apprentissage

**Statut : Existant pour Religion et Coran**

La page Progression affiche :

- le temps d'étude des sept derniers jours et du mois ;
- le nombre de sessions d'étude ;
- le nombre de sessions Coran ;
- la confiance moyenne Coran ;
- les routines cochées ;
- les sujets actifs et terminés ;
- la progression moyenne déclarée des sujets ;
- les points Coran actifs et maîtrisés.

La progression moyenne des sujets dépend d'un pourcentage saisi. Elle n'est pas encore reconstruite automatiquement depuis les unités terminées, les révisions ou les résultats.

### 5.10 Arabe déjà présent ailleurs dans LifeOS

**Statut : Existant hors du shell Apprentissage**

LifeOS possède déjà un profil d'arabe et un journal de sessions. Le profil conserve le niveau auto-évalué, la cible hebdomadaire en minutes, le focus actuel et une estimation facultative du vocabulaire.

Une session d'arabe conserve la durée, la compétence travaillée, la ressource, les mots nouveaux, les mots révisés et les notes.

Ce module n'est toutefois pas intégré à l'univers Apprentissage. Il reste accessible dans Explorer, et ses données ne participent pas aux indicateurs de l'accueil ou de la progression Apprentissage.

### 5.11 Certifications déjà modélisées ailleurs

**Statut : Partiel**

Les certifications sont déjà représentables comme projets. Les ressources de préparation peuvent être reliées aux objectifs, projets et sujets d'étude. Les tâches peuvent porter les actions de préparation et les KPI peuvent mesurer l'avancement.

Il manque néanmoins un parcours pédagogique dédié : programme de certification, domaines de l'examen, modules, labs, examens blancs, niveau de préparation, erreurs récurrentes et révisions.

### 5.12 Incohérence actuelle entre documentation et code

**Statut : À corriger**

La documentation V4.1 indique que les routines Religion ne doivent plus apparaître dans l'interface Aujourd'hui du LifeOS principal. Le code actuel les agrège pourtant encore avec les habitudes dans Aujourd'hui, tandis que l'accueil Apprentissage les affiche également.

Une même routine Religion due peut donc être visible dans les deux univers. Il faut décider explicitement si :

- les routines d'apprentissage restent uniquement dans Apprentissage ; ou
- elles apparaissent dans les deux espaces avec une présentation partagée et assumée.

La cible recommandée est la suivante : l'activité pédagogique détaillée reste dans Apprentissage, tandis que LifeOS principal n'affiche que les engagements que l'utilisateur a explicitement décidé d'intégrer à son agenda général.

## 6. Ce que la Bible personnelle attend réellement de l'Apprentissage

### 6.1 Principe directeur

L'apprentissage doit servir un objectif actuel ou améliorer réellement la vie. Il ne doit pas devenir une accumulation de livres, de vidéos, de cours, de technologies ou de langues commencées sans suite.

Le système doit donc aider à :

- choisir peu d'apprentissages actifs ;
- expliquer pourquoi chacun est utile maintenant ;
- privilégier l'usage réel et les projets concrets ;
- terminer, synthétiser et réviser ;
- éviter de suivre plusieurs formations longues simultanément ;
- éviter les compétences apprises sans application ;
- reporter ou abandonner explicitement ce qui n'est plus prioritaire.

### 6.2 Apprentissage professionnel

Les compétences prioritaires sont :

- gestion de projet IT et posture de consultant ;
- cloud ;
- réseaux ;
- sécurité et cloud security ;
- automatisation avec Python et Terraform.

La roadmap de certifications retenue est :

1. PSM I, rapide et directement alignée avec la trajectoire consultant ou chef de projet IT ;
2. CCNA, pour consolider le socle réseau et sécurité ;
3. AWS Solutions Architect Associate, pour construire une vraie compétence cloud ;
4. Terraform Associate, après une pratique réelle de l'Infrastructure as Code ;
5. Azure AZ-104, pour élargir progressivement vers le multi-cloud ;
6. CEH, uniquement si l'évolution professionnelle rend cet investissement pertinent.

Le besoin n'est pas seulement de cocher une certification. Chaque préparation doit relier théorie, pratique, labs, projet démontrable, ressources officielles, examens blancs et capacité à expliquer ce qui a été appris.

### 6.3 Anglais

L'anglais doit être entretenu et amélioré pour :

- travailler dans un environnement international ;
- être à l'aise en entretien ;
- participer à des réunions ;
- présenter un projet ;
- travailler éventuellement en Australie ;
- accéder directement au contenu professionnel anglophone.

Le suivi ne doit donc pas se limiter à du vocabulaire. Il doit couvrir la compréhension, l'expression orale, l'écriture professionnelle, les entretiens, les présentations et l'usage de ressources réelles.

### 6.4 Arabe

L'objectif est de mieux lire, écrire, comprendre et développer le vocabulaire. La préférence personnelle est d'apprendre depuis des textes réels, idéalement liés à la Religion, plutôt que par des cours de grammaire principalement théoriques.

Le programme cible est d'environ trente minutes par jour :

1. lire un texte avec voyelles ;
2. identifier et comprendre les mots ou passages inconnus ;
3. relire le texte sans voyelles ;
4. retenir le vocabulaire réellement rencontré ;
5. recopier ou écrire quelques phrases.

Cette progression doit permettre de travailler simultanément la langue et le contenu religieux lorsque le texte s'y prête.

### 6.5 Lecture et culture générale

Les thèmes prioritaires sont :

- finances personnelles ;
- entrepreneuriat ;
- gestion et stratégie ;
- psychologie et comportement ;
- histoire et biographies ;
- culture générale ;
- sciences et technologie ;
- monde arabe et Islam ;
- économie, géopolitique et institutions ;
- fonctionnement des entreprises ;
- sujets de société.

La lecture doit produire une utilité réelle : une connaissance utile, une meilleure compréhension du monde ou un changement concret dans la manière de réfléchir et d'agir. Le nombre de livres lus ne constitue pas, à lui seul, une réussite.

### 6.6 Finance, investissement et patrimoine

L'espace Apprentissage doit accompagner la construction d'une vraie culture financière : budget, épargne, fonds de sécurité, investissement, immobilier, patrimoine, risque et analyse des décisions.

Ces apprentissages doivent pouvoir se relier aux données Finances de LifeOS sans transformer le module Apprentissage en conseiller financier automatique.

### 6.7 Entrepreneuriat et décision

Le besoin porte sur la gestion de projet, l'entrepreneuriat, le développement de produits, le fonctionnement des entreprises et la capacité à analyser correctement une opportunité business.

Un apprentissage peut donc être lié à LifeQuest, au projet LSS, au conseil, au NaaS, à l'e-commerce ou à un autre projet réel. Le meilleur indicateur n'est pas seulement le temps étudié, mais la capacité à appliquer une notion dans une décision, une expérience ou un livrable.

### 6.8 Compétences pratiques et curiosité technologique

Le système doit permettre d'apprendre sur la technologie, le cloud, le réseau, la cybersécurité, l'intelligence artificielle, l'automobile, la moto, les voyages, l'Australie, la productivité et d'autres sujets pratiques, sans obliger à transformer chaque intérêt en objectif de carrière.

La distinction essentielle est :

- apprentissage stratégique, lié à un objectif ou projet ;
- apprentissage d'entretien, utile régulièrement ;
- apprentissage d'exploration, volontairement limité dans le temps ;
- simple intérêt placé dans une liste À explorer plus tard.

### 6.9 Coran

Le programme personnel prévoit trois nouvelles pages par mois : une page pendant chacune des trois premières semaines, puis une quatrième ou cinquième semaine consacrée à la consolidation.

Chaque nouvelle page doit associer :

- lecture correcte ;
- mémorisation ;
- répétition pendant la semaine ;
- réutilisation dans les prières lorsque possible ;
- identification immédiate des hésitations ;
- sens général ;
- vocabulaire incompris ;
- Tafsir.

L'ordre prévu est Juz Tabarak, puis Juz Amma, puis Juz 28.

### 6.10 Seerah et sciences islamiques

La Seerah doit progresser chronologiquement à raison d'une séance principale par semaine. Chaque séance doit conserver :

- la période ou l'événement ;
- les personnes importantes ;
- la place dans la chronologie ;
- les enseignements ;
- une courte synthèse ;
- les questions restantes.

Les apprentissages complémentaires couvrent l'Aqida, le Fiqh, le Hadith, le Tafsir, l'histoire et les biographies. Ils suivent une progression régulière, peuvent partager des textes avec le programme d'arabe et doivent produire compréhension, notes, questions et synthèse.

### 6.11 Duas, adhkar et apprentissage quotidien

Le système personnel vise au minimum une chose nouvelle liée à la Religion chaque jour. Il doit aussi suivre les duas apprises ou révisées, leur sens, leur contexte d'usage et leur réutilisation. Les adhkar doivent être appris dans leur contexte quotidien plutôt que comme une liste abstraite.

### 6.12 Régularité plutôt que perfection

La Bible personnelle insiste sur la discipline, la constance et la réduction de la procrastination. Le système doit privilégier une progression régulière plutôt qu'une phase très intense suivie d'un abandon.

Une routine ratée ne doit pas déclencher un jugement ou casser tout le programme. LifeOS doit aider à reprendre, alléger, replanifier ou suspendre consciemment.

## 7. Fonctionnalités cibles de l'espace Apprentissage

### 7.1 Tableau de bord transversal

**Priorité : indispensable**

L'accueil Apprentissage doit permettre de choisir ou filtrer un domaine :

- Religion ;
- Arabe ;
- Anglais ;
- Certifications ;
- Compétences professionnelles ;
- Finance et patrimoine ;
- Entrepreneuriat et business ;
- Lecture et culture générale ;
- Compétences pratiques ;
- Explorations personnelles.

Il doit afficher :

- le programme du jour ;
- les révisions dues ;
- la prochaine activité utile ;
- les parcours actifs ;
- le temps étudié par domaine ;
- les éléments fragiles ;
- les apprentissages récemment appliqués ;
- une alerte de dispersion si trop de parcours lourds sont actifs.

### 7.2 Domaines et parcours d'apprentissage

**Priorité : indispensable**

Un domaine regroupe une famille d'apprentissages. Un parcours correspond à une progression concrète, par exemple PSM I, CCNA, anglais professionnel, arabe par les textes, culture financière ou Seerah.

Chaque parcours doit pouvoir définir :

- le résultat recherché ;
- la raison de l'apprendre maintenant ;
- le type stratégique, entretien, exploration ou loisir ;
- le niveau actuel ;
- le niveau ou résultat cible ;
- la priorité ;
- le statut : idée, prévu, actif, en pause, terminé ou abandonné ;
- une date ou une fenêtre cible ;
- un budget de temps hebdomadaire ;
- les prérequis ;
- un objectif ou projet LifeOS lié ;
- un indicateur de réussite ;
- la prochaine action pédagogique ;
- la date de prochaine revue.

Un parcours de certification doit réutiliser le projet de certification existant au lieu de créer un doublon.

### 7.3 Programme et modules

**Priorité : indispensable**

Chaque parcours doit pouvoir être décomposé en modules ou étapes ordonnées. Un module peut contenir des leçons, labs, lectures, exercices, examens blancs ou livrables.

Exemples :

- PSM I : Scrum Guide, rôles, événements, artefacts, principes, cas pratiques, Open Assessments ;
- CCNA : fundamentals, switching, routing, IP services, sécurité, automatisation, labs ;
- Arabe : lecture avec voyelles, compréhension, lecture sans voyelles, vocabulaire, écriture ;
- Seerah : périodes chronologiques, événements, personnages, enseignements, synthèses.

Le système doit afficher clairement ce qui est terminé, en cours, bloqué et ensuite.

### 7.4 Leçons et activités

**Priorité : indispensable**

Une leçon ou activité doit préciser :

- son objectif pédagogique ;
- le contenu à travailler ;
- la ressource ;
- le type : lecture, vidéo, cours, lab, exercice, discussion, écriture, mémorisation, révision ou examen ;
- la durée estimée ;
- la difficulté ;
- les prérequis ;
- le résultat attendu ;
- les points à retenir ;
- les questions de contrôle ;
- la prochaine révision éventuelle.

Une leçon peut être planifiée, mais elle ne doit pas devenir automatiquement une tâche LifeOS. L'utilisateur choisit s'il veut seulement la voir dans Apprentissage ou créer une mission datée dans Aujourd'hui.

### 7.5 Sessions réelles

**Priorité : indispensable**

Après une séance, l'utilisateur doit pouvoir enregistrer rapidement :

- la durée ;
- ce qui a été réellement couvert ;
- le résultat obtenu ;
- ce qui a été compris ;
- ce qui reste flou ;
- le niveau de confiance ;
- les erreurs ;
- les connaissances créées ou révisées ;
- la prochaine action ;
- l'application éventuelle dans un projet réel.

Les formulaires doivent être adaptés au domaine. Une session de lab CCNA n'a pas les mêmes champs qu'une lecture de livre, une session d'anglais oral ou une mémorisation du Coran.

### 7.6 Mémoire pédagogique et connaissances

**Priorité : indispensable**

LifeOS doit pouvoir conserver des unités de connaissance durables : notion, définition, formule, procédure, vocabulaire, dua, hadith, personnage, événement, erreur fréquente ou décision tirée d'un apprentissage.

Chaque connaissance doit pouvoir conserver :

- son origine ;
- sa source ;
- sa synthèse ;
- ses exemples ;
- ses relations avec d'autres notions ;
- son niveau de maîtrise ;
- la première présentation ;
- les dernières révisions ;
- les erreurs rencontrées ;
- la prochaine révision.

Cette mémoire évite que chaque nouvelle séance reparte de zéro.

### 7.7 Révisions génériques

**Priorité : indispensable**

Le moteur actuel de révision Coran doit être étendu aux autres apprentissages sans perdre sa spécialisation.

La file générique doit pouvoir proposer :

- les connaissances arrivées à échéance ;
- les erreurs persistantes ;
- le vocabulaire à revoir ;
- les notions jugées importantes mais fragiles ;
- les examens blancs ou exercices à refaire ;
- les ressources terminées dont la synthèse n'a pas été révisée.

Après une révision, l'utilisateur indique par exemple oublié, fragile, correct ou maîtrisé. La prochaine date doit être calculée par une règle explicable et configurable. Une règle recommandée peut être proposée, mais ne doit pas être imposée silencieusement.

### 7.8 Ressources enrichies

**Priorité : indispensable**

La bibliothèque doit devenir transversale. Pour chaque ressource, elle doit permettre de conserver :

- le titre ;
- l'auteur, intervenant ou fournisseur ;
- le type ;
- le domaine et le parcours ;
- le lien ou document ;
- la raison précise de l'utiliser ;
- le statut ;
- la progression ;
- les parties utiles ;
- les notes ;
- les points à vérifier ;
- la synthèse finale ;
- les connaissances extraites ;
- la qualité ou fiabilité perçue ;
- les informations de provenance.

Le système doit éviter la collection infinie. Une liste À consulter doit pouvoir être limitée ou priorisée, et une ressource abandonnée doit conserver la raison de l'abandon.

### 7.9 Certifications

**Priorité : indispensable**

La vue Certifications doit réunir les projets de certification existants et leur parcours pédagogique. Elle doit afficher :

- l'ordre de priorité ;
- la fenêtre cible ;
- le coût ;
- le temps estimé ;
- les domaines de l'examen ;
- les ressources officielles ;
- les labs réalisés ;
- les scores d'examens blancs ;
- les points faibles ;
- le niveau de préparation ;
- la prochaine étape ;
- la décision passer, reporter ou abandonner.

Pour Terraform, AWS, Azure, CCNA ou CEH, un niveau de préparation ne doit pas dépendre uniquement de vidéos terminées. Les labs et projets réels doivent compter explicitement.

### 7.10 Langues

**Priorité : indispensable**

Le module Langues doit intégrer l'Arabe existant et accueillir l'Anglais. Il doit suivre :

- lecture ;
- écoute ;
- expression orale ;
- écriture ;
- vocabulaire ;
- grammaire lorsqu'elle est utile ;
- situations réelles ;
- textes ou ressources utilisés ;
- mots nouveaux et revus ;
- erreurs récurrentes ;
- temps d'exposition ;
- niveau auto-évalué et objectifs concrets.

Pour l'Arabe, un modèle de séance doit reprendre les cinq étapes définies dans la Bible. Pour l'Anglais, des scénarios dédiés doivent couvrir les entretiens, réunions, présentations et contenus professionnels.

### 7.11 Lecture et livres

**Priorité : importante**

Le suivi de lecture doit privilégier la valeur obtenue plutôt que le nombre de livres. Il doit permettre de conserver :

- la raison de lire le livre ;
- les questions auxquelles il doit répondre ;
- l'avancement ;
- les idées clés ;
- les citations courtes utiles ;
- les points discutables ou à vérifier ;
- la synthèse ;
- les décisions ou actions qui en résultent ;
- une date de révision de la synthèse.

### 7.12 Apprentissage par projet

**Priorité : indispensable**

Un parcours doit pouvoir exiger une application concrète : lab réseau, infrastructure cloud, projet Terraform, présentation en anglais, analyse d'opportunité business, budget, étude de cas ou synthèse de Seerah.

LifeOS doit relier l'apprentissage au projet concerné et permettre de marquer une connaissance comme appliquée. Cette relation donne plus de valeur qu'un simple pourcentage déclaré.

### 7.13 Planification et relation avec Aujourd'hui

**Priorité : indispensable**

L'espace Apprentissage doit distinguer :

- le programme pédagogique, qui indique la progression logique ;
- la routine, qui indique une cadence ;
- la session planifiée, qui indique un créneau d'étude ;
- la mission LifeOS, qui représente un engagement d'exécution général.

Une activité n'entre dans Aujourd'hui que si elle est explicitement planifiée ou si une routine déterministe la rend due. Le module ne doit pas remplir automatiquement le calendrier à partir d'un objectif vague.

### 7.14 Revue hebdomadaire et mensuelle Apprentissage

**Priorité : indispensable**

La revue Apprentissage doit calculer les faits :

- temps réellement étudié ;
- sessions réalisées ;
- parcours ayant avancé ;
- leçons terminées ;
- révisions dues et réalisées ;
- connaissances fragiles ;
- routines tenues ;
- apprentissages appliqués ;
- ressources commencées, terminées ou abandonnées ;
- dispersion entre parcours.

L'utilisateur doit ensuite décider : continuer, simplifier, mettre en pause, changer de ressource, augmenter ou réduire la charge, planifier une application ou abandonner.

### 7.15 Progression et indicateurs

**Priorité : indispensable**

La progression doit combiner plusieurs preuves au lieu de reposer sur un score opaque :

- temps investi ;
- régularité ;
- modules terminés ;
- exercices ou labs réussis ;
- résultats de quiz ou examens blancs ;
- niveau de confiance ;
- rétention après révision ;
- application dans un projet ;
- production d'une synthèse ;
- certification obtenue lorsque cela s'applique.

Les données absentes doivent rester absentes. Le système ne doit pas conclure qu'une connaissance est maîtrisée uniquement parce qu'une ressource est terminée.

### 7.16 Recherche et historique

**Priorité : importante**

Une recherche transversale doit retrouver un sujet, une ressource, une session, une note, une connaissance, une erreur, une synthèse ou une question. L'historique doit permettre de comprendre comment un apprentissage a évolué dans le temps.

### 7.17 Assistant pédagogique IA

**Priorité : évolution possible après stabilisation du socle**

L'IA pourra :

- préparer une leçon à partir d'un objectif et de sources validées ;
- proposer un exercice ;
- générer un quiz à partir des notes ;
- transformer une session en fiche mémo ;
- résumer les points retenus ;
- proposer une révision ;
- adapter la difficulté ;
- détecter les connaissances fragiles ;
- préparer une revue hebdomadaire ;
- suggérer la prochaine activité utile.

L'IA ne devra jamais :

- inventer une source ;
- déclarer une connaissance maîtrisée sans preuve ;
- exécuter une modification importante sans validation ;
- créer une référence religieuse fictive ;
- remplacer l'utilisateur dans une décision de priorité ;
- envoyer les fichiers privés ou des données hors périmètre sans choix explicite.

### 7.18 Import de contenu et capture d'apprentissage

**Priorité : importante**

L'utilisateur doit pouvoir capturer rapidement :

- une ressource à consulter ;
- une idée apprise ;
- une question ;
- un mot de vocabulaire ;
- une difficulté ;
- une citation utile ;
- un sujet à explorer.

La capture doit proposer une destination avant l'enregistrement. Une classification IA éventuelle doit rester une proposition visible et modifiable.

### 7.19 Limites et anti-dispersion

**Priorité : indispensable**

Le système doit intégrer les décisions personnelles de non-dispersion :

- limiter le nombre de parcours lourds simultanés ;
- distinguer actif, entretien et exploration ;
- avertir lorsqu'une nouvelle formation longue est ajoutée alors que plusieurs sont déjà actives ;
- demander ce qui sera mis en pause lorsqu'une nouvelle priorité importante démarre ;
- signaler les ressources accumulées sans progression ;
- faire ressortir les parcours sans usage réel ;
- proposer un abandon propre plutôt qu'une culpabilité permanente.

### 7.20 Confidentialité et qualité des sources

**Priorité : indispensable**

Toutes les données d'apprentissage restent privées et isolées par utilisateur. Les documents et médias restent dans le stockage privé.

Pour les contenus sensibles ou religieux, le système doit conserver la provenance, le statut de vérification et les éventuels points à confirmer. Une source absente doit rester absente.

## 8. Matrice des écarts

| Besoin | État actuel | Cible |
| --- | --- | --- |
| Accueil Apprentissage | Religion uniquement | Tous les domaines avec filtre et synthèse transversale |
| Sujets et sessions | Disponibles pour Religion | Modèle générique avec parcours, modules, leçons et applications |
| Coran | Parcours, sessions, confiance, échéances | Conserver et enrichir avec programme mensuel, Tafsir et bilan |
| Révisions | Coran uniquement | Moteur générique plus spécialisation Coran |
| Arabe | Module séparé dans Explorer | Intégration complète au shell Apprentissage et modèle de séance personnel |
| Anglais | Pas de module dédié | Parcours professionnel et situations réelles |
| Certifications | Projets, tâches et ressources | Parcours d'examen, domaines, labs, examens blancs, préparation |
| Livres | Ressource générique | Suivi par intention, synthèse, application et révision |
| Culture générale | Non structurée | Parcours ou explorations limitées avec connaissances durables |
| Finance et business | Données métier présentes, apprentissage absent | Parcours reliés aux projets et décisions réelles |
| Mémoire pédagogique | Takeaway simple par session | Connaissances persistantes, relations, maîtrise et historique |
| Quiz et exercices | Absents | Création, résultats, erreurs et révisions |
| Progression | Temps, sessions, routines, pourcentage manuel | Preuves multiples, rétention et application réelle |
| Ressources | Bibliothèque Religion et ressource générique | Bibliothèque transversale anti-accumulation |
| IA pédagogique | Contrats documentés, non intégrés | Leçons, quiz, mémos et recommandations sous contrôle |
| Liaison avec objectifs | Indirecte ou via ressources | Liaison explicite sans dupliquer objectifs et tâches |
| Anti-dispersion | Non automatisée | Limites de charge, arbitrage et mise en pause explicite |
| Aujourd'hui | Routines Religion visibles dans deux univers | Règle claire d'exposition choisie par l'utilisateur |

## 9. Périmètre recommandé par étapes

### Étape 1 : unifier le socle Apprentissage

- rendre les domaines d'apprentissage génériques ;
- intégrer l'Arabe existant ;
- ajouter Anglais et Certifications ;
- créer les parcours, modules, leçons et sessions ;
- relier un parcours aux objectifs et projets existants ;
- unifier la bibliothèque ;
- corriger la double exposition des routines Religion.

### Étape 2 : construire la mémoire et la révision

- ajouter les connaissances ;
- créer la file de révision générique ;
- suivre les erreurs, la confiance et la maîtrise ;
- ajouter les synthèses de livres et sessions ;
- conserver le moteur Coran spécialisé.

### Étape 3 : spécialiser les expériences

- parcours Certifications avec labs et examens blancs ;
- parcours Langues avec vocabulaire contextualisé ;
- programme Arabe en cinq étapes ;
- lecture et culture générale ;
- apprentissage par projet ;
- revue Apprentissage dédiée.

### Étape 4 : ajouter l'assistance IA contrôlée

- génération de propositions de leçons ;
- quiz et fiches mémo ;
- recommandations de révision ;
- synthèses hebdomadaires ;
- validation humaine avant toute mutation.

## 10. Définition de réussite de la partie Apprentissage

La partie Apprentissage sera réellement réussie lorsque l'utilisateur pourra :

1. voir immédiatement ce qu'il apprend actuellement et pourquoi ;
2. savoir quelle est la prochaine activité utile ;
3. effectuer une séance sans ressaisie excessive ;
4. conserver ce qu'il a compris, pas seulement le temps passé ;
5. retrouver les erreurs et connaissances fragiles ;
6. réviser au bon moment ;
7. relier l'apprentissage à un objectif, un projet ou une situation réelle ;
8. mesurer une progression avec des preuves explicables ;
9. mettre en pause ou abandonner proprement ce qui n'est plus prioritaire ;
10. couvrir Religion, Arabe, Anglais, certifications, carrière, finance, business, lecture, culture générale et compétences pratiques dans un seul univers cohérent ;
11. conserver la séparation entre apprentissage, planification quotidienne et pilotage stratégique ;
12. utiliser l'IA comme assistant contrôlé, jamais comme source automatique de vérité.

En résumé, la cible n'est pas « stocker tout ce que j'aimerais apprendre ». La cible est « choisir ce qui compte maintenant, apprendre de façon régulière, retenir, appliquer et ajuster sans se disperser ».
