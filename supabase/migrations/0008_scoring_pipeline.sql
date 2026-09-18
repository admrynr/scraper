-- ============================================================
-- Migration 0008: Lead Scoring & Pipeline Status
-- Tambah kolom scoring otomatis + pipeline status manual
-- ke tabel saved_prospects
-- ============================================================

-- ── Kolom Scoring (diisi otomatis oleh backend/service role) ──────────────────

ALTER TABLE public.saved_prospects
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS score_label TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS business_status TEXT DEFAULT NULL;

-- Constraint score_label enum
ALTER TABLE public.saved_prospects
  DROP CONSTRAINT IF EXISTS saved_prospects_score_label_check;
ALTER TABLE public.saved_prospects
  ADD CONSTRAINT saved_prospects_score_label_check
  CHECK (score_label IN ('hot', 'warm', 'cold', 'unreachable'));

-- ── Kolom Pipeline Status (diisi manual oleh user) ────────────────────────────

ALTER TABLE public.saved_prospects
  ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'belum_dihubungi',
  ADD COLUMN IF NOT EXISTS pipeline_status_updated_at TIMESTAMPTZ DEFAULT NULL;

-- Constraint pipeline_status enum
ALTER TABLE public.saved_prospects
  DROP CONSTRAINT IF EXISTS saved_prospects_pipeline_status_check;
ALTER TABLE public.saved_prospects
  ADD CONSTRAINT saved_prospects_pipeline_status_check
  CHECK (pipeline_status IN (
    'belum_dihubungi',
    'dihubungi',
    'dibalas',
    'tertarik',
    'closed',
    'tidak_tertarik'
  ));

-- ── Index untuk filter & sorting ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS saved_prospects_score_label_idx ON public.saved_prospects(score_label);
CREATE INDEX IF NOT EXISTS saved_prospects_pipeline_status_idx ON public.saved_prospects(pipeline_status);
CREATE INDEX IF NOT EXISTS saved_prospects_score_idx ON public.saved_prospects(score DESC NULLS LAST);

-- ============================================================
-- Verifikasi:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'saved_prospects'
-- ORDER BY ordinal_position;
-- ============================================================
