-- ============================================================================
-- Migration: 003_users_and_events.sql
-- Description: Core user management, events tracking, and reporting infrastructure
-- Dependencies: None (foundational tables)
-- ============================================================================
-- 
-- This migration creates:
-- 1. users - User profiles linked to Clerk authentication
-- 2. user_api_keys - Store external API keys (Gemini, OpenAI) for AI report generation
-- 3. events - Comprehensive event tracking for all system activities
-- 4. monitoring_sessions - Track monitoring start/stop sessions
-- 5. reports - Generated analysis reports with AI summaries
--
-- Also updates existing tables:
-- - sms_state: Adds user_id for multi-user support
-- - alert_records: Adds user_id for user-specific alerts
-- - camera_frames: Adds user_id for user-specific frames
-- ============================================================================

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Purpose: Store user profiles linked to Clerk authentication
-- Clerk handles authentication, we store additional user data and preferences
-- 
-- Key Features:
-- - Links to Clerk via clerk_id (unique identifier from Clerk)
-- - Stores contact info (email, phone) for notifications
-- - User preferences for alerts and thresholds
-- - Tracks last login for activity monitoring
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Clerk Integration
    clerk_id TEXT UNIQUE NOT NULL,              -- ID from Clerk authentication (e.g., "user_2abc123")
    
    -- Contact Information
    email TEXT NOT NULL,                        -- User's email address
    phone_number TEXT,                          -- Phone number for SMS alerts (format: +1234567890)
    display_name TEXT,                          -- User's display name (optional, can come from Clerk)
    
    -- Alert Preferences
    sms_alerts_enabled BOOLEAN DEFAULT true,    -- Whether user wants SMS alerts
    email_alerts_enabled BOOLEAN DEFAULT false, -- Whether user wants email alerts
    alert_threshold TEXT DEFAULT 'DANGER' CHECK (alert_threshold IN ('WARNING', 'DANGER')),
                                                 -- Minimum severity to trigger alerts
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE      -- Track user activity
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number) WHERE phone_number IS NOT NULL;

-- ============================================================================
-- USER API KEYS TABLE
-- ============================================================================
-- Purpose: Store external API keys for AI report generation
-- Users can add their own API keys (Gemini, OpenAI, Anthropic) to generate reports
-- 
-- Security Note: API keys should be ENCRYPTED before storing!
-- Consider using pgcrypto extension or application-level encryption
-- 
-- Key Features:
-- - One key per provider per user (enforced by unique constraint)
-- - Tracks last usage for monitoring
-- - Can be activated/deactivated without deletion
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_api_keys (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- API Key Details
    provider TEXT NOT NULL,                     -- 'gemini', 'openai', 'anthropic', 'claude', etc.
    api_key_encrypted TEXT NOT NULL,            -- ENCRYPTED API key (encrypt before storing!)
    key_name TEXT,                              -- Optional friendly name (e.g., "My OpenAI Key")
    
    -- Status
    is_active BOOLEAN DEFAULT true,              -- Can disable without deleting
    last_used_at TIMESTAMP WITH TIME ZONE,       -- Track usage for monitoring
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One key per provider per user
    CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON user_api_keys(user_id) WHERE is_active = true;

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
-- Purpose: Comprehensive event tracking for all system activities
-- This is the CORE table for generating reports and analyzing system behavior
-- 
-- Event Types:
-- - 'danger_detected' - Overshoot AI detected DANGER level
-- - 'warning_detected' - Overshoot AI detected WARNING level
-- - 'level_change' - Danger level transition (SAFE→WARNING, etc.)
-- - 'alert_sent' - SMS alert successfully sent
-- - 'sms_response' - User replied to SMS alert
-- - 'monitoring_started' - User started monitoring session
-- - 'monitoring_stopped' - User stopped monitoring session
-- - 'consecutive_threshold' - Reached 3+ consecutive DANGER events
-- 
-- Severity Levels:
-- - 'LOW' - Informational events (monitoring start/stop)
-- - 'MEDIUM' - Warning-level events
-- - 'HIGH' - Alert sent, threshold reached
-- - 'CRITICAL' - Danger detected, immediate action required
-- 
-- Metadata (JSONB):
-- Stores flexible event-specific data:
-- {
--   "danger_level": "DANGER",
--   "section": "closest",
--   "person_count": 3,
--   "consecutive_count": 5,
--   "camera_id": "default",
--   "grid": [[false, true, false], ...],
--   "description": "AI-generated summary"
-- }
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,  -- NULL for system events
    
    -- Event Classification
    event_type TEXT NOT NULL,                   -- See event types above
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    -- Event Details
    title TEXT NOT NULL,                        -- Short description (e.g., "DANGER detected in closest section")
    description TEXT,                           -- Detailed description (AI summary or user notes)
    
    -- Structured Metadata (JSONB for flexibility)
    metadata JSONB DEFAULT '{}',                -- Store any extra data (see examples above)
    
    -- Location/Source Info
    camera_id TEXT,                             -- Which camera detected this
    section TEXT CHECK (section IN ('farthest', 'middle', 'closest', NULL)),
                                                 -- Which section of the frame (from Overshoot)
    
    -- Timestamps
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),  -- When event actually happened
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()             -- When record was created
);

