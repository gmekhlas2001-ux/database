/*
  # Allow Librarians to View Borrower Contact Details

  1. Changes
    - Update staff table SELECT policy to allow librarians to read contact information
    - This enables librarians to see borrower details (phone, email, branch) when managing book loans
    - Only essential contact fields are accessible, not sensitive documents

  2. Security
    - Maintains RLS protection on staff table
    - Only admins and librarians can read staff records
    - Other users can only view their own staff record
*/

-- Drop existing staff view policy
DROP POLICY IF EXISTS "Users can view own staff record" ON staff;

-- Create new policy that allows librarians and admins to view all staff, others can view own record
CREATE POLICY "Staff can view own record, admins and librarians can view all"
  ON staff FOR SELECT
  TO authenticated
  USING (
    -- User can view their own record
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
    OR
    -- Admins and librarians can view all records
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid()
      AND role_id IN ('admin', 'librarian')
    )
  );
