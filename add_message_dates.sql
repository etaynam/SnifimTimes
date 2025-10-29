-- Migration: Add start_date and end_date to global_messages and branches.branch_message
-- This allows automatic scheduling of messages

BEGIN;

-- Add start_date and end_date to global_messages table
ALTER TABLE public.global_messages
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.global_messages.start_date IS 'Date and time when the message should start showing (NULL = show immediately)';
COMMENT ON COLUMN public.global_messages.end_date IS 'Date and time when the message should stop showing (NULL = show indefinitely)';

-- Add start_date and end_date to branches.branch_message (for branch-specific messages)
-- Since branch_message is TEXT, we'll use separate columns for dates
ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS branch_message_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS branch_message_end_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.branches.branch_message_start_date IS 'Date and time when the branch message should start showing (NULL = show immediately)';
COMMENT ON COLUMN public.branches.branch_message_end_date IS 'Date and time when the branch message should stop showing (NULL = show indefinitely)';

COMMIT;

