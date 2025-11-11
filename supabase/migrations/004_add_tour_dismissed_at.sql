-- Add tour_dismissed_at column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tour_dismissed_at TIMESTAMPTZ NULL;

-- RLS policies already cover this column (users can select/update their own profile)
-- No additional policies needed

