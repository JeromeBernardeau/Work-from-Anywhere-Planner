-- Add authentication fields to users table
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN last_login DATETIME;
ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN account_locked DATETIME;

-- Create sessions table for user authentication
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY, -- UUID session ID
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  active INTEGER DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_id ON user_sessions(id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(active);

-- Create audit table for login attempts
CREATE TABLE IF NOT EXISTS login_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  success INTEGER NOT NULL, -- 1 for success, 0 for failure
  ip_address TEXT,
  user_agent TEXT,
  failure_reason TEXT, -- 'invalid_password', 'account_locked', 'user_not_found'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS idx_login_audit_email ON login_audit(email);
CREATE INDEX IF NOT EXISTS idx_login_audit_created ON login_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_login_audit_success ON login_audit(success);