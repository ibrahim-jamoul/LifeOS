# Rapport d'implémentation — LifeOS Manager v1

> **Note 22/09/2026 :** la section ci-dessous décrit l’implémentation v1 historique. La définition courante d’Aujourd’hui est désormais celle de `17_MANAGER_MODE.md` : un projet FOCUS ne crée plus d’éligibilité et les routines hebdomadaires/mensuelles non datées ne sont plus injectées dans la journée.

Date : 21 septembre 2026
Base reconstruite : commit Git `d37b819` (`docs: finalize LifeOS handoff`)

## 1. Méthode anti-casse

Le RAR transmis contient 46 177 entrées, dont environ 44 396 fichiers `node_modules`, 1 096 fichiers `.next` et 478 fichiers `.git`.

Pour éviter de modifier des artefacts générés ou des secrets :

- le dépôt a été reconstruit depuis les objets Git présents dans l'archive ;
- la base utilisée correspond au commit `d37b819` ;
- les fichiers sources de l'archive ont été comparés par taille/CRC avec la copie Git : les fichiers applicatifs reconstruits correspondent à l'archive, hors `tsconfig.json` dont la différence observée est un changement de fin de ligne ;
- `.env.local`, `.vercel`, `supabase/.temp`, `.next`, `node_modules` et les rapports de test générés ne sont pas intégrés au livrable final.

## 2. Objectif implémenté

Faire de `/app/dashboard` une vraie vue **Aujourd'hui** : LifeOS propose l'ordre du jour et l'utilisateur exécute principalement en un geste.

## 3. Changements principaux

### Moteur de journée

Nouveau moteur pur : `src/lib/domain/daily-plan.ts`.

Il classe :

1. échéances dépassées ;
2. échéances du jour ;
3. tâches explicitement planifiées ;
4. routines dues avec prise en compte de `matin / journée / soir` ;
5. tâches liées aux projets FOCUS.

Le top est limité à 3 éléments et la file visible à 10 éléments.

### Séparation planification / échéance

Nouvelle colonne additive `tasks.planned_on`.

- `planned_on` = jour prévu pour travailler ;
- `due_on` / `due_at` = vraie échéance.

Reporter une tâche modifie uniquement `planned_on`.

### Actions rapides

Nouvelle interface `src/components/today-manager.tsx` :

- `Fait` ;
- `Demain` ;
- `+7 jours` ;
- accès secondaire à l'administration détaillée.

Les routines se valident avec le moteur existant.

### Historique

La complétion d'une tâche écrit désormais un événement `completed` dans `activity_log`.
La replanification écrit un événement `rescheduled`.

### Navigation

- `Dashboard` devient `Aujourd'hui` ;
- le bouton global `Capturer` est retiré du parcours principal ;
- l'Assistant IA n'est plus exposé dans la navigation principale, mais son code n'est pas supprimé ;
- les écrans CRUD restent accessibles dans leurs branches pour les modifications exceptionnelles.

## 4. Base de données

Migration additive :

`supabase/migrations/20260921230000_add_task_planning.sql`

Elle :

- ajoute `tasks.planned_on date` ;
- ajoute un index partiel sur les tâches actives ;
- ne supprime ni ne transforme aucune donnée existante.

Rollback applicatif : redéployer l'ancienne version et conserver la colonne. Elle sera simplement ignorée.

## 5. Référentiel

Aucune ressaisie du Word n'est effectuée.
L'import structuré existant reste la source :

- `initial_data/referentiel_2026-09-21.json` ;
- `initial_data/REFERENTIEL_MAPPING_2026-09-21.md`.

Aucun nouveau seed concurrent n'a été créé.

## 6. Validation exécutée dans cet environnement

Réussis :

- `git diff --check` ;
- parsing/transpilation syntaxique TypeScript de 73 fichiers `src/` + `tests/` : 0 erreur de syntaxe ;
- smoke tests directs du moteur de journée : priorité échéance, routine du matin, tâche FOCUS et report opérationnel ;
- vérification manuelle des changements SQL additifs.

Non exécutables complètement ici :

- `npm run lint` ;
- `npm run typecheck` avec toutes les dépendances ;
- Vitest complet ;
- Playwright ;
- Supabase live / RLS live ;
- build Next.js complet.

Cause : l'archive RAR contient `node_modules`, mais la majorité des dépendances sont compressées dans un format nécessitant l'outil RAR externe absent de l'environnement, et l'installation npm externe n'a pas abouti. Le livrable conserve `package-lock.json` pour une installation déterministe.

## 7. Ordre de déploiement

1. sauvegarder / conserver le déploiement actuel ;
2. `npm ci` ;
3. exécuter les tests ;
4. appliquer la nouvelle migration Supabase ;
5. déployer l'application ;
6. vérifier `/app/dashboard` sur mobile et desktop ;
7. tester Fait / Demain / +7 jours ;
8. vérifier que les alertes d'échéance restent présentes après un report si l'échéance est réellement dépassée.

## 8. Codex

Codex n'a pas besoin de relire le référentiel complet pour cette version.
Voir `CODEX_MINIMAL_HANDOFF.md` si une validation ou une petite correction doit être déléguée plus tard.

## 9. Phase 2 volontairement différée

La grosse BDD personnelle Arabe + Religion hors Coran, avec sources et sélection quotidienne de lecture, reste un chantier ultérieur. Elle doit se brancher sur ce moteur une fois le Manager Mode stabilisé.
