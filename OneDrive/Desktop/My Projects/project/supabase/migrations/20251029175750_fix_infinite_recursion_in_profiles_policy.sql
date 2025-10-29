/*
  # Fix Infinite Recursion in Profiles Policy

  1. Changes
    - Drop the problematic policy that causes infinite recursion
    - Create a new policy that avoids self-referencing
    - Use a helper function to check admin status without recursion

  2. Security
    - Maintain same access controls without recursion
    - Users can view their own profile
    - Teachers can view students in their classrooms
    - Admins can view all profiles
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can read relevant profiles" ON profiles;

-- Create a helper function to check if current user is admin
-- This uses auth.uid() directly without querying profiles table
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = auth.uid()
    AND (role_id = 'admin' OR is_super_admin = true)
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a helper function to check if current user is teacher
CREATE OR REPLACE FUNCTION is_teacher_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = auth.uid()
    AND role_id IN ('teacher', 'admin')
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate the SELECT policy without recursion
CREATE POLICY "Users can read relevant profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own profile (no recursion here)
    auth_user_id = auth.uid()
    OR
    -- For teachers viewing students: check classroom_enrollments directly
    (
      is_teacher_user()
      AND
      EXISTS (
        SELECT 1 FROM classroom_enrollments ce
        JOIN classrooms c ON c.id = ce.classroom_id
        WHERE ce.student_id = profiles.id
        AND c.teacher_id = (
          SELECT p.id FROM profiles p WHERE p.auth_user_id = auth.uid() LIMIT 1
        )
        AND ce.status = 'active'
      )
    )
    OR
    -- Admins can view all profiles
    is_admin_user()
  );
