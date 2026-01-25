-- ============================================================================
-- Migration: 010_event_clips.sql
-- Description: Video clip storage for events
-- Dependencies: 003_users_and_events.sql, 005_incidents_and_escalation.sql
-- ============================================================================
--
-- This migration creates:
-- 1. event_clips - Video clips associated with events/incidents
--
-- Purpose:
-- - Store video evidence for incidents
-- - Review footage after events
-- - Share clips with first responders
-- - Legal evidence collection
-- ============================================================================

-- ============================================================================
-- EVENT CLIPS TABLE
-- ============================================================================
-- Purpose: Store video clips associated with events and incidents
-- 
-- Use Cases:
-- - When DANGER is detected, save 30 seconds before and after
-- - Store clips for incident investigation
-- - Share clips with first responders
-- - Legal evidence collection
-- 
-- Storage:
-- - storage_url: URL to video file (S3, Cloudinary, local storage, etc.)
-- - storage_provider: Which service stores it ('s3', 'cloudinary', 'local', etc.)
-- 
-- Clip Details:
-- - duration_seconds: Length of clip in seconds
-- - start_timestamp/end_timestamp: When the clip was recorded
-- - file_size_bytes: Size for storage management
-- 
-- Retention:
-- - expires_at: Auto-delete after X days (compliance, storage costs)
-- - Can be extended for important incidents
-- 
-- Future Enhancements:
-- - Thumbnail generation
-- - Video processing (compression, format conversion)
-- - Direct streaming URLs
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_clips (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    incident_id TEXT REFERENCES incidents(id) ON DELETE SET NULL,
    camera_id TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Storage Information
    storage_url TEXT NOT NULL,                  -- URL to video file
    storage_provider TEXT,                      -- 's3', 'cloudinary', 'local', etc.
    
    -- Clip Details
    duration_seconds INTEGER,                   -- Length of clip
    start_timestamp TIMESTAMP WITH TIME ZONE,    -- When clip starts
    end_timestamp TIMESTAMP WITH TIME ZONE,      -- When clip ends
    file_size_bytes BIGINT,                      -- File size for storage management
    
    -- Metadata
    format TEXT,                                 -- 'mp4', 'webm', etc.
    resolution TEXT,                             -- '1920x1080', '1280x720', etc.
    thumbnail_url TEXT,                          -- URL to thumbnail image
    
    -- Retention
    expires_at TIMESTAMP WITH TIME ZONE,        -- Auto-delete after this date
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_clips_event_id ON event_clips(event_id);
CREATE INDEX IF NOT EXISTS idx_event_clips_incident_id ON event_clips(incident_id);
CREATE INDEX IF NOT EXISTS idx_event_clips_user_id ON event_clips(user_id);
CREATE INDEX IF NOT EXISTS idx_event_clips_camera_id ON event_clips(camera_id);
CREATE INDEX IF NOT EXISTS idx_event_clips_expires_at ON event_clips(expires_at) WHERE expires_at IS NOT NULL;
