# Rollback — modèle référentiel 2026-09-21

Cette évolution est volontairement additive. Le rollback sûr consiste à redéployer
la version applicative précédente et à **conserver** les nouvelles colonnes, la
table `resources` et leurs politiques RLS. L’ancienne application ignore ces
éléments et continue de fonctionner sans perte de données.

Ne supprimez pas les colonnes ni la table pour effectuer un rollback applicatif.
Avant tout nettoyage ultérieur, exportez les données, vérifiez qu’aucune ligne ne
les utilise et planifiez une migration séparée avec validation humaine.

La valeur d’enum `priority_level.unset` n’est pas supprimable de manière sûre en
place par PostgreSQL. Elle doit rester disponible lors d’un rollback. Les valeurs
par défaut peuvent être remises à `medium` dans une migration ultérieure si ce
choix est explicitement décidé, sans réécrire les lignes existantes.

Après un rollback applicatif, contrôlez :

- connexion et RLS des tables historiques ;
- lecture/édition des objectifs, projets, tâches, KPI et décisions ;
- accès privé aux buckets `documents` et `memories` ;
- absence d’erreur dans les logs Vercel.

## Extension Manager Mode

La migration `20260921230000_add_task_planning.sql` ajoute uniquement `tasks.planned_on` et un index partiel. Un rollback applicatif consiste à redéployer la version précédente et à conserver cette colonne : elle est ignorée par l’ancienne application. Ne supprimez pas la colonne en urgence.
