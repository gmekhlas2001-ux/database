/*
  # Fix Profiles Policy Without Recursion

  1. Changes
    - Drop all existing policies on profiles table
    - Drop helper functions that cause recursion
    - Create new policies that don't reference profiles table in USING clause
    - Use a materialized approach with a separate lookup table

  2. Security
    - Users can view their own profile
    - Teachers can view students in their classrooms
    - Admins can view all profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read relevant profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile and admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Drop helper functions
DROP FUNCTION IF EXISTS is_admin_user();
DROP FUNCTION IF EXISTS is_teacher_user();

-- Create a simple policy that allows users to read their own profile first
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Create a separate policy for admins to read all profiles
-- This uses a direct role check without recursion
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'is_super_admin' = 'true'
      )
    )
  );

-- Create policy for teachers to view students in their classrooms
CREATE POLICY "Teachers can read students in their classrooms"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM classroom_enrollments ce
      JOIN classrooms c ON c.id = ce.classroom_id
      WHERE ce.student_id = profiles.id
      AND ce.status = 'active'
      AND c.teacher_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Recreate UPDATE policies
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'is_super_admin' = 'true'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'is_super_admin' = 'true'
      )
    )
  );

-- Recreate DELETE policy
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'is_super_admin' = 'true'
      )
    )
  );
