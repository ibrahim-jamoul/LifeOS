# Proposition de migration — NE PAS appliquer aveuglément

> Ce fichier est une proposition fonctionnelle. L'agent doit d'abord inspecter les migrations du repo,
> les contraintes/FK composées existantes et les conventions RLS avant de générer la migration finale.

```sql
create table if not exists public.quran_revision_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quran_item_id uuid null,
  surah_number smallint not null check (surah_number between 1 and 114),
  ayah_number integer not null check (ayah_number > 0),
  issue_type text not null default 'memorization'
    check (issue_type in ('hesitation','confusion','memorization','pronunciation','tajwid','other')),
  note text null,
  priority smallint not null default 1 check (priority between 1 and 3),
  status text not null default 'active'
    check (status in ('active','resolved','archived')),
  occurrence_count integer not null default 1 check (occurrence_count >= 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  next_review_at timestamptz null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ajouter la FK vers quran_items selon le pattern d'ownership déjà employé dans le projet.
-- Préférer une FK composite (quran_item_id, user_id) si quran_items possède/obtient
-- la contrainte unique correspondante, afin d'empêcher les liens cross-user.

alter table public.quran_revision_points enable row level security;

create policy "quran_revision_points_select_own"
on public.quran_revision_points
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "quran_revision_points_insert_own"
on public.quran_revision_points
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "quran_revision_points_update_own"
on public.quran_revision_points
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "quran_revision_points_delete_own"
on public.quran_revision_points
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists quran_revision_points_due_idx
on public.quran_revision_points(user_id, status, next_review_at);

create index if not exists quran_revision_points_ayah_idx
on public.quran_revision_points(user_id, surah_number, ayah_number);
```

## Notes

- Le nombre réel de versets par sourate ne doit pas être codé au hasard dans une contrainte SQL.
- La validation `ayah_number <= ayah_count` doit s'appuyer sur une table/dataset de métadonnées Coran fiable.
- Le trigger `updated_at` doit réutiliser la fonction/pattern déjà existant dans LifeOS s'il existe.
- Avant livraison, exécuter les advisors Supabase et tester les RLS.
