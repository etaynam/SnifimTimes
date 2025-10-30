-- Verify RLS is working correctly after enabling
-- This script tests that all operations still work

-- 1. Test basic read operations
SELECT 'Testing basic read operations...' as test_phase;

-- Test branches table
SELECT 
    'branches' as table_name,
    COUNT(*) as row_count,
    '✅ Read successful' as status
FROM public.branches
LIMIT 1;

-- Test managers table
SELECT 
    'managers' as table_name,
    COUNT(*) as row_count,
    '✅ Read successful' as status
FROM public.managers
LIMIT 1;

-- Test manager_branches table
SELECT 
    'manager_branches' as table_name,
    COUNT(*) as row_count,
    '✅ Read successful' as status
FROM public.manager_branches
LIMIT 1;

-- Test global_messages table
SELECT 
    'global_messages' as table_name,
    COUNT(*) as row_count,
    '✅ Read successful' as status
FROM public.global_messages
LIMIT 1;

-- 2. Test if we can still insert/update (if needed)
SELECT 'Testing write operations...' as test_phase;

-- Test insert into global_messages (if we have permission)
-- This is just a test - we'll rollback
BEGIN;
INSERT INTO public.global_messages (message, is_active, created_at) 
VALUES ('RLS Test Message - Will be deleted', false, NOW())
ON CONFLICT DO NOTHING;
ROLLBACK;

SELECT '✅ Write test completed (rolled back)' as write_test_status;

-- 3. Show current RLS status
SELECT 'Current RLS Status:' as summary;
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
AND tablename IN ('branches', 'manager_branches', 'managers', 'global_messages', 'branch_reports', 'navigation_clicks', 'app_settings')
ORDER BY tablename;

-- 4. Show active policies
SELECT 'Active RLS Policies:' as summary;
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('branches', 'manager_branches', 'managers', 'global_messages', 'branch_reports', 'navigation_clicks', 'app_settings')
ORDER BY tablename, policyname;
