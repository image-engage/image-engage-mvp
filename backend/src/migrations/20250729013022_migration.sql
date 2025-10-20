/*
  # Create photo_sessions table
  - This table remains largely the same but now links to the new `patients` table.
  - Updated to include `file_urls`, `photo_type`, and `storage_folder_path`.
*/
CREATE TABLE IF NOT EXISTS photo_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_photo_id text NOT NULL,
  session_date timestamptz NOT NULL DEFAULT now(),
  photos_count integer NOT NULL DEFAULT 0,
  storage_folder_path text NOT NULL,
  file_urls text[],
  photo_type text,
  status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'ready', 'published')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE photo_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Practices can manage own photo sessions"
  ON photo_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM practices
      WHERE practices.id = photo_sessions.practice_id
      AND practices.id = auth.uid()::uuid
    )
  );

CREATE INDEX IF NOT EXISTS idx_photo_sessions_practice_id ON photo_sessions(practice_id);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_patient_id ON photo_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_status ON photo_sessions(status);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_date ON photo_sessions(session_date);
