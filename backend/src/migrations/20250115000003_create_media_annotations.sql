-- Create media_annotations table for storing category and notes
CREATE TABLE IF NOT EXISTS media_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id VARCHAR(255) NOT NULL,
    practice_id UUID NOT NULL,
    category VARCHAR(50) DEFAULT 'other',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(media_id, practice_id)
);