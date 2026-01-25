-- ============================================================================
-- Migration: 006_organizations_and_teams.sql
-- Description: Multi-user organization and team support
-- Dependencies: 003_users_and_events.sql (requires users table)
-- ============================================================================
--
-- This migration creates:
-- 1. organizations - Company/organization accounts
-- 2. organization_members - Team members with roles and permissions
--
-- Purpose:
-- - Support team-based security operations
-- - Role-based access control (owner, admin, operator, viewer)
-- - Organization-level settings and billing
-- - Shared resources (locations, cameras) across team
-- ============================================================================

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
-- Purpose: Company/organization accounts for team collaboration
-- 
-- Use Cases:
-- - Security company managing multiple client sites
-- - Large organization with multiple security operators
-- - Shared billing and subscription management
-- 
-- Plan Types:
-- - free - Basic plan, limited features
-- - pro - Professional plan, more features
-- - enterprise - Enterprise plan, all features, custom support
-- 
-- Future: Can add billing info, subscription management, etc.
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Organization Details
    name TEXT NOT NULL,                         -- "Acme Security Corp", "Chicago School District"
    description TEXT,
    
    -- Subscription/Billing
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
    
    -- Contact Information
    contact_email TEXT,
    contact_phone TEXT,
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- ============================================================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================================================
-- Purpose: Team members with roles and permissions
-- 
-- Roles (hierarchical permissions):
-- - owner - Full control, can delete org, manage billing
-- - admin - Can manage members, settings, all resources
-- - operator - Can view/monitor, acknowledge incidents, generate reports
-- - viewer - Read-only access, can view dashboards and reports
-- 
-- Use Cases:
-- - Security team with different access levels
-- - Manager (admin) + Operators (operator) + Stakeholders (viewer)
-- - Per-member notification preferences
-- ============================================================================
CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Role and Permissions
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
    
    -- Notification Preferences (per-member, per-organization)
    receives_alerts BOOLEAN DEFAULT true,      -- Should this member receive alerts?
    alert_priority_threshold TEXT DEFAULT 'high',  -- Minimum priority to alert this member
                                                 -- ('low', 'medium', 'high', 'critical')
    
    -- Timestamps
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One membership per user per organization
    CONSTRAINT unique_org_membership UNIQUE (organization_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(organization_id, role);

-- ============================================================================
-- UPDATE EXISTING TABLES FOR ORGANIZATION SUPPORT
-- ============================================================================

-- Add organization_id to locations (locations belong to organizations)
ALTER TABLE locations ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_locations_organization_id ON locations(organization_id);

-- Add organization_id to cameras
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cameras_organization_id ON cameras(organization_id);

-- Add organization_id to incidents
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_organization_id ON incidents(organization_id);
