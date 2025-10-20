/*
  # Add missing foreign key relationships

  This migration adds the foreign key relationships that Supabase is expecting
  to resolve the schema cache error.
*/

-- Add foreign key constraint from patient_workflow_sessions to patients
ALTER TABLE patient_workflow_sessions 
ADD CONSTRAINT fk_workflow_patient 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- Add foreign key constraint from patient_workflow_sessions to practices  
ALTER TABLE patient_workflow_sessions 
ADD CONSTRAINT fk_workflow_practice 
FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE CASCADE;

-- Add foreign key constraint from photo_sessions to patients
ALTER TABLE photo_sessions 
ADD CONSTRAINT fk_photo_patient 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- Add foreign key constraint from photo_sessions to practices
ALTER TABLE photo_sessions 
ADD CONSTRAINT fk_photo_practice 
FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE CASCADE;