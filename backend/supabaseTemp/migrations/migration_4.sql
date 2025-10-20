/*
  # Add shareable links table

  1. New Tables
    - `shareable_links`
      - `id` (uuid, primary key)
      - `patientConsentId` (uuid, foreign key to patient_consents)
      - `token` (text, unique)
      - `expiresAt` (timestamp)
      - `selectedMedia` (jsonb array of media IDs)
      - `isActive` (boolean)
      - `createdBy` (uuid, foreign key to users)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)

  2. Security
    - Enable RLS on shareable_links table
    - Add policies for authenticated users
*/

-- Create shareable_links table
CREATE TABLE IF NOT EXISTS shareable_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patientConsentId uuid NOT NULL REFERENCES patient_consents(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expiresAt timestamptz NOT NULL,
  selectedMedia jsonb NOT NULL DEFAULT '[]'::jsonb,
  isActive boolean NOT NULL DEFAULT true,
  createdBy uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE shareable_links ENABLE ROW LEVEL SECURITY;

-- Create policies for shareable_links table
CREATE POLICY "Authenticated users can read all shareable links"
  ON shareable_links
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create shareable links"
  ON shareable_links
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shareable links"
  ON shareable_links
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete shareable links"
  ON shareable_links
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shareable_links_token ON shareable_links(token);
CREATE INDEX IF NOT EXISTS idx_shareable_links_patient_consent_id ON shareable_links(patientConsentId);
CREATE INDEX IF NOT EXISTS idx_shareable_links_expires_at ON shareable_links(expiresAt);
CREATE INDEX IF NOT EXISTS idx_shareable_links_is_active ON shareable_links(isActive);
CREATE INDEX IF NOT EXISTS idx_shareable_links_created_by ON shareable_links(createdBy);

-- Create trigger for updated_at
CREATE TRIGGER update_shareable_links_updated_at
    BEFORE UPDATE ON shareable_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();