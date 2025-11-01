-- Add quality metrics columns to media_files table
-- 1) Add columns (no-op if they already exist)
ALTER TABLE public.media_files 
  ADD COLUMN IF NOT EXISTS quality_score int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brightness_level int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contrast_score int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sharpness_rating int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quality_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS quality_feedback text;

-- 2) Add the CHECK constraint only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.contype = 'c'
      AND c.conname = 'media_files_quality_status_check'
      AND n.nspname = 'public'
      AND t.relname = 'media_files'
  ) THEN
    ALTER TABLE public.media_files
      ADD CONSTRAINT media_files_quality_status_check
      CHECK (quality_status = ANY (ARRAY['pending'::text, 'pass'::text, 'fail'::text, 'accepted'::text]));
  END IF;
END;
$$;