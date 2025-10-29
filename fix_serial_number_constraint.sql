-- Fix: Remove unique constraint to allow multiple branches with serial_number = '0'
-- You're okay with multiple '0' values, so we just remove the constraint

BEGIN;

-- Drop the existing unique constraint
ALTER TABLE public.branches 
DROP CONSTRAINT IF EXISTS unique_branch_serial_number;

COMMIT;

-- Now multiple branches can have serial_number = '0'
-- No uniqueness constraint on serial_number anymore
