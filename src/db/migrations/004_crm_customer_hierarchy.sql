-- ============================================================
-- Migration 004: Customer Parent-Child Hierarchy
-- Adds optional parent_customer_id to crm_customers
-- for supporting company group / subsidiary relationships
-- ============================================================

-- Add parent_customer_id column (nullable, self-referencing FK)
-- ON DELETE SET NULL: if parent is deleted, children become root-level
ALTER TABLE crm_customers ADD COLUMN parent_customer_id TEXT REFERENCES crm_customers(id) ON DELETE SET NULL;

-- Index for fast child lookups
CREATE INDEX IF NOT EXISTS idx_crm_customers_parent ON crm_customers(parent_customer_id);
