-- Update vehicle_wishlist RLS policy to allow viewing all wishlist items
-- This allows users to see wishlist items when viewing someone else's vehicle

-- Drop the existing view policy
DROP POLICY IF EXISTS "Users can view wishlist items for vehicles they own" ON vehicle_wishlist;

-- Create new policy that allows viewing all wishlist items
CREATE POLICY "Users can view all wishlist items"
ON vehicle_wishlist FOR SELECT
TO authenticated
USING (true);

-- Keep the existing policies for other operations (insert, update, delete)
-- (These should already exist from the previous migration) 