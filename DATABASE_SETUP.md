# Neon Database Setup - Complete ✅

This document describes the Neon PostgreSQL database setup for the Watchdog application.

## ✅ What's Been Set Up

### 1. Database Connection
- ✅ Neon database connection configured via `DATABASE_URL` in `.env.local`
- ✅ Database utility created at `lib/db.ts` for reusable database connections
- ✅ PostgreSQL client (`pg`) installed and configured

### 2. Migration System
- ✅ SQL migration files in `migrations/` directory
- ✅ Migration runner script (`migrations/run-migrations.js`)
- ✅ Migration tracking via `schema_migrations` table
- ✅ NPM scripts for running migrations

### 3. Database Schema
- ✅ **sms_state** table - Replaces `.sms-state.json` file storage
- ✅ **alert_records** table - Stores alert history (replaces in-memory array)
- ✅ **camera_frames** table - Stores camera frame data (replaces in-memory Map)
- ✅ **schema_migrations** table - Tracks applied migrations

## 📁 Project Structure

```
watchdog/
├── migrations/
│   ├── 001_initial_schema.sql    # SMS state and alert records
│   ├── 002_camera_frames.sql     # Camera frames storage
│   ├── run-migrations.js         # Migration runner
│   └── README.md                 # Migration documentation
├── lib/
│   └── db.ts                     # Database connection utility
├── scripts/
│   └── test-db-connection.js     # Database connection test
└── .env.local                    # Contains DATABASE_URL
```

## 🚀 Available Commands

### Run Migrations
```bash
npm run migrate
```
Runs all pending SQL migrations in order. Safe to run multiple times - already applied migrations are skipped.

### Check Migration Status
```bash
npm run migrate:status
```
Shows which migrations have been applied.

### Test Database Connection
```bash
npm run db:test
```
Tests the database connection and shows current state of all tables.

## 📊 Database Schema Details

### sms_state (Singleton Table)
Stores the current SMS alert state. Only one row exists (id = 'singleton').

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Always 'singleton' (primary key) |
| consecutive_danger_count | INTEGER | Current streak of DANGER events |
| last_alert_sent_time | BIGINT | Unix timestamp (ms) of last alert |
| last_danger_level | TEXT | Last recorded level (SAFE/WARNING/DANGER) |
| created_at | TIMESTAMP | Row creation time |
| updated_at | TIMESTAMP | Last update time |

### alert_records
Stores alert history (replaces `alertHistory` array in `.sms-state.json`).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID (primary key) |
| timestamp | BIGINT | Unix timestamp (ms) when alert occurred |
| danger_level | TEXT | SAFE, WARNING, or DANGER |
| description | TEXT | Alert description |
| reason | TEXT | initial, response_1, or response_2 |
| created_at | TIMESTAMP | Row creation time |

**Indexes:**
- `idx_alert_records_timestamp` - Fast ordering by timestamp
- `idx_alert_records_created_at` - Fast cleanup queries

### camera_frames
Stores camera frame data (replaces in-memory `Map` in `app/api/camera/store.ts`).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID (primary key) |
| camera_id | TEXT | Camera identifier |
| image_data | TEXT | Base64 encoded image or URL |
| timestamp | BIGINT | Unix timestamp (ms) |
| created_at | TIMESTAMP | Row creation time |

**Indexes:**
- `idx_camera_frames_camera_timestamp` - Fast lookups by camera and time
- `idx_camera_frames_timestamp` - Fast cleanup queries

## 🔄 Next Steps (Future Work)

The database is ready, but the application code still uses file-based storage. To complete the migration:

1. **Update `app/sms/smsState.ts`**:
   - Replace file I/O with database queries
   - Use `lib/db.ts` for database access
   - Maintain backward compatibility (read from `.sms-state.json` on first run, migrate to DB)

2. **Update `app/api/camera/store.ts`**:
   - Replace in-memory `Map` with database queries
   - Use `camera_frames` table

3. **Add User Support** (when Clerk is integrated):
   - Add `user_id` column to relevant tables
   - Associate alerts and frames with users

## ⚠️ Notes

### SSL Warning
You may see a warning about SSL modes. This is a future compatibility notice and doesn't affect current functionality. The connection is secure.

### Backward Compatibility
The current implementation still uses `.sms-state.json` files. The database is ready but not yet integrated into the application code. This allows for a gradual migration.

### Migration Safety
All migrations use `IF NOT EXISTS` and `ON CONFLICT` clauses, making them safe to run multiple times. The migration runner tracks applied migrations to prevent duplicates.

## 🔍 Verification

To verify everything is working:

```bash
# Test connection and see current state
npm run db:test

# Check migration status
npm run migrate:status

# Run migrations (will skip already applied ones)
npm run migrate
```

## 📝 Creating New Migrations

1. Create a new file: `migrations/XXX_description.sql`
2. Write your SQL (use `IF NOT EXISTS`, `ON CONFLICT`, etc. for idempotency)
3. Run `npm run migrate`

Example:
```sql
-- migrations/003_add_user_support.sql
ALTER TABLE alert_records ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_alert_records_user_id ON alert_records(user_id);
```

## 🎯 Current Status

✅ **Database**: Connected and operational  
✅ **Migrations**: All initial migrations applied  
✅ **Schema**: Tables created and ready  
⏳ **Integration**: Application code still uses file storage (to be migrated)

The database infrastructure is complete and ready for integration with your application code!
