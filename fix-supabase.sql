-- הרץ את זה ב-SQL Editor של Supabase

-- תחילה, הוסף את העמודות אם חסרות
ALTER TABLE branches ADD COLUMN IF NOT EXISTS branch_number TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE managers ADD COLUMN IF NOT EXISTS name TEXT;

-- הסר את ה-UNIQUE מ-phone אם קיים
ALTER TABLE managers DROP CONSTRAINT IF EXISTS managers_phone_key;

-- עדכן managers כך ש-user_id יהיה nullable
ALTER TABLE managers ALTER COLUMN user_id DROP NOT NULL;

-- הסר את כל ה-RLS policies הקיימים
DROP POLICY IF EXISTS "Users can view all branches" ON branches;
DROP POLICY IF EXISTS "Users can view managers" ON managers;
DROP POLICY IF EXISTS "Admins can manage managers" ON managers;
DROP POLICY IF EXISTS "Admins can insert managers" ON managers;
DROP POLICY IF EXISTS "Admins can update managers" ON managers;
DROP POLICY IF EXISTS "Admins can delete managers" ON managers;
DROP POLICY IF EXISTS "Managers can view their branches" ON manager_branches;
DROP POLICY IF EXISTS "Admins can manage assignments" ON manager_branches;
DROP POLICY IF EXISTS "Allow all on branches" ON branches;
DROP POLICY IF EXISTS "Allow all on managers" ON managers;
DROP POLICY IF EXISTS "Allow all on manager_branches" ON manager_branches;

-- כבה RLS זמנית
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE managers DISABLE ROW LEVEL SECURITY;
ALTER TABLE manager_branches DISABLE ROW LEVEL SECURITY;

