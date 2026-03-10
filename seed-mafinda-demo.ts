import Database from "better-sqlite3";

const db = new Database("finance.db");

console.log("🌱 Seeding MAFINDA demo data...");

// Check if users exist, if not create them
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  console.log("⚠️  No users found. Creating default users...");
  const insertUser = db.prepare("INSERT INTO users (username, password, role_id, status) VALUES (?, ?, ?, ?)");
  insertUser.run("admin", "admin123", "ADMIN", "Active");
  insertUser.run("banking", "banking123", "BANKING_OFFICER", "Active");
  insertUser.run("finance", "finance123", "FINANCE_ANALYST", "Active");
  console.log("✅ Default users created");
}

// Get user IDs
const bankingUser = db.prepare("SELECT id FROM users WHERE username = 'banking'").get() as any;
const financeUser = db.prepare("SELECT id FROM users WHERE username = 'finance'").get() as any;

if (!bankingUser || !financeUser) {
  console.error("❌ Error: Required users not found. Please run the server first to initialize the database.");
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
      financeUserId, // Finance Analyst
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
        bankingUserId, // Banking Officer
        financeUserId, // Finance Analyst
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

db.close();
