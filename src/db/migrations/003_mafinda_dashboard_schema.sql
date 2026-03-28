-- ============================================================
-- MAFINDA Dashboard Enhancement Migration: 003_mafinda_dashboard_schema.sql
-- Creates all tables for MAFINDA Dashboard Enhancement
-- Requirements: 7.6, 7.7, 7.8, 8.7, 8.8, 8.9
-- ============================================================

-- ============================================================
-- DEPARTMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS mafinda_departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS mafinda_projects (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES mafinda_departments(id),
  UNIQUE(department_id, name)
);

CREATE INDEX IF NOT EXISTS idx_mafinda_projects_dept ON mafinda_projects(department_id);

-- ============================================================
-- TARGETS
-- ============================================================

CREATE TABLE IF NOT EXISTS mafinda_targets (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('department', 'project')),
  entity_id TEXT NOT NULL,
  period TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK(period_type IN ('monthly', 'quarterly', 'annual')),
  revenue_target REAL NOT NULL DEFAULT 0,
  operational_cost_target REAL NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id, period, period_type)
);

CREATE INDEX IF NOT EXISTS idx_mafinda_targets_entity ON mafinda_targets(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_mafinda_targets_period ON mafinda_targets(period);

-- ============================================================
-- BALANCE SHEETS
-- ============================================================

CREATE TABLE IF NOT EXISTS mafinda_balance_sheets (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL UNIQUE,
  current_assets REAL NOT NULL DEFAULT 0,
  fixed_assets REAL NOT NULL DEFAULT 0,
  other_assets REAL NOT NULL DEFAULT 0,
  short_term_liabilities REAL NOT NULL DEFAULT 0,
  long_term_liabilities REAL NOT NULL DEFAULT 0,
  paid_in_capital REAL NOT NULL DEFAULT 0,
  retained_earnings REAL NOT NULL DEFAULT 0,
  other_equity REAL NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INCOME STATEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS mafinda_income_statements (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL UNIQUE,
  revenue REAL NOT NULL DEFAULT 0,
  cost_of_goods_sold REAL NOT NULL DEFAULT 0,
  operational_expenses REAL NOT NULL DEFAULT 0,
  interest_expense REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  net_profit REAL NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CASH FLOWS
-- ============================================================

CREATE TABLE IF NOT EXISTS mafinda_cash_flows (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  department_id TEXT,
  project_id TEXT,
  operating_cash_in REAL NOT NULL DEFAULT 0,
  operating_cash_out REAL NOT NULL DEFAULT 0,
  investing_cash_in REAL NOT NULL DEFAULT 0,
  investing_cash_out REAL NOT NULL DEFAULT 0,
  financing_cash_in REAL NOT NULL DEFAULT 0,
  financing_cash_out REAL NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES mafinda_departments(id),
  FOREIGN KEY (project_id) REFERENCES mafinda_projects(id),
  UNIQUE(period, department_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_mafinda_cash_flows_period ON mafinda_cash_flows(period);
CREATE INDEX IF NOT EXISTS idx_mafinda_cash_flows_dept ON mafinda_cash_flows(department_id);
CREATE INDEX IF NOT EXISTS idx_mafinda_cash_flows_project ON mafinda_cash_flows(project_id);

-- ============================================================
-- REVENUE REALIZATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS mafinda_revenue_realizations (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('department', 'project')),
  entity_id TEXT NOT NULL,
  period TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK(period_type IN ('monthly', 'quarterly', 'annual')),
  revenue REAL NOT NULL DEFAULT 0,
  operational_cost REAL NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id, period, period_type)
);

CREATE INDEX IF NOT EXISTS idx_mafinda_realizations_entity ON mafinda_revenue_realizations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_mafinda_realizations_period ON mafinda_revenue_realizations(period);
