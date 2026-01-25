-- ============================================================================
-- Migration: 009_monitoring_schedules.sql
-- Description: Automated monitoring schedules
-- Dependencies: 003_users_and_events.sql, 004_locations_and_cameras.sql
-- ============================================================================
--
-- This migration creates:
-- 1. monitoring_schedules - Automated start/stop monitoring schedules
--
-- Purpose:
-- - Auto-start monitoring at specific times (e.g., after hours)
-- - Different alert sensitivity during scheduled times
-- - Time-based monitoring rules
-- - Reduce manual intervention
-- ============================================================================

-- ============================================================================
-- MONITORING SCHEDULES TABLE
-- ============================================================================
-- Purpose: Automated monitoring schedules for cameras/locations
-- 
-- Use Cases:
-- - School: Only monitor after 6pm (after hours)
-- - Office: Monitor weekdays 6pm-6am
-- - Warehouse: Monitor weekends only
-- - Different sensitivity during scheduled hours
-- 
-- Schedule Format:
-- - days_of_week: Array of integers [1,2,3,4,5] for Mon-Fri
--   (0=Sunday, 1=Monday, ..., 6=Saturday)
-- - start_time: Time to start monitoring (e.g., '18:00:00')
-- - end_time: Time to stop monitoring (e.g., '06:00:00')
-- 
-- Example:
-- - Name: "After Hours Monitoring"
-- - Days: [1,2,3,4,5] (Mon-Fri)
-- - Start: 18:00 (6pm)
-- - End: 06:00 (6am next day)
-- - Result: Auto-starts at 6pm, stops at 6am on weekdays
-- 
-- Alert Sensitivity:
-- - Can override default sensitivity during scheduled hours
-- - Useful for "after hours = higher sensitivity"
-- ============================================================================
CREATE TABLE IF NOT EXISTS monitoring_schedules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
    camera_id TEXT REFERENCES cameras(id) ON DELETE SET NULL,
    
    -- Schedule Identification
    name TEXT NOT NULL,                        -- "After Hours Monitoring", "Weekend Security"
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Schedule Configuration
    days_of_week INTEGER[],                    -- [1,2,3,4,5] for Mon-Fri, [0,6] for weekends
    start_time TIME NOT NULL,                  -- '18:00:00' format
    end_time TIME NOT NULL,                    -- '06:00:00' format
    timezone TEXT DEFAULT 'America/Chicago',   -- IANA timezone
    
    -- Monitoring Settings During Schedule
    alert_sensitivity TEXT DEFAULT 'high',     -- 'low', 'normal', 'high'
                                                 -- Override default sensitivity during scheduled hours
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monitoring_schedules_user_id ON monitoring_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_schedules_location_id ON monitoring_schedules(location_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_schedules_camera_id ON monitoring_schedules(camera_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_schedules_active ON monitoring_schedules(user_id) WHERE is_active = true;
