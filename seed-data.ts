// seed-data.ts — Seed additional corporates + historical financial data
// Run with: npx tsx seed-data.ts

import 'dotenv/config';
import { db } from './src/db/connection';
import { corporates, departments } from './src/db/schema/public';
import { balanceSheets, incomeStatements } from './src/db/schema/cfd';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🌱 Seeding additional data...');

  // ── Additional Corporates ─────────────────────────────────
  const extraCorps = [
    { name: 'PT Subsidiary Three', code: 'SUB3', industry: 'Technology', currency: 'IDR' as const, createdBy: 'system' },
    { name: 'PT Subsidiary Four', code: 'SUB4', industry: 'Manufacturing', currency: 'IDR' as const, createdBy: 'system' },
    { name: 'PT Subsidiary Five', code: 'SUB5', industry: 'Retail', currency: 'IDR' as const, createdBy: 'system' },
  ];

  for (const corp of extraCorps) {
    await db.insert(corporates).values(corp).onConflictDoNothing({ target: corporates.code });
  }
  console.log('✓ Additional corporates ready');

  // Create one department per new corporate for financial data
  const allCorps = await db.select().from(corporates);
  for (const corp of allCorps.filter((c) => ['SUB3', 'SUB4', 'SUB5'].includes(c.code))) {
    await db
      .insert(departments)
      .values({ corporateId: corp.id, name: 'General', code: `${corp.code}-GEN`, createdBy: 'system' })
      .onConflictDoNothing();
  }
  console.log('✓ Departments for new corporates ready');

  // ── Generate historical financial data ────────────────────
  // Generate periods from 2024-01 to 2026-12
  const periods: string[] = [];
  for (let y = 2024; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      periods.push(`${y}-${String(m).padStart(2, '0')}`);
    }
  }

  console.log(`📊 Generating data for ${periods.length} periods...`);

  const allDepts = await db.select().from(departments);

  // Map corporate code -> department id (pick first department per corp)
  const corpDeptMap = new Map<string, string>();
  for (const corp of allCorps) {
    const dept = allDepts.find((d) => d.corporateId === corp.id);
    if (dept) corpDeptMap.set(corp.code, dept.id);
  }

  interface CompanyProfile {
    code: string;
    baseRev: number;
    revGrowth: number;
    marginRange: [number, number];
    assetBase: number;
    equityRatio: number;
  }

  const profiles: CompanyProfile[] = [
    { code: 'ASI', baseRev: 1_000_000, revGrowth: 50_000, marginRange: [0.15, 0.20], assetBase: 5_000_000, equityRatio: 0.60 },
    { code: 'TSI', baseRev: 800_000, revGrowth: 60_000, marginRange: [0.12, 0.16], assetBase: 4_500_000, equityRatio: 0.55 },
    { code: 'SUB3', baseRev: 600_000, revGrowth: 80_000, marginRange: [0.18, 0.24], assetBase: 3_500_000, equityRatio: 0.63 },
    { code: 'SUB4', baseRev: 1_200_000, revGrowth: 40_000, marginRange: [0.10, 0.13], assetBase: 6_000_000, equityRatio: 0.58 },
    { code: 'SUB5', baseRev: 900_000, revGrowth: 55_000, marginRange: [0.08, 0.13], assetBase: 4_000_000, equityRatio: 0.57 },
  ];

  let recordCount = 0;

  for (const [idx, period] of periods.entries()) {
    for (const profile of profiles) {
      const deptId = corpDeptMap.get(profile.code);
      if (!deptId) continue;

      const revenue = profile.baseRev + idx * profile.revGrowth + Math.random() * 100_000;
      const margin = profile.marginRange[0] + Math.random() * (profile.marginRange[1] - profile.marginRange[0]);
      const cogs = revenue * (1 - margin - 0.15);
      const opex = revenue * 0.08;
      const interest = revenue * 0.02;
      const tax = revenue * margin * 0.22;

      const totalAssets = profile.assetBase + idx * 80_000;
      const equity = totalAssets * profile.equityRatio;
      const liabilities = totalAssets - equity;
      const currentAssets = totalAssets * 0.3;
      const cash = currentAssets * 0.35;

      // Income Statement
      await db
        .insert(incomeStatements)
        .values({
          departmentId: deptId,
          period,
          revenue: String(Math.round(revenue)),
          cogs: String(Math.round(cogs)),
          operatingExpenses: String(Math.round(opex)),
          interestExpense: String(Math.round(interest)),
          taxExpense: String(Math.round(tax)),
          createdBy: 'seed',
        })
        .onConflictDoNothing();

      // Balance Sheet
      await db
        .insert(balanceSheets)
        .values({
          departmentId: deptId,
          period,
          cashAndBank: String(Math.round(cash)),
          accountsReceivable: String(Math.round(currentAssets * 0.35)),
          inventory: String(Math.round(currentAssets * 0.2)),
          land: String(Math.round(totalAssets * 0.25)),
          building: String(Math.round(totalAssets * 0.2)),
          equipment: String(Math.round(totalAssets * 0.15)),
          accountsPayable: String(Math.round(liabilities * 0.3)),
          bankLoanCurrent: String(Math.round(liabilities * 0.2)),
          bankLoanLongTerm: String(Math.round(liabilities * 0.4)),
          capital: String(Math.round(equity * 0.6)),
          earningsAfterTax: String(Math.round(revenue * margin * 0.78)),
          retainedEarnings: String(Math.round(equity * 0.3)),
          dividends: String(Math.round(equity * 0.05)),
          createdBy: 'seed',
        })
        .onConflictDoNothing();

      recordCount++;
    }
  }

  console.log(`✅ Generated ${recordCount} financial records (balance sheets + income statements)`);
  console.log(`📅 Period range: 2024-01 to 2026-12`);
  console.log('🏢 Companies: ASI, TSI, SUB3, SUB4, SUB5');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
