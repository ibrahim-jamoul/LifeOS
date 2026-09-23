# 07 — Critères d'acceptation V3 bis

## Non-régression
- [ ] aucune fonctionnalité V3 supprimée ;
- [ ] build réussi ;
- [ ] routes hors Religion intactes ;
- [ ] aucune donnée existante supprimée ;
- [ ] aucune duplication du système global d'objectifs/tâches/KPI.

## Religion
- [ ] critères de `requirements/religion/05_ACCEPTANCE_TESTS.md` respectés ;
- [ ] points d'attention Coran persistants et sécurisés ;
- [ ] données réelles uniquement en production.

## IA — V1 manuelle
- [ ] le contrat JSON est documenté et versionné ;
- [ ] un payload invalide est rejeté ;
- [ ] doublons détectés lorsque la logique le permet ;
- [ ] source facultative reste facultative, mais aucune source n'est inventée ;
- [ ] contenu importé peut être relié à son module et à son historique.

## Mémoire pédagogique
- [ ] possibilité d'identifier ce qui a déjà été vu ;
- [ ] possibilité de relier une activité à un résultat ;
- [ ] possibilité de planifier une prochaine révision ;
- [ ] une notion peut revenir après plusieurs semaines sans être recréée comme nouvelle notion.

## Weekly Review
- [ ] chiffres calculés à partir de données réelles ;
- [ ] résumé IA séparé des KPI ;
- [ ] drill-down possible vers les données sources quand l'UI le permet ;
- [ ] aucune métrique inventée.

## Action IA
- [ ] observation sans mutation ;
- [ ] recommandation distincte de l'action ;
- [ ] action destructive ou modificatrice soumise à validation ;
- [ ] journal d'action ou mécanisme de traçabilité prévu.

## Sécurité
- [ ] clé OpenAI côté serveur uniquement en phase API ;
- [ ] RLS vérifiée ;
- [ ] aucun `service_role` frontend ;
- [ ] ownership vérifié ;
- [ ] rollback migration documenté.
