-- LifeOS V4: KPI source metadata.
-- Personal KPI values and reference-derived content are intentionally NOT stored
-- in this repository. This migration only adds the generic schema required by V4.

alter table public.kpis
  add column if not exists measurement_mode text not null default 'manual',
  add column if not exists source_type text,
  add column if not exists source_id uuid,
  add column if not exists aggregation text not null default 'latest';

do $$
begin
  if not exists (select 1 from pg_constraint where conname='kpis_measurement_mode_ck') then
    alter table public.kpis add constraint kpis_measurement_mode_ck
      check (measurement_mode in ('manual','derived'));
  end if;
  if not exists (select 1 from pg_constraint where conname='kpis_source_type_ck') then
    alter table public.kpis add constraint kpis_source_type_ck
      check (source_type is null or source_type in (
        'habit','religion_routine','project','goal','weekly_review',
        'resource_completed','all_routines'
      ));
  end if;
  if not exists (select 1 from pg_constraint where conname='kpis_aggregation_ck') then
    alter table public.kpis add constraint kpis_aggregation_ck
      check (aggregation in ('latest','sum_count','count_days','count','progress','ratio'));
  end if;
end $$;

create index if not exists idx_kpis_user_measurement
  on public.kpis(user_id, measurement_mode, source_type, source_id)
  where active = true;

comment on column public.kpis.measurement_mode is
  'manual: values come from kpi_entries; derived: value is calculated from an existing LifeOS source.';
comment on column public.kpis.source_type is
  'Polymorphic LifeOS source used for derived KPI values.';
comment on column public.kpis.source_id is
  'Identifier of the derived source when source_type targets a single owned entity.';
comment on column public.kpis.aggregation is
  'How a derived KPI is calculated over its cadence window.';
