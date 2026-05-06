-- Migration: Add write_header column to report_configs
-- Controls whether a header row is written before data rows when generating Excel reports.

ALTER TABLE "report_configs"
  ADD COLUMN IF NOT EXISTS "write_header" BOOLEAN NOT NULL DEFAULT FALSE;
