import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import helmet from "helmet";
import { initCRMSchema } from "./src/db/initCRM.js";
import { initFinancialRatioSchema } from "./src/db/initFinancialRatio.js";
import { initMafindaDashboardSchema } from "./src/db/initMafindaDashboard.js";
import { loadCRMRoles } from "./src/middleware/crmRbac.js";
import { createCustomerRouter, createContactRouter, createContactStandaloneRouter } from "./src/routes/crm/customers.js";
import { createInteractionRouter } from "./src/routes/crm/interactions.js";
import { createFRSRouter } from "./src/routes/financial/index.js";
import { getFRSConfig } from "./src/config/frsConfig.js";
import { createDepartmentRouter } from "./src/routes/management/departments.js";
import { createProjectRouter } from "./src/routes/management/projects.js";
import { createTargetRouter } from "./src/routes/management/targets.js";
import { createFinancialStatementRouter } from "./src/routes/management/financialStatements.js";
import { createMafindaDashboardRouter } from "./src/routes/dashboard/mafindaDashboard.js";

// Validate FRS configuration on startup (Requirements: 14.3)
try {
  getFRSConfig();
  console.log('[FRS] Configuration validated successfully');
} catch (err: any) {
  console.error(err.message);
  // Don't exit in dev - allow server to start with defaults
}

const db = new Database("finance.db");

// Initialize CRM schema
initCRMSchema(db);

// Initialize Financial Ratio Monitoring System schema
initFinancialRatioSchema(db);

// Initialize MAFINDA Dashboard Enhancement schema
initMafindaDashboardSchema(db);

