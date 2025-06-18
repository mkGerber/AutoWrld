-- Enable RLS on vehicles table if not already enabled
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow viewing all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow updating vehicle likes count" ON vehicles;

-- Create policy to allow viewing all vehicles
CREATE POLICY "Allow viewing all vehicles"
ON vehicles FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow updating likes_count (needed for the trigger function)
CREATE POLICY "Allow updating vehicle likes count"
ON vehicles FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Also need to ensure the trigger function can run with elevated privileges
-- Create a function that bypasses RLS for the likes count update
CREATE OR REPLACE FUNCTION update_vehicle_likes_count_secure()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger to use the secure function
DROP TRIGGER IF EXISTS trigger_update_vehicle_likes_count ON vehicle_likes;
CREATE TRIGGER trigger_update_vehicle_likes_count
    AFTER INSERT OR DELETE ON vehicle_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_likes_count_secure(); 