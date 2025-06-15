-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own vehicles" ON vehicles;
 
-- Create new policy to allow viewing all vehicles
CREATE POLICY "Allow viewing all vehicles"
ON vehicles FOR SELECT
TO authenticated
USING (true); 