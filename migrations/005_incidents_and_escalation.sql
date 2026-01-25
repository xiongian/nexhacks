-- ============================================================================
-- Migration: 005_incidents_and_escalation.sql
-- Description: Incident management and escalation system
-- Dependencies: 003_users_and_events.sql, 004_locations_and_cameras.sql
-- ============================================================================
--
-- This migration creates:
-- 1. incidents - Trackable incidents from detection to resolution
-- 2. escalation_rules - Auto-escalation rules for unacknowledged incidents
-- 3. escalation_history - Log of escalation actions taken
--
-- Purpose:
-- - Transform event streams into trackable incidents
-- - Manage incident lifecycle (open → acknowledged → resolved)
-- - Auto-escalate if no response (critical for emergencies)
-- - Track false alarms vs real incidents
-- ============================================================================

-- ============================================================================
-- INCIDENTS TABLE
-- ============================================================================
-- Purpose: Trackable incidents from detection to resolution
-- 
-- Incident Lifecycle:
-- 1. open - Incident detected, no action taken yet
-- 2. acknowledged - Someone has seen/acknowledged the incident
-- 3. responding - First responders or security team is responding
-- 4. resolved - Incident has been resolved
-- 5. false_alarm - Incident was a false alarm (no actual threat)
-- 
-- Priority Levels:
-- - low - Minor incidents, informational
-- - medium - Requires attention but not urgent
-- - high - Urgent, needs immediate attention
-- - critical - Emergency, immediate response required
-- 
-- Use Cases:
-- - Track incident response times
-- - Generate incident reports
-- - Analyze false alarm rates
-- - Link multiple events to one incident
-- ============================================================================
CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
    
    -- Incident Details
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'responding', 'resolved', 'false_alarm')),
    priority TEXT DEFAULT 'high' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    title TEXT NOT NULL,                        -- Short incident title
    description TEXT,                           -- Detailed description
    
    -- Timeline
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),  -- When first detected
    acknowledged_at TIMESTAMP WITH TIME ZONE,    -- When someone acknowledged
    resolved_at TIMESTAMP WITH TIME ZONE,        -- When incident was resolved
    
    -- Resolution Details
    resolution_notes TEXT,                       -- How it was resolved, what happened
    was_false_alarm BOOLEAN DEFAULT false,      -- Mark as false alarm for analytics
    
    -- Linked Data
    first_event_id TEXT REFERENCES events(id),  -- The event that triggered this incident
    camera_id TEXT,                             -- Which camera detected it
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);
CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_location_id ON incidents(location_id);
CREATE INDEX IF NOT EXISTS idx_incidents_camera_id ON incidents(camera_id);
CREATE INDEX IF NOT EXISTS idx_incidents_open ON incidents(user_id) WHERE status = 'open';

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_incidents_user_status ON incidents(user_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_status_time ON incidents(status, detected_at DESC);

-- ============================================================================
-- ESCALATION RULES TABLE
-- ============================================================================
-- Purpose: Auto-escalation rules for unacknowledged incidents
-- 
-- How It Works:
-- 1. Incident is created with status 'open'
-- 2. If no one acknowledges within trigger_after_minutes, escalation fires
-- 3. Escalation action is executed (SMS, email, webhook, call)
-- 4. Escalation is logged in escalation_history
-- 
-- Use Cases:
-- - Primary contact doesn't respond → escalate to backup contact
-- - Critical incident → immediately escalate to emergency services
-- - Night shift → escalate to different contact list
-- 
-- Action Types:
-- - sms - Send SMS to phone number
-- - email - Send email
-- - webhook - POST to external system (dispatch system, pager, etc.)
-- - call - Make phone call (requires Twilio Voice API)
-- ============================================================================
CREATE TABLE IF NOT EXISTS escalation_rules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Rule Configuration
    name TEXT NOT NULL,                         -- "Primary Backup", "Night Shift Escalation"
    is_active BOOLEAN DEFAULT true,
    
    -- Trigger Conditions
    trigger_after_minutes INTEGER NOT NULL DEFAULT 5,  -- Escalate if no ack in X minutes
    applies_to_severity TEXT[],                        -- ['CRITICAL', 'HIGH'] - only escalate these
    applies_to_priority TEXT[],                        -- ['high', 'critical'] - only escalate these
    
    -- Escalation Action
    action_type TEXT NOT NULL CHECK (action_type IN ('sms', 'email', 'webhook', 'call')),
    action_target TEXT NOT NULL,                -- Phone number, email, or webhook URL
    
    -- Additional Action Config (JSONB for flexibility)
    action_config JSONB DEFAULT '{}',           -- {"message": "Custom escalation message", ...}
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_escalation_rules_user_id ON escalation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_escalation_rules_active ON escalation_rules(user_id) WHERE is_active = true;

-- ============================================================================
-- ESCALATION HISTORY TABLE
-- ============================================================================
-- Purpose: Log all escalation actions taken
-- 
-- Use Cases:
-- - Audit trail of escalations
-- - Track which escalations were successful
-- - Analyze escalation patterns
-- - Debug escalation issues
-- ============================================================================
CREATE TABLE IF NOT EXISTS escalation_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    incident_id TEXT REFERENCES incidents(id) ON DELETE CASCADE,
    rule_id TEXT REFERENCES escalation_rules(id) ON DELETE SET NULL,
    
    -- Escalation Details
    escalated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_type TEXT NOT NULL,                  -- What action was taken
    action_target TEXT,                        -- Who/what was notified
    
    -- Result
    was_successful BOOLEAN,                     -- Did the escalation succeed?
    error_message TEXT,                         -- If failed, why?
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_escalation_history_incident_id ON escalation_history(incident_id);
CREATE INDEX IF NOT EXISTS idx_escalation_history_rule_id ON escalation_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_escalation_history_escalated_at ON escalation_history(escalated_at DESC);
