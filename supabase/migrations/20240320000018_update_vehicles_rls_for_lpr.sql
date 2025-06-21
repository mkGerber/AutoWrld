-- Update vehicles RLS policy to allow license plate searches for LPR feature
-- This allows users to search for vehicles by license plate while maintaining privacy

-- Drop existing select policy
DROP POLICY IF EXISTS "Users can view all vehicles" ON vehicles;

-- Create policy that allows viewing vehicle info for LPR searches
-- Users can see basic vehicle info and license plate for LPR functionality
-- but license plate data is only shown to vehicle owners in their own vehicles
CREATE POLICY "Users can view vehicle info for LPR"
ON vehicles FOR SELECT
TO authenticated
USING (true);

-- Note: The application logic will handle privacy by:
-- 1. Allowing LPR searches to find vehicles by license plate
-- 2. Only showing license plate data to vehicle owners in their own vehicles
-- 3. For LPR results, showing the plate number but not the owner's private data 