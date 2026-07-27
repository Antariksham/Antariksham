-- Mission "details" — the extensible, structured data model behind the Phase 1
-- Mission Management upgrade.
--
-- One additive, NULLABLE jsonb column holds every new structured section,
-- namespaced so each Phase 1 feature owns its own key without a schema change:
--
--   details = {
--     identity?:       { shortName, acronym, subtitle, summary, objective,
--                        motto, website, wikipedia, pressKit, alias },   -- Feature 1
--     classification?: { ... },   -- Feature 2 (multi type / destinations / agencies)
--     specifications?: { ... },   -- Feature 3
--     objectives?:     { ... },   -- Feature 4 (scientific objectives)
--     launch?:         { ... },   -- Feature 6
--     media?:          { ... },   -- Feature 7
--   }
--
-- Why one jsonb column (not many typed columns):
--   * Backward compatible — existing rows get `details = NULL`; every existing
--     read/write path is untouched (name, slug, status, mission_type,
--     destination, launch_date, agency_id, featured, featured_image, timeline,
--     description all remain top-level columns).
--   * Reversible — any field can later be promoted to its own column via a
--     follow-up migration without data loss.
--   * Matches the house pattern (`timeline jsonb`, `articles.featured_image_meta`).
--
-- Reads degrade gracefully: services select `details` and re-select without it
-- if this migration hasn't been applied yet (same idiom as featured_image_meta).
--
-- Idempotent: safe to re-run.

alter table public.missions
  add column if not exists details jsonb;

comment on column public.missions.details is
  'Extensible structured mission data, namespaced by Phase 1 feature: identity, classification, specifications, objectives, launch, media. All keys optional; NULL for legacy rows.';

-- Optional GIN index so future queries into details (e.g. by mission acronym,
-- program, or family) stay fast. jsonb_path_ops keeps the index small and is
-- ideal for containment (@>) lookups. Harmless on an all-NULL column.
create index if not exists missions_details_gin_idx
  on public.missions using gin (details jsonb_path_ops);
