/*
  # Create content library table

  1. New Tables
    - `content_library`
      - `id` (uuid, primary key)
      - `practice_id` (uuid, foreign key to practices)
      - `title` (text, content title)
      - `description` (text, content description)
      - `content_type` (text, article/pdf/video/image)
      - `category` (text, content category)
      - `file_name` (text, original file name)
      - `file_size` (numeric, file size in bytes)
      - `file_path` (text, path to file)
      - `tags` (text[], array of tags)
      - `is_active` (boolean, whether content is active)
      - `created_by` (text, email of creator)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `content_library` table
    - Add policy for practices to manage their own content
*/

CREATE TABLE IF NOT EXISTS content_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('article', 'pdf', 'video', 'image')),
  category text NOT NULL,
  file_name text NOT NULL,
  file_size numeric DEFAULT 0,
  file_path text DEFAULT '',
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Policy for practices to manage their own content library
CREATE POLICY "Practices can manage own content library"
  ON content_library
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM practices 
      WHERE practices.id = content_library.practice_id 
      AND practices.id = auth.uid()::text::uuid
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_library_practice_id ON content_library(practice_id);
CREATE INDEX IF NOT EXISTS idx_content_library_content_type ON content_library(content_type);
CREATE INDEX IF NOT EXISTS idx_content_library_category ON content_library(category);
CREATE INDEX IF NOT EXISTS idx_content_library_is_active ON content_library(is_active);
CREATE INDEX IF NOT EXISTS idx_content_library_tags ON content_library USING GIN(tags);