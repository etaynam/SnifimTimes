-- יצירת טבלת דיווחים על שעות פעילות
CREATE TABLE IF NOT EXISTS branch_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL,
  days TEXT[] NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'closed')),
  closed_reason TEXT,
  closed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- יצירת אינדקסים
CREATE INDEX IF NOT EXISTS idx_branch_reports_branch_id ON branch_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_reports_status ON branch_reports(status);
CREATE INDEX IF NOT EXISTS idx_branch_reports_created_at ON branch_reports(created_at DESC);

-- RLS Policies
ALTER TABLE branch_reports ENABLE ROW LEVEL SECURITY;

-- כל אחד יכול ליצור דיווח (לקוחות)
CREATE POLICY "Anyone can create reports"
  ON branch_reports FOR INSERT
  WITH CHECK (true);

-- כל אחד יכול לצפות בדיווחים שלו (אופציונלי - אפשר להסיר אם לא צריך)
CREATE POLICY "Anyone can view all reports"
  ON branch_reports FOR SELECT
  USING (true);

-- רק אדמינים יכולים לעדכן דיווחים
CREATE POLICY "Admins can update reports"
  ON branch_reports FOR UPDATE
  USING (true);

-- רק אדמינים יכולים למחוק דיווחים
CREATE POLICY "Admins can delete reports"
  ON branch_reports FOR DELETE
  USING (true);

-- פונקציה לעדכון updated_at
CREATE OR REPLACE FUNCTION update_branch_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- טריגר לעדכון updated_at
CREATE TRIGGER update_branch_reports_updated_at_trigger
  BEFORE UPDATE ON branch_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_branch_reports_updated_at();

