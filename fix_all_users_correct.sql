-- Fix all users by adding default habits for everyone
-- This will ensure everyone can see and modify their schedules

-- First, clear existing patterns to avoid conflicts
DELETE FROM recurring_patterns WHERE user_id > 0;

-- Add default habits for ALL users (Mon/Tue/Thu: Office, Wed/Fri: WFH)
INSERT INTO recurring_patterns (user_id, day_of_week, time_period, status, active)
SELECT 
    u.id as user_id,
    dow.day as day_of_week,
    tp.period as time_period,
    CASE 
        WHEN dow.day IN (1, 2, 4) THEN 'WFO'  -- Monday, Tuesday, Thursday
        ELSE 'WFH'  -- Wednesday, Friday
    END as status,
    1 as active
FROM users u
CROSS JOIN (
    SELECT 1 as day UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
) dow
CROSS JOIN (
    SELECT 'AM' as period UNION SELECT 'PM'
) tp
WHERE u.active = 1;