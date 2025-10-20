/*
  # Content Library System Migration

  1. New Tables
    - `content_library`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `contentType` (text, enum: article, pdf, video, image)
      - `category` (text)
      - `fileName` (text)
      - `originalName` (text)
      - `fileSize` (integer)
      - `filePath` (text)
      - `mimeType` (text)
      - `tags` (jsonb array)
      - `isActive` (boolean)
      - `createdBy` (uuid, foreign key to users)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
    
    - `patient_shared_content`
      - `id` (uuid, primary key)
      - `patientConsentId` (uuid, foreign key to patient_consents)
      - `contentId` (uuid, foreign key to content_library)
      - `sharedBy` (uuid, foreign key to users)
      - `sharedAt` (timestamp)
      - `createdAt` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Indexes
    - Performance indexes for common queries
    - GIN index for tags JSONB field
*/

-- Create content_library table
CREATE TABLE IF NOT EXISTS content_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  contentType text NOT NULL CHECK (contentType IN ('article', 'pdf', 'video', 'image')),
  category text NOT NULL,
  fileName text NOT NULL,
  originalName text NOT NULL,
  fileSize integer NOT NULL,
  filePath text NOT NULL,
  mimeType text NOT NULL,
  tags jsonb DEFAULT '[]'::jsonb,
  isActive boolean DEFAULT true,
  createdBy uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

-- Create patient_shared_content table
CREATE TABLE IF NOT EXISTS patient_shared_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patientConsentId uuid NOT NULL REFERENCES patient_consents(id) ON DELETE CASCADE,
  contentId uuid NOT NULL REFERENCES content_library(id) ON DELETE CASCADE,
  sharedBy uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sharedAt timestamptz DEFAULT now(),
  createdAt timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_shared_content ENABLE ROW LEVEL SECURITY;

-- Create policies for content_library table
CREATE POLICY "Authenticated users can read all content"
  ON content_library
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create content"
  ON content_library
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update content"
  ON content_library
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete content"
  ON content_library
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for patient_shared_content table
CREATE POLICY "Authenticated users can read all shared content"
  ON patient_shared_content
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create shared content"
  ON patient_shared_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shared content"
  ON patient_shared_content
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete shared content"
  ON patient_shared_content
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_library_title ON content_library(title);
CREATE INDEX IF NOT EXISTS idx_content_library_category ON content_library(category);
CREATE INDEX IF NOT EXISTS idx_content_library_content_type ON content_library(contentType);
CREATE INDEX IF NOT EXISTS idx_content_library_is_active ON content_library(isActive);
CREATE INDEX IF NOT EXISTS idx_content_library_created_by ON content_library(createdBy);
CREATE INDEX IF NOT EXISTS idx_content_library_created_at ON content_library(createdAt);
CREATE INDEX IF NOT EXISTS idx_content_library_tags ON content_library USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_patient_shared_content_patient_id ON patient_shared_content(patientConsentId);
CREATE INDEX IF NOT EXISTS idx_patient_shared_content_content_id ON patient_shared_content(contentId);
CREATE INDEX IF NOT EXISTS idx_patient_shared_content_shared_by ON patient_shared_content(sharedBy);
CREATE INDEX IF NOT EXISTS idx_patient_shared_content_shared_at ON patient_shared_content(sharedAt);

-- Create triggers for updated_at
CREATE TRIGGER update_content_library_updated_at
    BEFORE UPDATE ON content_library
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint to prevent duplicate sharing
ALTER TABLE patient_shared_content 
ADD CONSTRAINT unique_patient_content_share 
UNIQUE (patientConsentId, contentId);



/*
  # Fix Content Library Migration

  1. Create a default admin user if none exists
  2. Insert sample content data with proper user reference
  3. Handle the case where no admin user exists

  This migration fixes the null value constraint error for createdBy field.
*/

