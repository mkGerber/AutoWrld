-- Fix vehicle_likes table - ensure it exists with correct structure and policies
-- This migration will recreate the table if there are any issues

-- Drop existing table and recreate it
DROP TABLE IF EXISTS vehicle_likes CASCADE;

-- Create vehicle_likes table
CREATE TABLE vehicle_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vehicle_id, user_id)
);

-- Add likes_count column to vehicles table if it doesn't exist
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_likes_vehicle_id ON vehicle_likes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_likes_user_id ON vehicle_likes(user_id);

-- Enable RLS
ALTER TABLE vehicle_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow viewing all vehicle likes" ON vehicle_likes;
DROP POLICY IF EXISTS "Allow users to like vehicles" ON vehicle_likes;
DROP POLICY IF EXISTS "Allow users to unlike vehicles" ON vehicle_likes;

-- Create policies for vehicle_likes table
CREATE POLICY "Allow viewing all vehicle likes"
ON vehicle_likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to like vehicles"
ON vehicle_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to unlike vehicles"
ON vehicle_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Ensure vehicles table has the correct policies
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow viewing all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow updating vehicle likes count" ON vehicles;

CREATE POLICY "Allow viewing all vehicles"
ON vehicles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow updating vehicle likes count"
ON vehicles FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true); 