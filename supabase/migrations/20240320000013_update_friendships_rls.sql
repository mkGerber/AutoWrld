-- Update friendships RLS policy to allow viewing all accepted friendships
-- This allows users to see all friends when viewing someone else's profile

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;

-- Create new policy that allows viewing all accepted friendships
CREATE POLICY "Users can view all accepted friendships"
ON friendships FOR SELECT
TO authenticated
USING (
    status = 'accepted'
);

-- Keep the existing policies for other operations
-- (The other policies should already exist from the previous migration) 