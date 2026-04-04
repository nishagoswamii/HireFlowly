ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS track_key TEXT,
  ADD COLUMN IF NOT EXISTS version_number INTEGER,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS seniority TEXT;

UPDATE public.analyses
SET track_key = COALESCE(track_key, 'legacy-' || id::text),
    version_number = COALESCE(version_number, 1);

ALTER TABLE public.analyses
  ALTER COLUMN track_key SET NOT NULL,
  ALTER COLUMN version_number SET NOT NULL,
  ALTER COLUMN version_number SET DEFAULT 1;

CREATE INDEX IF NOT EXISTS analyses_user_track_created_idx
  ON public.analyses (user_id, track_key, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS analyses_user_track_version_unique_idx
  ON public.analyses (user_id, track_key, version_number);
