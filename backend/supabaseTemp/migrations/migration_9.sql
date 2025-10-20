-- ============================================
-- Complete Table Creation Script for media_posts
-- Run this in your Supabase SQL Editor
-- ============================================

-- Drop table if exists (BE CAREFUL - this will delete all data)
-- DROP TABLE IF EXISTS media_posts CASCADE;

-- Create the media_posts table
CREATE TABLE IF NOT EXISTS media_posts (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- File information
  file_name text NOT NULL,
  file_path text NOT NULL,
  bucket_name text NOT NULL DEFAULT 'media-uploads',
  
  -- Image/Video URL (publicly accessible)
  image_url text NOT NULL,
  
  -- Social media content
  caption text NOT NULL DEFAULT '',
  hashtags text,
  target_platforms jsonb DEFAULT '["Instagram"]'::jsonb,
  
  -- Media metadata
  media_type text DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
  media_id text,
  permalink text,
  
  -- Status workflow
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'posted')),
  
  -- Error handling
  error_message text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  posted_at timestamptz,
  
  -- Metadata
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_media_posts_status 
ON media_posts(status);

-- Index on created_at for date range queries and sorting
CREATE INDEX IF NOT EXISTS idx_media_posts_created_at 
ON media_posts(created_at DESC);

-- Index on posted_at for posted content queries
CREATE INDEX IF NOT EXISTS idx_media_posts_posted_at 
ON media_posts(posted_at DESC) 
WHERE posted_at IS NOT NULL;

-- Index on media_type for filtering
CREATE INDEX IF NOT EXISTS idx_media_posts_media_type 
ON media_posts(media_type);

-- Full-text search index for captions and file names
CREATE INDEX IF NOT EXISTS idx_media_posts_search 
ON media_posts USING gin(
  to_tsvector('english', coalesce(caption, '') || ' ' || coalesce(file_name, ''))
);

-- GIN index for target_platforms JSONB queries
CREATE INDEX IF NOT EXISTS idx_media_posts_target_platforms 
ON media_posts USING gin(target_platforms);

-- ============================================
-- Triggers for automatic updated_at
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_media_posts_updated_at ON media_posts;
CREATE TRIGGER update_media_posts_updated_at
  BEFORE UPDATE ON media_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE media_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all media posts
CREATE POLICY "Allow authenticated users to read media posts"
ON media_posts
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to insert media posts
CREATE POLICY "Allow authenticated users to insert media posts"
ON media_posts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to update media posts
CREATE POLICY "Allow authenticated users to update media posts"
ON media_posts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to delete media posts
CREATE POLICY "Allow authenticated users to delete media posts"
ON media_posts
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE media_posts IS 'Stores dental practice media posts for social media management and approval workflow';

COMMENT ON COLUMN media_posts.id IS 'Primary key UUID';
COMMENT ON COLUMN media_posts.file_name IS 'Original filename of the uploaded media';
COMMENT ON COLUMN media_posts.file_path IS 'Path to file in storage bucket';
COMMENT ON COLUMN media_posts.bucket_name IS 'Supabase storage bucket name';
COMMENT ON COLUMN media_posts.image_url IS 'Publicly accessible URL for the media file';
COMMENT ON COLUMN media_posts.caption IS 'Social media post caption/description';
COMMENT ON COLUMN media_posts.hashtags IS 'Hashtags for the post (space or comma separated)';
COMMENT ON COLUMN media_posts.target_platforms IS 'Array of social media platforms (Instagram, Facebook, TikTok, YouTube, LinkedIn)';
COMMENT ON COLUMN media_posts.media_type IS 'Type of media: photo or video';
COMMENT ON COLUMN media_posts.media_id IS 'External social media post ID after posting';
COMMENT ON COLUMN media_posts.permalink IS 'Permanent link to the posted content on social media';
COMMENT ON COLUMN media_posts.status IS 'Approval status: pending, approved, declined, or posted';
COMMENT ON COLUMN media_posts.error_message IS 'Error message if posting fails';
COMMENT ON COLUMN media_posts.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN media_posts.posted_at IS 'Timestamp when content was posted to social media';
COMMENT ON COLUMN media_posts.updated_at IS 'Timestamp when record was last updated';

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert sample data (uncomment to use)
/*
INSERT INTO media_posts (
  file_name,
  file_path,
  bucket_name,
  image_url,
  caption,
  hashtags,
  target_platforms,
  media_type,
  status
) VALUES 
(
  'patient_smile_before.jpg',
  'uploads/2024/01/patient_smile_before.jpg',
  'media-uploads',
  'https://your-project.supabase.co/storage/v1/object/public/media-uploads/uploads/2024/01/patient_smile_before.jpg',
  'Amazing transformation! Our patient is thrilled with their new smile. Book your consultation today!',
  '#NewSmile #DentalTransformation #SmileMakeover #CosmeticDentistry',
  '["Instagram", "Facebook"]'::jsonb,
  'photo',
  'pending'
),
(
  'teeth_whitening_after.jpg',
  'uploads/2024/01/teeth_whitening_after.jpg',
  'media-uploads',
  'https://your-project.supabase.co/storage/v1/object/public/media-uploads/uploads/2024/01/teeth_whitening_after.jpg',
  'Teeth whitening results that speak for themselves! ✨',
  '#TeethWhitening #BrightSmile #DentalCare #BeforeAndAfter',
  '["Instagram", "TikTok"]'::jsonb,
  'photo',
  'approved'
);
*/

-- ============================================
-- Verification Queries
-- ============================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'media_posts'
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'media_posts';

-- Check policies
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'media_posts';

-- ============================================
-- Additional Utility Functions
-- ============================================

-- Function to get statistics
CREATE OR REPLACE FUNCTION get_media_posts_stats()
RETURNS TABLE (
  total bigint,
  pending bigint,
  approved bigint,
  declined bigint,
  posted bigint,
  photos bigint,
  videos bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total,
    COUNT(*) FILTER (WHERE status = 'pending')::bigint as pending,
    COUNT(*) FILTER (WHERE status = 'approved')::bigint as approved,
    COUNT(*) FILTER (WHERE status = 'declined')::bigint as declined,
    COUNT(*) FILTER (WHERE status = 'posted')::bigint as posted,
    COUNT(*) FILTER (WHERE media_type = 'photo')::bigint as photos,
    COUNT(*) FILTER (WHERE media_type = 'video')::bigint as videos
  FROM media_posts;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT * FROM get_media_posts_stats();

-- ============================================
-- Grant Permissions (if needed)
-- ============================================

-- Grant all privileges to authenticated users
GRANT ALL ON media_posts TO authenticated;
GRANT ALL ON media_posts TO service_role;

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'media_posts table created successfully!';
  RAISE NOTICE 'Indexes created for optimal performance';
  RAISE NOTICE 'RLS policies enabled for security';
  RAISE NOTICE 'Triggers set up for automatic timestamp updates';
END $$;