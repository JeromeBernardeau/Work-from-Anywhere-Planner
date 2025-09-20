-- Add missing updated_at column to recurring_patterns table
-- This column is needed for the habits save functionality

ALTER TABLE recurring_patterns ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Create an index on updated_at for performance
CREATE INDEX IF NOT EXISTS idx_recurring_updated_at ON recurring_patterns(updated_at);