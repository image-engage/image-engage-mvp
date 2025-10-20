/*
  # Create patient workflow sessions table

  1. New Tables
    - `patient_workflow_sessions`
      - `id` (uuid, primary key)
      - `practice_id` (uuid, foreign key to practices)
      - `patient_id` (uuid, foreign key to patients)
      - `current_step` (text, workflow step: 'consent', 'before_photos', 'after_photos', 'completed')
      - `before_photos_completed` (boolean, default false)
      - `after_photos_completed` (boolean, default false)
      - `before_completed_at` (timestamptz, nullable)
      - `after_completed_at` (timestamptz, nullable)
      - `workflow_completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `patient_workflow_sessions` table
    - Add policy for practices to manage their own workflow sessions
*/

CREATE TABLE IF NOT EXISTS patient_workflow_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  current_step text NOT NULL DEFAULT 'consent' CHECK (current_step IN ('consent', 'before_photos', 'after_photos', 'completed')),
  before_photos_completed boolean DEFAULT false,
  after_photos_completed boolean DEFAULT false,
  before_completed_at timestamptz,
  after_completed_at timestamptz,
  workflow_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Ensure one workflow session per patient per practice
  UNIQUE (practice_id, patient_id)
);

ALTER TABLE patient_workflow_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for practices to manage their own workflow sessions
CREATE POLICY "Practices can manage own workflow sessions"
  ON patient_workflow_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM practices
      WHERE practices.id = patient_workflow_sessions.practice_id
      AND practices.id = auth.uid()::uuid
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_practice_id ON patient_workflow_sessions(practice_id);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_patient_id ON patient_workflow_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_current_step ON patient_workflow_sessions(current_step);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_completed ON patient_workflow_sessions(workflow_completed_at);