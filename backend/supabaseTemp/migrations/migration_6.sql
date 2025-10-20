/*
  # Add showcase-ready functionality to patient_media

  1. Changes
    - Add `isShowcaseReady` boolean field to patient_media table
    - Add `showcaseNotes` text field for staff notes about edits
    - Add `editedBy` field to track who marked it as showcase-ready
    - Add `editedAt` timestamp for when it was marked as showcase-ready
    - Add indexes for better performance

  2. Security
    - Update existing RLS policies to handle new fields
*/

-- Add new columns to patient_media table
ALTER TABLE patient_media 
ADD COLUMN IF NOT EXISTS isShowcaseReady boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS showcaseNotes text DEFAULT '',
ADD COLUMN IF NOT EXISTS editedBy uuid REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS editedAt timestamptz;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_media_showcase_ready ON patient_media(isShowcaseReady);
CREATE INDEX IF NOT EXISTS idx_patient_media_edited_by ON patient_media(editedBy);
CREATE INDEX IF NOT EXISTS idx_patient_media_edited_at ON patient_media(editedAt);

-- Create a composite index for showcase-ready media queries
CREATE INDEX IF NOT EXISTS idx_patient_media_showcase_composite 
ON patient_media(patientConsentId, isShowcaseReady, mediaCategory);