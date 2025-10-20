/*
  # Create practices table

  1. New Tables
    - `practices`
      - `id` (uuid, primary key)
      - `name` (text, practice name)
      - `email` (text, unique, for authentication)
      - `password_hash` (text, hashed password)
      - `phone` (text, optional)
      - `address` (text, optional)
      - `logo_url` (text, optional, Google Drive URL)
      - `branding_colors` (jsonb, color scheme)
      - `social_media` (jsonb, social media handles)
      - `google_drive_folder_id` (text, root folder ID in Google Drive)
      - `google_refresh_token` (text, encrypted refresh token)
      - `subscription_status` (text, active/inactive/trial)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `practices` table
    - Add policy for practices to manage their own data
*/

CREATE TABLE IF NOT EXISTS practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  phone text,
  address text,
  logo_url text,
  branding_colors jsonb DEFAULT '{"primary": "#3B82F6", "secondary": "#14B8A6", "accent": "#F97316"}',
  social_media jsonb DEFAULT '{}',
  google_drive_folder_id text,
  google_refresh_token text,
  subscription_status text DEFAULT 'trial' CHECK (subscription_status IN ('active', 'inactive', 'trial')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE practices ENABLE ROW LEVEL SECURITY;

-- Policy for practices to manage their own data
CREATE POLICY "Practices can manage own data"
  ON practices
  FOR ALL
  TO authenticated
  USING (auth.uid()::uuid = id); -- <-- CHANGE IS HERE: Cast to UUID

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_practices_email ON practices(email);