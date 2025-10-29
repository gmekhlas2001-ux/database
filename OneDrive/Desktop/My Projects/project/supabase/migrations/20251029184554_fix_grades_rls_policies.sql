/*
  # Fix Grades Table RLS Policies

  ## Changes Made
  
  ### Grades Table - All Policies
  - Fixed INSERT policy to properly match teacher's profile ID with exams.teacher_id
  - Fixed SELECT policy to properly compare student_id and teacher_id
  - Fixed UPDATE and DELETE policies for proper profile ID matching
  
  ## Technical Details
  
  The core issue:
  - Policies were comparing `exams.teacher_id` (profiles.id) with `auth.uid()` (auth_user_id)
  - Policies were comparing `student_id` (profiles.id) with `auth.uid()` (auth_user_id)
  - Need to join through profiles table to match auth_user_id with profile.id
  
  ## Security Notes
  
  1. Teachers can only add/update/delete grades for their own exams
  2. Students can only view their own grades
  3. Admins have full access to all grades
*/

-- Drop existing policies for grades
DROP POLICY IF EXISTS "Teachers can add grades for their exams" ON grades;
DROP POLICY IF EXISTS "Users can view relevant grades" ON grades;
DROP POLICY IF EXISTS "Teachers can update grades for their exams" ON grades;
DROP POLICY IF EXISTS "Teachers can delete grades for their exams" ON grades;

-- CREATE INSERT policy for grades
CREATE POLICY "Teachers can add grades for their exams"
  ON grades
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM exams
      JOIN profiles ON profiles.id = exams.teacher_id
      WHERE exams.id = grades.exam_id
        AND profiles.auth_user_id = auth.uid()
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

-- CREATE SELECT policy for grades
CREATE POLICY "Users can view relevant grades"
  ON grades
  FOR SELECT
  TO authenticated
  USING (
    -- Students can see their own grades
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND profiles.id = grades.student_id
    )
    OR
    -- Teachers can see grades for their exams
    EXISTS (
      SELECT 1
      FROM exams
      JOIN profiles ON profiles.id = exams.teacher_id
      WHERE exams.id = grades.exam_id
        AND profiles.auth_user_id = auth.uid()
    )
    OR
    -- Admins can see all grades
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
        AND profiles.status = 'approved'
    )
  );

-- CREATE UPDATE policy for grades
CREATE POLICY "Teachers can update grades for their exams"
  ON grades
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM exams
      JOIN profiles ON profiles.id = exams.teacher_id
      WHERE exams.id = grades.exam_id
        AND profiles.auth_user_id = auth.uid()
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
      FROM exams
      JOIN profiles ON profiles.id = exams.teacher_id
      WHERE exams.id = grades.exam_id
        AND profiles.auth_user_id = auth.uid()
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

-- CREATE DELETE policy for grades
CREATE POLICY "Teachers can delete grades for their exams"
  ON grades
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM exams
      JOIN profiles ON profiles.id = exams.teacher_id
      WHERE exams.id = grades.exam_id
        AND profiles.auth_user_id = auth.uid()
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