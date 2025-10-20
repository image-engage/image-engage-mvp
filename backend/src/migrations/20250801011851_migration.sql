-- Create a new table to store business hours, with a one-to-one relationship to practices
CREATE TABLE IF NOT EXISTS business_hours (
  practice_id uuid PRIMARY KEY REFERENCES practices(id),
  hours jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table to store subscription details
CREATE TABLE IF NOT EXISTS subscriptions (
  practice_id uuid PRIMARY KEY REFERENCES practices(id),
  user_id text, -- A reference to the user from your auth service
  customer_id text,
  subscription_id text,
  plan text,
  status text CHECK (status IN ('active', 'inactive', 'trial')),
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Table to store legal agreements and digital signatures
CREATE TABLE IF NOT EXISTS legal_agreements (
  practice_id uuid PRIMARY KEY REFERENCES practices(id),
  terms_accepted boolean DEFAULT false,
  privacy_policy_accepted boolean DEFAULT false,
  hipaa_signature jsonb,
  signed_at timestamptz DEFAULT now()
);

-- Table to store individual social media accounts for each practice
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id),
  platform text NOT NULL, -- e.g., 'instagram', 'facebook', 'tiktok'
  username text,
  page_id text,
  is_connected boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Ensures a practice can only have one account per platform type
  UNIQUE (practice_id, platform)
);

-- SQL script to alter the existing `practices` table to the new schema
ALTER TABLE practices
-- Ensure RLS is enabled on the table before trying to drop a policy
ENABLE ROW LEVEL SECURITY;

ALTER TABLE practices
-- Drop columns that are now in separate tables or handled by auth
DROP COLUMN IF EXISTS password_hash,
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS social_media,
-- Add new columns and change data types
ADD COLUMN IF NOT EXISTS website_url text,
ALTER COLUMN address TYPE jsonb USING address::jsonb;

-- Remove the old policy and recreate a new one
DROP POLICY IF EXISTS "Practices can manage own data" ON practices;
CREATE POLICY "Practices can manage own data"
  ON practices
  FOR ALL
  TO authenticated
  USING (auth.uid()::uuid = id);

---

-- Add RLS to the new tables to secure the data
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business hours can manage own data"
  ON business_hours
  FOR ALL
  TO authenticated
  USING (auth.uid()::uuid = practice_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subscriptions can manage own data"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid()::uuid = practice_id);

ALTER TABLE legal_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Legal agreements can manage own data"
  ON legal_agreements
  FOR ALL
  TO authenticated
  USING (auth.uid()::uuid = practice_id);

ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Social media can manage own data"
  ON social_media_accounts
  FOR ALL
  TO authenticated
  USING (auth.uid()::uuid = practice_id);
