-- Migration: Create app_settings table for global application settings
-- Run this script in Supabase SQL Editor

BEGIN;

-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.app_settings IS 'Global application settings';

-- Enable Row Level Security (RLS) for app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy for anonymous and authenticated users to read settings
DROP POLICY IF EXISTS "Allow public read access" ON public.app_settings;
CREATE POLICY "Allow public read access" ON public.app_settings
FOR SELECT USING (true);

-- Policy for service_role to manage settings
DROP POLICY IF EXISTS "Allow service_role to manage app_settings" ON public.app_settings;
CREATE POLICY "Allow service_role to manage app_settings" ON public.app_settings
FOR ALL USING (true) WITH CHECK (true);

-- Insert default period display setting ('auto' = automatic based on current month)
-- Use ON CONFLICT DO UPDATE instead of DO NOTHING to ensure it's set
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES ('display_period', 'auto', 'Period to display: "summer", "winter", or "auto" (automatic based on current month)')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description;

COMMIT;

