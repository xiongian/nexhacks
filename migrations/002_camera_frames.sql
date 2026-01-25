-- Migration: 002_camera_frames.sql
-- Description: Add camera frames table for frame storage
-- This replaces the in-memory Map in app/api/camera/store.ts

CREATE TABLE IF NOT EXISTS camera_frames (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    camera_id TEXT NOT NULL,
    image_data TEXT NOT NULL, -- base64 encoded image data or URL
    timestamp BIGINT NOT NULL, -- Unix timestamp in milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by camera_id and timestamp
CREATE INDEX IF NOT EXISTS idx_camera_frames_camera_timestamp 
ON camera_frames(camera_id, timestamp DESC);

-- Index for cleanup queries (frames older than 5 seconds)
CREATE INDEX IF NOT EXISTS idx_camera_frames_timestamp 
ON camera_frames(timestamp DESC);
