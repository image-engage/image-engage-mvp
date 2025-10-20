-- Create session_tokens table for QR code security
CREATE TABLE IF NOT EXISTS session_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    practice_id VARCHAR(255) NOT NULL,
    created_by VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_session_tokens_token ON session_tokens(session_token);
CREATE INDEX IF NOT EXISTS idx_session_tokens_expires ON session_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_session_tokens_practice ON session_tokens(practice_id);

-- Add cleanup function for expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM session_tokens 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;