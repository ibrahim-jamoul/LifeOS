# Codex — handoff minimal pour économiser les tokens

Ce fichier est le point d'entrée à utiliser **si Codex doit intervenir plus tard**.

## Ne pas lui renvoyer les 117 pages par défaut

Le référentiel a déjà été structuré et importé. Le repository contient :

- `initial_data/referentiel_2026-09-21.json` ;
- `initial_data/REFERENTIEL_MAPPING_2026-09-21.md` ;
- `PASSATION_LIFEOS_2026-09-21.md` ;
- `17_MANAGER_MODE.md`.

Pour une modification ordinaire, Codex doit lire uniquement :

1. `AGENTS.md` ;
2. `17_MANAGER_MODE.md` ;
3. le ou les fichiers concernés ;
4. les migrations liées ;
5. les tests liés.

Il ne doit consulter le référentiel complet que si la demande porte explicitement sur une information qui n'existe pas déjà dans les données structurées.

## Prompt minimal recommandé

> Travaille sur LifeOS sans refonte. Lis AGENTS.md et 17_MANAGER_MODE.md, puis uniquement les fichiers directement concernés. Préserve l'architecture, les données et la RLS. Fais le plus petit diff possible. N'ajoute aucune donnée déjà présente dans initial_data/referentiel_2026-09-21.json. Exécute les tests ciblés puis le check global. Ne refactore pas le reste du projet. À la fin, donne seulement : fichiers changés, tests, migration éventuelle, risques et rollback.

## Pour une revue après modification par une autre IA

> Analyse uniquement le git diff et les tests associés. Cherche des bugs, régressions, erreurs de sécurité/RLS ou incohérences avec 17_MANAGER_MODE.md. Ne réécris pas le code et ne refactore rien sans erreur concrète démontrée.

Cette stratégie évite une relecture complète du repository et du référentiel à chaque demande.
