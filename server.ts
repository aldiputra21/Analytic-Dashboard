import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("finance.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    permissions TEXT NOT NULL -- JSON array
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role_id TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    FOREIGN KEY (role_id) REFERENCES roles(id)
  );

  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    industry TEXT,
    fiscal_year_start TEXT DEFAULT '01',
    currency TEXT DEFAULT 'USD',
    tax_rate REAL DEFAULT 0,
    status TEXT DEFAULT 'Active',
    thresholds TEXT, -- JSON object
    ideal_ratios TEXT -- JSON object
  );

  CREATE TABLE IF NOT EXISTS user_company_access (
    user_id INTEGER,
    company_id TEXT,
    PRIMARY KEY (user_id, company_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS financial_statements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT NOT NULL,
    period TEXT NOT NULL, -- YYYY-MM
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

  CREATE TABLE IF NOT EXISTS parameters (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed initial data if empty
const roleCount = db.prepare("SELECT COUNT(*) as count FROM roles").get() as { count: number };
if (roleCount.count === 0) {
  const insertRole = db.prepare("INSERT INTO roles (id, name, permissions) VALUES (?, ?, ?)");
  insertRole.run("SUPER_ADMIN", "Super Admin", JSON.stringify(["view_dashboard", "upload_data", "edit_benchmark", "manage_user", "access_alert", "export_report"]));
  insertRole.run("CORP_ADMIN", "Corporate Admin", JSON.stringify(["view_dashboard", "upload_data", "edit_benchmark", "access_alert", "export_report"]));
  insertRole.run("FIN_MGR", "Finance Manager", JSON.stringify(["view_dashboard", "upload_data", "access_alert", "export_report"]));
  insertRole.run("ANALYST", "Analyst", JSON.stringify(["view_dashboard", "access_alert", "export_report"]));
  insertRole.run("AUDITOR", "Auditor", JSON.stringify(["view_dashboard"]));

  const insertUser = db.prepare("INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)");
  insertUser.run("admin", "admin123", "SUPER_ADMIN");
}

const companyCount = db.prepare("SELECT COUNT(*) as count FROM companies").get() as { count: number };
if (companyCount.count === 0) {
  const insertCompany = db.prepare("INSERT INTO companies (id, name, color, industry, thresholds, ideal_ratios) VALUES (?, ?, ?, ?, ?, ?)");
  const defaultThresholds = JSON.stringify({ liquidity_drop: 20, der_rise: 15, margin_drop_months: 3 });
  const defaultIdeals = JSON.stringify({ current_ratio: 1.5, quick_ratio: 1, der: 2, npm: 10 });

  insertCompany.run("ASI", "PT Asia Servis Indonesia", "#0f172a", "Industrial", defaultThresholds, defaultIdeals);
  insertCompany.run("TSI", "PT Titian Servis Indonesia", "#334155", "Services", defaultThresholds, defaultIdeals);

  // Grant admin access to both companies
  const adminId = (db.prepare("SELECT id FROM users WHERE username = 'admin'").get() as any).id;
  db.prepare("INSERT OR IGNORE INTO user_company_access (user_id, company_id) VALUES (?, ?)").run(adminId, "ASI");
  db.prepare("INSERT OR IGNORE INTO user_company_access (user_id, company_id) VALUES (?, ?)").run(adminId, "TSI");
}

const statementCount = db.prepare("SELECT COUNT(*) as count FROM financial_statements").get() as { count: number };
if (statementCount.count === 0) {
  const insertStatement = db.prepare(`
    INSERT INTO financial_statements 
    (company_id, period, revenue, net_profit, total_assets, total_equity, total_liabilities, current_assets, current_liabilities, quick_assets, cash, operating_cash_flow, ar_aging_90_plus, interest_expense, short_term_debt, long_term_debt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const periods = ["2023-12", "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06", "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12"];
  
  periods.forEach((period, idx) => {
    // ASI Data (Growth Simulation)
    const baseRevASI = 1000000 + (idx * 50000);
    insertStatement.run("ASI", period, baseRevASI, baseRevASI * 0.15, 5000000, 3000000, 2000000, 1500000, 800000, 1200000, 500000, baseRevASI * 0.1, 100000, 50000, 200000, 800000);
    
    // TSI Data (Growth Simulation)
    const baseRevTSI = 800000 + (idx * 60000);
    insertStatement.run("TSI", period, baseRevTSI, baseRevTSI * 0.12, 4500000, 2500000, 2000000, 1200000, 900000, 900000, 400000, baseRevTSI * 0.08, 150000, 60000, 300000, 700000);
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request Logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