-- Indexes for fast querying and report generation
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_camera_id ON events(camera_id);
CREATE INDEX IF NOT EXISTS idx_events_section ON events(section) WHERE section IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_user_time ON events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type_time ON events(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_severity_time ON events(severity, occurred_at DESC);

-- GIN index for JSONB metadata queries (for searching within metadata)
CREATE INDEX IF NOT EXISTS idx_events_metadata ON events USING GIN (metadata);

-- ============================================================================
-- MONITORING SESSIONS TABLE
-- ============================================================================
-- Purpose: Track when users start/stop monitoring for session-based analysis
-- 
-- Use Cases:
-- - Calculate total monitoring time per user
-- - Generate session-based reports
-- - Track which sessions had the most events
-- - Analyze patterns (e.g., "most incidents happen during night sessions")
-- 
-- Statistics are populated when session ends (via application logic)
-- ============================================================================
CREATE TABLE IF NOT EXISTS monitoring_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    camera_id TEXT DEFAULT 'default',
    
    -- Session Timeline
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,          -- NULL if session still active
    
    -- Session Statistics (populated when session ends)
    total_events INTEGER DEFAULT 0,
    danger_events INTEGER DEFAULT 0,
    warning_events INTEGER DEFAULT 0,
    alerts_sent INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_user_id ON monitoring_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_started_at ON monitoring_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_active ON monitoring_sessions(user_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_camera_id ON monitoring_sessions(camera_id);

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================
-- Purpose: Store generated analysis reports (weekly, monthly, custom date ranges)
-- Reports are AI-generated summaries of events over a time period
-- 
-- Report Types:
-- - 'weekly' - Weekly summary report
-- - 'monthly' - Monthly summary report
-- - 'custom' - User-defined date range
-- - 'incident' - Report for a specific incident
-- 
-- Content (JSONB):
-- Stores full report data:
-- {
--   "total_events": 150,
--   "by_severity": {"CRITICAL": 5, "HIGH": 12, "MEDIUM": 45, "LOW": 88},
--   "by_type": {"danger_detected": 5, "alert_sent": 12, ...},
--   "peak_hours": [22, 23, 0, 1],  // Hours with most events
--   "recommendations": ["Increase monitoring during night hours", ...],
--   "charts": {...}  // Chart data for visualization
-- }
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Report Details
    title TEXT NOT NULL,                        -- e.g., "Weekly Security Report - Jan 20-26, 2026"
    report_type TEXT NOT NULL,                  -- 'weekly', 'monthly', 'custom', 'incident'
    
    -- Date Range Covered
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Report Content
    summary TEXT,                               -- AI-generated executive summary (plain text)
    content JSONB NOT NULL DEFAULT '{}',        -- Full report data (see structure above)
    
    -- AI Generation Details
    ai_provider TEXT,                           -- 'gemini', 'openai', 'anthropic', etc.
    ai_model TEXT,                              -- 'gpt-4', 'gemini-pro', 'claude-3', etc.
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_period ON reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- ============================================================================
-- UPDATE EXISTING TABLES FOR MULTI-USER SUPPORT
-- ============================================================================

-- Add user_id to sms_state (future: one sms_state row per user)
ALTER TABLE sms_state ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_sms_state_user_id ON sms_state(user_id);

-- Add user_id to alert_records
ALTER TABLE alert_records ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_alert_records_user_id ON alert_records(user_id);

-- Add user_id to camera_frames
ALTER TABLE camera_frames ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_camera_frames_user_id ON camera_frames(user_id);
