-- Fix RLS for global_messages table
-- This table needs RLS enabled and proper policies

-- 1. First, let's check if global_messages has any policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'global_messages';

-- 2. If no policies exist, create them
-- Create policies for global_messages if they don't exist
DO $$
BEGIN
    -- Check if policies exist for global_messages
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'global_messages'
    ) THEN
        -- Create policies for global_messages
        CREATE POLICY "Allow public read access" ON public.global_messages
        FOR SELECT USING (true);
        
        CREATE POLICY "Allow service_role to manage global_messages" ON public.global_messages
        FOR ALL USING (true);
        
        RAISE NOTICE 'Created RLS policies for global_messages table';
    ELSE
        RAISE NOTICE 'RLS policies already exist for global_messages table';
    END IF;
END $$;

-- 3. Enable RLS on global_messages
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;

-- 4. Verify the fix
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'global_messages';

-- 5. Show the policies for global_messages
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'global_messages'
ORDER BY policyname;

-- 6. Test that we can still read from global_messages
SELECT 
    'global_messages' as table_name,
    COUNT(*) as row_count,
    '✅ Read successful' as status
FROM public.global_messages;