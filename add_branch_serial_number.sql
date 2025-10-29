-- Migration: Add serial_number column to branches table
-- This will help link branches to WordPress posts

-- Add the serial_number column
ALTER TABLE public.branches 
ADD COLUMN serial_number VARCHAR(20);

-- Add a comment to explain the column purpose
COMMENT ON COLUMN public.branches.serial_number IS 'Serial number to link branch with WordPress post';

-- Create an index for faster lookups by serial number
CREATE INDEX idx_branches_serial_number ON public.branches(serial_number);

-- Update existing branches with their current branch_number as serial_number
-- (You can modify these values as needed)
UPDATE public.branches 
SET serial_number = branch_number 
WHERE serial_number IS NULL;

-- Make serial_number NOT NULL after setting default values
ALTER TABLE public.branches 
ALTER COLUMN serial_number SET NOT NULL;

-- Add a unique constraint to ensure each serial number is unique
ALTER TABLE public.branches 
ADD CONSTRAINT unique_branch_serial_number UNIQUE (serial_number);
