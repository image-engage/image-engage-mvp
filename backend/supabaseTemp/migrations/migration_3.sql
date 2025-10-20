/*
  # Review Request System

  1. New Tables
    - `review_settings`
      - `id` (uuid, primary key)
      - `emailEnabled` (boolean)
      - `smsEnabled` (boolean)
      - `emailTemplate` (text)
      - `smsTemplate` (text)
      - `reviewPlatforms` (jsonb)
      - `delayHours` (integer)
      - `createdBy` (uuid, foreign key to users)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
    
    - `review_requests`
      - `id` (uuid, primary key)
      - `patientConsentId` (uuid, foreign key to patient_consents)
      - `requestType` (text, enum: email, sms)
      - `status` (text, enum: sent, clicked, reviewed, failed)
      - `sentAt` (timestamp)
      - `clickedAt` (timestamp, optional)
      - `reviewedAt` (timestamp, optional)
      - `reviewPlatform` (text)
      - `reviewUrl` (text)
      - `messageContent` (text)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create review_settings table
CREATE TABLE IF NOT EXISTS review_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emailEnabled boolean DEFAULT true,
  smsEnabled boolean DEFAULT false,
  emailTemplate text DEFAULT 'Hi {{patientName}}, thank you for choosing our practice! We would love to hear about your experience with your {{procedureType}}. Please take a moment to leave us a review: {{reviewUrl}}',
  smsTemplate text DEFAULT 'Hi {{patientName}}! Thanks for your {{procedureType}} treatment. Please share your experience: {{reviewUrl}}',
  reviewPlatforms jsonb DEFAULT '[
    {"name": "Google Business Profile", "url": "https://g.page/r/YOUR_GOOGLE_PLACE_ID/review", "enabled": true},
    {"name": "Yelp", "url": "https://www.yelp.com/writeareview/biz/YOUR_YELP_ID", "enabled": false},
    {"name": "Facebook", "url": "https://www.facebook.com/YOUR_PAGE/reviews", "enabled": false}
  ]'::jsonb,
  delayHours integer DEFAULT 24,
  createdBy uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

-- Create review_requests table
CREATE TABLE IF NOT EXISTS review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patientConsentId uuid NOT NULL REFERENCES patient_consents(id) ON DELETE CASCADE,
  requestType text NOT NULL CHECK (requestType IN ('email', 'sms')),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'clicked', 'reviewed', 'failed')),
  sentAt timestamptz DEFAULT now(),
  clickedAt timestamptz,
  reviewedAt timestamptz,
  reviewPlatform text NOT NULL,
  reviewUrl text NOT NULL,
  messageContent text NOT NULL,
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE review_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for review_settings table
CREATE POLICY "Authenticated users can read review settings"
  ON review_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create review settings"
  ON review_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update review settings"
  ON review_settings
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete review settings"
  ON review_settings
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for review_requests table
CREATE POLICY "Authenticated users can read all review requests"
  ON review_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create review requests"
  ON review_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update review requests"
  ON review_requests
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete review requests"
  ON review_requests
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_requests_patient_consent_id ON review_requests(patientConsentId);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON review_requests(status);
CREATE INDEX IF NOT EXISTS idx_review_requests_sent_at ON review_requests(sentAt);
CREATE INDEX IF NOT EXISTS idx_review_requests_platform ON review_requests(reviewPlatform);

-- Create triggers for updated_at
CREATE TRIGGER update_review_settings_updated_at
    BEFORE UPDATE ON review_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_requests_updated_at
    BEFORE UPDATE ON review_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();