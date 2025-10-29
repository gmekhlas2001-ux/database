/*
  # Simple Profiles Policy Without Recursion

  1. Changes
    - Drop all existing policies
    - Create minimal policies that avoid recursion
    - Use only auth_user_id checks for basic access

  2. Security
    - Users can read and update their own profile
    - Basic access control without complex checks
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can read students in their classrooms" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Simple SELECT policy: users can read their own profile ONLY
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Simple UPDATE policy: users can update their own profile ONLY
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Simple DELETE policy: only allow via service role (admins use backend)
CREATE POLICY "Service role can delete profiles"
  ON profiles FOR DELETE
  TO service_role
  USING (true);
