-- הוסף עמודת hours לטבלת branches
ALTER TABLE branches ADD COLUMN IF NOT EXISTS hours JSONB DEFAULT '{}';

-- הערה: שדה ה-hours יכיל את המבנה הבא:
-- {
--   "summer": {
--     "sun": { "open": "08:00", "close": "20:00" },
--     "mon": { "open": "08:00", "close": "20:00" },
--     "tue": { "open": "08:00", "close": "20:00" },
--     "wed": { "open": "08:00", "close": "20:00" },
--     "thu": { "open": "08:00", "close": "20:00" },
--     "fri": { "open": "08:00", "close": "14:00" },
--     "sat": { "open": "", "close": "", "openSaturday": false }
--   },
--   "winter": {
--     "sun": { "open": "08:00", "close": "19:00" },
--     "mon": { "open": "08:00", "close": "19:00" },
--     "tue": { "open": "08:00", "close": "19:00" },
--     "wed": { "open": "08:00", "close": "19:00" },
--     "thu": { "open": "08:00", "close": "19:00" },
--     "fri": { "open": "08:00", "close": "14:00" },
--     "sat": { "open": "", "close": "", "openSaturday": false }
--   }
-- }

