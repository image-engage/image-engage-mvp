-- This is a SQL migration file for Supabase.
-- It refactors the database schema to support multiple users per practice.

-- Step 1: Remove user-specific columns from the 'practices' table.
-- These columns will be moved to the new 'users' table.
ALTER TABLE practices
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS password_hash;

-- Step 2: Create the new 'users' table.
-- This table will store individual user accounts and link them to a practice.
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique ID for each user. Consider linking to Supabase Auth's user ID if using it.
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE, -- Foreign key linking user to their practice (organization).
  email text UNIQUE NOT NULL, -- User's login email, must be unique across all users.
  password_hash text NOT NULL, -- Hashed password for the user.
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'owner')), -- User's role within the practice.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create an index for faster email lookups on the 'users' table.
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Step 3: Update Row Level Security (RLS) policies.

-- Drop the old policy on 'practices' that assumed 'practices.id' was 'auth.uid()'.
DROP POLICY IF EXISTS "Practices can manage own data" ON practices;

-- New RLS Policy for 'practices' table:
-- Allows authenticated users to manage (read, insert, update, delete) practice data
-- IF they belong to that practice AND have the 'admin' role.
-- Adjust 'admin' role check as per your application's requirements.
CREATE POLICY "Practice admins can manage their practice data"
  ON practices
  FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users AS u -- Changed alias from current_user to u to resolve syntax error
      WHERE u.id = auth.uid()::uuid -- The logged-in user's ID matches a user record
        AND u.practice_id = practices.id -- The user belongs to this specific practice
        AND u.role = 'admin' -- Only users with 'admin' role can manage practice data
    )
  );

-- Enable RLS on the new 'users' table.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy for 'users' table:
-- Allows authenticated users to view/manage their own user profile.
CREATE POLICY "Users can manage own profile"
  ON users
  FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
  TO authenticated
  USING (auth.uid()::uuid = id); -- User ID from auth token must match the row's ID

-- RLS Policy for 'users' table:
-- Allows authenticated 'admin' users to manage (read, insert, update, delete) other users
-- within their own practice.
CREATE POLICY "Admins can manage users in their practice"
  ON users
  FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users AS admin_user -- Alias the users table for the admin checking
      WHERE admin_user.id = auth.uid()::uuid -- The logged-in user
        AND admin_user.role = 'admin'        -- Is an admin
        AND admin_user.practice_id = users.practice_id -- And belongs to the same practice as the user being accessed
    )
  );