-- הפשטת מדיניות RLS לעבודה מהירה
-- הפעל את זה ב-SQL Editor של Supabase

-- הסר את כל ה-policies הקיימים
DROP POLICY IF EXISTS "Users can view all branches" ON branches;
DROP POLICY IF EXISTS "Users can view managers" ON managers;
DROP POLICY IF EXISTS "Admins can manage managers" ON managers;
DROP POLICY IF EXISTS "Admins can insert managers" ON managers;
DROP POLICY IF EXISTS "Admins can update managers" ON managers;
DROP POLICY IF EXISTS "Admins can delete managers" ON managers;
DROP POLICY IF EXISTS "Managers can view their branches" ON manager_branches;
DROP POLICY IF EXISTS "Admins can manage assignments" ON manager_branches;

-- הוסף כתובות לטבלת branches אם חסרה
ALTER TABLE branches ADD COLUMN IF NOT EXISTS branch_number TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS address TEXT;

-- מדיניות פשוטה - כל אחד יכול לקרוא ולכתוב (לפיתוח)
CREATE POLICY "Allow all on branches" ON branches
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on managers" ON managers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on manager_branches" ON manager_branches
  FOR ALL USING (true) WITH CHECK (true);

