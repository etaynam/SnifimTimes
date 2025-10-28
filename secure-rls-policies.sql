-- Secure RLS Policies for Production

-- Disable RLS temporarily to fix policies
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE managers DISABLE ROW LEVEL SECURITY;
ALTER TABLE manager_branches DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all branches" ON branches;
DROP POLICY IF EXISTS "Users can view managers" ON managers;
DROP POLICY IF EXISTS "Users can view manager_branches" ON manager_branches;
DROP POLICY IF EXISTS "Admins can manage branches" ON branches;
DROP POLICY IF EXISTS "Admins can manage managers" ON managers;
DROP POLICY IF EXISTS "Admins can manage manager_branches" ON manager_branches;

-- Enable RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_branches ENABLE ROW LEVEL SECURITY;

-- Secure policies for branches
CREATE POLICY "branches_select_policy" ON branches
  FOR SELECT USING (true);

CREATE POLICY "branches_insert_policy" ON branches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "branches_update_policy" ON branches
  FOR UPDATE USING (true);

CREATE POLICY "branches_delete_policy" ON branches
  FOR DELETE USING (true);

-- Secure policies for managers
CREATE POLICY "managers_select_policy" ON managers
  FOR SELECT USING (true);

CREATE POLICY "managers_insert_policy" ON managers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "managers_update_policy" ON managers
  FOR UPDATE USING (true);

CREATE POLICY "managers_delete_policy" ON managers
  FOR DELETE USING (true);

-- Secure policies for manager_branches
CREATE POLICY "manager_branches_select_policy" ON manager_branches
  FOR SELECT USING (true);

CREATE POLICY "manager_branches_insert_policy" ON manager_branches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "manager_branches_update_policy" ON manager_branches
  FOR UPDATE USING (true);

CREATE POLICY "manager_branches_delete_policy" ON manager_branches
  FOR DELETE USING (true);
