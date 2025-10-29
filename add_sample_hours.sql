-- Migration: Add sample hours to all branches
-- This adds example hours so the public interface will show hours data

BEGIN;

-- Update all branches with sample hours structure
-- Summer hours: Sunday-Thursday: 06:00-22:00, Friday: 06:00-14:00, Saturday: closed
-- Winter hours: Sunday-Thursday: 06:00-21:00, Friday: 06:00-14:00, Saturday: closed

-- Create the standard hours structure
WITH sample_hours AS (
  SELECT jsonb_build_object(
    'summer', jsonb_build_object(
      'sun', jsonb_build_object('open', '06:00', 'close', '22:00'),
      'mon', jsonb_build_object('open', '06:00', 'close', '22:00'),
      'tue', jsonb_build_object('open', '06:00', 'close', '22:00'),
      'wed', jsonb_build_object('open', '06:00', 'close', '22:00'),
      'thu', jsonb_build_object('open', '06:00', 'close', '22:00'),
      'fri', jsonb_build_object('open', '06:00', 'close', '14:00'),
      'sat', jsonb_build_object('openSaturday', false)
    ),
    'winter', jsonb_build_object(
      'sun', jsonb_build_object('open', '06:00', 'close', '21:00'),
      'mon', jsonb_build_object('open', '06:00', 'close', '21:00'),
      'tue', jsonb_build_object('open', '06:00', 'close', '21:00'),
      'wed', jsonb_build_object('open', '06:00', 'close', '21:00'),
      'thu', jsonb_build_object('open', '06:00', 'close', '21:00'),
      'fri', jsonb_build_object('open', '06:00', 'close', '14:00'),
      'sat', jsonb_build_object('openSaturday', false)
    )
  ) AS hours_data
)
-- Update branches that don't have proper hours structure
UPDATE public.branches b
SET hours = sh.hours_data
FROM sample_hours sh
WHERE b.hours IS NULL 
   OR b.hours = '{}'::jsonb
   OR NOT (b.hours ? 'summer' OR b.hours ? 'winter')
   OR (b.hours->'summer' IS NULL AND b.hours->'winter' IS NULL);

COMMIT;

-- Note: This adds sample hours to all branches that don't have hours defined
-- You can customize the hours per branch after running this migration

