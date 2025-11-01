-- Add notes column to photo_sessions table
ALTER TABLE photo_sessions 
ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '{}'::jsonb;