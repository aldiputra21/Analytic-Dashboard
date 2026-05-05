-- Migration: Add name_en to approval_workflows
ALTER TABLE approval_workflows
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(100);
