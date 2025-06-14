-- Add stats column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{"vehicles": 0, "events": 0, "modifications": 0, "photos": 0}'::jsonb; 