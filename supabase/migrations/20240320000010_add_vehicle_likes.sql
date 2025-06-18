-- Create vehicle_likes table
CREATE TABLE IF NOT EXISTS vehicle_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vehicle_id, user_id)
);

-- Add likes_count column to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_likes_vehicle_id ON vehicle_likes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_likes_user_id ON vehicle_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_likes_created_at ON vehicle_likes(created_at);

-- Enable Row Level Security
ALTER TABLE vehicle_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicle_likes table
-- Users can view all likes
CREATE POLICY "Allow viewing all vehicle likes"
ON vehicle_likes FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own likes
CREATE POLICY "Allow users to like vehicles"
ON vehicle_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Allow users to unlike vehicles"
ON vehicle_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create function to update likes count
CREATE OR REPLACE FUNCTION update_vehicle_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE vehicles 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.vehicle_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE vehicles 
        SET likes_count = likes_count - 1 
        WHERE id = OLD.vehicle_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update likes count
DROP TRIGGER IF EXISTS trigger_update_vehicle_likes_count ON vehicle_likes;
CREATE TRIGGER trigger_update_vehicle_likes_count
    AFTER INSERT OR DELETE ON vehicle_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_likes_count();

-- Initialize likes_count for existing vehicles
UPDATE vehicles 
SET likes_count = (
    SELECT COUNT(*) 
    FROM vehicle_likes 
    WHERE vehicle_likes.vehicle_id = vehicles.id
); 