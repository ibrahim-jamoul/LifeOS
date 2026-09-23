# 04 — Context Builder

## But

Ne jamais envoyer toute la base LifeOS au modèle.

## Principe

Chaque tâche IA possède un profil de contexte.

### Exemple — leçon Religion du jour
Inclure :
- objectif Religion concerné ;
- derniers apprentissages ;
- sujets déjà vus ;
- révisions dues ;
- difficultés pertinentes ;
- temps disponible si connu ;
- préférences pédagogiques utiles.

Exclure :
- finances ;
- santé ;
- documents sans rapport ;
- historique complet ;
- secrets et credentials.

### Exemple — Weekly Review globale
Inclure :
- tâches prévues/réalisées/reportées ;
- routines ;
- KPI ;
- sessions d'apprentissage ;
- progression par objectif ;
- événements de la période.

Exclure :
- contenu brut non nécessaire ;
- documents personnels non reliés à l'analyse.

## Sécurité

Le Context Builder doit appliquer :
- filtrage par `user_id` ;
- minimisation ;
- limites de période ;
- limites de volume ;
- redaction de secrets ;
- journalisation du type de données envoyé, sans enregistrer inutilement le contenu sensible.
