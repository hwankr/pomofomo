-- Add study_start_time column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_start_time TIMESTAMPTZ;

-- Update fabronjeon@gmail.com to admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'fabronjeon@gmail.com';
