/*
  # Fix RLS Policies for Exams and Teacher Feedback Tables

  ## Changes Made
  
  ### Exams Table Policies
  - Fixed INSERT policy to properly compare profile.id with teacher_id using a subquery to get the profile_id from auth.uid()
  - The issue was comparing auth.uid() (auth_user_id) directly with profiles.id when they should match via auth_user_id
  
  ### Teacher Feedback Table Policies
  - Fixed INSERT policy to properly get student's profile.id from auth.uid()
  - Students can now submit feedback for their teachers
  
  ## Technical Details
  
  The core issue: 
  - `auth.uid()` returns the `auth_user_id` from the auth.users table
  - Tables like `exams` and `teacher_feedback` store foreign keys to `profiles.id`
  - We need to get the profile.id by matching auth.uid() with profiles.auth_user_id
  
  ## Security Notes
  
  1. Teachers/admins can create exams if their profile is approved
  2. Students can submit feedback only for valid teachers
  3. All policies maintain proper authentication and authorization checks
*/

-- Drop existing policies for exams table
DROP POLICY IF EXISTS "Teachers can create exams for their classrooms" ON exams;

-- Create new INSERT policy for exams
CREATE POLICY "Teachers can create exams for their classrooms"
  ON exams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND profiles.role_id IN ('teacher', 'admin')
        AND profiles.status = 'approved'
        AND profiles.id = exams.teacher_id
    )
    OR EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
        AND profiles.status = 'approved'
    )
  );

-- Drop existing INSERT policy for teacher_feedback
DROP POLICY IF EXISTS "Students can submit feedback for teachers" ON teacher_feedback;

-- Create new INSERT policy for teacher_feedback
CREATE POLICY "Students can submit feedback for teachers"
  ON teacher_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND profiles.role_id = 'student'
        AND profiles.status = 'approved'
        AND profiles.id = teacher_feedback.student_id
    )
    AND EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = teacher_feedback.teacher_id
        AND profiles.role_id IN ('teacher', 'admin')
    )
  );