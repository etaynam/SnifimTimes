-- Fix RLS policies for global_messages table
-- Since the app uses custom auth (not Supabase Auth), we need to allow operations via service_role
-- Security is handled at application level (only admins can access SuperAdmin)

BEGIN;

-- Drop all existing policies
DROP POLICY IF EXISTS "Service role can manage global messages" ON public.global_messages;
DROP POLICY IF EXISTS "Anyone can read active global messages" ON public.global_messages;
DROP POLICY IF EXISTS "Allow public read access" ON public.global_messages;
DROP POLICY IF EXISTS "Allow service_role to manage global messages" ON public.global_messages;
DROP POLICY IF EXISTS "Allow authenticated users to manage global messages" ON public.global_messages;
DROP POLICY IF EXISTS "Authenticated users can read all messages" ON public.global_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.global_messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON public.global_messages;
DROP POLICY IF EXISTS "Authenticated users can delete messages" ON public.global_messages;

-- Since the app doesn't use Supabase Auth (uses custom demo auth),
-- we'll disable RLS for this table. Security is handled at app level.
-- Only admins can access SuperAdmin panel which manages these messages.

ALTER TABLE public.global_messages DISABLE ROW LEVEL SECURITY;

COMMIT;

-- Alternative approach (if you want to keep RLS):
-- Uncomment the code below and comment out the DISABLE ROW LEVEL SECURITY line above

/*
-- Policy 1: Allow anyone to read active messages (for public BranchList)
CREATE POLICY "Anyone can read active global messages" ON public.global_messages
FOR SELECT
USING (is_active = true);

-- Policy 2: Allow service_role to do everything (used by Edge Functions)
CREATE POLICY "Service role can manage messages" ON public.global_messages
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Policy 3: Allow anonymous/anonymous role to read and write (since we use custom auth)
-- This is less secure but necessary when not using Supabase Auth
CREATE POLICY "Allow all operations for anon role" ON public.global_messages
FOR ALL
USING (true)
WITH CHECK (true);
*/

