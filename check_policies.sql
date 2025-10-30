-- Check existing RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('branches', 'manager_branches', 'managers', 'global_messages')
ORDER BY tablename, policyname;
