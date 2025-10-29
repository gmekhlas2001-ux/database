/*
  # Make Storage Buckets Private

  1. Changes
    - Update documents bucket to be private (not public)
    - Update avatars bucket to be private (not public)
    - Ensure files can only be accessed with proper authentication
    - Files will require signed URLs for access

  2. Security
    - All documents are private by default
    - Access requires authentication
    - Signed URLs expire after a set time
    - Public access is disabled
*/

-- Update documents bucket to be private
UPDATE storage.buckets
SET public = false
WHERE id = 'documents';

-- Update avatars bucket to be private
UPDATE storage.buckets
SET public = false
WHERE id = 'avatars';
