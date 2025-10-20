/*
  # Create patients table (renamed from patient_consents)
  - This table now serves as the core patient profile.
  - It no longer stores consent-specific details like `consent_date` or `consent_status`.
*/
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  last_photo_session timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure the table exists before altering
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent_status text DEFAULT 'active'; -- Re-adding if needed for future consent logic

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Practices can manage own patient data"
  ON patients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM practices
      WHERE practices.id = patients.practice_id
      AND practices.id = auth.uid()::uuid
    )
  );

CREATE INDEX IF NOT EXISTS idx_patients_practice_id ON patients(practice_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);