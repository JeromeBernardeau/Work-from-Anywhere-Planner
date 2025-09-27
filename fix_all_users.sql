-- Fix all users by adding default habits for everyone
-- This will ensure everyone can see and modify their schedules

-- Add default habits for ALL users (Mon/Tue/Thu: Office, Wed/Fri: WFH)
INSERT OR IGNORE INTO recurring_patterns (user_id, day_of_week, time_period, status, active)
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

-- Also add some initial schedule entries for the current week for all users
INSERT OR IGNORE INTO work_schedules (user_id, date, time_period, status)
SELECT 
    u.id as user_id,
    date('2025-09-27', 'weekday ' || dow.offset) as date,
    tp.period as time_period,
    CASE 
        WHEN strftime('%w', date('2025-09-27', 'weekday ' || dow.offset)) IN ('1', '2', '4') THEN 'WFO'
        ELSE 'WFH'
    END as status
FROM users u
CROSS JOIN (
    SELECT 0 as offset UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
) dow
CROSS JOIN (
    SELECT 'AM' as period UNION SELECT 'PM'
) tp
WHERE u.active = 1
AND date('2025-09-27', 'weekday ' || dow.offset) >= '2025-09-23'
AND date('2025-09-27', 'weekday ' || dow.offset) <= '2025-09-27';