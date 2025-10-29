-- Migration: Fix all branches to have proper working hours
-- This updates ALL branches with working hours, replacing any "closed" or empty hours

BEGIN;

-- Update ALL branches with standard working hours
-- Summer hours: Sunday-Thursday: 06:00-22:00, Friday: 06:00-14:00, Saturday: closed
-- Winter hours: Sunday-Thursday: 06:00-21:00, Friday: 06:00-14:00, Saturday: closed

UPDATE public.branches
SET hours = jsonb_build_object(
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
)
WHERE TRUE;

COMMIT;

-- This updates ALL branches regardless of their current hours status
-- After running this, all branches will have the same standard hours
-- You can then customize specific branches through the admin panel

