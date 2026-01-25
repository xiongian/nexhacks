-- ============================================================================
-- Migration: 007_notification_channels.sql
-- Description: Multi-channel notification system
-- Dependencies: 003_users_and_events.sql (requires users table)
-- ============================================================================
--
-- This migration creates:
-- 1. notification_channels - User-defined notification channels (SMS, email, webhooks, etc.)
--
-- Purpose:
-- - Support multiple notification methods beyond SMS
-- - Integration with external systems (Slack, Teams, PagerDuty)
-- - Per-channel configuration and preferences
-- - Channel verification and status tracking
-- ============================================================================

-- ============================================================================
-- NOTIFICATION CHANNELS TABLE
-- ============================================================================
-- Purpose: User-defined notification channels for alerts
-- 
-- Channel Types:
-- - sms - SMS via Twilio (phone number)
-- - email - Email notifications
-- - webhook - HTTP POST to external system
-- - slack - Slack webhook integration
-- - teams - Microsoft Teams webhook
-- - push - Push notifications (future: mobile app)
-- 
-- Configuration (JSONB):
-- Each channel type has different config:
-- 
-- SMS:
--   {"phone": "+1234567890"}
-- 
-- Email:
--   {"email": "alerts@example.com", "subject_template": "Alert: {severity}"}
-- 
-- Webhook:
--   {"url": "https://api.example.com/alerts", "method": "POST", "headers": {...}}
-- 
-- Slack:
--   {"webhook_url": "https://hooks.slack.com/...", "channel": "#security-alerts"}
-- 
-- Teams:
--   {"webhook_url": "https://outlook.office.com/webhook/..."}
-- 
-- Use Cases:
-- - Different channels for different severity levels
-- - Integration with dispatch systems
-- - Team communication platforms
-- - Backup notification methods
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_channels (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Channel Identification
    name TEXT NOT NULL,                         -- "Primary SMS", "Slack Alerts", "Backup Email"
    channel_type TEXT NOT NULL CHECK (channel_type IN ('sms', 'email', 'webhook', 'slack', 'teams', 'push')),
    
    -- Channel Configuration (JSONB for flexibility)
    config JSONB NOT NULL,                      -- See examples above
    
    -- Status
    is_active BOOLEAN DEFAULT true,             -- Can disable without deleting
    is_verified BOOLEAN DEFAULT false,          -- Has channel been verified? (email, webhook test)
    
    -- Alert Preferences
    min_severity TEXT DEFAULT 'WARNING',         -- Minimum severity to trigger this channel
                                                 -- ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    min_priority TEXT,                          -- Minimum incident priority (if applicable)
    
    -- Usage Tracking
    last_used_at TIMESTAMP WITH TIME ZONE,       -- When was this channel last used?
    total_notifications_sent INTEGER DEFAULT 0,  -- Count of notifications sent
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_channels_user_id ON notification_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_channels_type ON notification_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_notification_channels_active ON notification_channels(user_id) WHERE is_active = true;

-- GIN index for JSONB config queries
CREATE INDEX IF NOT EXISTS idx_notification_channels_config ON notification_channels USING GIN (config);
