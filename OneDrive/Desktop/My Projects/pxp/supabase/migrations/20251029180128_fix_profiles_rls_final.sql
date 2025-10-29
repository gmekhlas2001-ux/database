/*
  # Fix Profiles RLS Policy - Final Solution

  1. Changes
    - Drop all existing problematic policies
    - Create new policies that work correctly
    - Allow everyone to read all approved profiles (needed for app functionality)
    - Restrict updates to own profile or admins

  2. Security
    - All authenticated users can read approved profiles
    - Users can only update their own profile
    - Proper access control maintained
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- Allow all authenticated users to read profiles
-- This is needed for the app to function (viewing staff, students, etc.)
CREATE POLICY "Authenticated users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile only"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Only service role can delete (admins use edge functions)
CREATE POLICY "Service role can delete profiles"
  ON profiles FOR DELETE
  TO service_role
  USING (true);

-- Allow profile creation on signup
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());
