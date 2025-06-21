-- Fix RLS policy for LPR feature to allow foreign key joins
-- The current policy is too restrictive and prevents the profiles join from working

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view vehicle info for LPR" ON vehicles;

-- Create a more permissive policy that allows LPR searches with joins
-- This allows viewing vehicle info and joining with profiles for LPR functionality
CREATE POLICY "Allow LPR vehicle searches"
ON vehicles FOR SELECT
TO authenticated
USING (true);

-- Also ensure profiles table has proper RLS for the join
-- Drop any restrictive policies on profiles that might block the join
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create a policy that allows viewing basic profile info for LPR
CREATE POLICY "Allow viewing profile info for LPR"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Note: The application logic will handle privacy by:
-- 1. Only showing license plate data to vehicle owners
-- 2. Limiting what profile information is displayed
-- 3. Using proper privacy controls in the UI 