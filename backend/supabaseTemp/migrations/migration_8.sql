/*
  # Appointment Booking System

  1. New Tables
    - `appointment_slots`
      - `id` (uuid, primary key)
      - `date` (date)
      - `startTime` (time)
      - `endTime` (time)
      - `isAvailable` (boolean)
      - `appointmentType` (text)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
    
    - `appointments`
      - `id` (uuid, primary key)
      - `patientName` (text)
      - `patientEmail` (text)
      - `patientPhone` (text)
      - `appointmentDate` (date)
      - `appointmentTime` (time)
      - `appointmentType` (text)
      - `status` (text: pending, confirmed, cancelled, completed)
      - `notes` (text)
      - `source` (text: chatbot, phone, online, walk-in)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and public booking
*/

-- Create appointment_slots table
CREATE TABLE IF NOT EXISTS appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  startTime time NOT NULL,
  endTime time NOT NULL,
  isAvailable boolean DEFAULT true,
  appointmentType text DEFAULT 'consultation' CHECK (appointmentType IN ('consultation', 'cleaning', 'checkup', 'emergency', 'procedure')),
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patientName text NOT NULL,
  patientEmail text NOT NULL,
  patientPhone text NOT NULL,
  appointmentDate date NOT NULL,
  appointmentTime time NOT NULL,
  appointmentType text NOT NULL CHECK (appointmentType IN ('consultation', 'cleaning', 'checkup', 'emergency', 'procedure')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text DEFAULT '',
  source text DEFAULT 'chatbot' CHECK (source IN ('chatbot', 'phone', 'online', 'walk-in')),
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment_slots table
CREATE POLICY "Anyone can read available appointment slots"
  ON appointment_slots
  FOR SELECT
  TO anon, authenticated
  USING (isAvailable = true);

CREATE POLICY "Authenticated users can manage appointment slots"
  ON appointment_slots
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for appointments table
CREATE POLICY "Authenticated users can read all appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create appointments"
  ON appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete appointments"
  ON appointments
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointment_slots_date ON appointment_slots(date);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_available ON appointment_slots(isAvailable);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_type ON appointment_slots(appointmentType);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointmentDate);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments(patientEmail);
CREATE INDEX IF NOT EXISTS idx_appointments_source ON appointments(source);

-- Create triggers for updated_at
CREATE TRIGGER update_appointment_slots_updated_at
    BEFORE UPDATE ON appointment_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample appointment slots for the next 30 days
DO $$
DECLARE
    current_date date := CURRENT_DATE;
    end_date date := CURRENT_DATE + INTERVAL '30 days';
    slot_date date;
    slot_time time;
BEGIN
    -- Generate slots for weekdays (Monday-Friday) from 8 AM to 5 PM
    WHILE current_date <= end_date LOOP
        -- Only create slots for weekdays (Monday = 1, Sunday = 0)
        IF EXTRACT(DOW FROM current_date) BETWEEN 1 AND 5 THEN
            -- Create hourly slots from 8 AM to 5 PM
            FOR hour IN 8..16 LOOP
                INSERT INTO appointment_slots (date, startTime, endTime, appointmentType, isAvailable)
                VALUES (
                    current_date,
                    (hour || ':00:00')::time,
                    ((hour + 1) || ':00:00')::time,
                    'consultation',
                    true
                );
            END LOOP;
        END IF;
        
        -- Also create Saturday morning slots (9 AM to 2 PM)
        IF EXTRACT(DOW FROM current_date) = 6 THEN
            FOR hour IN 9..13 LOOP
                INSERT INTO appointment_slots (date, startTime, endTime, appointmentType, isAvailable)
                VALUES (
                    current_date,
                    (hour || ':00:00')::time,
                    ((hour + 1) || ':00:00')::time,
                    'consultation',
                    true
                );
            END LOOP;
        END IF;
        
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
END $$;