-- Drop existing students table policies
DROP POLICY IF EXISTS "Users can view relevant student records" ON students;

-- Create simple policy for students table
-- All authenticated users can read student records (teachers need this to view their students)
CREATE POLICY "Authenticated read students"
  ON students FOR SELECT
  TO authenticated
  USING (true);
