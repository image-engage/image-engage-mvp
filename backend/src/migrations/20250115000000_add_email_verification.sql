-- Add email_verified column to users table
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Update existing users to have email_verified as true (optional, for existing users)
-- UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;