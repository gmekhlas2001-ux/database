/*
  # Allow Super Admin to Promote Admins to Super Admin

  1. Changes
    - Update RLS policies to allow super admins to update the is_super_admin flag of other admins
    - Add a new policy for super admins to promote other admins to super admin status

  2. Permission Structure
    - Super Admin: Can set is_super_admin flag on any admin profile
    - Regular Admins: Cannot modify is_super_admin flag
    - All other users: Cannot modify is_super_admin flag

  3. Security Rules
    - Only super admins can promote other admins to super admin
    - Only super admins can demote super admins
    - Super admins can update role_id and is_super_admin fields for admin profiles
*/

-- Drop the existing "Super admin can update any profile" policy
DROP POLICY IF EXISTS "Super admin can update any profile" ON profiles;

-- Recreate the super admin update policy with ability to modify is_super_admin
CREATE POLICY "Super admin can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Ensure that regular admins cannot modify is_super_admin flag or admin roles
DROP POLICY IF EXISTS "Regular admins can update non-admin profiles" ON profiles;

CREATE POLICY "Regular admins can update non-admin profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    is_admin() 
    AND NOT is_super_admin()
    AND role_id != 'admin'
  )
  WITH CHECK (
    is_admin() 
    AND NOT is_super_admin()
    AND role_id != 'admin'
    -- Prevent regular admins from setting is_super_admin
    AND (is_super_admin IS NULL OR is_super_admin = false)
  );

-- Update the users own profile policy to prevent self-promotion
DROP POLICY IF EXISTS "Users can update own non-role fields" ON profiles;

CREATE POLICY "Users can update own non-role fields"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (
    auth_user_id = auth.uid()
    -- Prevent users from changing their own role or super_admin status
    AND role_id = (SELECT role_id FROM profiles WHERE auth_user_id = auth.uid())
    AND (is_super_admin IS NULL OR is_super_admin = (SELECT is_super_admin FROM profiles WHERE auth_user_id = auth.uid()))
  );
