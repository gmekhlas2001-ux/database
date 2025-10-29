/*
  # Allow Librarians Full Access to Books Table

  1. Changes
    - Drop existing admin-only policies on books table
    - Create new policies that allow both admins and librarians to manage books
    - Librarians can INSERT, UPDATE, and DELETE books
    - All authenticated users can still view books

  2. Security
    - Maintains RLS protection on books table
    - Only admins and librarians can modify book records
    - All authenticated users can view books
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can insert books" ON books;
DROP POLICY IF EXISTS "Admin can update books" ON books;
DROP POLICY IF EXISTS "Admin can delete books" ON books;

-- Create new policies that include librarians
CREATE POLICY "Admins and librarians can insert books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid()
      AND role_id IN ('admin', 'librarian')
    )
  );

CREATE POLICY "Admins and librarians can update books"
  ON books FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid()
      AND role_id IN ('admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid()
      AND role_id IN ('admin', 'librarian')
    )
  );

CREATE POLICY "Admins and librarians can delete books"
  ON books FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid()
      AND role_id IN ('admin', 'librarian')
    )
  );
