-- Migration: Add report_configs and report_outputs tables for Dynamic Excel Report feature

CREATE TABLE IF NOT EXISTS "report_configs" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title_id"          VARCHAR(200) NOT NULL,
  "title_en"          VARCHAR(200) NOT NULL,
  "filters"           JSONB NOT NULL DEFAULT '[]',
  "columns"           JSONB NOT NULL DEFAULT '[]',
  "query"             TEXT NOT NULL,
  "template_filename" VARCHAR(255),
  "cell_info_filter"  VARCHAR(10),
  "start_row"         INTEGER NOT NULL DEFAULT 1,
  "allowed_roles"     JSONB NOT NULL DEFAULT '[]',
  "retention_type"    VARCHAR(20) NOT NULL DEFAULT 'days',
  "retention_days"    INTEGER,
  "is_active"         BOOLEAN NOT NULL DEFAULT TRUE,
  "created_by"        VARCHAR(100) NOT NULL,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_by"        VARCHAR(100),
  "updated_at"        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "report_outputs" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_config_id"  UUID NOT NULL REFERENCES "report_configs"("id"),
  "user_id"           UUID NOT NULL REFERENCES "users"("id"),
  "filter_values"     JSONB NOT NULL DEFAULT '{}',
  "status"            VARCHAR(30) NOT NULL DEFAULT 'pending',
  "started_at"        TIMESTAMPTZ,
  "completed_at"      TIMESTAMPTZ,
  "error_message"     TEXT,
  "output_path"       VARCHAR(500),
  "output_filename"   VARCHAR(255),
  "file_size"         BIGINT,
  "downloaded_at"     TIMESTAMPTZ,
  "deleted_at"        TIMESTAMPTZ,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by"        VARCHAR(100) NOT NULL
);
