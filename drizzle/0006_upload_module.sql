-- Migration: Add upload_sessions and upload_staging_rows tables for Export & Upload Module

CREATE TABLE IF NOT EXISTS "upload_sessions" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"       UUID NOT NULL REFERENCES "users"("id"),
  "module"        VARCHAR(50) NOT NULL,
  "entity_type"   VARCHAR(50) NOT NULL,
  "file_name"     VARCHAR(255) NOT NULL,
  "file_path"     VARCHAR(500),
  "file_size"     BIGINT NOT NULL,
  "total_rows"    INTEGER NOT NULL,
  "valid_rows"    INTEGER NOT NULL,
  "invalid_rows"  INTEGER NOT NULL,
  "status"        VARCHAR(20) NOT NULL DEFAULT 'pending_review',
  "approval_id"   UUID REFERENCES "approvals"("id"),
  "created_by"    VARCHAR(100) NOT NULL,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_by"    VARCHAR(100),
  "updated_at"    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "upload_staging_rows" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id"      UUID NOT NULL REFERENCES "upload_sessions"("id") ON DELETE CASCADE,
  "row_number"      INTEGER NOT NULL,
  "row_data"        JSONB NOT NULL,
  "is_valid"        BOOLEAN NOT NULL DEFAULT FALSE,
  "error_messages"  JSONB,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_upload_staging_rows_session_id"
  ON "upload_staging_rows" ("session_id");

CREATE INDEX IF NOT EXISTS "idx_upload_staging_rows_session_row"
  ON "upload_staging_rows" ("session_id", "row_number");
