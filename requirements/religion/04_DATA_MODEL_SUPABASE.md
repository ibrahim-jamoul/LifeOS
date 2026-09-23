# 04 — Mapping Supabase et proposition de modèle

## Tables existantes à réutiliser

### `religion_routines`
Rôle : définition des routines religieuses planifiées.

Champs utiles déjà présents :
- `name`
- `target_frequency`
- `target_count`
- `duration_minutes`
- `target_unit`
- `schedule_weekday`
- `schedule_day_of_month`
- `time_context`
- `reminder_enabled`
- `reminder_time`
- `status`
- `goal_id`
- `kpi_id`

### `religion_logs`
Rôle : occurrences réelles des routines.
- `routine_id`
- `occurred_at`
- `occurred_on`
- `count`
- `note`

### `quran_items`
Rôle : élément de travail Coran.
- `surah_number`
- `surah_name`
- `start_ayah`
- `end_ayah`
- `activity`
- `status`
- `confidence`
- `next_revision_at`
- `notes`

### `quran_sessions`
Rôle : historique des sessions Coran.
- `quran_item_id`
- `occurred_at`
- `duration_minutes`
- `activity`
- `confidence`
- `outcome`
- `next_revision_at`

### `arabic_profiles`
- niveau auto-évalué ;
- objectif minutes/semaine ;
- focus actuel ;
- estimation vocabulaire.

### `arabic_sessions`
- durée ;
- skill ;
- resource ;
- new_words ;
- reviewed_words ;
- notes.

### `study_topics`
- domaine ;
- titre ;
- catégorie ;
- ressource ;
- statut ;
- progression ;
- notes.

### `study_sessions`
- topic ;
- domaine ;
- durée ;
- type d'activité ;
- ressource ;
- synthèse ;
- takeaway.

### `resources`
À utiliser pour la bibliothèque Religion avec `life_area='religion'`.

### Tables globales
- `goals`
- `tasks`
- `habits`
- `kpis`

Elles seront utilisées lors de la jointure globale. Ne pas dupliquer leurs responsabilités.

---

## Nouvelle table recommandée : `quran_revision_points`

But : stocker les difficultés persistantes sur un verset.

### Colonnes recommandées

| Colonne | Type | Rôle |
|---|---|---|
| id | uuid PK | identifiant |
| user_id | uuid FK auth.users | propriétaire |
| quran_item_id | uuid nullable | lien optionnel vers quran_items |
| surah_number | smallint | 1..114 |
| ayah_number | integer | verset |
| issue_type | text | hesitation/confusion/memorization/pronunciation/tajwid/other |
| note | text nullable | description |
| priority | smallint | 1 normal, 2 haute, 3 critique si besoin |
| status | text | active/resolved/archived |
| occurrence_count | integer | nombre de fois où la difficulté réapparaît |
| first_seen_at | timestamptz | première détection |
| last_seen_at | timestamptz | dernière détection |
| next_review_at | timestamptz nullable | prochaine remontée |
| resolved_at | timestamptz nullable | résolution |
| created_at | timestamptz | audit |
| updated_at | timestamptz | audit |

### Contraintes

- `surah_number between 1 and 114`
- `ayah_number > 0`
- `occurrence_count >= 1`
- `priority between 1 and 3`
- `status in ('active','resolved','archived')`
- `issue_type` contrôlé.

La validité réelle de `ayah_number` par rapport à la sourate doit être gérée à partir d'un jeu de métadonnées Coran fiable côté application ou base.

### Sécurité

LifeOS étant multi-utilisateur techniquement :
- RLS obligatoire ;
- SELECT/INSERT/UPDATE/DELETE limité au `user_id = auth.uid()`;
- UPDATE avec `USING` **et** `WITH CHECK`;
- aucune clé service role dans le client.

### Index recommandés

- `(user_id, status, next_review_at)`
- `(user_id, surah_number, ayah_number)`
- `(user_id, quran_item_id)` si lien utilisé.

### Non-régression

Avant migration :
1. inspecter les migrations existantes ;
2. respecter les conventions de nommage du repo ;
3. ne supprimer aucune colonne/table ;
4. ne pas réutiliser arbitrairement `notes` comme substitut ;
5. vérifier les policies RLS existantes.
