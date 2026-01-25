# Database Migrations

This directory contains SQL migration files for the Watchdog Neon PostgreSQL database.

## Migration Naming Convention

Format: `XXX_description.sql`
- `XXX` - Sequential number (001, 002, 003...)
- `description` - Brief description of what the migration does

## Running Migrations

```bash
npm run migrate
```

This will:
1. Connect to your Neon database using `DATABASE_URL` from `.env.local`
2. Create a `schema_migrations` table to track applied migrations
3. Run all `.sql` files in order
4. Skip migrations that have already been applied

## Creating a New Migration

1. Create a new file: `migrations/XXX_your_description.sql`
2. Write your SQL (CREATE TABLE, ALTER TABLE, etc.)
3. Make sure it's idempotent (use `IF NOT EXISTS`, `ON CONFLICT`, etc.)
4. Run `npm run migrate`

## Migration Files

### 001_initial_schema.sql
**Purpose:** Foundation tables for SMS alert system

**Tables Created:**
- `sms_state` - Singleton table tracking SMS alert state (replaces `.sms-state.json`)
- `alert_records` - History of SMS alerts sent

**Key Features:**
- Singleton pattern for SMS state
- Unix timestamp (milliseconds) for compatibility
- Indexes for fast timestamp queries

---

### 002_camera_frames.sql
**Purpose:** Store camera frame data (replaces in-memory Map)

**Tables Created:**
- `camera_frames` - Video frame storage

**Key Features:**
- Base64 encoded image data or URLs
- Indexes for fast camera_id + timestamp lookups
- Automatic cleanup support

---

### 003_users_and_events.sql
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

### 004_locations_and_cameras.sql
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

### 005_incidents_and_escalation.sql
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

### 006_organizations_and_teams.sql
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

### 007_notification_channels.sql
**Purpose:** Multi-channel notification system

**Tables Created:**
- `notification_channels` - User-defined notification channels

**Key Features:**
- Multiple channel types: SMS, email, webhook, Slack, Teams, push
- JSONB configuration for flexible channel setup
- Per-channel severity thresholds
- Channel verification and usage tracking

---

### 008_audit_logs.sql
**Purpose:** Comprehensive audit logging for compliance

**Tables Created:**
- `audit_logs` - Complete audit trail of all actions

**Key Features:**
- Tracks all user actions (login, settings changes, incident management)
- IP address and user agent tracking
- JSONB details for flexible context storage
- Compliance-ready (SOC2, HIPAA if applicable)

---

### 009_monitoring_schedules.sql
**Purpose:** Automated monitoring schedules

**Tables Created:**
- `monitoring_schedules` - Time-based monitoring rules

**Key Features:**
- Cron-like scheduling (days of week, start/end times)
- Timezone-aware scheduling
- Per-schedule alert sensitivity
- Auto-start/stop monitoring

---

### 010_event_clips.sql
**Purpose:** Video clip storage for events

**Tables Created:**
- `event_clips` - Video clips associated with events/incidents

**Key Features:**
- Links to events and incidents
- Multiple storage providers (S3, Cloudinary, local)
- Automatic expiration for storage management
- Thumbnail support

---

## Complete Database Schema

The database now contains **20 tables**:

1. `sms_state` - SMS alert state
2. `alert_records` - Alert history
3. `camera_frames` - Frame storage
4. `users` - User profiles
5. `user_api_keys` - API keys for AI
6. `events` - Event tracking (core)
7. `monitoring_sessions` - Monitoring sessions
8. `reports` - Generated reports
9. `locations` - Physical locations
10. `cameras` - Camera devices
11. `incidents` - Incident management
12. `escalation_rules` - Escalation config
13. `escalation_history` - Escalation log
14. `organizations` - Organizations
15. `organization_members` - Team members
16. `notification_channels` - Notification channels
17. `audit_logs` - Audit trail
18. `monitoring_schedules` - Monitoring schedules
19. `event_clips` - Video clips
20. `schema_migrations` - Migration tracking

## Notes

- Migrations are tracked in `schema_migrations` table
- All migrations should be idempotent (safe to run multiple times)
- Timestamps are stored as BIGINT (Unix milliseconds) to match existing code
- JSONB columns use GIN indexes for fast queries
- Foreign keys use appropriate ON DELETE actions

## Documentation

For complete database documentation, see:
- `DATABASE_SCHEMA.md` - Full schema documentation with examples
- `DATABASE_SETUP.md` - Setup and configuration guide
