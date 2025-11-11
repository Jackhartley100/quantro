-- Add monthly_net_goal column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS monthly_net_goal NUMERIC NULL;

-- RLS policies already cover this column (users can select/update their own profile)
-- No additional policies needed

