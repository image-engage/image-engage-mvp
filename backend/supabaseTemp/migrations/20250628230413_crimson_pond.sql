/*
  # Initial Schema for ImageEngage AI

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password` (text)
      - `firstName` (text)
      - `lastName` (text)
      - `role` (text, enum: admin, staff)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
    
    - `patient_consents`
      - `id` (uuid, primary key)
      - `firstName` (text)
      - `lastName` (text)
      - `email` (text)
      - `phone` (text)
      - `procedureType` (text)
      - `notes` (text, optional)
      - `signatureData` (text, optional)
      - `consentDate` (timestamp)
      - `status` (text, enum: pending, completed)
      - `createdBy` (uuid, foreign key to users)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
    
    - `patient_media`
      - `id` (uuid, primary key)
      - `patientConsentId` (uuid, foreign key to patient_consents)
      - `fileName` (text)
      - `originalName` (text)
      - `fileType` (text, enum: image, video)
      - `mediaCategory` (text, enum: before, after)
      - `filePath` (text)
      - `fileSize` (integer)
      - `mimeType` (text)
      - `uploadedBy` (uuid, foreign key to users)
      - `uploadDate` (timestamp)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  firstName text NOT NULL,
  lastName text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

-- Create patient_consents table
CREATE TABLE IF NOT EXISTS patient_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firstName text NOT NULL,
  lastName text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  procedureType text NOT NULL,
  notes text DEFAULT '',
  signatureData text DEFAULT '',
  consentDate timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  createdBy uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

-- Create patient_media table
CREATE TABLE IF NOT EXISTS patient_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patientConsentId uuid NOT NULL REFERENCES patient_consents(id) ON DELETE CASCADE,
  fileName text NOT NULL,
  originalName text NOT NULL,
  fileType text NOT NULL CHECK (fileType IN ('image', 'video')),
  mediaCategory text NOT NULL CHECK (mediaCategory IN ('before', 'after')),
  filePath text NOT NULL,
  fileSize integer NOT NULL,
  mimeType text NOT NULL,
  uploadedBy uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploadDate timestamptz DEFAULT now(),
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_media ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for patient_consents table
CREATE POLICY "Authenticated users can read all consents"
  ON patient_consents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create consents"
  ON patient_consents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update consents"
  ON patient_consents
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete consents"
  ON patient_consents
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for patient_media table
CREATE POLICY "Authenticated users can read all media"
  ON patient_media
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create media"
  ON patient_media
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update media"
  ON patient_media
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete media"
  ON patient_media
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_consents_email ON patient_consents(email);
CREATE INDEX IF NOT EXISTS idx_patient_consents_status ON patient_consents(status);
CREATE INDEX IF NOT EXISTS idx_patient_consents_created_by ON patient_consents(createdBy);
CREATE INDEX IF NOT EXISTS idx_patient_consents_created_at ON patient_consents(createdAt);

CREATE INDEX IF NOT EXISTS idx_patient_media_consent_id ON patient_media(patientConsentId);
CREATE INDEX IF NOT EXISTS idx_patient_media_category ON patient_media(mediaCategory);
CREATE INDEX IF NOT EXISTS idx_patient_media_type ON patient_media(fileType);
CREATE INDEX IF NOT EXISTS idx_patient_media_uploaded_by ON patient_media(uploadedBy);
CREATE INDEX IF NOT EXISTS idx_patient_media_upload_date ON patient_media(uploadDate);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_consents_updated_at
    BEFORE UPDATE ON patient_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_media_updated_at
    BEFORE UPDATE ON patient_media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();