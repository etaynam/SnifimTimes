-- Test RLS Functionality After Enabling
-- This script tests that all operations still work after enabling RLS

-- Test 1: Check if we can still read from branches table
SELECT COUNT(*) as total_branches FROM public.branches;

-- Test 2: Check if we can still read from managers table  
SELECT COUNT(*) as total_managers FROM public.managers;

-- Test 3: Check if we can still read from manager_branches table
SELECT COUNT(*) as total_manager_branches FROM public.manager_branches;

-- Test 4: Check if we can still read from global_messages table
SELECT COUNT(*) as total_global_messages FROM public.global_messages;

-- Test 5: Verify RLS policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('branches', 'manager_branches', 'managers', 'global_messages')
ORDER BY tablename, policyname;
