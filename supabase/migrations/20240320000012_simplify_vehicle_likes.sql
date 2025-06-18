-- Remove the trigger-based approach and simplify
DROP TRIGGER IF EXISTS trigger_update_vehicle_likes_count ON vehicle_likes;
DROP FUNCTION IF EXISTS update_vehicle_likes_count();
DROP FUNCTION IF EXISTS update_vehicle_likes_count_secure();

-- Keep the basic table structure and policies
-- The likes count will be updated directly in the application code
-- This is more reliable and easier to debug

-- Ensure the vehicle_likes table exists with proper structure
CREATE TABLE IF NOT EXISTS vehicle_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vehicle_id, user_id)
);

-- Ensure likes_count column exists
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_vehicle_likes_vehicle_id ON vehicle_likes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_likes_user_id ON vehicle_likes(user_id);

-- Enable RLS
ALTER TABLE vehicle_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for vehicle_likes
DROP POLICY IF EXISTS "Allow viewing all vehicle likes" ON vehicle_likes;
DROP POLICY IF EXISTS "Allow users to like vehicles" ON vehicle_likes;
DROP POLICY IF EXISTS "Allow users to unlike vehicles" ON vehicle_likes;

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

-- Drop and recreate policies for vehicles
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

-- Initialize likes_count for existing vehicles
UPDATE vehicles 
SET likes_count = (
    SELECT COUNT(*) 
    FROM vehicle_likes 
    WHERE vehicle_likes.vehicle_id = vehicles.id
); 