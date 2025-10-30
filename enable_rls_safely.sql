-- Enable RLS Safely - Only on tables with existing policies
-- This script will enable RLS only after verifying policies exist

-- Step 1: Enable RLS on tables that have policies
-- (We'll run this only after checking the policies exist)

-- For branches table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'branches'
    ) THEN
        ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on branches table';
    ELSE
        RAISE NOTICE 'No policies found for branches table - skipping RLS enable';
    END IF;
END $$;

-- For manager_branches table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'manager_branches'
    ) THEN
        ALTER TABLE public.manager_branches ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on manager_branches table';
    ELSE
        RAISE NOTICE 'No policies found for manager_branches table - skipping RLS enable';
    END IF;
END $$;

-- For managers table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'managers'
    ) THEN
        ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on managers table';
    ELSE
        RAISE NOTICE 'No policies found for managers table - skipping RLS enable';
    END IF;
END $$;

-- For global_messages table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'global_messages'
    ) THEN
        ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on global_messages table';
    ELSE
        RAISE NOTICE 'No policies found for global_messages table - skipping RLS enable';
    END IF;
END $$;

-- For branch_reports table (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'branch_reports'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'branch_reports'
        ) THEN
            ALTER TABLE public.branch_reports ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'RLS enabled on branch_reports table';
        ELSE
            RAISE NOTICE 'No policies found for branch_reports table - skipping RLS enable';
        END IF;
    ELSE
        RAISE NOTICE 'branch_reports table does not exist - skipping';
    END IF;
END $$;

-- For navigation_clicks table (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'navigation_clicks'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'navigation_clicks'
        ) THEN
            ALTER TABLE public.navigation_clicks ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'RLS enabled on navigation_clicks table';
        ELSE
            RAISE NOTICE 'No policies found for navigation_clicks table - skipping RLS enable';
        END IF;
    ELSE
        RAISE NOTICE 'navigation_clicks table does not exist - skipping';
    END IF;
END $$;

-- For app_settings table (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'app_settings'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'app_settings'
        ) THEN
            ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'RLS enabled on app_settings table';
        ELSE
            RAISE NOTICE 'No policies found for app_settings table - skipping RLS enable';
        END IF;
    ELSE
        RAISE NOTICE 'app_settings table does not exist - skipping';
    END IF;
END $$;

-- Final verification
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
