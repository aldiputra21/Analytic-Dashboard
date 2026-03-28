-- Migration 002: Financial Ratio Monitoring System Schema
-- Requirements: 11.1, 12.7

-- ============================================================
-- Financial Ratio Monitoring System Tables
-- ============================================================

-- Subsidiaries Table
CREATE TABLE IF NOT EXISTS subsidiaries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry_sector TEXT NOT NULL,
  fiscal_year_start_month INTEGER NOT NULL CHECK(fiscal_year_start_month BETWEEN 1 AND 12),
  currency TEXT NOT NULL DEFAULT 'IDR',
  tax_rate REAL NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subsidiaries_active ON subsidiaries(is_active);
CREATE INDEX IF NOT EXISTS idx_subsidiaries_industry ON subsidiaries(industry_sector);

-- Financial Data Table
CREATE TABLE IF NOT EXISTS frs_financial_data (
  id TEXT PRIMARY KEY,
  subsidiary_id TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK(period_type IN ('monthly', 'quarterly', 'annual')),
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,

  -- Income Statement
  revenue REAL NOT NULL,
  net_profit REAL NOT NULL,
  operating_cash_flow REAL NOT NULL,
  interest_expense REAL NOT NULL DEFAULT 0,

  -- Balance Sheet
  cash REAL NOT NULL,
  inventory REAL NOT NULL DEFAULT 0,
  current_assets REAL NOT NULL,
  total_assets REAL NOT NULL,
  current_liabilities REAL NOT NULL,
  short_term_debt REAL NOT NULL DEFAULT 0,
  current_portion_long_term_debt REAL NOT NULL DEFAULT 0,
  total_liabilities REAL NOT NULL,
  total_equity REAL NOT NULL,

  -- Metadata
  is_restated INTEGER NOT NULL DEFAULT 0,
  restatement_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,

  FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id),
  UNIQUE(subsidiary_id, period_type, period_start_date)
);

CREATE INDEX IF NOT EXISTS idx_frs_financial_data_subsidiary ON frs_financial_data(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_frs_financial_data_period ON frs_financial_data(period_start_date, period_end_date);
CREATE INDEX IF NOT EXISTS idx_frs_financial_data_lookup ON frs_financial_data(subsidiary_id, period_type, period_start_date);
-- Composite index for common subsidiary+period queries (Req 12.7)
CREATE INDEX IF NOT EXISTS idx_financial_data_subsidiary_period ON frs_financial_data(subsidiary_id, period_start_date DESC);

-- Calculated Ratios Table
CREATE TABLE IF NOT EXISTS frs_calculated_ratios (
  id TEXT PRIMARY KEY,
  financial_data_id TEXT NOT NULL,
  subsidiary_id TEXT NOT NULL,

  -- Profitability Ratios
  roa REAL,
  roe REAL,
  npm REAL,

  -- Leverage Ratio
  der REAL,

  -- Liquidity Ratios
  current_ratio REAL,
  quick_ratio REAL,
  cash_ratio REAL,

  -- Cash Flow Ratios
  ocf_ratio REAL,
  dscr REAL,

  -- Health Score
  health_score REAL NOT NULL DEFAULT 0,

  calculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (financial_data_id) REFERENCES frs_financial_data(id) ON DELETE CASCADE,
  FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id),
  UNIQUE(financial_data_id)
);

CREATE INDEX IF NOT EXISTS idx_frs_calculated_ratios_subsidiary ON frs_calculated_ratios(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_frs_calculated_ratios_health ON frs_calculated_ratios(health_score);

-- Thresholds Table
CREATE TABLE IF NOT EXISTS frs_thresholds (
  id TEXT PRIMARY KEY,
  subsidiary_id TEXT NOT NULL,
  ratio_name TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK(period_type IN ('monthly', 'quarterly', 'annual')),

  -- For ratios where higher is better (ROA, ROE, NPM, Current Ratio, Quick Ratio, Cash Ratio, OCF Ratio, DSCR)
  healthy_min REAL,
  moderate_min REAL,
  risky_max REAL,

  -- For ratios where lower is better (DER)
  healthy_max REAL,
  moderate_max REAL,
  risky_min REAL,

  is_default INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT NOT NULL,

  FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id),
  UNIQUE(subsidiary_id, ratio_name, period_type)
);

CREATE INDEX IF NOT EXISTS idx_frs_thresholds_subsidiary ON frs_thresholds(subsidiary_id);

-- Alerts Table
CREATE TABLE IF NOT EXISTS frs_alerts (
  id TEXT PRIMARY KEY,
  subsidiary_id TEXT NOT NULL,
  financial_data_id TEXT NOT NULL,
  ratio_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('high', 'medium', 'low')),

  current_value REAL NOT NULL,
  threshold_value REAL NOT NULL,
  message TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_at DATETIME,
  acknowledged_by TEXT,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id),
  FOREIGN KEY (financial_data_id) REFERENCES frs_financial_data(id)
);

