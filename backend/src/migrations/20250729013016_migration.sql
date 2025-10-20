/*
  # Create consent_forms table
  - This table now stores the details for a specific signed form.
  - It no longer duplicates patient demographic data.
  - It uses a `patient_id` foreign key to link to the new `patients` table.
*/
CREATE TABLE IF NOT EXISTS consent_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  procedure_type text NOT NULL,
  notes text,
  consent_date timestamptz NOT NULL DEFAULT now(),
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'pending')),
  signature_data text,
  shared_content jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Practices can manage own consent forms"
  ON consent_forms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM practices
      WHERE practices.id = consent_forms.practice_id
      AND practices.id = auth.uid()::uuid
    )
  );

CREATE INDEX IF NOT EXISTS idx_consent_forms_practice_id ON consent_forms(practice_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_patient_id ON consent_forms(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_status ON consent_forms(status);
CREATE INDEX IF NOT EXISTS idx_consent_forms_consent_date ON consent_forms(consent_date);
CREATE INDEX IF NOT EXISTS idx_consent_forms_procedure_type ON consent_forms(procedure_type);