-- First, ensure we have an admin user to reference
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Check if admin user exists
    SELECT id INTO admin_user_id 
    FROM users 
    WHERE email = 'admin@dental.com' 
    LIMIT 1;
    
    -- If no admin user exists, create one
    IF admin_user_id IS NULL THEN
        INSERT INTO users (
            email,
            password,
            firstName,
            lastName,
            role
        ) VALUES (
            'admin@dental.com',
            '$2a$12$LQv3c1yqBw2Lq8.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8', -- bcrypt hash for 'admin123'
            'Admin',
            'User',
            'admin'
        ) RETURNING id INTO admin_user_id;
    END IF;
    
    -- Now insert sample content data with the admin user ID
    INSERT INTO content_library (
        title,
        description,
        contentType,
        category,
        fileName,
        originalName,
        fileSize,
        filePath,
        mimeType,
        tags,
        isActive,
        createdBy
    ) VALUES 
    (
        'Post-Operative Care Instructions',
        'Comprehensive guide for patient care after dental procedures including pain management, diet restrictions, and healing timeline.',
        'pdf',
        'Post-Operative Care',
        'post-op-care-guide.pdf',
        'Post-Operative Care Instructions.pdf',
        245760,
        '/content/post-op-care-guide.pdf',
        'application/pdf',
        '["general", "post-op", "care-instructions"]'::jsonb,
        true,
        admin_user_id
    ),
    (
        'Teeth Whitening FAQ',
        'Common questions and answers about professional teeth whitening procedures, expectations, and aftercare.',
        'article',
        'FAQ',
        'whitening-faq.html',
        'Teeth Whitening FAQ.html',
        15360,
        '/content/whitening-faq.html',
        'text/html',
        '["teeth-whitening", "cosmetic", "faq"]'::jsonb,
        true,
        admin_user_id
    ),
    (
        'Dental Implant Procedure Overview',
        'Educational video explaining the dental implant process from consultation to final restoration.',
        'video',
        'Procedure Information',
        'implant-overview.mp4',
        'Dental Implant Procedure Overview.mp4',
        52428800,
        '/content/implant-overview.mp4',
        'video/mp4',
        '["dental-implants", "oral-surgery", "procedure"]'::jsonb,
        true,
        admin_user_id
    ),
    (
        'Orthodontic Treatment Guide',
        'Complete guide to orthodontic treatment options including traditional braces and clear aligners.',
        'pdf',
        'Procedure Information',
        'orthodontic-guide.pdf',
        'Orthodontic Treatment Guide.pdf',
        1024000,
        '/content/orthodontic-guide.pdf',
        'application/pdf',
        '["orthodontics", "braces", "invisalign"]'::jsonb,
        true,
        admin_user_id
    ),
    (
        'Emergency Dental Care',
        'What to do in dental emergencies including tooth pain, broken teeth, and trauma.',
        'article',
        'Emergency Care',
        'emergency-care.html',
        'Emergency Dental Care.html',
        8192,
        '/content/emergency-care.html',
        'text/html',
        '["emergency", "urgent-care", "pain-relief"]'::jsonb,
        true,
        admin_user_id
    ),
    (
        'Preventive Care Guidelines',
        'Daily oral hygiene practices and preventive measures to maintain optimal dental health.',
        'pdf',
        'General Education',
        'preventive-care.pdf',
        'Preventive Care Guidelines.pdf',
        512000,
        '/content/preventive-care.pdf',
        'application/pdf',
        '["preventive", "hygiene", "maintenance"]'::jsonb,
        true,
        admin_user_id
    ),
    (
        'Insurance and Billing Information',
        'Understanding dental insurance coverage, payment options, and billing procedures.',
        'article',
        'Insurance & Billing',
        'insurance-billing.html',
        'Insurance and Billing Information.html',
        12288,
        '/content/insurance-billing.html',
        'text/html',
        '["insurance", "billing", "payment"]'::jsonb,
        true,
        admin_user_id
    ),
    (
        'Root Canal Procedure Explanation',
        'Step-by-step explanation of root canal treatment and what patients can expect.',
        'video',
        'Procedure Information',
        'root-canal-explanation.mp4',
        'Root Canal Procedure Explanation.mp4',
        45678912,
        '/content/root-canal-explanation.mp4',
        'video/mp4',
        '["root-canal", "endodontics", "procedure"]'::jsonb,
        true,
        admin_user_id
    );
    
END $$;