CREATE INDEX IF NOT EXISTS idx_frs_alerts_subsidiary ON frs_alerts(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_frs_alerts_status ON frs_alerts(status);
CREATE INDEX IF NOT EXISTS idx_frs_alerts_severity ON frs_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_frs_alerts_created ON frs_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_frs_alerts_subsidiary_status ON frs_alerts(subsidiary_id, status);

-- FRS Users Table (separate from MAFINDA users)
CREATE TABLE IF NOT EXISTS frs_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'bod', 'subsidiary_manager')),
  full_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_frs_users_role ON frs_users(role);
CREATE INDEX IF NOT EXISTS idx_frs_users_active ON frs_users(is_active);

-- User Subsidiary Access Table
CREATE TABLE IF NOT EXISTS frs_user_subsidiary_access (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subsidiary_id TEXT NOT NULL,
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  granted_by TEXT NOT NULL,

  FOREIGN KEY (user_id) REFERENCES frs_users(id) ON DELETE CASCADE,
  FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE CASCADE,
  UNIQUE(user_id, subsidiary_id)
);

CREATE INDEX IF NOT EXISTS idx_frs_user_access_user ON frs_user_subsidiary_access(user_id);
CREATE INDEX IF NOT EXISTS idx_frs_user_access_subsidiary ON frs_user_subsidiary_access(subsidiary_id);

-- FRS Audit Log Table
CREATE TABLE IF NOT EXISTS frs_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('create', 'update', 'delete', 'login', 'logout', 'export', 'backup', 'restore')),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  subsidiary_id TEXT,

  old_values TEXT,
  new_values TEXT,
  justification TEXT,

  ip_address TEXT,
  user_agent TEXT,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_frs_audit_log_user ON frs_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_frs_audit_log_entity ON frs_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_frs_audit_log_subsidiary ON frs_audit_log(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_frs_audit_log_created ON frs_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_frs_audit_log_user_date ON frs_audit_log(user_id, created_at);

-- Scheduled Reports Table
CREATE TABLE IF NOT EXISTS frs_scheduled_reports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK(report_type IN ('consolidated', 'individual', 'benchmark')),
  subsidiary_ids TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK(period_type IN ('monthly', 'quarterly', 'annual')),
  format TEXT NOT NULL CHECK(format IN ('pdf', 'excel')),

  schedule_frequency TEXT NOT NULL CHECK(schedule_frequency IN ('monthly', 'quarterly', 'annual')),
  schedule_day INTEGER NOT NULL CHECK(schedule_day BETWEEN 1 AND 31),

  recipients TEXT NOT NULL,

  is_active INTEGER NOT NULL DEFAULT 1,
  last_run DATETIME,
  next_run DATETIME NOT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_frs_scheduled_reports_next_run ON frs_scheduled_reports(next_run, is_active);

-- Financial Data History Table (versioning)
CREATE TABLE IF NOT EXISTS frs_financial_data_history (
  id TEXT PRIMARY KEY,
  financial_data_id TEXT NOT NULL,
  version INTEGER NOT NULL,

  subsidiary_id TEXT NOT NULL,
  period_type TEXT NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  revenue REAL NOT NULL,
  net_profit REAL NOT NULL,
  operating_cash_flow REAL NOT NULL,
  interest_expense REAL NOT NULL,
  cash REAL NOT NULL,
  inventory REAL NOT NULL,
  current_assets REAL NOT NULL,
  total_assets REAL NOT NULL,
  current_liabilities REAL NOT NULL,
  short_term_debt REAL NOT NULL,
  current_portion_long_term_debt REAL NOT NULL,
  total_liabilities REAL NOT NULL,
  total_equity REAL NOT NULL,

  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_by TEXT NOT NULL,
  change_reason TEXT,

  FOREIGN KEY (financial_data_id) REFERENCES frs_financial_data(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_frs_financial_data_history_lookup ON frs_financial_data_history(financial_data_id, version);

-- Threshold History Table
CREATE TABLE IF NOT EXISTS frs_threshold_history (
  id TEXT PRIMARY KEY,
  threshold_id TEXT NOT NULL,
  subsidiary_id TEXT NOT NULL,
  ratio_name TEXT NOT NULL,
  period_type TEXT NOT NULL,
  old_values TEXT NOT NULL,
  new_values TEXT NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_frs_threshold_history_subsidiary ON frs_threshold_history(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_frs_threshold_history_changed ON frs_threshold_history(changed_at);

-- Financial Data Archive Table (for data older than 10 years)
CREATE TABLE IF NOT EXISTS frs_financial_data_archive (
  id TEXT PRIMARY KEY,
  original_id TEXT NOT NULL,
  subsidiary_id TEXT NOT NULL,
  period_type TEXT NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  revenue REAL NOT NULL,
  net_profit REAL NOT NULL,
  operating_cash_flow REAL NOT NULL,
  interest_expense REAL NOT NULL,
  cash REAL NOT NULL,
  inventory REAL NOT NULL,
  current_assets REAL NOT NULL,
  total_assets REAL NOT NULL,
  current_liabilities REAL NOT NULL,
  short_term_debt REAL NOT NULL,
  current_portion_long_term_debt REAL NOT NULL,
  total_liabilities REAL NOT NULL,
  total_equity REAL NOT NULL,
  archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_frs_archive_subsidiary ON frs_financial_data_archive(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_frs_archive_period ON frs_financial_data_archive(period_end_date);
