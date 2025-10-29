-- Migration: Add city column to branches table
-- This will enable filtering branches by city in the public interface

BEGIN;

-- Add the city column
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Add a comment to explain the column purpose
COMMENT ON COLUMN public.branches.city IS 'City name for filtering branches in public interface';

-- Create an index for faster lookups by city
CREATE INDEX IF NOT EXISTS idx_branches_city ON public.branches(city);

COMMIT;
