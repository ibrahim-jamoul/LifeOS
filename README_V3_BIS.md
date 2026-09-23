# LifeOS — V3 bis — Jointure Religion + couche IA

Date : 24/09/2026

## Objet

Cette V3 bis complète la V3 LifeOS avec deux nouveaux ensembles d'exigences :

1. la V1 fonctionnelle du module Religion ;
2. la conception de la couche IA centrale de LifeOS.

La V3 bis ne doit pas créer trois systèmes concurrents. Elle impose une séparation stricte des responsabilités :

- **Système global LifeOS** : objectifs long terme, missions/tâches, planification, vue Aujourd'hui, KPI consolidés, revues globales ;
- **Modules de domaine** : données factuelles propres à Religion, Arabe, Coran, étude, etc. ;
- **Couche IA** : analyse, recherche, génération, personnalisation, mémorisation pédagogique, recommandations et préparation de contenu ;
- **Supabase** : mémoire structurée et source de vérité persistante ;
- **UI LifeOS** : restitution et action utilisateur.

## Principe central

L'IA n'est pas un chatbot ajouté dans LifeOS. Elle travaille **pour** LifeOS.

```text
IA
↓
analyse / recherche / génération / personnalisation
↓
Supabase
↓
LifeOS
↓
restitution / suivi / historique / progression / rappels
```

## Sources de vérité

Ordre d'autorité pour cette V3 bis :

1. code et migrations réellement présents dans la V3 au moment de l'implémentation ;
2. `requirements/religion/` pour le périmètre Religion ;
3. `requirements/ai/AI_CENTRAL_PROMPT_V1.md` pour la couche IA ;
4. les documents `integration/` de ce package pour arbitrer les interfaces entre les deux ;
5. le référentiel personnel inclus dans le package Religion pour le contexte utilisateur.

En cas de contradiction, ne pas inventer : documenter l'écart et privilégier la donnée réelle du repo et de Supabase.

## Règles non négociables

- aucune suppression de table ou donnée existante ;
- aucune refonte générale non demandée ;
- aucun deuxième système d'objectifs ;
- aucune duplication de `tasks`, `habits`, `kpis`, `resources` ;
- l'IA n'a jamais d'accès SQL arbitraire ;
- aucune clé OpenAI ou `service_role` exposée dans le navigateur ;
- RLS obligatoire pour toute nouvelle table exposée ;
- l'IA propose avant d'agir lorsque l'action modifie LifeOS ;
- les contenus religieux doivent être sourcés lorsqu'une source est requise ;
- aucune source ne doit être inventée ;
- pas de mock data en production.

## Ce que V3 bis ajoute

### Religion

- espace quotidien réellement opérationnel ;
- Coran, Arabe, Étudier, Duʿāʾ/Adhkār, Bibliothèque, Progression ;
- points d'attention Coran persistants ;
- future jointure avec objectifs et KPI globaux.

### IA

- mémoire d'apprentissage ;
- génération structurée de contenus ;
- répétition espacée ;
- fiches mémo ;
- analyse hebdomadaire ;
- recommandations ;
- Context Builder ;
- contrat JSON IA → LifeOS ;
- fonctionnement manuel d'abord, API ensuite.

## Statut d'implémentation

Ce package est un **cahier des charges de jointure V3 bis**. Il doit être appliqué sur le code V3 réel après audit de celui-ci. Il ne remplace pas le dépôt applicatif.
