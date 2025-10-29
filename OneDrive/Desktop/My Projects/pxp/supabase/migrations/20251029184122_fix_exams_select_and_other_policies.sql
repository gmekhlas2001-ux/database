/*
  # Fix Exams SELECT, UPDATE, and DELETE RLS Policies

  ## Changes Made
  
  ### Exams Table - SELECT Policy
  - Fixed to properly compare profile IDs with teacher_id and student_id
  - Teachers can see their own exams
  - Students can see exams from classrooms they're actively enrolled in
  - Admins can see all exams
  
  ### Exams Table - UPDATE and DELETE Policies  
  - Fixed to properly match teacher_id with the authenticated user's profile ID
  - Admins can update/delete all exams
  
  ### Classroom Enrollments - SELECT Policy
  - Ensure students use profiles.id not auth.uid() for enrollment checks
  
  ## Technical Details
  
  The core fix:
  - Changed `teacher_id = auth.uid()` to match via profiles.auth_user_id
  - Changed `classroom_enrollments.student_id = auth.uid()` to proper profile ID matching
  
  ## Security Notes
  
  1. Teachers can only see and modify their own exams
  2. Students can only see exams from their active classroom enrollments
  3. Admins have full access
*/

-- Drop and recreate SELECT policy for exams
DROP POLICY IF EXISTS "Users can view relevant exams" ON exams;

CREATE POLICY "Users can view relevant exams"
  ON exams
  FOR SELECT
  TO authenticated
  USING (
    -- Teachers can see their own exams
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND profiles.id = exams.teacher_id
    )
    OR
    -- Students can see exams from their enrolled classrooms
    EXISTS (
      SELECT 1
      FROM classroom_enrollments
      JOIN profiles ON profiles.id = classroom_enrollments.student_id
      WHERE classroom_enrollments.classroom_id = exams.classroom_id
        AND profiles.auth_user_id = auth.uid()
        AND classroom_enrollments.status = 'active'
    )
    OR
    -- Admins can see all exams
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
        AND profiles.status = 'approved'
    )
  );

-- Drop and recreate UPDATE policy for exams
DROP POLICY IF EXISTS "Teachers can update own exams, admins can update all" ON exams;

CREATE POLICY "Teachers can update own exams, admins can update all"
  ON exams
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND profiles.id = exams.teacher_id
    )
    OR
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
        AND profiles.status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND profiles.id = exams.teacher_id
    )
    OR
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
        AND profiles.status = 'approved'
    )
  );

-- Drop and recreate DELETE policy for exams
DROP POLICY IF EXISTS "Teachers can delete own exams, admins can delete all" ON exams;

CREATE POLICY "Teachers can delete own exams, admins can delete all"
  ON exams
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND profiles.id = exams.teacher_id
    )
    OR
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
        AND profiles.status = 'approved'
    )
  );