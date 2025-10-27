-- Disable RLS temporarily for development
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE managers DISABLE ROW LEVEL SECURITY;
ALTER TABLE manager_branches DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all branches" ON branches;
DROP POLICY IF EXISTS "Users can view managers" ON managers;
DROP POLICY IF EXISTS "Managers can view their branches" ON manager_branches;
DROP POLICY IF EXISTS "Admins can manage assignments" ON manager_branches;

-- Add new simple policies
CREATE POLICY "Allow all operations on branches"
  ON branches FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on managers"
  ON managers FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on manager_branches"
  ON manager_branches FOR ALL
  USING (true);

-- Enable RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_branches ENABLE ROW LEVEL SECURITY;

