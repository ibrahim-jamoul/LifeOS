# LifeOS

LifeOS est une application personnelle de pilotage, prête pour Next.js, Vercel et Supabase. Elle relie vision, objectifs, projets, tâches, KPI, reviews et décisions aux neuf branches du produit : Religion, Arabe, Coran, pilotage, assistant IA, finances, santé/habitudes, documents et souvenirs.

Cette implémentation n’embarque aucune donnée de démonstration. Toutes les mutations sont authentifiées, validées côté serveur et protégées par RLS. Les fichiers sont envoyés directement vers des buckets Supabase privés sous un préfixe appartenant à l’utilisateur.

## Fonctionnalités livrées

- Auth Supabase SSR : inscription, connexion, déconnexion et réinitialisation du mot de passe.
- Initialisation idempotente des neuf domaines au premier accès.
- CRUD complet pour objectifs, projets multi-objectifs, tâches, KPI/mesures, weekly reviews et décisions.
- Dashboard réel : tâches du jour/semaine/en retard, projets FOCUS, alertes, santé des objectifs, KPI et activité récente.
- Alertes dérivées à la lecture et notifications persistées sans doublons, avec lecture, snooze et dismiss.
- Religion, Arabe et Coran, avec minutes hebdomadaires et file de révision.
- Finances multi-devise sans conversion implicite ; transferts atomiques exclus des revenus/dépenses.
- Habitudes, métriques santé et tendances fondées uniquement sur les points saisis.
- Classement transversal PRO / PERSO / RELIGION, routines cochables et historique par période.
- Import reproductible du référentiel personnel, sans écrasement ni doublons.
- Ressources nommées reliées aux objectifs, projets et sujets d’étude.
- Coffres Documents et Souvenirs privés, URLs signées temporaires et suppression cohérente objet/métadonnées.
- Assistant IA optionnel, strictement serveur, lecture seule et limité au périmètre choisi.
- Export JSON de toutes les lignes appartenant au compte.

## Prérequis

- Node.js 22 ou version LTS récente ;
- npm ;
- un projet Supabase ;
- un compte Vercel pour la production.

## Installation locale

```bash
npm install
```

Copiez `.env.example` vers `.env.local`, puis renseignez au minimum :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Dans Supabase :

1. liez le projet avec la CLI Supabase ;
2. appliquez toutes les migrations versionnées avec `npx supabase db push` ;
3. créez deux buckets **privés**, nommés exactement `documents` et `memories` ;
4. activez Email/Password dans Auth ;
5. ajoutez `http://localhost:3000/auth/callback` aux URLs de redirection locales.

Les politiques Storage sont déjà dans la migration initiale. Les buckets doivent rester privés ; ne créez pas d’URL publique.

Lancez ensuite :

```bash
npm run dev
```

Ouvrez `http://localhost:3000`. Le premier accès à `/app/*` appelle l’initialisation idempotente et crée exactement les neuf branches.

## Variables d’environnement

| Variable | Portée | Obligatoire | Usage |
|---|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + serveur | oui | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + serveur | oui | clé publiable Supabase, protégée par RLS |
| `SUPABASE_SECRET_KEY` | serveur | cron uniquement | génération d’alertes pour tous les comptes |
| `SUPABASE_SERVICE_ROLE_KEY` | serveur | ancien fallback | compatibilité temporaire avec l’ancienne clé service-role |
| `CRON_SECRET` | serveur | cron uniquement | protège `/api/cron/alerts` |
| `AI_API_KEY` | serveur | non | active l’assistant IA |
| `AI_MODEL` | serveur | avec IA | identifiant du modèle |
| `AI_BASE_URL` | serveur | non | base OpenAI-compatible, défaut `https://api.openai.com/v1` |
| `LIFEOS_IMPORT_USER_ID` | import serveur | import seulement | UUID du compte personnel cible |
| `LIFEOS_REFERENCE_DOCX` | import serveur | non | chemin du Word, sinon celui déclaré dans le JSON |

Ne préfixez jamais une clé secrète avec `NEXT_PUBLIC_`.

## Import du référentiel personnel

Le jeu structuré est dans `initial_data/referentiel_2026-09-21.json`. Lancez
d’abord une simulation, puis l’application explicite :

```bash
npm run import:referentiel -- --user UUID_DU_COMPTE
npm run import:referentiel -- --apply --user UUID_DU_COMPTE
```

L’importeur utilise des identifiants déterministes, rapproche les titres
normalisés, complète seulement les champs vides et refuse d’écraser les valeurs
existantes. Le Word est vérifié par empreinte SHA-256 avant d’être réutilisé et
reste dans le bucket privé `documents`. Un second passage doit annoncer zéro
insertion, zéro complément et zéro relation nouvelle.

Le détail de l’interprétation se trouve dans
`initial_data/REFERENTIEL_MAPPING_2026-09-21.md`. L’état complet de la mission et
les suites possibles se trouvent dans `PASSATION_LIFEOS_2026-09-21.md`.

## Déploiement Vercel

1. importez ce dossier comme racine du projet Vercel ;
2. configurez les variables ci-dessus dans les environnements Preview/Production appropriés ;
3. dans Supabase Auth, ajoutez l’URL de production et `https://VOTRE_DOMAINE/auth/callback` ;
4. déployez ;
5. vérifiez inscription, connexion, upload privé et isolation avec deux comptes.

`vercel.json` planifie `/api/cron/alerts` chaque jour à 05:15 UTC. Vercel envoie `CRON_SECRET` dans l’en-tête Bearer. Le dashboard et les alertes dues restent corrects même sans cron, car ils sont aussi calculés à la lecture.

## Assistant IA

Sans variables IA, la page affiche clairement « configuration serveur requise » et le reste de LifeOS fonctionne. Avec une configuration, le serveur envoie uniquement des colonnes structurées du périmètre explicitement sélectionné. Les chemins Storage et les fichiers binaires ne sont pas transmis. L’adaptateur ne propose aucun outil d’écriture.

## Tests et validation

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Les tests unitaires couvrent score projet, KPI, dates/semaines ISO, totaux financiers et tendances santé. Playwright vérifie au minimum la protection desktop/mobile des routes privées ; le parcours authentifié complet s’active avec :

```dotenv
LIFEOS_E2E_EMAIL=
LIFEOS_E2E_PASSWORD=
```

Le test live RLS/Storage exige deux comptes Supabase dédiés :

```dotenv
SUPABASE_TEST_USER_A_EMAIL=
SUPABASE_TEST_USER_A_PASSWORD=
SUPABASE_TEST_USER_B_EMAIL=
SUPABASE_TEST_USER_B_PASSWORD=
```

Il contrôle l’initialisation idempotente, les lectures/modifications/suppressions inter-utilisateurs, l’usurpation de `user_id` et l’accès croisé aux objets privés.

## Modèle de sécurité

- `user_id` provient toujours de la session serveur, jamais du payload client.
- RLS est activée sur chaque table utilisateur.
- Les clés étrangères composites de `002_security_integrity.sql` empêchent de relier un enfant à l’objet d’un autre compte.
- Les mutations filtrent également l’identifiant propriétaire, en défense en profondeur.
- Les objets privés suivent `<user_id>/<année>/<uuid>-<nom-normalisé>`.
- Les documents sont ouverts avec des URLs signées de cinq minutes.
- L’export JSON est authentifié et ne contient pas les binaires Storage.

Les documents `01` à `16` restent la spécification produit. Consultez `KNOWN_LIMITATIONS.md` avant une mise en production et `supabase/tests/RLS_TEST_PLAN.md` pour la recette manuelle exhaustive.
