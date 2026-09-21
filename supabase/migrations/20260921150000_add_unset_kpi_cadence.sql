-- Represent an unknown measurement cadence explicitly instead of coercing it
-- to weekly or ad hoc. Existing KPI rows are preserved unchanged.
alter table public.kpis
  alter column cadence set default 'unset',
  drop constraint if exists kpis_cadence_check,
  add constraint kpis_cadence_check
    check (cadence in ('unset', 'daily', 'weekly', 'monthly', 'quarterly', 'adhoc'));
