import Database from "better-sqlite3";

const db = new Database("finance.db");

console.log("🚀 Initializing MAFINDA database...");

// First, ensure roles exist
console.log("📋 Checking roles...");
const roleCount = db.prepare("SELECT COUNT(*) as count FROM roles").get() as { count: number };
console.log(`   Found ${roleCount.count} roles`);
if (roleCount.count === 0) {
  console.log("   Creating roles...");
  const insertRole = db.prepare("INSERT INTO roles (id, name, permissions) VALUES (?, ?, ?)");
  insertRole.run("ADMIN", "Admin", JSON.stringify(["view_dashboard", "upload_data", "edit_benchmark", "manage_user", "access_alert", "export_report", "approve_all", "manage_divisions", "manage_projects"]));
  insertRole.run("FINANCE_ANALYST", "Finance Analyst", JSON.stringify(["view_dashboard", "read:target", "write:target", "approve:cash_flow", "read:cash_flow", "write:financial_statements", "read:financial_statements", "read:dashboard"]));
  insertRole.run("BANKING_OFFICER", "Banking Officer", JSON.stringify(["view_dashboard", "write:cash_flow", "read:cash_flow", "read:target", "read:dashboard"]));
  console.log("   ✅ Roles created");
} else {
  // Check if specific roles exist
  const admin = db.prepare("SELECT id FROM roles WHERE id = 'ADMIN'").get();
  const finance = db.prepare("SELECT id FROM roles WHERE id = 'FINANCE_ANALYST'").get();
  const banking = db.prepare("SELECT id FROM roles WHERE id = 'BANKING_OFFICER'").get();
  
  if (!admin) {
    console.log("   Creating ADMIN role...");
    db.prepare("INSERT INTO roles (id, name, permissions) VALUES (?, ?, ?)").run("ADMIN", "Admin", JSON.stringify(["view_dashboard", "upload_data", "edit_benchmark", "manage_user", "access_alert", "export_report", "approve_all", "manage_divisions", "manage_projects"]));
  }
  if (!finance) {
    console.log("   Creating FINANCE_ANALYST role...");
    db.prepare("INSERT INTO roles (id, name, permissions) VALUES (?, ?, ?)").run("FINANCE_ANALYST", "Finance Analyst", JSON.stringify(["view_dashboard", "read:target", "write:target", "approve:cash_flow", "read:cash_flow", "write:financial_statements", "read:financial_statements", "read:dashboard"]));
  }
  if (!banking) {
    console.log("   Creating BANKING_OFFICER role...");
    db.prepare("INSERT INTO roles (id, name, permissions) VALUES (?, ?, ?)").run("BANKING_OFFICER", "Banking Officer", JSON.stringify(["view_dashboard", "write:cash_flow", "read:cash_flow", "read:target", "read:dashboard"]));
  }
}

// Ensure users exist
console.log("👥 Checking users...");
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
console.log(`   Found ${userCount.count} users`);
if (userCount.count === 0) {
  console.log("   Creating users...");
  const insertUser = db.prepare("INSERT INTO users (username, password, role_id, status) VALUES (?, ?, ?, ?)");
  insertUser.run("admin", "admin123", "ADMIN", "Active");
  insertUser.run("banking", "banking123", "BANKING_OFFICER", "Active");
  insertUser.run("finance", "finance123", "FINANCE_ANALYST", "Active");
  console.log("   ✅ Users created");
} else {
  // Check if specific users exist
  const banking = db.prepare("SELECT id, username FROM users WHERE username = 'banking'").get();
  const finance = db.prepare("SELECT id, username FROM users WHERE username = 'finance'").get();
  console.log(`   Banking user: ${banking ? 'exists' : 'missing'}`);
  console.log(`   Finance user: ${finance ? 'exists' : 'missing'}`);
  
  // Create missing users
  if (!banking) {
    console.log("   Creating banking user...");
    db.prepare("INSERT INTO users (username, password, role_id, status) VALUES (?, ?, ?, ?)").run("banking", "banking123", "BANKING_OFFICER", "Active");
  }
  if (!finance) {
    console.log("   Creating finance user...");
    db.prepare("INSERT INTO users (username, password, role_id, status) VALUES (?, ?, ?, ?)").run("finance", "finance123", "FINANCE_ANALYST", "Active");
  }
}

