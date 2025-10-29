-- Migration: Add message columns to branches table
-- This adds ability to display messages for specific branches or global messages

BEGIN;

-- Add branch-specific message column
ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS branch_message TEXT;

-- Add a comment to explain the column purpose
COMMENT ON COLUMN public.branches.branch_message IS 'Message to display for this specific branch (shown at bottom of branch card)';

-- Add global messages table (for messages that appear above all branches)
CREATE TABLE IF NOT EXISTS public.global_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add a comment to explain the table purpose
COMMENT ON TABLE public.global_messages IS 'Global messages to display above all branch cards';

-- Add index for active messages
CREATE INDEX IF NOT EXISTS idx_global_messages_active ON public.global_messages(is_active) WHERE is_active = true;

-- Enable RLS on global_messages
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow service_role to manage messages
CREATE POLICY "Service role can manage global messages"
  ON public.global_messages
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy to allow authenticated users to read active messages
CREATE POLICY "Anyone can read active global messages"
  ON public.global_messages
  FOR SELECT
  USING (is_active = true);

COMMIT;

-- Note: After running this migration:
-- 1. Branch-specific messages can be added/updated via the admin panel
-- 2. Global messages can be inserted directly into global_messages table
--    Example: INSERT INTO public.global_messages (message, is_active) VALUES ('הודעה כללית', true);

