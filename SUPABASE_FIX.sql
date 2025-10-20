-- Run this SQL in your Supabase SQL editor to fix the schema cache error

-- First, check if foreign key constraints already exist
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint 
WHERE contype = 'f' 
AND (conrelid::regclass::text = 'patient_workflow_sessions' OR conrelid::regclass::text = 'photo_sessions');

-- Add missing foreign key constraints (ignore errors if they already exist)
DO $$ 
BEGIN
    -- Add foreign key from patient_workflow_sessions to patients
    BEGIN
        ALTER TABLE patient_workflow_sessions 
        ADD CONSTRAINT fk_workflow_patient 
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
    EXCEPTION 
        WHEN duplicate_object THEN NULL;
    END;

    -- Add foreign key from patient_workflow_sessions to practices
    BEGIN
        ALTER TABLE patient_workflow_sessions 
        ADD CONSTRAINT fk_workflow_practice 
        FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE CASCADE;
    EXCEPTION 
        WHEN duplicate_object THEN NULL;
    END;

    -- Add foreign key from photo_sessions to patients
    BEGIN
        ALTER TABLE photo_sessions 
        ADD CONSTRAINT fk_photo_patient 
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
    EXCEPTION 
        WHEN duplicate_object THEN NULL;
    END;

    -- Add foreign key from photo_sessions to practices
    BEGIN
        ALTER TABLE photo_sessions 
        ADD CONSTRAINT fk_photo_practice 
        FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE CASCADE;
    EXCEPTION 
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Force Supabase to reload schema cache
NOTIFY pgrst, 'reload schema';