// Ensure companies exist
console.log("🏢 Checking companies...");
const companyCount = db.prepare("SELECT COUNT(*) as count FROM companies").get() as { count: number };
if (companyCount.count === 0) {
  console.log("   Creating companies...");
  const insertCompany = db.prepare("INSERT INTO companies (id, name, code, color, industry, currency, thresholds, ideal_ratios) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const defaultThresholds = JSON.stringify({ liquidity_drop: 20, der_rise: 15, margin_drop_months: 3 });
  const defaultIdeals = JSON.stringify({ current_ratio: 1.5, quick_ratio: 1, der: 2, npm: 10, roa: 5, roe: 15 });

  insertCompany.run("ASI", "PT Asia Serv Indonesia", "ASI", "#0f172a", "Industrial Services", "IDR", defaultThresholds, defaultIdeals);
  insertCompany.run("TSI", "PT Titian Servis Indonesia", "TSI", "#334155", "Services", "IDR", defaultThresholds, defaultIdeals);
  console.log("   ✅ Companies created");
}

// Ensure divisions exist
console.log("📁 Checking divisions...");
const divisionCount = db.prepare("SELECT COUNT(*) as count FROM divisions").get() as { count: number };
if (divisionCount.count === 0) {
  console.log("   Creating divisions...");
  const insertDivision = db.prepare("INSERT INTO divisions (id, company_id, name) VALUES (?, ?, ?)");
  insertDivision.run("DIV_ASI_ONM", "ASI", "ONM (Operational)");
  insertDivision.run("DIV_ASI_WS", "ASI", "WS (Workshop)");
  insertDivision.run("DIV_TSI_ONM", "TSI", "ONM (Operational)");
  insertDivision.run("DIV_TSI_WS", "TSI", "WS (Workshop)");
  console.log("   ✅ Divisions created");
}

// Ensure projects exist
console.log("📊 Checking projects...");
const projectCount = db.prepare("SELECT COUNT(*) as count FROM projects").get() as { count: number };
if (projectCount.count === 0) {
  console.log("   Creating projects...");
  const insertProject = db.prepare("INSERT INTO projects (id, division_id, name, description) VALUES (?, ?, ?, ?)");
  insertProject.run("PROJ_ASI_ONM_1", "DIV_ASI_ONM", "Project Alpha", "Main operational project for ASI");
  insertProject.run("PROJ_ASI_ONM_2", "DIV_ASI_ONM", "Project Beta", "Secondary operational project");
  insertProject.run("PROJ_ASI_WS_1", "DIV_ASI_WS", "Workshop Maintenance", "Regular maintenance services");
  insertProject.run("PROJ_TSI_ONM_1", "DIV_TSI_ONM", "Project Gamma", "Main operational project for TSI");
  insertProject.run("PROJ_TSI_WS_1", "DIV_TSI_WS", "Workshop Services", "Workshop service operations");
  console.log("   ✅ Projects created");
}

// Grant user access to companies
console.log("🔐 Setting up user access...");
const adminId = (db.prepare("SELECT id FROM users WHERE username = 'admin'").get() as any)?.id;
const financeId = (db.prepare("SELECT id FROM users WHERE username = 'finance'").get() as any)?.id;
const bankingId = (db.prepare("SELECT id FROM users WHERE username = 'banking'").get() as any)?.id;

if (adminId && financeId && bankingId) {
  const insertAccess = db.prepare("INSERT OR IGNORE INTO user_company_access (user_id, company_id) VALUES (?, ?)");
  [adminId, financeId, bankingId].forEach(userId => {
    insertAccess.run(userId, "ASI");
    insertAccess.run(userId, "TSI");
  });
  console.log("   ✅ User access configured");
}

console.log("\n✅ Database initialization complete!");
console.log("\n🌱 Now seeding demo data...\n");

// Now run the seed script - re-query to ensure we have the IDs
const bankingUser = db.prepare("SELECT id FROM users WHERE username = 'banking'").get() as any;
const financeUser = db.prepare("SELECT id FROM users WHERE username = 'finance'").get() as any;

if (!bankingUser || !financeUser) {
  console.error("❌ Error: Required users not found after initialization.");
  db.close();
  process.exit(1);
}

const bankingUserId = bankingUser.id;
const financeUserId = financeUser.id;

console.log(`📝 Using Banking Officer ID: ${bankingUserId}`);
console.log(`📝 Using Finance Analyst ID: ${financeUserId}`);

// Seed sample weekly cash flow data
const insertCashFlow = db.prepare(`
  INSERT OR IGNORE INTO weekly_cash_flow 
  (id, project_id, period, week, revenue, cash_in, cash_out, notes, status, submitted_by, approved_by, approved_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Seed sample targets
const insertTarget = db.prepare(`
  INSERT OR IGNORE INTO targets 
  (id, project_id, period, revenue_target, cash_in_target, cash_out_target, status, created_by, approved_by, approved_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Current period
const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

// Previous periods for historical data
const periods = [
  '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
  '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'
];

const projects = [
  'PROJ_ASI_ONM_1',
  'PROJ_ASI_ONM_2',
  'PROJ_ASI_WS_1',
  'PROJ_TSI_ONM_1',
  'PROJ_TSI_WS_1'
];

let count = 0;

// Seed historical approved data
periods.forEach((period, periodIdx) => {
  projects.forEach((projectId, projIdx) => {
    // Set targets for each project/period
    const baseTarget = 50000000 + (projIdx * 10000000);
    const targetId = `target_${period}_${projectId}`;
    
    insertTarget.run(
      targetId,
      projectId,
      period,
      baseTarget,
      baseTarget * 0.8,
      baseTarget * 0.6,
      'approved',
      financeUserId,
      financeUserId,
      new Date().toISOString()
    );
    count++;

    // Add weekly cash flow data (W1-W5)
    ['W1', 'W2', 'W3', 'W4', 'W5'].forEach((week, weekIdx) => {
      const weeklyRevenue = (baseTarget / 5) * (0.8 + Math.random() * 0.4);
      const weeklyCashIn = weeklyRevenue * (0.7 + Math.random() * 0.2);
      const weeklyCashOut = weeklyRevenue * (0.5 + Math.random() * 0.2);
      
      const cashFlowId = `cf_${period}_${projectId}_${week}`;
      
      insertCashFlow.run(
        cashFlowId,
        projectId,
        period,
        week,
        Math.round(weeklyRevenue),
        Math.round(weeklyCashIn),
        Math.round(weeklyCashOut),
        `Historical data for ${period} ${week}`,
        'approved',
        bankingUserId,
        financeUserId,
        new Date().toISOString()
      );
      count++;
    });
  });
});

// Seed current period with some pending approvals
projects.forEach((projectId, projIdx) => {
  const baseTarget = 50000000 + (projIdx * 10000000);
  
  // Current period target (approved)
  const targetId = `target_${currentPeriod}_${projectId}`;
  insertTarget.run(
    targetId,
    projectId,
    currentPeriod,
    baseTarget,
    baseTarget * 0.8,
    baseTarget * 0.6,
    'approved',
    financeUserId,
    financeUserId,
    new Date().toISOString()
  );
  count++;

  // W1 and W2 approved
  ['W1', 'W2'].forEach((week) => {
    const weeklyRevenue = (baseTarget / 5) * (0.8 + Math.random() * 0.4);
    const weeklyCashIn = weeklyRevenue * (0.7 + Math.random() * 0.2);
    const weeklyCashOut = weeklyRevenue * (0.5 + Math.random() * 0.2);
    
    const cashFlowId = `cf_${currentPeriod}_${projectId}_${week}`;
    
    insertCashFlow.run(
      cashFlowId,
      projectId,
      currentPeriod,
      week,
      Math.round(weeklyRevenue),
      Math.round(weeklyCashIn),
      Math.round(weeklyCashOut),
      `Current period ${week}`,
      'approved',
      bankingUserId,
      financeUserId,
      new Date().toISOString()
    );
    count++;
  });

  // W3 pending approval (for demo)
  if (projIdx < 2) {
    const weeklyRevenue = (baseTarget / 5) * (0.8 + Math.random() * 0.4);
    const weeklyCashIn = weeklyRevenue * (0.7 + Math.random() * 0.2);
    const weeklyCashOut = weeklyRevenue * (0.5 + Math.random() * 0.2);
    
    const cashFlowId = `cf_${currentPeriod}_${projectId}_W3`;
    
    insertCashFlow.run(
      cashFlowId,
      projectId,
      currentPeriod,
      'W3',
      Math.round(weeklyRevenue),
      Math.round(weeklyCashIn),
      Math.round(weeklyCashOut),
      'Pending approval for W3',
      'pending_approval',
      bankingUserId,
      null,
      null
    );
    count++;
  }
});

console.log(`✅ Seeded ${count} records successfully!`);
console.log(`📊 Data includes:`);
console.log(`   - ${periods.length} historical periods`);
console.log(`   - ${projects.length} projects`);
console.log(`   - Weekly cash flow data (W1-W5)`);
console.log(`   - Targets for each project/period`);
console.log(`   - Some pending approvals for demo`);

// Seed Balance Sheet and Income Statement data
console.log("\n💰 Seeding financial statements...");

// Seed Balance Sheet for current period
const insertBalanceSheet = db.prepare(`
  INSERT OR IGNORE INTO balance_sheets (
    id, company_id, period,
    kas, piutang, persediaan, current_assets_lain_lain,
    tanah_bangunan, mesin_peralatan, kendaraan, akumulasi_penyusutan,
    other_assets,
    hutang_usaha, hutang_bank, current_liabilities_lain_lain,
    hutang_jangka_panjang,
    modal, laba_ditahan, deviden,
    status, submitted_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)
`);

// ASI Balance Sheet
insertBalanceSheet.run(
  `BS_ASI_${currentPeriod}`,
  'ASI',
  currentPeriod,
  50000000,  // kas
  75000000,  // piutang
  100000000, // persediaan
  25000000,  // current_assets_lain_lain
  500000000, // tanah_bangunan
  300000000, // mesin_peralatan
  150000000, // kendaraan
  200000000, // akumulasi_penyusutan
  50000000,  // other_assets
  60000000,  // hutang_usaha
  40000000,  // hutang_bank
  20000000,  // current_liabilities_lain_lain
  150000000, // hutang_jangka_panjang
  500000000, // modal
  250000000, // laba_ditahan
  30000000,  // deviden
  financeUserId
);

// TSI Balance Sheet
insertBalanceSheet.run(
  `BS_TSI_${currentPeriod}`,
  'TSI',
  currentPeriod,
  40000000,
  60000000,
  80000000,
  20000000,
  400000000,
  250000000,
  120000000,
  150000000,
  40000000,
  50000000,
  30000000,
  15000000,
  120000000,
  400000000,
  200000000,
  25000000,
  financeUserId
);

console.log("   ✅ Balance sheets seeded");

// Seed Income Statement for current period
const insertIncomeStatement = db.prepare(`
  INSERT OR IGNORE INTO income_statements (
    id, company_id, period,
    revenue, cogs,
    operational_expenses, marketing_sales, administrative_costs,
    it_technology, human_resources, maintenance_repairs, miscellaneous,
    other_income, other_expenses, tax,
    status, submitted_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)
`);

// ASI Income Statement
insertIncomeStatement.run(
  `IS_ASI_${currentPeriod}`,
  'ASI',
  currentPeriod,
  500000000, // revenue
  300000000, // cogs
  30000000,  // operational_expenses
  25000000,  // marketing_sales
  20000000,  // administrative_costs
  15000000,  // it_technology
  40000000,  // human_resources
  10000000,  // maintenance_repairs
  5000000,   // miscellaneous
  5000000,   // other_income
  3000000,   // other_expenses
  15000000,  // tax
  financeUserId
);

// TSI Income Statement
insertIncomeStatement.run(
  `IS_TSI_${currentPeriod}`,
  'TSI',
  currentPeriod,
  400000000,
  240000000,
  25000000,
  20000000,
  15000000,
  12000000,
  35000000,
  8000000,
  4000000,
  4000000,
  2000000,
  12000000,
  financeUserId
);

console.log("   ✅ Income statements seeded");

console.log(`\n🎉 MAFINDA is ready for demo!`);

db.close();
