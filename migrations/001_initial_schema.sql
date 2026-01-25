-- Migration: 001_initial_schema.sql
-- Description: Create initial tables for SMS state and alert history
-- This replaces the .sms-state.json file with database storage

-- SMS State table (replaces .sms-state.json)
-- Uses singleton pattern - only one row with id = 'singleton'
CREATE TABLE IF NOT EXISTS sms_state (
    id TEXT PRIMARY KEY DEFAULT 'singleton',
    consecutive_danger_count INTEGER NOT NULL DEFAULT 0,
    last_alert_sent_time BIGINT, -- Stored as Unix timestamp (milliseconds) to match existing code
    last_danger_level TEXT CHECK (last_danger_level IN ('SAFE', 'WARNING', 'DANGER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT singleton_check CHECK (id = 'singleton')
);

-- Alert History table (stores alert records, replaces alertHistory array)
CREATE TABLE IF NOT EXISTS alert_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    timestamp BIGINT NOT NULL, -- Unix timestamp in milliseconds to match existing code
    danger_level TEXT NOT NULL CHECK (danger_level IN ('SAFE', 'WARNING', 'DANGER')),
    description TEXT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('initial', 'response_1', 'response_2')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on alert_records timestamp for faster queries and ordering
CREATE INDEX IF NOT EXISTS idx_alert_records_timestamp ON alert_records(timestamp DESC);

-- Create index on alert_records created_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_alert_records_created_at ON alert_records(created_at DESC);

-- Insert initial SMS state (singleton row)
-- ON CONFLICT ensures we don't duplicate if migration runs twice
INSERT INTO sms_state (id, consecutive_danger_count, last_alert_sent_time, last_danger_level)
VALUES ('singleton', 0, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
