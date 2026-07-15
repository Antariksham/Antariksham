-- ─────────────────────────────────────────────────────────────
-- Migration: add `thumbnail` to knowledge_articles
-- ─────────────────────────────────────────────────────────────
-- Adds an optional cover-image URL for Learn articles.
--
-- The app already renders a generated, space-themed cover for every Learn
-- card (see modules/learn/components/LearnThumb.tsx). Once this column exists
-- and a row has a `thumbnail` URL, that image is shown instead of the
-- generated cover. Rows without a thumbnail keep the generated cover.
--
-- Safe to run more than once (idempotent).
-- ─────────────────────────────────────────────────────────────

alter table public.knowledge_articles
  add column if not exists thumbnail text;

comment on column public.knowledge_articles.thumbnail is
  'Optional cover-image URL for the Learn card. When NULL, the app shows a generated cover.';
