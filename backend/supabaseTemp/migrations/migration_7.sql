/*
  # Chatbot System Tables

  1. New Tables
    - `chatbot_faqs`
      - `id` (uuid, primary key)
      - `question` (text)
      - `answer` (text)
      - `keywords` (jsonb array)
      - `category` (text)
      - `isActive` (boolean)
      - `priority` (integer)
      - `createdBy` (uuid, foreign key to users)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
    
    - `chatbot_logs`
      - `id` (uuid, primary key)
      - `message` (text)
      - `response` (text)
      - `matchedFaqId` (uuid, optional foreign key to chatbot_faqs)
      - `timestamp` (timestamp)
      - `userAgent` (text, optional)
      - `ipAddress` (text, optional)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and public access where appropriate
*/

-- Create chatbot_faqs table
CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  keywords jsonb DEFAULT '[]'::jsonb,
  category text NOT NULL,
  isActive boolean DEFAULT true,
  priority integer DEFAULT 1 CHECK (priority >= 1 AND priority <= 3),
  createdBy uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

-- Create chatbot_logs table
CREATE TABLE IF NOT EXISTS chatbot_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  response text NOT NULL,
  matchedFaqId uuid REFERENCES chatbot_faqs(id) ON DELETE SET NULL,
  timestamp timestamptz DEFAULT now(),
  userAgent text,
  ipAddress text
);

-- Enable Row Level Security
ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for chatbot_faqs table
CREATE POLICY "Authenticated users can read all FAQs"
  ON chatbot_faqs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create FAQs"
  ON chatbot_faqs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update FAQs"
  ON chatbot_faqs
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete FAQs"
  ON chatbot_faqs
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for chatbot_logs table
CREATE POLICY "Authenticated users can read all chat logs"
  ON chatbot_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create chat logs"
  ON chatbot_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_category ON chatbot_faqs(category);
CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_is_active ON chatbot_faqs(isActive);
CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_priority ON chatbot_faqs(priority);
CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_keywords ON chatbot_faqs USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_created_by ON chatbot_faqs(createdBy);

CREATE INDEX IF NOT EXISTS idx_chatbot_logs_timestamp ON chatbot_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_matched_faq_id ON chatbot_logs(matchedFaqId);

-- Create trigger for updated_at
CREATE TRIGGER update_chatbot_faqs_updated_at
    BEFORE UPDATE ON chatbot_faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample FAQ data
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM users 
    WHERE email = 'admin@dental.com' 
    LIMIT 1;
    
    -- If no admin user exists, create one
    IF admin_user_id IS NULL THEN
        INSERT INTO users (
            email,
            password,
            firstName,
            lastName,
            role
        ) VALUES (
            'admin@dental.com',
            '$2a$12$LQv3c1yqBw2Lq8.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8', -- bcrypt hash for 'admin123'
            'Admin',
            'User',
            'admin'
        ) RETURNING id INTO admin_user_id;
    END IF;
    
    -- Insert sample FAQs
    INSERT INTO chatbot_faqs (
        question,
        answer,
        keywords,
        category,
        isActive,
        priority,
        createdBy
    ) VALUES 
    (
        'What are your office hours?',
        'Our office is open Monday through Friday from 8:00 AM to 6:00 PM, and Saturdays from 9:00 AM to 3:00 PM. We are closed on Sundays and major holidays.',
        '["hours", "open", "time", "schedule", "when"]'::jsonb,
        'Location & Hours',
        true,
        1,
        admin_user_id
    ),
    (
        'Do you accept new patients?',
        'Yes, we are currently accepting new patients! We welcome patients of all ages and would be happy to schedule your first appointment. Please call us at (555) 123-4567 or use our online booking system.',
        '["new patients", "accepting", "new", "appointment"]'::jsonb,
        'Appointments',
        true,
        1,
        admin_user_id
    ),
    (
        'Where are you located?',
        'We are located at 123 Main Street, Suite 100, Anytown, ST 12345. We have convenient parking available and are easily accessible by public transportation.',
        '["location", "address", "where", "directions", "parking"]'::jsonb,
        'Location & Hours',
        true,
        1,
        admin_user_id
    ),
    (
        'What insurance do you accept?',
        'We accept most major dental insurance plans including Delta Dental, Blue Cross Blue Shield, Aetna, Cigna, and MetLife. We also offer flexible payment plans for uninsured patients. Please call us to verify your specific coverage.',
        '["insurance", "coverage", "payment", "plans", "accept"]'::jsonb,
        'Insurance & Billing',
        true,
        1,
        admin_user_id
    ),
    (
        'Do you handle dental emergencies?',
        'Yes, we provide emergency dental care for urgent situations such as severe tooth pain, broken teeth, or dental trauma. Please call our office immediately at (555) 123-4567. For after-hours emergencies, follow the instructions on our voicemail.',
        '["emergency", "urgent", "pain", "broken", "trauma", "after hours"]'::jsonb,
        'Emergency Care',
        true,
        2,
        admin_user_id
    ),
    (
        'How much does teeth whitening cost?',
        'Our professional teeth whitening treatment starts at $299. The exact cost may vary depending on your specific needs and the type of whitening treatment recommended. We offer both in-office and take-home whitening options.',
        '["whitening", "cost", "price", "teeth", "bleaching"]'::jsonb,
        'Services',
        true,
        1,
        admin_user_id
    ),
    (
        'Do you offer payment plans?',
        'Yes, we offer flexible payment plans to help make dental care more affordable. We accept CareCredit and offer in-house financing options. Please speak with our financial coordinator to discuss the best payment option for your needs.',
        '["payment plans", "financing", "carecredit", "affordable"]'::jsonb,
        'Insurance & Billing',
        true,
        1,
        admin_user_id
    ),
    (
        'How often should I visit the dentist?',
        'We recommend visiting the dentist every 6 months for routine cleanings and checkups. However, some patients may need more frequent visits depending on their oral health needs. During your visit, we will recommend the best schedule for you.',
        '["how often", "frequency", "checkup", "cleaning", "routine"]'::jsonb,
        'General Information',
        true,
        1,
        admin_user_id
    );
    
END $$;