// Initialize Database - MAFINDA Schema
db.exec(`
  -- Roles Table
  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    permissions TEXT NOT NULL -- JSON array
  );

  -- Users Table (Banking Officer, Finance Analyst, Admin)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role_id TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    FOREIGN KEY (role_id) REFERENCES roles(id)
  );

  -- Companies Table
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL,
    industry TEXT,
    fiscal_year_start TEXT DEFAULT '01',
    currency TEXT DEFAULT 'IDR',
    tax_rate REAL DEFAULT 0,
    status TEXT DEFAULT 'Active',
    thresholds TEXT, -- JSON object
    ideal_ratios TEXT, -- JSON object
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- User Company Access
  CREATE TABLE IF NOT EXISTS user_company_access (
    user_id INTEGER,
    company_id TEXT,
    PRIMARY KEY (user_id, company_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  -- Divisions Table (ONM, WS, etc.)
  CREATE TABLE IF NOT EXISTS divisions (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(company_id, name)
  );

  -- Projects Table
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    division_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (division_id) REFERENCES divisions(id),
    UNIQUE(division_id, name)
  );

  -- Weekly Cash Flow Table (W1-W5)
  CREATE TABLE IF NOT EXISTS weekly_cash_flow (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    period TEXT NOT NULL,
    week TEXT NOT NULL CHECK(week IN ('W1', 'W2', 'W3', 'W4', 'W5')),
    revenue REAL NOT NULL DEFAULT 0,
    cash_in REAL NOT NULL DEFAULT 0,
    cash_out REAL NOT NULL DEFAULT 0,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK(status IN ('pending_approval', 'approved', 'rejected')),
    submitted_by INTEGER NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER,
    approved_at DATETIME,
    rejection_reason TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (submitted_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    UNIQUE(project_id, period, week)
  );

  -- Targets Table
  CREATE TABLE IF NOT EXISTS targets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    period TEXT NOT NULL,
    revenue_target REAL NOT NULL DEFAULT 0,
    cash_in_target REAL NOT NULL DEFAULT 0,
    cash_out_target REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK(status IN ('pending_approval', 'approved', 'rejected')),
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER,
    approved_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    UNIQUE(project_id, period)
  );

  -- Balance Sheet Table (Enhanced with new fields)
  CREATE TABLE IF NOT EXISTS balance_sheets (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    period TEXT NOT NULL,
    
    -- Current Assets
    kas REAL NOT NULL DEFAULT 0,
    piutang REAL NOT NULL DEFAULT 0,
    persediaan REAL NOT NULL DEFAULT 0,
    current_assets_lain_lain REAL NOT NULL DEFAULT 0,
    
    -- Fixed Assets
    tanah_bangunan REAL NOT NULL DEFAULT 0,
    mesin_peralatan REAL NOT NULL DEFAULT 0,
    kendaraan REAL NOT NULL DEFAULT 0,
    akumulasi_penyusutan REAL NOT NULL DEFAULT 0,
    
    -- Other Assets
    other_assets REAL NOT NULL DEFAULT 0,
    
    -- Current Liabilities
    hutang_usaha REAL NOT NULL DEFAULT 0,
    hutang_bank REAL NOT NULL DEFAULT 0,
    current_liabilities_lain_lain REAL NOT NULL DEFAULT 0,
    
    -- Long Term Liabilities
    hutang_jangka_panjang REAL NOT NULL DEFAULT 0,
    
    -- Equity
    modal REAL NOT NULL DEFAULT 0,
    laba_ditahan REAL NOT NULL DEFAULT 0,
    deviden REAL NOT NULL DEFAULT 0,
    
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK(status IN ('pending_approval', 'approved', 'rejected')),
    submitted_by INTEGER NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER,
    approved_at DATETIME,
    
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (submitted_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    UNIQUE(company_id, period)
  );

  -- Income Statement Table
  CREATE TABLE IF NOT EXISTS income_statements (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    period TEXT NOT NULL,
    
    -- Revenue
    revenue REAL NOT NULL DEFAULT 0,
    
    -- Cost of Goods Sold
    cogs REAL NOT NULL DEFAULT 0,
    
    -- Operating Expenses (7 categories for cost control)
    operational_expenses REAL NOT NULL DEFAULT 0,
    marketing_sales REAL NOT NULL DEFAULT 0,
    administrative_costs REAL NOT NULL DEFAULT 0,
    it_technology REAL NOT NULL DEFAULT 0,
    human_resources REAL NOT NULL DEFAULT 0,
    maintenance_repairs REAL NOT NULL DEFAULT 0,
    miscellaneous REAL NOT NULL DEFAULT 0,
    
    -- Other Income/Expenses
    other_income REAL NOT NULL DEFAULT 0,
    other_expenses REAL NOT NULL DEFAULT 0,
    
    -- Tax
    tax REAL NOT NULL DEFAULT 0,
    
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK(status IN ('pending_approval', 'approved', 'rejected')),
    submitted_by INTEGER NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER,
    approved_at DATETIME,
    
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (submitted_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    UNIQUE(company_id, period)
  );

  -- Cost Control Budget Table
  CREATE TABLE IF NOT EXISTS cost_control_budgets (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    period TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN (
      'operational_expenses',
      'marketing_sales',
      'administrative_costs',
      'it_technology',
      'human_resources',
      'maintenance_repairs',
      'miscellaneous'
    )),
    budgeted_amount REAL NOT NULL DEFAULT 0,
    notes TEXT,
    action_plan TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(company_id, period, category)
  );

  -- Approval Audit Log
  CREATE TABLE IF NOT EXISTS approval_audit_log (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('cash_flow', 'target', 'balance_sheet', 'income_statement')),
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('submitted', 'approved', 'rejected')),
    performed_by INTEGER NOT NULL,
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (performed_by) REFERENCES users(id)
  );

  -- Projection Parameters
  CREATE TABLE IF NOT EXISTS projection_parameters (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    growth_rate REAL NOT NULL DEFAULT 0.05,
    seasonality_factor REAL NOT NULL DEFAULT 1.0,
    confidence_level REAL NOT NULL DEFAULT 0.95,
    updated_by INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    UNIQUE(project_id)
  );

  -- Legacy financial_statements table (keep for backward compatibility)
  CREATE TABLE IF NOT EXISTS financial_statements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT NOT NULL,
    period TEXT NOT NULL,
    revenue REAL DEFAULT 0,
    net_profit REAL DEFAULT 0,
    total_assets REAL DEFAULT 0,
    total_equity REAL DEFAULT 0,
    total_liabilities REAL DEFAULT 0,
    current_assets REAL DEFAULT 0,
    current_liabilities REAL DEFAULT 0,
    quick_assets REAL DEFAULT 0,
    cash REAL DEFAULT 0,
    operating_cash_flow REAL DEFAULT 0,
    ar_aging_90_plus REAL DEFAULT 0,
    interest_expense REAL DEFAULT 0,
    short_term_debt REAL DEFAULT 0,
    long_term_debt REAL DEFAULT 0,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  -- Parameters Table
  CREATE TABLE IF NOT EXISTS parameters (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed initial data if empty - MAFINDA Roles
const roleCount = db.prepare("SELECT COUNT(*) as count FROM roles").get() as { count: number };
if (roleCount.count === 0) {
  const insertRole = db.prepare("INSERT INTO roles (id, name, permissions) VALUES (?, ?, ?)");
  insertRole.run("ADMIN", "Admin", JSON.stringify(["view_dashboard", "upload_data", "edit_benchmark", "manage_user", "access_alert", "export_report", "approve_all", "manage_divisions", "manage_projects"]));
  insertRole.run("FINANCE_ANALYST", "Finance Analyst", JSON.stringify(["view_dashboard", "read:target", "write:target", "approve:cash_flow", "read:cash_flow", "write:financial_statements", "read:financial_statements", "read:dashboard"]));
  insertRole.run("BANKING_OFFICER", "Banking Officer", JSON.stringify(["view_dashboard", "write:cash_flow", "read:cash_flow", "read:target", "read:dashboard"]));

  const insertUser = db.prepare("INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)");
  insertUser.run("admin", "admin123", "ADMIN");
  insertUser.run("finance", "finance123", "FINANCE_ANALYST");
  insertUser.run("banking", "banking123", "BANKING_OFFICER");
}

const companyCount = db.prepare("SELECT COUNT(*) as count FROM companies").get() as { count: number };
if (companyCount.count === 0) {
  const insertCompany = db.prepare("INSERT INTO companies (id, name, code, color, industry, currency, thresholds, ideal_ratios) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const defaultThresholds = JSON.stringify({ liquidity_drop: 20, der_rise: 15, margin_drop_months: 3 });
  const defaultIdeals = JSON.stringify({ current_ratio: 1.5, quick_ratio: 1, der: 2, npm: 10, roa: 5, roe: 15 });

  insertCompany.run("ASI", "PT Asia Serv Indonesia", "ASI", "#0f172a", "Industrial Services", "IDR", defaultThresholds, defaultIdeals);
  insertCompany.run("TSI", "PT Titian Servis Indonesia", "TSI", "#334155", "Services", "IDR", defaultThresholds, defaultIdeals);

  // Grant admin access to all companies
  const adminId = (db.prepare("SELECT id FROM users WHERE username = 'admin'").get() as any).id;
  const financeId = (db.prepare("SELECT id FROM users WHERE username = 'finance'").get() as any).id;
  const bankingId = (db.prepare("SELECT id FROM users WHERE username = 'banking'").get() as any).id;
  
  const insertAccess = db.prepare("INSERT OR IGNORE INTO user_company_access (user_id, company_id) VALUES (?, ?)");
  [adminId, financeId, bankingId].forEach(userId => {
    insertAccess.run(userId, "ASI");
    insertAccess.run(userId, "TSI");
  });

  // Create sample divisions
  const insertDivision = db.prepare("INSERT INTO divisions (id, company_id, name) VALUES (?, ?, ?)");
  insertDivision.run("DIV_ASI_ONM", "ASI", "ONM (Operational)");
  insertDivision.run("DIV_ASI_WS", "ASI", "WS (Workshop)");
  insertDivision.run("DIV_TSI_ONM", "TSI", "ONM (Operational)");
  insertDivision.run("DIV_TSI_WS", "TSI", "WS (Workshop)");

  // Create sample projects
  const insertProject = db.prepare("INSERT INTO projects (id, division_id, name, description) VALUES (?, ?, ?, ?)");
  insertProject.run("PROJ_ASI_ONM_1", "DIV_ASI_ONM", "Project Alpha", "Main operational project for ASI");
  insertProject.run("PROJ_ASI_ONM_2", "DIV_ASI_ONM", "Project Beta", "Secondary operational project");
  insertProject.run("PROJ_ASI_WS_1", "DIV_ASI_WS", "Workshop Maintenance", "Regular maintenance services");
  insertProject.run("PROJ_TSI_ONM_1", "DIV_TSI_ONM", "Project Gamma", "Main operational project for TSI");
  insertProject.run("PROJ_TSI_WS_1", "DIV_TSI_WS", "Workshop Services", "Workshop service operations");
}

const statementCount = db.prepare("SELECT COUNT(*) as count FROM financial_statements").get() as { count: number };
if (statementCount.count === 0) {
  const insertStatement = db.prepare(`
    INSERT INTO financial_statements 
    (company_id, period, revenue, net_profit, total_assets, total_equity, total_liabilities, current_assets, current_liabilities, quick_assets, cash, operating_cash_flow, ar_aging_90_plus, interest_expense, short_term_debt, long_term_debt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Generate data for 3 years (2024-01 to 2026-12)
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2026-12-31');
  const periods: string[] = [];
  
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    periods.push(`${year}-${month}`);
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  console.log(`Generating dummy data for ${periods.length} periods across 5 companies...`);
  
  periods.forEach((period, idx) => {
    // ASI Data (Steady Growth)
    const baseRevASI = 1000000 + (idx * 50000) + (Math.random() * 100000);
    const profitMarginASI = 0.15 + (Math.random() * 0.05);
    insertStatement.run(
      "ASI", period, 
      baseRevASI, 
      baseRevASI * profitMarginASI, 
      5000000 + (idx * 100000), 
      3000000 + (idx * 60000), 
      2000000 + (idx * 40000), 
      1500000 + (idx * 30000), 
      800000 + (idx * 15000), 
      1200000 + (idx * 25000), 
      500000 + (idx * 10000), 
      baseRevASI * 0.1, 
      100000, 50000, 200000, 800000
    );
    
    // TSI Data (Moderate Growth)
    const baseRevTSI = 800000 + (idx * 60000) + (Math.random() * 80000);
    const profitMarginTSI = 0.12 + (Math.random() * 0.04);
    insertStatement.run(
      "TSI", period, 
      baseRevTSI, 
      baseRevTSI * profitMarginTSI, 
      4500000 + (idx * 90000), 
      2500000 + (idx * 50000), 
      2000000 + (idx * 40000), 
      1200000 + (idx * 25000), 
      900000 + (idx * 18000), 
      900000 + (idx * 20000), 
      400000 + (idx * 8000), 
      baseRevTSI * 0.08, 
      150000, 60000, 300000, 700000
    );
    
    // SUB3 Data (High Growth - Technology)
    const baseRevSUB3 = 600000 + (idx * 80000) + (Math.random() * 120000);
    const profitMarginSUB3 = 0.18 + (Math.random() * 0.06);
    insertStatement.run(
      "SUB3", period, 
      baseRevSUB3, 
      baseRevSUB3 * profitMarginSUB3, 
      3500000 + (idx * 120000), 
      2200000 + (idx * 70000), 
      1300000 + (idx * 50000), 
      1000000 + (idx * 35000), 
      600000 + (idx * 12000), 
      800000 + (idx * 28000), 
      350000 + (idx * 12000), 
      baseRevSUB3 * 0.12, 
      80000, 40000, 150000, 500000
    );
    
    // SUB4 Data (Stable - Manufacturing)
    const baseRevSUB4 = 1200000 + (idx * 40000) + (Math.random() * 60000);
    const profitMarginSUB4 = 0.10 + (Math.random() * 0.03);
    insertStatement.run(
      "SUB4", period, 
      baseRevSUB4, 
      baseRevSUB4 * profitMarginSUB4, 
      6000000 + (idx * 80000), 
      3500000 + (idx * 45000), 
      2500000 + (idx * 35000), 
      1800000 + (idx * 20000), 
      1000000 + (idx * 15000), 
      1400000 + (idx * 18000), 
      600000 + (idx * 8000), 
      baseRevSUB4 * 0.09, 
      120000, 55000, 250000, 900000
    );
    
    // SUB5 Data (Volatile - Retail)
    const baseRevSUB5 = 900000 + (idx * 55000) + (Math.random() * 150000);
    const profitMarginSUB5 = 0.08 + (Math.random() * 0.05);
    insertStatement.run(
      "SUB5", period, 
      baseRevSUB5, 
      baseRevSUB5 * profitMarginSUB5, 
      4000000 + (idx * 70000), 
      2300000 + (idx * 40000), 
      1700000 + (idx * 30000), 
      1300000 + (idx * 22000), 
      850000 + (idx * 16000), 
      1000000 + (idx * 18000), 
      450000 + (idx * 9000), 
      baseRevSUB5 * 0.07, 
      110000, 48000, 220000, 650000
    );
  });
  
  console.log(`✓ Generated ${periods.length * 5} financial records`);
}

async function startServer() {
  const app = express();
  const PORT = 5000;

  // Security headers
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json());

  // Request Logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Simple auth middleware: reads user from X-User-Id header (dev) or session
  app.use((req: any, res, next) => {
    const userId = req.headers['x-user-id'] as string | undefined;
    if (userId) {
      req.userId = userId;
      const user = db.prepare('SELECT role_id FROM users WHERE id = ?').get(userId) as any;
      if (user) req.userRole = user.role_id;
    }
    next();
  });

  // Load CRM roles for authenticated users
  app.use(loadCRMRoles(db));

  // API Routes
  app.get("/api/companies", (req, res) => {
    const companies = db.prepare("SELECT * FROM companies").all();
    res.json(companies.map((c: any) => ({
      ...c,
      thresholds: c.thresholds ? JSON.parse(c.thresholds) : {},
      ideal_ratios: c.ideal_ratios ? JSON.parse(c.ideal_ratios) : {}
    })));
  });

  app.post("/api/companies", (req, res) => {
    const { id, name, color, industry, fiscal_year_start, currency, tax_rate, status, thresholds, ideal_ratios } = req.body;
    db.prepare(`
      INSERT OR REPLACE INTO companies (id, name, color, industry, fiscal_year_start, currency, tax_rate, status, thresholds, ideal_ratios)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, color, industry, fiscal_year_start, currency, tax_rate, status, JSON.stringify(thresholds), JSON.stringify(ideal_ratios));
    res.json({ success: true });
  });

  app.put("/api/companies/:id", (req, res) => {
    const { name, color, industry, fiscal_year_start, currency, tax_rate, status, thresholds, ideal_ratios } = req.body;
    db.prepare(`
      UPDATE companies 
      SET name = ?, color = ?, industry = ?, fiscal_year_start = ?, currency = ?, tax_rate = ?, status = ?, thresholds = ?, ideal_ratios = ?
      WHERE id = ?
    `).run(name, color, industry, fiscal_year_start, currency, tax_rate, status, JSON.stringify(thresholds), JSON.stringify(ideal_ratios), req.params.id);
    res.json({ success: true });
  });

  app.get("/api/users", (req, res) => {
    const users = db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id
    `).all();
    
    const usersWithAccess = users.map((u: any) => {
      const access = db.prepare("SELECT company_id FROM user_company_access WHERE user_id = ?").all(u.id);
      return { ...u, company_ids: access.map((a: any) => a.company_id) };
    });
    
    res.json(usersWithAccess);
  });

  app.put("/api/users/:id", (req, res) => {
    const { username, role_id, status, company_ids } = req.body;
    db.prepare("UPDATE users SET username = ?, role_id = ?, status = ? WHERE id = ?")
      .run(username, role_id, status, req.params.id);
    
    if (company_ids && Array.isArray(company_ids)) {
      db.prepare("DELETE FROM user_company_access WHERE user_id = ?").run(req.params.id);
      const insertAccess = db.prepare("INSERT INTO user_company_access (user_id, company_id) VALUES (?, ?)");
      company_ids.forEach(cid => insertAccess.run(req.params.id, cid));
    }
    res.json({ success: true });
  });

  app.post("/api/users/:id/reset-password", (req, res) => {
    const { password } = req.body;
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(password, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role_id, status, company_ids } = req.body;
    const info = db.prepare("INSERT INTO users (username, password, role_id, status) VALUES (?, ?, ?, ?)").run(username, password, role_id, status || 'Active');
    const userId = info.lastInsertRowid;
    
    if (company_ids && Array.isArray(company_ids)) {
      const insertAccess = db.prepare("INSERT INTO user_company_access (user_id, company_id) VALUES (?, ?)");
      company_ids.forEach(cid => insertAccess.run(userId, cid));
    }
    res.json({ success: true, id: userId });
  });

  app.get("/api/roles", (req, res) => {
    const roles = db.prepare("SELECT * FROM roles").all();
    res.json(roles.map((r: any) => ({ ...r, permissions: JSON.parse(r.permissions) })));
  });

  app.put("/api/roles/:id", (req, res) => {
    const { permissions } = req.body;
    db.prepare("UPDATE roles SET permissions = ? WHERE id = ?")
      .run(JSON.stringify(permissions), req.params.id);
    res.json({ success: true });
  });

  app.get("/api/financials", (req, res) => {
    const { companyId } = req.query;
    let query = "SELECT * FROM financial_statements";
    const params: any[] = [];

    if (companyId && companyId !== "both") {
      query += " WHERE company_id = ?";
      params.push(companyId);
    }

    query += " ORDER BY period ASC";
    const data = db.prepare(query).all(params);
    res.json(data);
  });

  app.get("/api/ratios", (req, res) => {
    const { companyId } = req.query;
    let query = `
      SELECT 
        company_id,
        period,
        revenue,
        net_profit,
        operating_cash_flow,
        cash,
        current_assets,
        current_liabilities,
        quick_assets,
        ar_aging_90_plus,
        interest_expense,
        short_term_debt,
        long_term_debt,
        CASE WHEN total_assets > 0 THEN (net_profit / total_assets) * 100 ELSE 0 END as roa,
        CASE WHEN total_equity > 0 THEN (net_profit / total_equity) * 100 ELSE 0 END as roe,
        CASE WHEN revenue > 0 THEN (net_profit / revenue) * 100 ELSE 0 END as npm,
        CASE WHEN total_equity > 0 THEN (total_liabilities / total_equity) ELSE 0 END as der,
        CASE WHEN current_liabilities > 0 THEN (current_assets / current_liabilities) ELSE 0 END as current_ratio,
        CASE WHEN current_liabilities > 0 THEN (quick_assets / current_liabilities) ELSE 0 END as quick_ratio,
        CASE WHEN current_liabilities > 0 THEN (cash / current_liabilities) ELSE 0 END as cash_ratio,
        CASE WHEN current_liabilities > 0 THEN (operating_cash_flow / current_liabilities) ELSE 0 END as ocf_ratio,
        CASE WHEN (interest_expense + short_term_debt) > 0 THEN (operating_cash_flow / (interest_expense + short_term_debt)) ELSE 0 END as dscr
      FROM financial_statements
    `;
    const params: any[] = [];

    if (companyId && companyId !== "both") {
      query += " WHERE company_id = ?";
      params.push(companyId);
    }

    query += " ORDER BY period DESC";
    const data = db.prepare(query).all(params);
    res.json(data);
  });

  app.post("/api/upload", (req, res) => {
    const { company_id, period, revenue, net_profit, total_assets, total_equity, total_liabilities, current_assets, current_liabilities, quick_assets, cash, operating_cash_flow, ar_aging_90_plus, interest_expense, short_term_debt, long_term_debt } = req.body;
    
    db.prepare(`
      INSERT OR REPLACE INTO financial_statements 
      (company_id, period, revenue, net_profit, total_assets, total_equity, total_liabilities, current_assets, current_liabilities, quick_assets, cash, operating_cash_flow, ar_aging_90_plus, interest_expense, short_term_debt, long_term_debt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(company_id, period, revenue, net_profit, total_assets, total_equity, total_liabilities, current_assets, current_liabilities, quick_assets, cash, operating_cash_flow, ar_aging_90_plus, interest_expense, short_term_debt, long_term_debt);
    
    res.json({ success: true });
  });

  // Parameters Management
  app.get("/api/parameters", (req, res) => {
    const params = db.prepare("SELECT * FROM parameters").all();
    res.json(params);
  });

  app.post("/api/parameters", (req, res) => {
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO parameters (key, value) VALUES (?, ?)").run(key, value);
    res.json({ success: true });
  });

  // ===== MAFINDA API ENDPOINTS =====

  // Divisions Management
  app.get("/api/divisions", (req, res) => {
    const { companyId } = req.query;
    let query = "SELECT * FROM divisions";
    const params: any[] = [];
    
    if (companyId) {
      query += " WHERE company_id = ?";
      params.push(companyId);
    }
    
    const divisions = db.prepare(query).all(...params);
    res.json(divisions);
  });

  app.post("/api/divisions", (req, res) => {
    const { id, companyId, name } = req.body;
    try {
      db.prepare("INSERT INTO divisions (id, company_id, name) VALUES (?, ?, ?)").run(id, companyId, name);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/divisions/:id", (req, res) => {
    // Check if division has projects
    const projects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE division_id = ?").get(req.params.id) as { count: number };
    if (projects.count > 0) {
      return res.status(400).json({ error: "Cannot delete division with associated projects" });
    }
    
    db.prepare("DELETE FROM divisions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Projects Management
  app.get("/api/projects", (req, res) => {
    const { divisionId } = req.query;
    let query = "SELECT * FROM projects";
    const params: any[] = [];
    
    if (divisionId) {
      query += " WHERE division_id = ?";
      params.push(divisionId);
    }
    
    const projects = db.prepare(query).all(...params);
    res.json(projects);
  });

  app.post("/api/projects", (req, res) => {
    const { id, divisionId, name, description } = req.body;
    try {
      db.prepare("INSERT INTO projects (id, division_id, name, description) VALUES (?, ?, ?, ?)").run(id, divisionId, name, description);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/projects/:id", (req, res) => {
    // Check if project has financial data
    const cashFlow = db.prepare("SELECT COUNT(*) as count FROM weekly_cash_flow WHERE project_id = ?").get(req.params.id) as { count: number };
    const targets = db.prepare("SELECT COUNT(*) as count FROM targets WHERE project_id = ?").get(req.params.id) as { count: number };
    
    if (cashFlow.count > 0 || targets.count > 0) {
      return res.status(400).json({ error: "Cannot delete project with financial data" });
    }
    
    db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Weekly Cash Flow Management
  app.get("/api/cash-flow/weekly", (req, res) => {
    const { projectId, period, status } = req.query;
    let query = `
      SELECT wcf.*, u1.username as submitted_by_name, u2.username as approved_by_name
      FROM weekly_cash_flow wcf
      LEFT JOIN users u1 ON wcf.submitted_by = u1.id
      LEFT JOIN users u2 ON wcf.approved_by = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (projectId) {
      query += " AND wcf.project_id = ?";
      params.push(projectId);
    }
    if (period) {
      query += " AND wcf.period = ?";
      params.push(period);
    }
    if (status) {
      query += " AND wcf.status = ?";
      params.push(status);
    }
    
    query += " ORDER BY wcf.period DESC, wcf.week ASC";
    const data = db.prepare(query).all(...params);
    res.json(data);
  });

  app.post("/api/cash-flow/weekly", (req, res) => {
    const { id, projectId, period, week, revenue, cashIn, cashOut, notes, submittedBy } = req.body;
    try {
      db.prepare(`
        INSERT INTO weekly_cash_flow (id, project_id, period, week, revenue, cash_in, cash_out, notes, submitted_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, projectId, period, week, revenue, cashIn, cashOut, notes, submittedBy);
      
      // Log audit trail
      db.prepare(`
        INSERT INTO approval_audit_log (id, entity_type, entity_id, action, performed_by)
        VALUES (?, 'cash_flow', ?, 'submitted', ?)
      `).run(`audit_${Date.now()}`, id, submittedBy);
      
      res.json({ success: true, id, status: 'pending_approval' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/cash-flow/weekly/:id", (req, res) => {
    const { revenue, cashIn, cashOut, notes } = req.body;
    try {
      db.prepare(`
        UPDATE weekly_cash_flow 
        SET revenue = ?, cash_in = ?, cash_out = ?, notes = ?
        WHERE id = ? AND status = 'pending_approval'
      `).run(revenue, cashIn, cashOut, notes, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Targets Management
  app.get("/api/targets", (req, res) => {
    const { projectId, period, status } = req.query;
    let query = `
      SELECT t.*, u1.username as created_by_name, u2.username as approved_by_name
      FROM targets t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.approved_by = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (projectId) {
      query += " AND t.project_id = ?";
      params.push(projectId);
    }
    if (period) {
      query += " AND t.period = ?";
      params.push(period);
    }
    if (status) {
      query += " AND t.status = ?";
      params.push(status);
    }
    
    query += " ORDER BY t.period DESC";
    const data = db.prepare(query).all(...params);
    res.json(data);
  });

  app.post("/api/targets", (req, res) => {
    const { id, projectId, period, revenueTarget, cashInTarget, cashOutTarget, createdBy } = req.body;
    try {
      db.prepare(`
        INSERT INTO targets (id, project_id, period, revenue_target, cash_in_target, cash_out_target, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, projectId, period, revenueTarget, cashInTarget, cashOutTarget, createdBy);
      
      // Log audit trail
      db.prepare(`
        INSERT INTO approval_audit_log (id, entity_type, entity_id, action, performed_by)
        VALUES (?, 'target', ?, 'submitted', ?)
      `).run(`audit_${Date.now()}`, id, createdBy);
      
      res.json({ success: true, id, status: 'pending_approval' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/targets/:id", (req, res) => {
    const { revenueTarget, cashInTarget, cashOutTarget } = req.body;
    try {
      db.prepare(`
        UPDATE targets 
        SET revenue_target = ?, cash_in_target = ?, cash_out_target = ?
        WHERE id = ? AND status = 'pending_approval'
      `).run(revenueTarget, cashInTarget, cashOutTarget, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Approval Workflow
  app.get("/api/approvals/pending", (req, res) => {
    const { userId } = req.query;
    
    // Get pending cash flows
    const pendingCashFlows = db.prepare(`
      SELECT 'cash_flow' as type, wcf.id, wcf.project_id, wcf.period, wcf.week, 
             wcf.revenue, wcf.cash_in, wcf.cash_out, wcf.submitted_at, wcf.submitted_by,
             u.username as submitted_by_name, p.name as project_name, d.name as division_name
      FROM weekly_cash_flow wcf
      JOIN users u ON wcf.submitted_by = u.id
      JOIN projects p ON wcf.project_id = p.id
      JOIN divisions d ON p.division_id = d.id
      WHERE wcf.status = 'pending_approval'
    `).all();
    
    // Get pending targets
    const pendingTargets = db.prepare(`
      SELECT 'target' as type, t.id, t.project_id, t.period, 
             t.revenue_target, t.cash_in_target, t.cash_out_target, t.created_at as submitted_at, t.created_by as submitted_by,
             u.username as submitted_by_name, p.name as project_name, d.name as division_name
      FROM targets t
      JOIN users u ON t.created_by = u.id
      JOIN projects p ON t.project_id = p.id
      JOIN divisions d ON p.division_id = d.id
      WHERE t.status = 'pending_approval'
    `).all();
    
    res.json([...pendingCashFlows, ...pendingTargets]);
  });

  app.post("/api/approvals/:id/approve", (req, res) => {
    const { type, approvedBy, notes } = req.body;
    const entityId = req.params.id;
    
    try {
      if (type === 'cash_flow') {
        db.prepare(`
          UPDATE weekly_cash_flow 
          SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(approvedBy, entityId);
      } else if (type === 'target') {
        db.prepare(`
          UPDATE targets 
          SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(approvedBy, entityId);
      }
      
      // Log audit trail
      db.prepare(`
        INSERT INTO approval_audit_log (id, entity_type, entity_id, action, performed_by, notes)
        VALUES (?, ?, ?, 'approved', ?, ?)
      `).run(`audit_${Date.now()}`, type, entityId, approvedBy, notes);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/approvals/:id/reject", (req, res) => {
    const { type, rejectedBy, reason } = req.body;
    const entityId = req.params.id;
    
    try {
      if (type === 'cash_flow') {
        db.prepare(`
          UPDATE weekly_cash_flow 
          SET status = 'rejected', rejection_reason = ?
          WHERE id = ?
        `).run(reason, entityId);
      } else if (type === 'target') {
        db.prepare(`
          UPDATE targets 
          SET status = 'rejected'
          WHERE id = ?
        `).run(entityId);
      }
      
      // Log audit trail
      db.prepare(`
        INSERT INTO approval_audit_log (id, entity_type, entity_id, action, performed_by, notes)
        VALUES (?, ?, ?, 'rejected', ?, ?)
      `).run(`audit_${Date.now()}`, type, entityId, rejectedBy, reason);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Dashboard APIs
  app.get("/api/dashboard/cash-position", (req, res) => {
    const { companyId } = req.query;
    
    // Get latest approved cash flow data grouped by project
    const query = `
      SELECT 
        p.id as project_id,
        p.name as project_name,
        d.name as division_name,
        d.company_id,
        wcf.period,
        wcf.week,
        wcf.revenue,
        wcf.cash_in,
        wcf.cash_out,
        wcf.approved_at as last_updated
      FROM weekly_cash_flow wcf
      JOIN projects p ON wcf.project_id = p.id
      JOIN divisions d ON p.division_id = d.id
      WHERE wcf.status = 'approved'
        ${companyId ? 'AND d.company_id = ?' : ''}
      ORDER BY wcf.period DESC, wcf.week DESC
    `;
    
    const params = companyId ? [companyId] : [];
    const data = db.prepare(query).all(...params);
    
    // Calculate cash position (simplified - sum of latest week's cash in - cash out)
    const cashPosition = data.reduce((sum: number, row: any) => {
      return sum + (row.cash_in - row.cash_out);
    }, 0);
    
    res.json({
      cashPosition,
      lastUpdated: data.length > 0 ? data[0].last_updated : null,
      weeklyBreakdown: data
    });
  });

  app.get("/api/dashboard/achievement-gauge", (req, res) => {
    const { companyId, period } = req.query;
    
    // Calculate achievement by division
    const query = `
      SELECT 
        d.id as division_id,
        d.name as division_name,
        SUM(t.revenue_target) as total_target,
        SUM(wcf.revenue) as total_actual
      FROM divisions d
      JOIN projects p ON d.id = p.division_id
      LEFT JOIN targets t ON p.id = t.project_id AND t.period = ? AND t.status = 'approved'
      LEFT JOIN weekly_cash_flow wcf ON p.id = wcf.project_id AND wcf.period = ? AND wcf.status = 'approved'
      WHERE d.company_id = ?
      GROUP BY d.id, d.name
    `;
    
    const data = db.prepare(query).all(period, period, companyId);
    
    const divisionBreakdown = data.map((row: any) => ({
      divisionName: row.division_name,
      achievement: row.total_target > 0 ? (row.total_actual / row.total_target) * 100 : 0,
      weight: row.total_target
    }));
    
    const totalWeight = divisionBreakdown.reduce((sum, d) => sum + d.weight, 0);
    const overallAchievement = totalWeight > 0 
      ? divisionBreakdown.reduce((sum, d) => sum + (d.achievement * d.weight), 0) / totalWeight 
      : 0;
    
    const colorZone = overallAchievement > 75 ? 'green' : overallAchievement > 25 ? 'yellow' : 'red';
    
    res.json({
      overallAchievement,
      colorZone,
      divisionBreakdown
    });
  });

  app.get("/api/dashboard/dept-performance", (req, res) => {
    const { companyId, period } = req.query;
    
    const query = `
      SELECT 
        d.id as division_id,
        d.name as division_name,
        SUM(t.revenue_target) as target,
        SUM(wcf.revenue) as actual
      FROM divisions d
      JOIN projects p ON d.id = p.division_id
      LEFT JOIN targets t ON p.id = t.project_id AND t.period = ? AND t.status = 'approved'
      LEFT JOIN weekly_cash_flow wcf ON p.id = wcf.project_id AND wcf.period = ? AND wcf.status = 'approved'
      WHERE d.company_id = ?
      GROUP BY d.id, d.name
      HAVING target > 0
      ORDER BY (actual / target) DESC
    `;
    
    const data = db.prepare(query).all(period, period, companyId) as any[];
    
    if (data.length === 0) {
      return res.json({ highest: null, lowest: null });
    }
    
    const highest = {
      divisionName: data[0].division_name,
      achievement: (data[0].actual / data[0].target) * 100,
      target: data[0].target,
      actual: data[0].actual
    };
    
    const lowest = {
      divisionName: data[data.length - 1].division_name,
      achievement: (data[data.length - 1].actual / data[data.length - 1].target) * 100,
      target: data[data.length - 1].target,
      actual: data[data.length - 1].actual
    };
    
    res.json({ highest, lowest });
  });

  app.get("/api/dashboard/historical-cash-flow", (req, res) => {
    const { companyId, divisionId, projectId, months = 12 } = req.query;
    
    let query = `
      SELECT 
        wcf.period,
        SUM(wcf.cash_in) as cash_in,
        SUM(wcf.cash_out) as cash_out,
        SUM(wcf.cash_in - wcf.cash_out) as net_cash_flow
      FROM weekly_cash_flow wcf
      JOIN projects p ON wcf.project_id = p.id
      JOIN divisions d ON p.division_id = d.id
      WHERE wcf.status = 'approved'
    `;
    const params: any[] = [];
    
    if (companyId) {
      query += " AND d.company_id = ?";
      params.push(companyId);
    }
    if (divisionId) {
      query += " AND d.id = ?";
      params.push(divisionId);
    }
    if (projectId) {
      query += " AND p.id = ?";
      params.push(projectId);
    }
    
    query += " GROUP BY wcf.period ORDER BY wcf.period DESC LIMIT ?";
    params.push(months);
    
    const data = db.prepare(query).all(...params);
    res.json(data.reverse());
  });

  // ===== NEW DASHBOARD API ENDPOINTS =====

  // Key Metrics API
  app.get("/api/dashboard/key-metrics", (req, res) => {
    const { companyId, period } = req.query;
    
    // Get balance sheet data
    const balanceSheet = db.prepare(`
      SELECT * FROM balance_sheets 
      WHERE company_id = ? AND period = ? AND status = 'approved'
      ORDER BY submitted_at DESC LIMIT 1
    `).get(companyId, period) as any;
    
    // Get income statement data
    const incomeStatement = db.prepare(`
      SELECT * FROM income_statements 
      WHERE company_id = ? AND period = ? AND status = 'approved'
      ORDER BY submitted_at DESC LIMIT 1
    `).get(companyId, period) as any;
    
    if (!balanceSheet || !incomeStatement) {
      return res.json(null);
    }
    
    // Calculate metrics
    const currentAssets = balanceSheet.kas + balanceSheet.piutang + balanceSheet.persediaan + balanceSheet.current_assets_lain_lain;
    const fixedAssets = balanceSheet.tanah_bangunan + balanceSheet.mesin_peralatan + balanceSheet.kendaraan - balanceSheet.akumulasi_penyusutan;
    const totalAssets = currentAssets + fixedAssets + balanceSheet.other_assets;
    
    const currentLiabilities = balanceSheet.hutang_usaha + balanceSheet.hutang_bank + balanceSheet.current_liabilities_lain_lain;
    const totalLiabilities = currentLiabilities + balanceSheet.hutang_jangka_panjang;
    
    const grossProfit = incomeStatement.revenue - incomeStatement.cogs;
    const totalOpex = incomeStatement.operational_expenses + incomeStatement.marketing_sales + 
                      incomeStatement.administrative_costs + incomeStatement.it_technology +
                      incomeStatement.human_resources + incomeStatement.maintenance_repairs + 
                      incomeStatement.miscellaneous;
    const operatingProfit = grossProfit - totalOpex;
    const profitBeforeTax = operatingProfit + incomeStatement.other_income - incomeStatement.other_expenses;
    const netProfit = profitBeforeTax - incomeStatement.tax;
    
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const totalEquity = balanceSheet.modal + balanceSheet.laba_ditahan + balanceSheet.deviden;
    const der = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
    
    res.json({
      totalAssets,
      currentAssets,
      totalLiabilities,
      currentLiabilities,
      netProfit,
      currentRatio,
      der,
      lastUpdated: {
        balanceSheet: balanceSheet.submitted_at,
        incomeStatement: incomeStatement.submitted_at
      }
    });
  });

  // Financial Ratios API
  app.get("/api/dashboard/financial-ratios", (req, res) => {
    const { companyId, period } = req.query;
    
    const balanceSheet = db.prepare(`
      SELECT * FROM balance_sheets 
      WHERE company_id = ? AND period = ? AND status = 'approved'
      ORDER BY submitted_at DESC LIMIT 1
    `).get(companyId, period) as any;
    
    const incomeStatement = db.prepare(`
      SELECT * FROM income_statements 
      WHERE company_id = ? AND period = ? AND status = 'approved'
      ORDER BY submitted_at DESC LIMIT 1
    `).get(companyId, period) as any;
    
    if (!balanceSheet || !incomeStatement) {
      return res.json(null);
    }
    
    // Calculate all values
    const currentAssets = balanceSheet.kas + balanceSheet.piutang + balanceSheet.persediaan + balanceSheet.current_assets_lain_lain;
    const fixedAssets = balanceSheet.tanah_bangunan + balanceSheet.mesin_peralatan + balanceSheet.kendaraan - balanceSheet.akumulasi_penyusutan;
    const totalAssets = currentAssets + fixedAssets + balanceSheet.other_assets;
    const currentLiabilities = balanceSheet.hutang_usaha + balanceSheet.hutang_bank + balanceSheet.current_liabilities_lain_lain;
    const totalLiabilities = currentLiabilities + balanceSheet.hutang_jangka_panjang;
    const totalEquity = balanceSheet.modal + balanceSheet.laba_ditahan + balanceSheet.deviden;
    
    const grossProfit = incomeStatement.revenue - incomeStatement.cogs;
    const totalOpex = incomeStatement.operational_expenses + incomeStatement.marketing_sales + 
                      incomeStatement.administrative_costs + incomeStatement.it_technology +
                      incomeStatement.human_resources + incomeStatement.maintenance_repairs + 
                      incomeStatement.miscellaneous;
    const operatingProfit = grossProfit - totalOpex;
    const profitBeforeTax = operatingProfit + incomeStatement.other_income - incomeStatement.other_expenses;
    const netProfit = profitBeforeTax - incomeStatement.tax;
    
    // Calculate ratios
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const quickRatio = currentLiabilities > 0 ? (currentAssets - balanceSheet.persediaan) / currentLiabilities : 0;
    const der = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
    const debtRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
    const roa = totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0;
    const roe = totalEquity > 0 ? (netProfit / totalEquity) * 100 : 0;
    const npm = incomeStatement.revenue > 0 ? (netProfit / incomeStatement.revenue) * 100 : 0;
    const grossProfitMargin = incomeStatement.revenue > 0 ? (grossProfit / incomeStatement.revenue) * 100 : 0;
    
    // Determine status
    const getStatus = (value: number, healthy: number, warning: number) => {
      if (value >= healthy) return 'healthy';
      if (value >= warning) return 'warning';
      return 'critical';
    };
    
    res.json([
      {
        groupName: 'Liquidity',
        ratios: [
          { name: 'Current Ratio', value: currentRatio, status: getStatus(currentRatio, 1.5, 1.0), trend: 'stable' },
          { name: 'Quick Ratio', value: quickRatio, status: getStatus(quickRatio, 1.0, 0.7), trend: 'stable' }
        ]
      },
      {
        groupName: 'Profitability',
        ratios: [
          { name: 'ROA', value: roa, status: getStatus(roa, 5, 2), trend: 'stable', unit: '%' },
          { name: 'ROE', value: roe, status: getStatus(roe, 15, 10), trend: 'stable', unit: '%' },
          { name: 'NPM', value: npm, status: getStatus(npm, 10, 5), trend: 'stable', unit: '%' },
          { name: 'Gross Profit Margin', value: grossProfitMargin, status: getStatus(grossProfitMargin, 30, 20), trend: 'stable', unit: '%' }
        ]
      },
      {
        groupName: 'Leverage',
        ratios: [
          { name: 'DER', value: der, status: der <= 2.0 ? 'healthy' : der <= 3.0 ? 'warning' : 'critical', trend: 'stable' },
          { name: 'Debt Ratio', value: debtRatio, status: debtRatio <= 0.5 ? 'healthy' : debtRatio <= 0.7 ? 'warning' : 'critical', trend: 'stable' }
        ]
      }
    ]);
  });

  // Asset Composition API
  app.get("/api/dashboard/asset-composition", (req, res) => {
    const { companyId, period } = req.query;
    
    const balanceSheet = db.prepare(`
      SELECT * FROM balance_sheets 
      WHERE company_id = ? AND period = ? AND status = 'approved'
      ORDER BY submitted_at DESC LIMIT 1
    `).get(companyId, period) as any;
    
    if (!balanceSheet) {
      return res.json(null);
    }
    
    const currentAssets = balanceSheet.kas + balanceSheet.piutang + balanceSheet.persediaan + balanceSheet.current_assets_lain_lain;
    const fixedAssets = balanceSheet.tanah_bangunan + balanceSheet.mesin_peralatan + balanceSheet.kendaraan - balanceSheet.akumulasi_penyusutan;
    const total = currentAssets + fixedAssets + balanceSheet.other_assets;
    
    res.json({
      currentAssets,
      fixedAssets,
      otherAssets: balanceSheet.other_assets,
      total
    });
  });

  // Equity Composition API
  app.get("/api/dashboard/equity-composition", (req, res) => {
    const { companyId, period } = req.query;
    
    const balanceSheet = db.prepare(`
      SELECT * FROM balance_sheets 
      WHERE company_id = ? AND period = ? AND status = 'approved'
      ORDER BY submitted_at DESC LIMIT 1
    `).get(companyId, period) as any;
    
    if (!balanceSheet) {
      return res.json(null);
    }
    
    const total = balanceSheet.modal + balanceSheet.laba_ditahan + balanceSheet.deviden;
    
    res.json({
      modal: balanceSheet.modal,
      labaDitahan: balanceSheet.laba_ditahan,
      deviden: balanceSheet.deviden,
      total
    });
  });

  // Cost Control API
  app.get("/api/cost-control", (req, res) => {
    const { companyId, period } = req.query;
    
    const incomeStatement = db.prepare(`
      SELECT * FROM income_statements 
      WHERE company_id = ? AND period = ? AND status = 'approved'
      ORDER BY submitted_at DESC LIMIT 1
    `).get(companyId, period) as any;
    
    const budget = db.prepare(`
      SELECT * FROM cost_control_budgets 
      WHERE company_id = ? AND period = ?
    `).all(companyId, period) as any[];
    
    if (!incomeStatement) {
      return res.json(null);
    }
    
    const categories = [
      { key: 'operational_expenses', name: 'Operational Expenses', actual: incomeStatement.operational_expenses },
      { key: 'marketing_sales', name: 'Marketing & Sales', actual: incomeStatement.marketing_sales },
      { key: 'administrative_costs', name: 'Administrative Costs', actual: incomeStatement.administrative_costs },
      { key: 'it_technology', name: 'IT & Technology', actual: incomeStatement.it_technology },
      { key: 'human_resources', name: 'Human Resources', actual: incomeStatement.human_resources },
      { key: 'maintenance_repairs', name: 'Maintenance & Repairs', actual: incomeStatement.maintenance_repairs },
      { key: 'miscellaneous', name: 'Miscellaneous', actual: incomeStatement.miscellaneous }
    ];
    
    const result = categories.map(cat => {
      const budgetItem = budget.find(b => b.category === cat.key);
      const budgeted = budgetItem?.budgeted_amount || cat.actual * 0.9; // Default budget if not set
      const variance = cat.actual - budgeted;
      const variancePercentage = budgeted > 0 ? (variance / budgeted) * 100 : 0;
      
      return {
        category: cat.name,
        budgeted,
        actual: cat.actual,
        variance,
        variancePercentage,
        trend: [0, 0, 0, 0, 0, variancePercentage], // Simplified trend
        alert: variance > 0 && variancePercentage > 10,
        notes: budgetItem?.notes,
        actionPlan: budgetItem?.action_plan
      };
    });
    
    // Sort by variance (highest overspend first)
    result.sort((a, b) => b.variance - a.variance);
    
    res.json(result);
  });

  // Auth Profile API
  app.get("/api/auth/profile", (req, res) => {
    // Mock user for now - in production, this would check session/token
    res.json({
      id: 1,
      username: 'admin',
      role: 'ADMIN'
    });
  });

  // Companies API
  app.get("/api/companies", (req, res) => {
    const companies = db.prepare("SELECT * FROM companies WHERE status = 'Active'").all();
    res.json(companies);
  });

  // Divisions API
  app.get("/api/divisions", (req, res) => {
    const { companyId } = req.query;
    const divisions = db.prepare("SELECT * FROM divisions WHERE company_id = ?").all(companyId);
    res.json(divisions);
  });

  app.post("/api/divisions", express.json(), (req, res) => {
    const { companyId, name } = req.body;
    const id = `DIV_${companyId}_${name.replace(/\s+/g, '_').toUpperCase()}`;
    
    try {
      db.prepare("INSERT INTO divisions (id, company_id, name) VALUES (?, ?, ?)").run(id, companyId, name);
      res.json({ id, company_id: companyId, name });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/divisions/:id", express.json(), (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    try {
      db.prepare("UPDATE divisions SET name = ? WHERE id = ?").run(name, id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/divisions/:id", (req, res) => {
    const { id } = req.params;
    
    try {
      // Delete associated projects first
      db.prepare("DELETE FROM projects WHERE division_id = ?").run(id);
      db.prepare("DELETE FROM divisions WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Projects API
  app.get("/api/projects", (req, res) => {
    const { companyId } = req.query;
    
    const projects = db.prepare(`
      SELECT p.* FROM projects p
      JOIN divisions d ON p.division_id = d.id
      WHERE d.company_id = ?
    `).all(companyId);
    
    res.json(projects);
  });

  app.post("/api/projects", express.json(), (req, res) => {
    const { divisionId, name, description } = req.body;
    const id = `PROJ_${divisionId}_${Date.now()}`;
    
    try {
      db.prepare("INSERT INTO projects (id, division_id, name, description) VALUES (?, ?, ?, ?)").run(id, divisionId, name, description);
      res.json({ id, division_id: divisionId, name, description });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/projects/:id", express.json(), (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    
    try {
      db.prepare("UPDATE projects SET name = ?, description = ? WHERE id = ?").run(name, description, id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/projects/:id", (req, res) => {
    const { id } = req.params;
    
    try {
      db.prepare("DELETE FROM projects WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Financial Statements API
  app.post("/api/financial/balance-sheet", express.json(), (req, res) => {
    const data = req.body;
    const id = `BS_${data.companyId}_${data.period}_${Date.now()}`;
    
    try {
      db.prepare(`
        INSERT INTO balance_sheets (
          id, company_id, period,
          kas, piutang, persediaan, current_assets_lain_lain,
          tanah_bangunan, mesin_peralatan, kendaraan, akumulasi_penyusutan,
          other_assets,
          hutang_usaha, hutang_bank, current_liabilities_lain_lain,
          hutang_jangka_panjang,
          modal, laba_ditahan, deviden,
          status, submitted_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1)
      `).run(
        id, data.companyId, data.period,
        data.kas, data.piutang, data.persediaan, data.currentAssetsLainLain,
        data.tanahBangunan, data.mesinPeralatan, data.kendaraan, data.akumulasiPenyusutan,
        data.otherAssets,
        data.hutangUsaha, data.hutangBank, data.currentLiabilitiesLainLain,
        data.hutangJangkaPanjang,
        data.modal, data.labaDitahan, data.deviden
      );
      
      res.json({ id, status: 'approved' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/financial/income-statement", express.json(), (req, res) => {
    const data = req.body;
    const id = `IS_${data.companyId}_${data.period}_${Date.now()}`;
    
    try {
      db.prepare(`
        INSERT INTO income_statements (
          id, company_id, period,
          revenue, cogs,
          operational_expenses, marketing_sales, administrative_costs,
          it_technology, human_resources, maintenance_repairs, miscellaneous,
          other_income, other_expenses, tax,
          status, submitted_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1)
      `).run(
        id, data.companyId, data.period,
        data.revenue, data.cogs,
        data.operationalExpenses, data.marketingSales, data.administrativeCosts,
        data.itTechnology, data.humanResources, data.maintenanceRepairs, data.miscellaneous,
        data.otherIncome, data.otherExpenses, data.tax
      );
      
      res.json({ id, status: 'approved' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ===== END MAFINDA API ENDPOINTS =====

  // ===== MAFINDA DASHBOARD ENHANCEMENT API ENDPOINTS =====
  app.use('/api/departments', createDepartmentRouter(db));
  app.use('/api/projects', createProjectRouter(db));
  app.use('/api/targets', createTargetRouter(db));
  app.use('/api/financial-statements', createFinancialStatementRouter(db));
  app.use('/api/dashboard', createMafindaDashboardRouter(db));
  // ===== END MAFINDA DASHBOARD ENHANCEMENT API ENDPOINTS =====

  // ===== CRM API ENDPOINTS =====
  app.use('/api/crm/customers', createCustomerRouter(db));
  app.use('/api/crm/customers/:customerId/contacts', createContactRouter(db));
  app.use('/api/crm/contacts', createContactStandaloneRouter(db));
  app.use('/api/crm/interactions', createInteractionRouter(db));
  // ===== END CRM API ENDPOINTS =====

  // ===== FINANCIAL RATIO MONITORING SYSTEM API ENDPOINTS =====
  app.use('/api/frs', createFRSRouter(db));
  // ===== END FRS API ENDPOINTS =====

  // Global FRS error handler - consistent error response format (Requirements: 12.1)
  app.use('/api/frs', (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) ?? '';
    const status = err.status ?? err.statusCode ?? 500;
    console.error(`[FRS Error] ${req.method} ${req.url}:`, err.message);
    res.status(status).json({
      error: {
        code: err.code ?? 'FRS_INTERNAL_ERROR',
        message: status < 500 ? err.message : 'An internal error occurred',
        details: status < 500 ? err.details : undefined,
        field: err.field,
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  });

  // API 404 Handler
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
