-- ============================================================================
-- Migration: 004_locations_and_cameras.sql
-- Description: Physical location and camera management
-- Dependencies: 003_users_and_events.sql (requires users table)
-- ============================================================================
--
-- This migration creates:
-- 1. locations - Physical locations (buildings, sites) where cameras are deployed
-- 2. cameras - Individual camera devices linked to locations
--
-- Purpose:
-- - Track WHERE incidents occur (physical address, coordinates)
-- - Support multi-site deployments
-- - Enable location-based reporting and analysis
-- - Link events to specific cameras and locations
-- ============================================================================

-- ============================================================================
-- LOCATIONS TABLE
-- ============================================================================
-- Purpose: Store physical locations (buildings, sites, facilities)
-- 
-- Use Cases:
-- - Multi-site security management (e.g., "Chicago Office", "NYC Warehouse")
-- - Dispatch first responders to correct address
-- - Location-based reporting ("Which location has most incidents?")
-- - Timezone management (important for accurate timestamps in reports)
-- 
-- Coordinates:
-- - latitude/longitude for map display and geofencing
-- - Can be used with mapping libraries (Leaflet, Mapbox, Google Maps)
-- 
-- Building Type:
-- - Helps with context (school vs warehouse have different security needs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Information
    name TEXT NOT NULL,                  -- "Main Office", "Warehouse B", "Chicago Branch"
    description TEXT,                     -- Additional details about the location
    
    -- Address Information
    address_line1 TEXT,                  -- "123 Main Street"
    address_line2 TEXT,                  -- "Suite 200" (optional)
    city TEXT,
    state TEXT,                          -- State/Province
    postal_code TEXT,                    -- ZIP/Postal code
    country TEXT DEFAULT 'US',
    
    -- Geographic Coordinates (for map display)
    latitude DECIMAL(10, 8),             -- e.g., 41.87811240
    longitude DECIMAL(11, 8),            -- e.g., -87.62979820
    -- Note: PostgreSQL supports PostGIS extension for advanced spatial queries,
    -- but basic lat/long is sufficient for most use cases
    
    -- Building Details
    building_type TEXT,                  -- 'office', 'warehouse', 'school', 'retail', 'residential', etc.
    total_floors INTEGER DEFAULT 1,      -- Number of floors in building
    
    -- Timezone (CRITICAL for accurate timestamps in reports)
    timezone TEXT DEFAULT 'America/Chicago',  -- IANA timezone (e.g., 'America/New_York')
    
    -- Status
    is_active BOOLEAN DEFAULT true,      -- Can disable location without deleting
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_city_state ON locations(city, state);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(user_id) WHERE is_active = true;

-- ============================================================================
-- CAMERAS TABLE
-- ============================================================================
-- Purpose: Individual camera devices linked to locations
-- 
-- Use Cases:
-- - Track which camera detected an event
-- - Camera-specific settings and preferences
-- - Zone-based analysis ("Most incidents in Entrance zone")
-- - Multi-camera deployments per location
-- 
-- Camera Position:
-- - floor_number: Which floor the camera is on
-- - zone_name: Area within location (e.g., "Entrance", "Parking Lot", "Back Office")
-- 
-- Stream URL:
-- - For real camera integrations (RTSP, HTTP streams)
-- - Currently using webcam, but structure supports future expansion
-- 
-- Sensitivity:
-- - Per-camera alert sensitivity (some areas need higher sensitivity)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cameras (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
    
    -- Camera Identification
    name TEXT NOT NULL,                  -- "Front Entrance Cam", "Lobby Camera 2", "Parking Lot Camera"
    description TEXT,                     -- Additional details
    
    -- Position Within Location
    floor_number INTEGER DEFAULT 1,      -- Which floor (0 = ground/basement, 1 = first floor, etc.)
    zone_name TEXT,                      -- "Entrance", "Back Office", "Loading Dock", "Parking Lot A"
    
    -- Camera Configuration
    stream_url TEXT,                     -- RTSP URL, HTTP stream, or webcam identifier
    is_active BOOLEAN DEFAULT true,      -- Can disable camera without deleting
    
    -- Alert Settings
    sensitivity TEXT DEFAULT 'normal' CHECK (sensitivity IN ('low', 'normal', 'high')),
                                                 -- Per-camera sensitivity override
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cameras_user_id ON cameras(user_id);
CREATE INDEX IF NOT EXISTS idx_cameras_location_id ON cameras(location_id);
CREATE INDEX IF NOT EXISTS idx_cameras_active ON cameras(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cameras_zone ON cameras(location_id, zone_name);

-- ============================================================================
-- UPDATE EXISTING TABLES TO LINK TO LOCATIONS/CAMERAS
-- ============================================================================

-- Add location_id to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS location_id TEXT REFERENCES locations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_location_id ON events(location_id);

-- Update camera_id in events to reference cameras table (if camera_id exists, it should match cameras.id)
-- Note: This is a soft link - camera_id is TEXT, so we can't enforce FK constraint
-- Application logic should ensure camera_id matches cameras.id when camera exists

-- Add location_id to monitoring_sessions
ALTER TABLE monitoring_sessions ADD COLUMN IF NOT EXISTS location_id TEXT REFERENCES locations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_location_id ON monitoring_sessions(location_id);
