import Database from "better-sqlite3";

const db = new Database("finance.db");

console.log("🌱 Seeding additional data...");

// Add new companies if they don't exist
const companies = [
  { id: "SUB3", name: "PT Subsidiary Three", color: "#7c3aed", industry: "Technology" },
  { id: "SUB4", name: "PT Subsidiary Four", color: "#059669", industry: "Manufacturing" },
  { id: "SUB5", name: "PT Subsidiary Five", color: "#dc2626", industry: "Retail" }
];

const defaultThresholds = JSON.stringify({ liquidity_drop: 20, der_rise: 15, margin_drop_months: 3 });
const defaultIdeals = JSON.stringify({ current_ratio: 1.5, quick_ratio: 1, der: 2, npm: 10 });

companies.forEach(company => {
  const existing = db.prepare("SELECT id FROM companies WHERE id = ?").get(company.id);
  if (!existing) {
    db.prepare(`
      INSERT INTO companies (id, name, color, industry, thresholds, ideal_ratios, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Active')
    `).run(company.id, company.name, company.color, company.industry, defaultThresholds, defaultIdeals);
    console.log(`✓ Added company: ${company.name}`);
  }
});

// Clear old financial data
db.prepare("DELETE FROM financial_statements").run();
console.log("✓ Cleared old financial data");

// Generate comprehensive dummy data
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

console.log(`📊 Generating data for ${periods.length} periods across 5 companies...`);

let recordCount = 0;

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
  recordCount++;
  
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
  recordCount++;
  
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
  recordCount++;
  
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
  recordCount++;
  
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
  recordCount++;
});

console.log(`✅ Generated ${recordCount} financial records`);
console.log(`📅 Period range: 2024-01 to 2026-12`);
console.log(`🏢 Companies: ASI, TSI, SUB3, SUB4, SUB5`);

// Verify data
const count = db.prepare("SELECT COUNT(*) as count FROM financial_statements").get() as { count: number };
console.log(`\n✓ Total records in database: ${count.count}`);

const latestPeriods = db.prepare(`
  SELECT company_id, MAX(period) as latest_period 
  FROM financial_statements 
  GROUP BY company_id
`).all();

console.log("\n📊 Latest periods by company:");
latestPeriods.forEach((row: any) => {
  console.log(`   ${row.company_id}: ${row.latest_period}`);
});

db.close();
console.log("\n🎉 Seeding completed successfully!");
