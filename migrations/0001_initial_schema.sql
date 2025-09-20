-- FICOFI Work-from-Anywhere Planner Database Schema

-- Users (Employees) table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  site TEXT NOT NULL, -- Office location
  department TEXT NOT NULL,
  manager_email TEXT,
  second_level_manager_email TEXT,
  admin_access INTEGER DEFAULT 0, -- 0=Employee, 1=Manager, 2=Admin/HR
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Work schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date DATE NOT NULL,
  time_period TEXT NOT NULL, -- 'AM', 'PM', or 'FULL'
  status TEXT NOT NULL, -- 'WFH', 'WFO', 'TRIP', 'LEAVE', 'IN_OFFICE'
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, date, time_period)
);

-- Recurring patterns table
CREATE TABLE IF NOT EXISTS recurring_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  time_period TEXT NOT NULL, -- 'AM', 'PM', or 'FULL'
  status TEXT NOT NULL, -- 'WFH', 'WFO', 'TRIP', 'LEAVE', 'IN_OFFICE'
  active INTEGER DEFAULT 1,
  start_date DATE,
  end_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Team/Department mapping table
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_name TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  manager_email TEXT,
  site TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  recipient_email TEXT,
  type TEXT NOT NULL, -- 'status_change', 'capacity_warning', 'missing_schedule', 'approval'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_status INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Office locations and capacity
CREATE TABLE IF NOT EXISTS office_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_name TEXT UNIQUE NOT NULL,
  capacity INTEGER,
  timezone TEXT,
  address TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for changes
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id INTEGER,
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedules_user_date ON schedules(user_id, date);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_site ON users(site);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_email);
CREATE INDEX IF NOT EXISTS idx_recurring_user_day ON recurring_patterns(user_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_status);
CREATE INDEX IF NOT EXISTS idx_audit_user_date ON audit_log(user_id, created_at);

-- Insert default office locations
INSERT OR IGNORE INTO office_locations (site_name, timezone, capacity) VALUES 
  ('Singapore', 'Asia/Singapore', 100),
  ('Hong Kong', 'Asia/Hong_Kong', 80),
  ('Paris', 'Europe/Paris', 120),
  ('Pessac', 'Europe/Paris', 90),
  ('Beaune', 'Europe/Paris', 30),
  ('New York', 'America/New_York', 50),
  ('Los Angeles', 'America/Los_Angeles', 40),
  ('Brazil', 'America/Sao_Paulo', 20);

-- Insert departments/teams
INSERT OR IGNORE INTO teams (team_name, department, site) VALUES 
  ('EO', 'EO', 'Singapore'),
  ('Estates APAC', 'Estates', 'Singapore'),
  ('Estates Europe', 'Estates', 'Paris'),
  ('Finance APAC', 'Finance', 'Singapore'),
  ('Finance Europe', 'Finance', 'Pessac'),
  ('Human Resources', 'Human Resources', 'Paris'),
  ('Legal', 'Legal', 'Singapore'),
  ('Management', 'ManCO', 'Singapore'),
  ('Marketing APAC', 'Marketing', 'Hong Kong'),
  ('Marketing Europe', 'Marketing', 'Paris'),
  ('Operations APAC', 'Operations', 'Singapore'),
  ('Operations Europe', 'Operations', 'Pessac'),
  ('Sales & Members', 'Sales & Members', 'Global'),
  ('Technology', 'Technology', 'Global'),
  ('Wines', 'Wines', 'Global'),
  ('Business Transformation', 'Business Transformation', 'Pessac');