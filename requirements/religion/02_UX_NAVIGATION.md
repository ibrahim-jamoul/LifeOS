# 02 — UX / Navigation

## Navigation principale

```text
RELIGION
├── Aujourd'hui
├── Coran
│   ├── En cours
│   ├── Révisions
│   └── Progression
├── Arabe
│   ├── Session du jour
│   ├── Textes
│   └── Vocabulaire
├── Étudier
│   ├── Vue d'ensemble
│   ├── Seerah
│   ├── Aqida
│   ├── Fiqh
│   ├── Hadith
│   ├── Tafsir
│   ├── Histoire
│   └── Biographies
├── Duʿāʾ & Adhkār
├── Bibliothèque
└── Progression
```

## 1. Aujourd'hui

Page d'entrée opérationnelle.

Afficher seulement :
- routines dues aujourd'hui ;
- reprise de l'activité en cours ;
- éventuelles révisions urgentes ;
- points d'attention Coran dus aujourd'hui.

Chaque carte doit permettre une action immédiate :
- Démarrer ;
- Réaliser ;
- Ajouter ;
- Reporter uniquement si la logique métier l'autorise ;
- Voir le détail.

## 2. Coran

### En cours
Afficher :
- Juz / Sourate / page ou plage de versets ;
- semaine du cycle ;
- progression mensuelle 0/3, 1/3, 2/3, 3/3 ;
- statut de mémorisation ;
- confiance ;
- Tafsir étudié / non étudié ;
- dernières sessions ;
- bouton "Enregistrer une session" ;
- bouton **"Signaler une difficulté"**.

### Révisions
Prioriser :
1. points d'attention actifs ;
2. éléments dont `next_revision_at` est arrivé ;
3. passages avec faible confiance ;
4. révision générale de la semaine 4/5.

### Progression
Afficher :
- Juz Tabarak ;
- Juz Amma ;
- Juz 28 ;
- pages/éléments par statut ;
- progression mensuelle.

## 3. Arabe

### Session du jour
Étapes :
1. lecture avec voyelles ;
2. compréhension ;
3. lecture sans voyelles ;
4. vocabulaire ;
5. écriture.

En fin de session :
- durée ;
- ressource/texte ;
- nouveaux mots ;
- mots revus ;
- note libre.

### Textes
Bibliothèque de textes travaillés.

### Vocabulaire
Mots réellement rencontrés, contextualisés par texte/sujet.

## 4. Étudier

Une seule porte d'entrée pour Seerah/Aqida/Fiqh/Hadith/Tafsir/Histoire/Biographies.

Une session d'étude doit pouvoir enregistrer :
- sujet ;
- domaine ;
- durée ;
- ressource ;
- synthèse ;
- enseignement principal.

Seerah :
- progression chronologique ;
- personnages ;
- événements ;
- enseignements ;
- courte synthèse ;
- possibilité de relier un texte arabe.

## 5. Duʿāʾ & Adhkār

Duʿāʾ :
- arabe ;
- sens ;
- contexte ;
- source si disponible ;
- statut : à apprendre / en apprentissage / apprise ;
- possibilité de rattacher à une routine.

Adhkār :
- par contexte : matin, soir, après prière, sommeil, etc.

## 6. Bibliothèque

Ressources :
- titre ;
- auteur/intervenant/provider ;
- type ;
- domaine ;
- raison d'utilisation ;
- notes ;
- points à vérifier ;
- statut.

## 7. Progression

Vue statistique séparée :
- semaine ;
- mois ;
- année.

KPI envisagés :
- pages Coran travaillées/mois ;
- jours avec arabe 30 min ;
- jours avec apprentissage religieux ;
- séances Seerah ;
- duʿāʾ apprises ;
- régularité dhikr ;
- sadaqa vendredi ;
- points d'attention Coran actifs/résolus.

La revue mensuelle doit être fondée sur des données, pas sur un long texte génératif.
