-- Add has_seen_tour field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_seen_tour BOOLEAN DEFAULT false;

-- Update existing profiles to default to false (already handled by DEFAULT, but explicit for clarity)
UPDATE profiles 
SET has_seen_tour = false 
WHERE has_seen_tour IS NULL;

