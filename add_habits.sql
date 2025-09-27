-- Add default habits for Jerome (user_id = 10)
-- Monday AM: Office, PM: Office
INSERT INTO recurring_patterns (user_id, day_of_week, time_period, status, active) VALUES (10, 1, 'AM', 'WFO', 1);
INSERT INTO recurring_patterns (user_id, day_of_week, time_period, status, active) VALUES (10, 1, 'PM', 'WFO', 1);

-- Tuesday AM: Office, PM: Office  
INSERT INTO recurring_patterns (user_id, day_of_week, time_period, status, active) VALUES (10, 2, 'AM', 'WFO', 1);
INSERT INTO recurring_patterns (user_id, day_of_week, time_period, status, active) VALUES (10, 2, 'PM', 'WFO', 1);

-- Wednesday: Work from Home
INSERT INTO recurring_patterns (user_id, day_of_week, time_period, status, active) VALUES (10, 3, 'AM', 'WFH', 1);
INSERT INTO recurring_patterns (user_id, day_of_week, time_period, status, active) VALUES (10, 3, 'PM', 'WFH', 1);

-- Thursday AM: Office, PM: Office
INSERT INTO recurring_patterns (user_id, day_of_week, time_period, status, active) VALUES (10, 4, 'AM', 'WFO', 1);
INSERT INTO recurring_patterns (user_id, day_of_week, time_period, status, active) VALUES (10, 4, 'PM', 'WFO', 1);

-- Friday: Work from Home
INSERT INTO recurring_patterns (user_id, day_of_week, time_period, status, active) VALUES (10, 5, 'AM', 'WFH', 1);
INSERT INTO recurring_patterns (user_id, day_of_week, time_period, status, active) VALUES (10, 5, 'PM', 'WFH', 1);