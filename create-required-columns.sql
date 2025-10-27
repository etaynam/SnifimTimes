-- Add missing columns if they don't exist
ALTER TABLE branches ADD COLUMN IF NOT EXISTS hours JSONB DEFAULT '{}';
ALTER TABLE branches ADD COLUMN IF NOT EXISTS branch_number TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE managers ADD COLUMN IF NOT EXISTS name TEXT;

