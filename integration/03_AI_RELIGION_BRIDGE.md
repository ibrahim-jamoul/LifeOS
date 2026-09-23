# 03 — Jointure IA ↔ Religion

## Principe

L'IA enrichit le module Religion, mais les données de domaine restent la source factuelle.

## Coran

Entrées IA possibles :
- éléments actuellement travaillés ;
- confiance ;
- sessions récentes ;
- `next_revision_at` ;
- points d'attention actifs ;
- historique des erreurs.

Sorties IA possibles :
- proposition de révision ;
- exercice de rappel ;
- fiche mémo ;
- synthèse d'un apprentissage ;
- recommandation de prochaine activité.

L'IA ne doit jamais :
- inventer le nombre de versets d'une sourate ;
- créer une référence religieuse fictive ;
- résoudre automatiquement un point d'attention sans action utilisateur ou règle explicite.

## Arabe

Entrées :
- profil ;
- objectif minutes/semaine ;
- focus ;
- sessions précédentes ;
- nouveaux mots ;
- mots revus ;
- difficultés identifiées.

Sorties :
- texte ou exercice adapté ;
- vocabulaire contextualisé ;
- mini-révision ;
- fiche mémo hebdomadaire.

## Étude religieuse

Entrées :
- `study_topics` ;
- sessions ;
- domaines étudiés ;
- ressources ;
- synthèses / takeaways.

Sorties :
- prochaine notion ;
- quiz ;
- fiche de synthèse ;
- rappel d'une notion ancienne ;
- connexion avec une notion déjà vue.

## Duʿāʾ / Hadith / Adhkār

Les objets doivent conserver provenance, référence et statut de vérification lorsque requis.

## Weekly Review Religion

Le calcul doit partir de données réelles :
- routines dues / réalisées ;
- sessions Coran ;
- pages/éléments travaillés ;
- sessions Arabe ;
- sessions d'étude ;
- points d'attention créés/résolus ;
- duʿāʾ apprises si le modèle de données le permet.

L'IA peut ensuite générer une courte lecture :
- réussites ;
- éléments fragiles ;
- révisions prioritaires ;
- suggestion pour la semaine suivante.
