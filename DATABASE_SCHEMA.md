# Watchdog Database Schema Documentation

Complete documentation of the Watchdog database schema, migrations, and data model.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Migration Files](#migration-files)
3. [Database Schema](#database-schema)
4. [Table Relationships](#table-relationships)
5. [Key Features](#key-features)
6. [Usage Examples](#usage-examples)

---

## Overview

The Watchdog database is built on **Neon PostgreSQL** and uses a migration-based approach for schema management. All migrations are stored in the `migrations/` directory and are executed in sequential order.

### Database Features

- ✅ **Multi-user support** - Each user has their own data with Clerk authentication
- ✅ **Event tracking** - Comprehensive logging of all system activities
- ✅ **Incident management** - Track incidents from detection to resolution
- ✅ **Multi-location support** - Manage multiple sites/buildings
- ✅ **Team collaboration** - Organizations with role-based access
- ✅ **AI-powered reports** - Generate insights using user's API keys
- ✅ **Audit logging** - Complete compliance trail
- ✅ **Escalation system** - Auto-escalate unacknowledged incidents

---

## Migration Files

### Migration 001: Initial Schema
**File:** `migrations/001_initial_schema.sql`

**Purpose:** Foundation tables for SMS alert system

**Tables Created:**
- `sms_state` - Singleton table tracking SMS alert state (replaces `.sms-state.json`)
- `alert_records` - History of SMS alerts sent

**Key Features:**
- Singleton pattern for SMS state (one row with id='singleton')
- Unix timestamp (milliseconds) for compatibility with existing code
- Indexes for fast timestamp queries

---

### Migration 002: Camera Frames
**File:** `migrations/002_camera_frames.sql`

**Purpose:** Store camera frame data (replaces in-memory Map)

**Tables Created:**
- `camera_frames` - Video frame storage

**Key Features:**
- Base64 encoded image data or URLs
- Indexes for fast camera_id + timestamp lookups
- Automatic cleanup support (frames older than 5 seconds)

---

### Migration 003: Users and Events
**File:** `migrations/003_users_and_events.sql`

**Purpose:** Core user management, event tracking, and reporting infrastructure

**Tables Created:**
- `users` - User profiles linked to Clerk authentication
- `user_api_keys` - External API keys (Gemini, OpenAI) for AI reports
- `events` - Comprehensive event tracking (core table for reports)
- `monitoring_sessions` - Track monitoring start/stop sessions
- `reports` - Generated AI analysis reports

**Updates Existing Tables:**
- Adds `user_id` to `sms_state`, `alert_records`, `camera_frames`

**Key Features:**
- Clerk integration via `clerk_id`
- JSONB metadata for flexible event data
- Multiple indexes for fast report generation
- GIN indexes for JSONB queries

---

### Migration 004: Locations and Cameras
**File:** `migrations/004_locations_and_cameras.sql`

**Purpose:** Physical location and camera management

**Tables Created:**
- `locations` - Physical locations (buildings, sites)
- `cameras` - Individual camera devices

**Updates Existing Tables:**
- Adds `location_id` to `events` and `monitoring_sessions`

**Key Features:**
- Full address support (street, city, state, postal code)
- Geographic coordinates (latitude/longitude) for map display
- Timezone support (critical for accurate timestamps)
- Zone-based camera organization (floor, zone_name)

---

### Migration 005: Incidents and Escalation
**File:** `migrations/005_incidents_and_escalation.sql`

**Purpose:** Incident management and auto-escalation system

**Tables Created:**
- `incidents` - Trackable incidents with lifecycle management
- `escalation_rules` - Auto-escalation configuration
- `escalation_history` - Log of escalation actions

**Key Features:**
- Incident lifecycle: open → acknowledged → responding → resolved
- Priority levels: low, medium, high, critical
- Auto-escalation if no response within X minutes
- False alarm tracking for analytics

---

### Migration 006: Organizations and Teams
**File:** `migrations/006_organizations_and_teams.sql`

**Purpose:** Multi-user organization and team support

**Tables Created:**
- `organizations` - Company/organization accounts
- `organization_members` - Team members with roles

**Updates Existing Tables:**
- Adds `organization_id` to `locations`, `cameras`, `incidents`

**Key Features:**
- Role-based access: owner, admin, operator, viewer
- Per-member notification preferences
- Shared resources across team
- Subscription plan management

---

### Migration 007: Notification Channels
**File:** `migrations/007_notification_channels.sql`

**Purpose:** Multi-channel notification system

**Tables Created:**
- `notification_channels` - User-defined notification channels

**Key Features:**
- Multiple channel types: SMS, email, webhook, Slack, Teams, push
- JSONB configuration for flexible channel setup
- Per-channel severity thresholds
- Channel verification and usage tracking

---

### Migration 008: Audit Logs
**File:** `migrations/008_audit_logs.sql`

**Purpose:** Comprehensive audit logging for compliance

**Tables Created:**
- `audit_logs` - Complete audit trail of all actions

**Key Features:**
- Tracks all user actions (login, settings changes, incident management)
- IP address and user agent tracking
- JSONB details for flexible context storage
- Compliance-ready (SOC2, HIPAA if applicable)

---

### Migration 009: Monitoring Schedules
**File:** `migrations/009_monitoring_schedules.sql`

**Purpose:** Automated monitoring schedules

**Tables Created:**
- `monitoring_schedules` - Time-based monitoring rules

**Key Features:**
- Cron-like scheduling (days of week, start/end times)
- Timezone-aware scheduling
- Per-schedule alert sensitivity
- Auto-start/stop monitoring

---

### Migration 010: Event Clips
**File:** `migrations/010_event_clips.sql`

**Purpose:** Video clip storage for events

**Tables Created:**
- `event_clips` - Video clips associated with events/incidents

**Key Features:**
- Links to events and incidents
- Multiple storage providers (S3, Cloudinary, local)
- Automatic expiration for storage management
- Thumbnail support

---

## Database Schema

### Core Tables

#### users
User profiles linked to Clerk authentication.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| clerk_id | TEXT | Clerk authentication ID (unique) |
| email | TEXT | User email |
| phone_number | TEXT | Phone for SMS alerts |
| display_name | TEXT | Display name |
| sms_alerts_enabled | BOOLEAN | SMS alert preference |
| email_alerts_enabled | BOOLEAN | Email alert preference |
| alert_threshold | TEXT | Minimum severity ('WARNING' or 'DANGER') |
| created_at | TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | Last update time |
| last_login_at | TIMESTAMP | Last login time |

#### events
Comprehensive event tracking - **core table for reports**.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| user_id | TEXT | User who owns this event |
| event_type | TEXT | Type: 'danger_detected', 'alert_sent', etc. |
| severity | TEXT | 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL' |
| title | TEXT | Short description |
| description | TEXT | Detailed description |
| metadata | JSONB | Flexible event data |
| camera_id | TEXT | Which camera detected it |
| section | TEXT | Frame section: 'farthest', 'middle', 'closest' |
| location_id | TEXT | Physical location |
| occurred_at | TIMESTAMP | When event happened |
| created_at | TIMESTAMP | Record creation time |

**Event Types:**
- `danger_detected` - Overshoot detected DANGER
- `warning_detected` - Overshoot detected WARNING
- `level_change` - Danger level transition
- `alert_sent` - SMS alert sent
- `sms_response` - User replied to SMS
- `monitoring_started` - Monitoring session started
- `monitoring_stopped` - Monitoring session stopped
- `consecutive_threshold` - Reached 3+ consecutive DANGER

#### incidents
Trackable incidents with lifecycle management.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| user_id | TEXT | User who owns incident |
| location_id | TEXT | Where incident occurred |
| status | TEXT | 'open', 'acknowledged', 'responding', 'resolved', 'false_alarm' |
| priority | TEXT | 'low', 'medium', 'high', 'critical' |
| title | TEXT | Incident title |
| description | TEXT | Detailed description |
| detected_at | TIMESTAMP | When first detected |
| acknowledged_at | TIMESTAMP | When acknowledged |
| resolved_at | TIMESTAMP | When resolved |
| resolution_notes | TEXT | How it was resolved |
| was_false_alarm | BOOLEAN | Mark as false alarm |
| first_event_id | TEXT | Event that triggered incident |
| camera_id | TEXT | Which camera detected it |

#### locations
Physical locations (buildings, sites).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| user_id | TEXT | User who owns location |
| organization_id | TEXT | Organization (if team-based) |
| name | TEXT | Location name |
| address_line1 | TEXT | Street address |
| city | TEXT | City |
| state | TEXT | State/Province |
| postal_code | TEXT | ZIP/Postal code |
| country | TEXT | Country code |
| latitude | DECIMAL(10,8) | Latitude coordinate |
| longitude | DECIMAL(11,8) | Longitude coordinate |
| building_type | TEXT | 'office', 'warehouse', 'school', etc. |
| total_floors | INTEGER | Number of floors |
| timezone | TEXT | IANA timezone |
| is_active | BOOLEAN | Active status |

#### cameras
Individual camera devices.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| user_id | TEXT | User who owns camera |
| location_id | TEXT | Which location |
| organization_id | TEXT | Organization (if team-based) |
| name | TEXT | Camera name |
| floor_number | INTEGER | Which floor |
| zone_name | TEXT | Zone: 'Entrance', 'Parking Lot', etc. |
| stream_url | TEXT | RTSP/HTTP stream URL |
| is_active | BOOLEAN | Active status |
| sensitivity | TEXT | 'low', 'normal', 'high' |

### Supporting Tables

#### user_api_keys
External API keys for AI report generation.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| user_id | TEXT | User who owns key |
| provider | TEXT | 'gemini', 'openai', 'anthropic' |
| api_key_encrypted | TEXT | **ENCRYPTED** API key |
| key_name | TEXT | Friendly name |
| is_active | BOOLEAN | Active status |
| last_used_at | TIMESTAMP | Last usage time |

**Security Note:** API keys should be encrypted before storing!

#### reports
Generated AI analysis reports.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| user_id | TEXT | User who owns report |
| title | TEXT | Report title |
| report_type | TEXT | 'weekly', 'monthly', 'custom', 'incident' |
| period_start | TIMESTAMP | Report start date |
| period_end | TIMESTAMP | Report end date |
| summary | TEXT | AI-generated summary |
| content | JSONB | Full report data |
| ai_provider | TEXT | Which AI was used |
| ai_model | TEXT | Model name |
| status | TEXT | 'draft', 'generating', 'completed', 'failed' |

#### monitoring_sessions
Track monitoring sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| user_id | TEXT | User who owns session |
| location_id | TEXT | Location monitored |
| camera_id | TEXT | Camera monitored |
| started_at | TIMESTAMP | Session start |
| ended_at | TIMESTAMP | Session end (NULL if active) |
| total_events | INTEGER | Events during session |
| danger_events | INTEGER | Danger events count |
| warning_events | INTEGER | Warning events count |
| alerts_sent | INTEGER | Alerts sent count |

#### escalation_rules
Auto-escalation configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| user_id | TEXT | User who owns rule |
| name | TEXT | Rule name |
| is_active | BOOLEAN | Active status |
| trigger_after_minutes | INTEGER | Escalate after X minutes |
| applies_to_severity | TEXT[] | Severity filter |
| applies_to_priority | TEXT[] | Priority filter |
| action_type | TEXT | 'sms', 'email', 'webhook', 'call' |
| action_target | TEXT | Phone, email, or webhook URL |
| action_config | JSONB | Additional config |

#### notification_channels
Multi-channel notification system.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| user_id | TEXT | User who owns channel |
| name | TEXT | Channel name |
| channel_type | TEXT | 'sms', 'email', 'webhook', 'slack', 'teams', 'push' |
| config | JSONB | Channel-specific config |
| is_active | BOOLEAN | Active status |
| is_verified | BOOLEAN | Verification status |
| min_severity | TEXT | Minimum severity to trigger |
| last_used_at | TIMESTAMP | Last usage time |

#### organizations
Company/organization accounts.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| name | TEXT | Organization name |
| description | TEXT | Description |
| plan_type | TEXT | 'free', 'pro', 'enterprise' |
| contact_email | TEXT | Contact email |
| contact_phone | TEXT | Contact phone |
| is_active | BOOLEAN | Active status |

#### organization_members
Team members with roles.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| organization_id | TEXT | Organization |
| user_id | TEXT | User |
| role | TEXT | 'owner', 'admin', 'operator', 'viewer' |
| receives_alerts | BOOLEAN | Alert preference |
| alert_priority_threshold | TEXT | Minimum priority |
| joined_at | TIMESTAMP | Join date |

#### audit_logs
Complete audit trail.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| user_id | TEXT | User who performed action |
| action | TEXT | Action type |
| resource_type | TEXT | Resource type |
| resource_id | TEXT | Resource ID |
| details | JSONB | Additional context |
| ip_address | INET | Request IP |
| user_agent | TEXT | Browser/client |
| created_at | TIMESTAMP | Action time |

#### monitoring_schedules
Automated monitoring schedules.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| user_id | TEXT | User who owns schedule |
| location_id | TEXT | Location to monitor |
| camera_id | TEXT | Camera to monitor |
| name | TEXT | Schedule name |
| days_of_week | INTEGER[] | [1,2,3,4,5] for Mon-Fri |
| start_time | TIME | Start time |
| end_time | TIME | End time |
| timezone | TEXT | IANA timezone |
| alert_sensitivity | TEXT | Sensitivity during schedule |
| is_active | BOOLEAN | Active status |

#### event_clips
Video clips for events.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| event_id | TEXT | Associated event |
| incident_id | TEXT | Associated incident |
| camera_id | TEXT | Camera that recorded |
| user_id | TEXT | User who owns clip |
| storage_url | TEXT | Video file URL |
| storage_provider | TEXT | 's3', 'cloudinary', 'local' |
| duration_seconds | INTEGER | Clip length |
| start_timestamp | TIMESTAMP | Clip start time |
| end_timestamp | TIMESTAMP | Clip end time |
| file_size_bytes | BIGINT | File size |
| format | TEXT | 'mp4', 'webm', etc. |
| resolution | TEXT | '1920x1080', etc. |
| thumbnail_url | TEXT | Thumbnail URL |
| expires_at | TIMESTAMP | Auto-delete date |

---

## Table Relationships

```
users (1) ──< (many) user_api_keys
users (1) ──< (many) events
users (1) ──< (many) incidents
users (1) ──< (many) locations
users (1) ──< (many) cameras
users (1) ──< (many) monitoring_sessions
users (1) ──< (many) reports
users (1) ──< (many) notification_channels
users (1) ──< (many) escalation_rules
users (1) ──< (many) audit_logs
users (1) ──< (many) monitoring_schedules
users (1) ──< (many) event_clips

organizations (1) ──< (many) organization_members ──> (many) users
organizations (1) ──< (many) locations
organizations (1) ──< (many) cameras
organizations (1) ──< (many) incidents

locations (1) ──< (many) cameras
locations (1) ──< (many) events
locations (1) ──< (many) incidents
locations (1) ──< (many) monitoring_sessions
locations (1) ──< (many) monitoring_schedules

cameras (1) ──< (many) events
cameras (1) ──< (many) incidents
cameras (1) ──< (many) camera_frames
cameras (1) ──< (many) event_clips
cameras (1) ──< (many) monitoring_sessions
cameras (1) ──< (many) monitoring_schedules

events (1) ──< (many) event_clips
events (1) ──> (1) incidents (first_event_id)

incidents (1) ──< (many) escalation_history
incidents (1) ──< (many) event_clips
incidents (1) ──> (1) events (first_event_id)

escalation_rules (1) ──< (many) escalation_history
```

---

## Key Features

### 1. Multi-User Support
- Each user has isolated data
- Clerk authentication integration
- User-specific preferences and settings

### 2. Event Tracking
- Comprehensive logging of all system activities
- JSONB metadata for flexible data storage
- Indexed for fast report generation

### 3. Incident Management
- Lifecycle tracking (open → acknowledged → resolved)
- Priority levels
- False alarm tracking
- Response time analytics

### 4. Multi-Location Support
- Multiple sites/buildings
- Geographic coordinates for mapping
- Timezone-aware timestamps

### 5. Team Collaboration
- Organizations with role-based access
- Shared resources
- Per-member preferences

### 6. AI-Powered Reports
- User-provided API keys (Gemini, OpenAI)
- Flexible report types (weekly, monthly, custom)
- JSONB content for rich data

### 7. Escalation System
- Auto-escalate unacknowledged incidents
- Multiple action types (SMS, email, webhook, call)
- Escalation history tracking

### 8. Audit Logging
- Complete compliance trail
- IP address and user agent tracking
- Action history for investigation

---

## Usage Examples

### Creating a User
```sql
INSERT INTO users (clerk_id, email, phone_number, display_name)
VALUES ('user_2abc123', 'user@example.com', '+1234567890', 'John Doe');
```

### Logging an Event
```sql
INSERT INTO events (user_id, event_type, severity, title, description, metadata, camera_id, section)
VALUES (
  'user-uuid',
  'danger_detected',
  'CRITICAL',
  'DANGER detected in closest section',
  'Two people fighting aggressively',
  '{"danger_level": "DANGER", "section": "closest", "person_count": 2, "consecutive_count": 3}'::jsonb,
  'camera-uuid',
  'closest'
);
```

### Creating an Incident
```sql
INSERT INTO incidents (user_id, location_id, status, priority, title, description, first_event_id, camera_id)
VALUES (
  'user-uuid',
  'location-uuid',
  'open',
  'critical',
  'Physical altercation detected',
  'DANGER level detected in closest section',
  'event-uuid',
  'camera-uuid'
);
```

### Generating a Report Query
```sql
-- Get all events for a date range
SELECT 
  event_type,
  severity,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_count
FROM events
WHERE user_id = 'user-uuid'
  AND occurred_at BETWEEN '2026-01-01' AND '2026-01-31'
GROUP BY event_type, severity
ORDER BY count DESC;
```

---

## Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Test database connection
npm run db:test
```

---

## Notes

- All migrations are **idempotent** (safe to run multiple times)
- Migrations use `IF NOT EXISTS` and `ON CONFLICT` for safety
- Timestamps use `TIMESTAMP WITH TIME ZONE` for accuracy
- JSONB columns use GIN indexes for fast queries
- Foreign keys use `ON DELETE CASCADE` or `ON DELETE SET NULL` appropriately

---

## Future Enhancements

- [ ] PostGIS extension for advanced spatial queries
- [ ] Full-text search on event descriptions
- [ ] Materialized views for analytics
- [ ] Partitioning for large event tables
- [ ] Encryption at rest for sensitive data
