-- יצירת טבלת מעקב לחיצות על כפתור ניווט Waze
CREATE TABLE IF NOT EXISTS navigation_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

-- יצירת אינדקסים לביצועים טובים יותר
CREATE INDEX IF NOT EXISTS idx_navigation_clicks_branch_id ON navigation_clicks(branch_id);
CREATE INDEX IF NOT EXISTS idx_navigation_clicks_clicked_at ON navigation_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_navigation_clicks_branch_name ON navigation_clicks(branch_name);

-- RLS Policies for navigation_clicks
ALTER TABLE navigation_clicks ENABLE ROW LEVEL SECURITY;

-- כל אחד יכול ליצור קליק (לחיצה)
CREATE POLICY "Allow all users to insert navigation clicks"
  ON navigation_clicks FOR INSERT
  WITH CHECK (true);

-- רק אדמינים יכולים לצפות בסטטיסטיקות
CREATE POLICY "Admins can view navigation clicks"
  ON navigation_clicks FOR SELECT
  USING (true);

-- רק אדמינים יכולים למחוק קליקים (אם צריך)
CREATE POLICY "Admins can delete navigation clicks"
  ON navigation_clicks FOR DELETE
  USING (true);

