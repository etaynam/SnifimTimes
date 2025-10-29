-- Migration: Add phone column to branches table
-- This adds a phone number column for branch contact information

BEGIN;

-- Add the phone column
ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add a comment to explain the column purpose
COMMENT ON COLUMN public.branches.phone IS 'Phone number for branch contact';

-- Update existing branches with a default phone if NULL (optional - you can remove this if you prefer)
-- UPDATE public.branches
-- SET phone = NULL
-- WHERE phone IS NULL;

COMMIT;

-- Note: After running this migration, you can update phone numbers for each branch
-- through the admin panel or directly in the Supabase dashboard

