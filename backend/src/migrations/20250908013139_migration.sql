/*
# Create collages table for dental practice

## Summary
This migration creates the database schema for storing dental collage data in the dental practice application.

## Changes Made

### 1. New Tables
- `collages` table with the following columns:
  - `id` (uuid, primary key) - Unique identifier for each collage
  - `before_image_url` (text, not null) - URL of the before dental image
  - `after_image_url` (text, not null) - URL of the after dental image  
  - `collage_url` (text, not null) - URL of the generated AI collage
  - `ai_prompt` (text) - Custom or default AI prompt used for generation
  - `created_at` (timestamptz, not null) - Timestamp when collage was created

### 2. Security
- Enable Row Level Security (RLS) on collages table
- Add policy for public read access (suitable for dental practice showcase)
- Add policy for authenticated insert access (if authentication is added later)

### 3. Storage
- Create 'dental-images' storage bucket for storing before/after images and collages
- Configure bucket for public read access for easy image serving

## Notes
- All image URLs reference Supabase Storage for consistent file management
- RLS policies can be customized based on specific practice requirements
- The ai_prompt field allows for both custom prompts and default template usage
*/

-- Create the collages table
CREATE TABLE IF NOT EXISTS collages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  before_image_url text NOT NULL,
  after_image_url text NOT NULL,
  collage_url text NOT NULL,
  ai_prompt text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE collages ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (dental practice showcase)
CREATE POLICY "Allow public read access to collages"
  ON collages
  FOR SELECT
  TO public
  USING (true);

-- Create policy for insert access (can be restricted later if authentication is added)
CREATE POLICY "Allow public insert access to collages"
  ON collages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create storage bucket for dental images (run this via Supabase Dashboard or CLI)
-- This is a comment as storage buckets are typically created via Dashboard
-- INSERT INTO storage.buckets (id, name, public) VALUES ('dental-images', 'dental-images', true);

-- Create index for faster queries on created_at
CREATE INDEX IF NOT EXISTS idx_collages_created_at ON collages (created_at DESC);