-- טבלת סניפים
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_number TEXT,
  name TEXT NOT NULL,
  address TEXT,
  format TEXT,
  summer_opening TIME,
  summer_closing TIME,
  winter_opening TIME,
  winter_closing TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- טבלת מנהלים
CREATE TABLE managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- טבלת שיוך מנהלים לסניפים
CREATE TABLE manager_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID REFERENCES managers(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(manager_id, branch_id)
);

-- RLS Policies
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_branches ENABLE ROW LEVEL SECURITY;

-- מדיניות ל-branches
CREATE POLICY "Users can view all branches"
  ON branches FOR SELECT
  USING (true);

-- מדיניות ל-managers
CREATE POLICY "Users can view managers"
  ON managers FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert managers"
  ON managers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update managers"
  ON managers FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete managers"
  ON managers FOR DELETE
  USING (true);

-- מדיניות ל-manager_branches
CREATE POLICY "Managers can view their branches"
  ON manager_branches FOR SELECT
  USING (
    manager_id IN (
      SELECT id FROM managers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage assignments"
  ON manager_branches FOR ALL
  USING (true);

-- פונקציה לעדכון updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- טריגרים לעדכון otomaticי של updated_at
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_managers_updated_at BEFORE UPDATE ON managers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

