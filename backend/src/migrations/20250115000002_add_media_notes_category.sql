-- Add notes and category columns to media_files table
ALTER TABLE media_files 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'other';