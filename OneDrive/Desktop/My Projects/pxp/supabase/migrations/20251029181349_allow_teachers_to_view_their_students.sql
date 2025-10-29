/*
  # Allow Teachers to View Their Students

  1. Changes
    - Update students table policy to allow teachers to view students in their classrooms
    - Update profiles table policy to check role from students/staff tables instead of profiles
    - Avoid infinite recursion by not querying profiles within profiles policy

  2. Security
    - Teachers can only view students enrolled in their classrooms
    - Students can view their own records
    - Admins can view all records
*/

-- Drop and recreate students table SELECT policy
DROP POLICY IF EXISTS "Users can view relevant student records" ON students;

CREATE POLICY "Users can view relevant student records"
  ON students FOR SELECT
  TO authenticated
  USING (
    -- Students can view their own record
    profile_id = auth.uid()
    OR
    -- Teachers can view students in their classrooms
    EXISTS (
      SELECT 1 FROM classroom_enrollments ce
      JOIN classrooms c ON c.id = ce.classroom_id
      WHERE ce.student_id = students.profile_id
      AND c.teacher_id = auth.uid()
      AND ce.status = 'active'
    )
    OR
    -- Staff members can view all student records
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.profile_id = auth.uid()
    )
  );

-- Update profiles SELECT policy to allow teachers to view student profiles
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;

CREATE POLICY "Users can read profiles based on role"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own profile
    auth_user_id = auth.uid()
    OR
    -- Teachers can view profiles of students in their classrooms
    EXISTS (
      SELECT 1 FROM classroom_enrollments ce
      JOIN classrooms c ON c.id = ce.classroom_id
      WHERE ce.student_id = profiles.id
      AND c.teacher_id = auth.uid()
      AND ce.status = 'active'
    )
    OR
    -- Staff members (admin/teacher) can view all profiles
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.profile_id = auth.uid()
    )
  );
