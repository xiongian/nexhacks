-- ============================================================================
-- Migration: 008_audit_logs.sql
-- Description: Comprehensive audit logging for compliance and security
-- Dependencies: 003_users_and_events.sql (requires users table)
-- ============================================================================
--
-- This migration creates:
-- 1. audit_logs - Complete audit trail of all user actions
--
-- Purpose:
-- - Compliance (SOC2, HIPAA if applicable)
-- - Security monitoring
-- - Post-incident investigation
-- - User activity tracking
-- - Legal liability protection
-- ============================================================================

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
-- Purpose: Complete audit trail of all user actions and system events
-- 
-- Actions Tracked:
-- - Authentication: 'login', 'logout', 'session_expired'
-- - Incident Management: 'acknowledge_incident', 'resolve_incident', 'create_incident'
-- - Settings: 'change_settings', 'update_api_key', 'update_notification_channel'
-- - Monitoring: 'start_monitoring', 'stop_monitoring'
-- - Reports: 'generate_report', 'view_report', 'delete_report'
-- - User Management: 'invite_user', 'remove_user', 'change_role'
-- - System: 'system_error', 'api_rate_limit', 'database_error'
-- 
-- Resource Types:
-- - 'incident', 'camera', 'user', 'report', 'location', 'organization', etc.
-- 
-- Details (JSONB):
-- Stores additional context:
-- {
--   "ip_address": "192.168.1.1",
--   "user_agent": "Mozilla/5.0...",
--   "changes": {"old_value": "...", "new_value": "..."},
--   "error": "Error message if action failed"
-- }
-- 
-- Use Cases:
-- - "Who acknowledged this incident?"
-- - "When did this user last log in?"
-- - "What changes were made to settings?"
-- - Compliance audits
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,  -- NULL for system events
    
    -- Action Details
    action TEXT NOT NULL,                    -- See actions tracked above
    resource_type TEXT,                      -- 'incident', 'camera', 'user', etc.
    resource_id TEXT,                        -- ID of the resource acted upon
    
    -- Additional Context
    details JSONB DEFAULT '{}',              -- See structure above
    
    -- Request Information
    ip_address INET,                         -- IP address of request
    user_agent TEXT,                         -- Browser/client user agent
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs(user_id, created_at DESC);

-- GIN index for JSONB details queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_details ON audit_logs USING GIN (details);
