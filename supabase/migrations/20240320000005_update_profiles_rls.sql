-- Drop existing policy
DROP POLICY IF EXISTS "Allow select for own profile" ON profiles;

-- Create new policy to allow viewing all profiles
CREATE POLICY "Allow viewing all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true); 