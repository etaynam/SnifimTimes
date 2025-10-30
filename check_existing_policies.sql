-- Comprehensive Check of Existing RLS Policies and Table Status
-- Run this first to understand the current state before enabling RLS

-- 1. Check current RLS status on all tables
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

-- 2. Check existing RLS policies for each table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('branches', 'manager_branches', 'managers', 'global_messages', 'branch_reports', 'navigation_clicks', 'app_settings')
ORDER BY tablename, policyname;

-- 3. Check if tables have any data (to ensure they exist)
SELECT 
    'branches' as table_name, 
    COUNT(*) as row_count 
FROM public.branches
UNION ALL
SELECT 
    'manager_branches' as table_name, 
    COUNT(*) as row_count 
FROM public.manager_branches
UNION ALL
SELECT 
    'managers' as table_name, 
    COUNT(*) as row_count 
FROM public.managers
UNION ALL
SELECT 
    'global_messages' as table_name, 
    COUNT(*) as row_count 
FROM public.global_messages
UNION ALL
SELECT 
    'branch_reports' as table_name, 
    COUNT(*) as row_count 
FROM public.branch_reports
UNION ALL
SELECT 
    'navigation_clicks' as table_name, 
    COUNT(*) as row_count 
FROM public.navigation_clicks
UNION ALL
SELECT 
    'app_settings' as table_name, 
    COUNT(*) as row_count 
FROM public.app_settings
ORDER BY table_name;

-- 4. Check table permissions for public role
SELECT 
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND grantee = 'public'
AND table_name IN ('branches', 'manager_branches', 'managers', 'global_messages', 'branch_reports', 'navigation_clicks', 'app_settings')
ORDER BY table_name, privilege_type;
