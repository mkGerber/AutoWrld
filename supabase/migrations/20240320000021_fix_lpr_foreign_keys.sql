-- Fix foreign key relationships for LPR invites
-- Ensure proper relationships exist between lpr_invites and profiles tables

-- First, let's check if the profiles table exists and has the right structure
-- If not, we'll create it
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  stats JSONB DEFAULT '{"vehicles": 0, "events": 0, "modifications": 0, "photos": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow viewing all profiles (needed for LPR functionality)
DROP POLICY IF EXISTS "Allow viewing all profiles" ON profiles;
CREATE POLICY "Allow viewing all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow users to update their own profile
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
CREATE POLICY "Allow users to update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
CREATE POLICY "Allow users to insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Now let's ensure the lpr_invites table has proper foreign key constraints
-- Drop existing constraints if they exist
ALTER TABLE lpr_invites DROP CONSTRAINT IF EXISTS lpr_invites_sender_id_fkey;
ALTER TABLE lpr_invites DROP CONSTRAINT IF EXISTS lpr_invites_recipient_id_fkey;

-- Add proper foreign key constraints
ALTER TABLE lpr_invites 
ADD CONSTRAINT lpr_invites_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE lpr_invites 
ADD CONSTRAINT lpr_invites_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Also ensure vehicles table has proper foreign key to profiles
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS fk_vehicles_user;
ALTER TABLE vehicles 
ADD CONSTRAINT fk_vehicles_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update LPR invites RLS policies to allow users to see invites matching their license plates
DROP POLICY IF EXISTS "Users can view their LPR invites" ON lpr_invites;
CREATE POLICY "Users can view their LPR invites"
ON lpr_invites FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid() OR 
  recipient_id = auth.uid() OR
  license_plate IN (
    SELECT license_plate FROM vehicles WHERE user_id = auth.uid() AND license_plate IS NOT NULL
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email); 