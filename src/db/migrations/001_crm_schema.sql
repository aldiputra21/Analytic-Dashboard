-- ============================================================
-- CRM Module Migration: 001_crm_schema.sql
-- Creates all CRM tables for MAFINDA CRM Module
-- ============================================================

-- ============================================================
-- CRM ROLE EXTENSION (extends existing users table)
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  crm_role TEXT NOT NULL CHECK(crm_role IN ('Sales_Manager', 'Sales_Executive', 'BD_Manager')),
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_by TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  UNIQUE(user_id, crm_role)
);

-- ============================================================
-- CUSTOMER & CONTACT
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_customers (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  address TEXT,
  npwp TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE(company_name, npwp)
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK(role IN ('PIC', 'Decision_Maker', 'Technical', 'Other')),
  is_primary INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES crm_customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS crm_interactions (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('customer', 'opportunity')),
  type TEXT NOT NULL CHECK(type IN ('Visit', 'Phone', 'Email', 'Meeting', 'Other')),
  interaction_date DATE NOT NULL,
  summary TEXT NOT NULL,
  next_action TEXT,
  next_action_date DATE,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- OPPORTUNITY & PIPELINE
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_opportunities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'Lead' CHECK(stage IN (
    'Lead', 'Qualification', 'Tender', 'Proposal', 'Negotiation', 'Contract'
  )),
  status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN (
    'Active', 'Won', 'Lost', 'On_Hold', 'Cancelled'
  )),
  estimated_value REAL,
  probability INTEGER DEFAULT 10,
  assigned_to TEXT NOT NULL,
  company_id TEXT NOT NULL,
  description TEXT,
  tender_name TEXT,
  tender_estimated_value REAL,
  tender_announcement_date DATE,
  close_reason TEXT,
  close_category TEXT CHECK(close_category IN (
    'Harga', 'Teknis', 'Kompetitor', 'Waktu', 'Lainnya'
  )),
  closed_at DATETIME,
  closed_by TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES crm_customers(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS crm_opportunity_value_history (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  old_value REAL,
  new_value REAL NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS crm_stage_transitions (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  transitioned_by TEXT NOT NULL,
  transitioned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id),
  FOREIGN KEY (transitioned_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS crm_competitors (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  competitor_name TEXT NOT NULL,
  estimated_bid_value REAL,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- QUALIFICATION & FEASIBILITY
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_qualifications (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  technical_capability_score INTEGER,
  resource_availability_score INTEGER,
  contract_value_score INTEGER,
  estimated_margin_score INTEGER,
  risk_score INTEGER,
  feasibility_score REAL NOT NULL,
  recommendation TEXT NOT NULL CHECK(recommendation IN ('Proceed', 'Hold', 'Reject')),
  notes TEXT,
  resource_plan TEXT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft', 'Approved', 'Rejected')),
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_by TEXT,
  approved_at DATETIME,
  FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- ============================================================
-- PROPOSAL & TENDER
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_proposals (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1.0',
  title TEXT NOT NULL,
  template_id TEXT,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN (
    'Draft', 'In_Review', 'Approved', 'Submitted', 'Revision_Required'
  )),
  submission_deadline DATE,
  submitted_at DATETIME,
  submitted_by TEXT,
  submission_method TEXT,
  client_feedback TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS crm_proposal_documents (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL CHECK(file_type IN ('pdf', 'docx', 'xlsx')),
  uploaded_by TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES crm_proposals(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS crm_proposal_versions (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  version TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES crm_proposals(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- COST & RESOURCE ESTIMATION
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_cost_estimations (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  material_cost REAL NOT NULL DEFAULT 0,
  labor_cost REAL NOT NULL DEFAULT 0,
  equipment_cost REAL NOT NULL DEFAULT 0,
  subcontractor_cost REAL NOT NULL DEFAULT 0,
  overhead_cost REAL NOT NULL DEFAULT 0,
  total_cost REAL NOT NULL,
  opportunity_value REAL NOT NULL,
  margin_percentage REAL NOT NULL,
  resource_plan TEXT,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- CONTRACT
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_contracts (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  contract_number TEXT UNIQUE,
  title TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  value REAL NOT NULL,
  start_date DATE,
  end_date DATE,
  scope_of_work TEXT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN (
    'Draft', 'Internal_Review', 'Approved', 'Pending_Client_Signature',
    'Signed', 'Active', 'Completed', 'Terminated'
  )),
  bd_manager_approved_by TEXT,
  bd_manager_approved_at DATETIME,
  sales_manager_approved_by TEXT,
  sales_manager_approved_at DATETIME,
  signed_at DATETIME,
  signed_by TEXT,
  mafinda_project_id TEXT,
  integration_status TEXT CHECK(integration_status IN ('Pending', 'Success', 'Failed')),
  integration_error TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id),
  FOREIGN KEY (customer_id) REFERENCES crm_customers(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS crm_contract_documents (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  uploaded_by TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES crm_contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- ============================================================
-- SALES TARGETS
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_sales_targets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  period TEXT NOT NULL,
  target_revenue REAL NOT NULL,
  target_deals INTEGER,
  set_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (set_by) REFERENCES users(id),
  UNIQUE(user_id, period)
);

-- ============================================================
-- CRM AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('create', 'update', 'delete', 'transition', 'approve', 'reject')),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values TEXT,
  new_values TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage ON crm_opportunities(stage, status);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_assigned ON crm_opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_customer ON crm_opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_entity ON crm_interactions(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_crm_proposals_opportunity ON crm_proposals(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_contracts_opportunity ON crm_contracts(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_log_entity ON crm_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_qualifications_opportunity ON crm_qualifications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_cost_estimations_opportunity ON crm_cost_estimations(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_user_roles_user ON crm_user_roles(user_id);
