/*
  # Update Student Access for Teachers

  1. Changes
    - Allow teachers to view student profiles if the student is enrolled in their classroom
    - Allow teachers to view student records (in students table) for their enrolled students
    - Maintain existing admin access
    - Students can still view their own profiles

  2. Security
    - Teachers can only see students assigned to them through classroom enrollment
    - No modification permissions for teachers on student profiles
    - Admins retain full access
*/

-- Drop existing select policy on students table
DROP POLICY IF EXISTS "Admins can view all students" ON students;
DROP POLICY IF EXISTS "Users can view own student record" ON students;

-- Create new comprehensive select policy for students table
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
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role_id IN ('teacher', 'admin')
        AND profiles.status = 'approved'
      )
    )
    OR
    -- Admins can view all student records
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
      AND profiles.status = 'approved'
    )
  );

-- Update profiles table SELECT policy to allow teachers to view their students
DROP POLICY IF EXISTS "Users can read own profile and admins can read all profiles" ON profiles;

CREATE POLICY "Users can read relevant profiles"
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
      AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role_id IN ('teacher', 'admin')
        AND p.status = 'approved'
      )
    )
    OR
    -- Admins can view all profiles
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
      AND profiles.status = 'approved'
    )
  );
