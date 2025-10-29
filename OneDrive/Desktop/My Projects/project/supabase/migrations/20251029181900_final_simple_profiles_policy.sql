-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can read profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON profiles;
DROP POLICY IF EXISTS "Service role can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Simple SELECT policy: all authenticated users can read all profiles
CREATE POLICY "All authenticated read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- UPDATE policy: users can only update their own profile
CREATE POLICY "Update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- INSERT policy: users can create their own profile
CREATE POLICY "Insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- DELETE policy: only service role
CREATE POLICY "Service role delete"
  ON profiles FOR DELETE
  TO service_role
  USING (true);
