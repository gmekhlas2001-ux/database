/*
  # Create Exams, Grades, and Feedback System

  1. New Tables
    - `exams`
      - `id` (uuid, primary key)
      - `classroom_id` (uuid, references classrooms)
      - `teacher_id` (uuid, references profiles)
      - `name` (text)
      - `description` (text, nullable)
      - `exam_date` (date)
      - `total_marks` (integer, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `grades`
      - `id` (uuid, primary key)
      - `exam_id` (uuid, references exams)
      - `student_id` (uuid, references profiles)
      - `marks_obtained` (numeric)
      - `percentage` (numeric, nullable)
      - `grade` (text, nullable)
      - `remarks` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `teacher_feedback`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, references profiles)
      - `student_id` (uuid, references profiles)
      - `classroom_id` (uuid, references classrooms, nullable)
      - `rating` (integer, 1-5)
      - `feedback_text` (text)
      - `created_at` (timestamptz)
      - `is_anonymous` (boolean, default true)

  2. Security
    - Enable RLS on all tables
    - Teachers can create exams for their classrooms
    - Teachers can add/update grades for students in their classrooms
    - Students can view their own grades only
    - Students can submit feedback for teachers
    - Only admins can view feedback
    - Teachers cannot see feedback about themselves
*/

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  exam_date date NOT NULL,
  total_marks integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  marks_obtained numeric NOT NULL CHECK (marks_obtained >= 0),
  percentage numeric,
  grade text,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Create teacher_feedback table
CREATE TABLE IF NOT EXISTS teacher_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  classroom_id uuid REFERENCES classrooms(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text text NOT NULL,
  is_anonymous boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teacher_feedback ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exams_classroom_id ON exams(classroom_id);
CREATE INDEX IF NOT EXISTS idx_exams_teacher_id ON exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_exam_id ON grades(exam_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_feedback_teacher_id ON teacher_feedback(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_feedback_student_id ON teacher_feedback(student_id);

-- Create function to calculate percentage
CREATE OR REPLACE FUNCTION calculate_percentage()
RETURNS TRIGGER AS $$
DECLARE
  exam_total_marks integer;
BEGIN
  SELECT total_marks INTO exam_total_marks FROM exams WHERE id = NEW.exam_id;
  
  IF exam_total_marks > 0 THEN
    NEW.percentage := (NEW.marks_obtained / exam_total_marks::numeric) * 100;
  ELSE
    NEW.percentage := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate percentage
DROP TRIGGER IF EXISTS calculate_grade_percentage ON grades;
CREATE TRIGGER calculate_grade_percentage
  BEFORE INSERT OR UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION calculate_percentage();

-- RLS Policies for exams table

-- Teachers can create exams for their own classrooms
CREATE POLICY "Teachers can create exams for their classrooms"
  ON exams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN ('teacher', 'admin')
      AND profiles.status = 'approved'
    )
    AND (
      teacher_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.auth_user_id = auth.uid()
        AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
        AND profiles.status = 'approved'
      )
    )
  );

-- Teachers can view exams for their classrooms, students can view exams they're enrolled in
CREATE POLICY "Users can view relevant exams"
  ON exams FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM classroom_enrollments
      WHERE classroom_enrollments.classroom_id = exams.classroom_id
      AND classroom_enrollments.student_id = auth.uid()
      AND classroom_enrollments.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
      AND profiles.status = 'approved'
    )
  );

-- Teachers can update their own exams, admins can update all
CREATE POLICY "Teachers can update own exams, admins can update all"
  ON exams FOR UPDATE
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
      AND profiles.status = 'approved'
    )
  )
  WITH CHECK (
    teacher_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
      AND profiles.status = 'approved'
    )
  );

-- Teachers can delete their own exams, admins can delete all
CREATE POLICY "Teachers can delete own exams, admins can delete all"
  ON exams FOR DELETE
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
      AND profiles.status = 'approved'
    )
  );

-- RLS Policies for grades table

-- Teachers can add grades for students in their exams
CREATE POLICY "Teachers can add grades for their exams"
  ON grades FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_id
      AND (
        exams.teacher_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.auth_user_id = auth.uid()
          AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
          AND profiles.status = 'approved'
        )
      )
    )
  );

-- Students can view only their own grades, teachers can view grades for their exams
CREATE POLICY "Users can view relevant grades"
  ON grades FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_id
      AND exams.teacher_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
      AND profiles.status = 'approved'
    )
  );

-- Teachers can update grades for their exams, admins can update all
CREATE POLICY "Teachers can update grades for their exams"
  ON grades FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_id
      AND (
        exams.teacher_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.auth_user_id = auth.uid()
          AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
          AND profiles.status = 'approved'
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_id
      AND (
        exams.teacher_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.auth_user_id = auth.uid()
          AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
          AND profiles.status = 'approved'
        )
      )
    )
  );

-- Teachers can delete grades for their exams, admins can delete all
CREATE POLICY "Teachers can delete grades for their exams"
  ON grades FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_id
      AND (
        exams.teacher_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.auth_user_id = auth.uid()
          AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
          AND profiles.status = 'approved'
        )
      )
    )
  );

-- RLS Policies for teacher_feedback table

-- Students can submit feedback for their teachers
CREATE POLICY "Students can submit feedback for teachers"
  ON teacher_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id = 'student'
      AND profiles.status = 'approved'
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = teacher_id
      AND profiles.role_id IN ('teacher', 'admin')
    )
  );

-- Only admins can view feedback
CREATE POLICY "Only admins can view feedback"
  ON teacher_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
      AND profiles.status = 'approved'
    )
  );

-- Admins can update feedback
CREATE POLICY "Admins can update feedback"
  ON teacher_feedback FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
      AND profiles.status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
      AND profiles.status = 'approved'
    )
  );

-- Admins can delete feedback
CREATE POLICY "Admins can delete feedback"
  ON teacher_feedback FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND (profiles.role_id = 'admin' OR profiles.is_super_admin = true)
      AND profiles.status = 'approved'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_exams_updated_at ON exams;
CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grades_updated_at ON grades;
CREATE TRIGGER update_grades_updated_at
  BEFORE UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
