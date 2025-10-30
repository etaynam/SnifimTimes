-- Final RLS Verification - Check all tables are properly secured
-- This should resolve all Supabase security warnings

-- 1. Check RLS status for all tables
SELECT 
    'RLS Status Check' as check_type,
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

-- 2. Check policies for all tables
SELECT 
    'Policy Check' as check_type,
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

-- 3. Test read access to all tables
SELECT 'branches' as table_name, COUNT(*) as row_count FROM public.branches
UNION ALL
SELECT 'manager_branches' as table_name, COUNT(*) as row_count FROM public.manager_branches
UNION ALL
SELECT 'managers' as table_name, COUNT(*) as row_count FROM public.managers
UNION ALL
SELECT 'global_messages' as table_name, COUNT(*) as row_count FROM public.global_messages
UNION ALL
SELECT 'branch_reports' as table_name, COUNT(*) as row_count FROM public.branch_reports
UNION ALL
SELECT 'navigation_clicks' as table_name, COUNT(*) as row_count FROM public.navigation_clicks
UNION ALL
SELECT 'app_settings' as table_name, COUNT(*) as row_count FROM public.app_settings
ORDER BY table_name;

-- 4. Summary
SELECT 
    'SUMMARY' as info,
    'All tables should now have RLS enabled with proper policies' as message,
    'Check Supabase dashboard for security warnings' as next_step;
