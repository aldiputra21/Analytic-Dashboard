// scripts/seed-cfd.ts — Seed CFD schema financial data
// Run with: npx tsx scripts/seed-cfd.ts
//
// Pre-requisites:
//   - Public schema must have data (run scripts/seed-public.ts first)
//
// Seeds:
//   - Additional corporates SUB3, SUB4, SUB5 + their departments (public schema)
//   - Weekly cash flows (all projects, 2024 monthly periods)
//   - Financial targets (all projects, 2024 periods)
//   - Balance sheets (ASI-ONM, TSI-ONM — current period)
//   - Income statements (ASI-ONM, TSI-ONM — current period)
//   - 36-month historical balance sheets + income statements (ASI, TSI, SUB3, SUB4, SUB5)

import 'dotenv/config';
import { db } from '../src/db/connection';
import { users, corporates, departments, projects } from '../src/db/schema/public';
import { targetHeaders, targetDetails, weeklyCashFlows, balanceSheets, incomeStatements, costCenters, cashFlowProjectionHeaders, cashFlowProjectionDetails } from '../src/db/schema/cfd';
import { eq } from 'drizzle-orm';

const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

async function main() {
  console.log('🚀 Seeding CFD schema data...');

  // ── Resolve users ─────────────────────────────────────────
  const allUsers = await db.select({ id: users.id, email: users.email }).from(users);
  if (allUsers.length === 0) {
    console.error('❌ No users found. Run scripts/seed-public.ts first.');
    process.exit(1);
  }

  const financeUserId = allUsers.find((u) => u.email === 'finance.leader@tsi.local' || u.email === 'admin.system@cfd.local')!.id;
  const bankingUserId = allUsers.find((u) => u.email === 'finance.staff@tsi.local' || u.email === 'admin.system@cfd.local')!.id;

  // ── Additional corporates (SUB3, SUB4, SUB5) ─────────────
  console.log('🏢 Seeding additional corporates...');
  const extraCorps = [
    { name: 'PT Subsidiary Three', code: 'SUB3', industry: 'IT', currency: 'IDR' as const, createdBy: SYSTEM_ACTOR_ID },
    { name: 'PT Subsidiary Four', code: 'SUB4', industry: 'IN', currency: 'IDR' as const, createdBy: SYSTEM_ACTOR_ID },
    { name: 'PT Subsidiary Five', code: 'SUB5', industry: 'RT', currency: 'IDR' as const, createdBy: SYSTEM_ACTOR_ID },
  ];

  for (const corp of extraCorps) {
    await db.insert(corporates).values(corp).onConflictDoNothing({ target: corporates.code });
  }

  const allCorps = await db.select().from(corporates);
  for (const corp of allCorps.filter((c) => ['SUB3', 'SUB4', 'SUB5'].includes(c.code))) {
    await db
      .insert(departments)
      .values({ corporateId: corp.id, name: 'General', code: `${corp.code}-GEN`, createdBy: SYSTEM_ACTOR_ID })
      .onConflictDoNothing();
  }
  console.log('   ✅ Additional corporates & departments ready');

  // ── Cost Centers ──────────────────────────────────────────
  console.log('🏷️ Seeding cost centers...');

  // ── Resolve existing departments & projects ───────────────
  const allDepts = await db.select().from(departments);
  const allProjects = await db.select().from(projects);

  if (allProjects.length === 0) {
    console.error('❌ No projects found. Run scripts/seed-public.ts first.');
    process.exit(1);
  }

  const asiId = allCorps.find((c) => c.code === 'ASI')!.id;
  const tsiId = allCorps.find((c) => c.code === 'TSI')!.id;
  const ccValues = [
    { corporateId: asiId, name: 'General & Admin', code: 'ASI-ADM', category: 'ADM', createdBy: SYSTEM_ACTOR_ID },
    { corporateId: asiId, name: 'Production', code: 'ASI-PROD', category: 'OPEX', createdBy: SYSTEM_ACTOR_ID },
    { corporateId: tsiId, name: 'General & Admin', code: 'TSI-ADM', category: 'ADM', createdBy: SYSTEM_ACTOR_ID },
    { corporateId: tsiId, name: 'Operations', code: 'TSI-OPS', category: 'OPEX', createdBy: SYSTEM_ACTOR_ID },
  ];

  for (const cc of ccValues) {
    await db.insert(costCenters).values(cc).onConflictDoNothing();
  }
  console.log('   ✅ Cost centers seeded');

  const deptMap = Object.fromEntries(allDepts.map((d) => [`${d.corporateId}_${d.code}`, d.id]));
  const asiOnmDeptId = deptMap[`${asiId}_ASI-ONM`];
  const tsiOnmDeptId = deptMap[`${tsiId}_TSI-ONM`];

  // ── Weekly Cash Flows ─────────────────────────────────────
  console.log('💰 Seeding weekly cash flows...');
  const cashFlowPeriods = [
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
  ];
  const currentPeriod = new Date().toISOString().slice(0, 7);

  let cfCount = 0;
  for (const period of cashFlowPeriods) {
    for (const proj of allProjects) {
      for (const week of ['W1', 'W2', 'W3', 'W4', 'W5'] as const) {
        const base = 10_000_000;
        const corpId = allProjects.find(p => p.id === proj.id)?.departmentId; // Fallback to department's corp if needed
        // Actually we can get corporateId from project if we join, but in seed we can just use the mapped value
        const projectCorp = allDepts.find(d => d.id === proj.departmentId)?.corporateId;

        console.log(`      Inserting ${proj.name} WCF for ${period} ${week}...`);
        await db
          .insert(weeklyCashFlows)
          .values({
            corporateId: projectCorp || asiId,
            entityType: 'project',
            entityId: proj.id,
            period,
            week,
            operatingCashIn: String(Math.round(base * (0.7 + Math.random() * 0.3))),
            operatingCashOut: String(Math.round(base * (0.4 + Math.random() * 0.2))),
            investingCashIn: '0',
            investingCashOut: String(Math.round(base * 0.05)),
            financingCashIn: '0',
            financingCashOut: '0',
            createdBy: bankingUserId,
          })
          .onConflictDoNothing();
        cfCount++;
      }
    }
  }
  console.log(`   ✅ ${cfCount} weekly cash flows seeded`);

  // ── Targets ───────────────────────────────────────────────
  console.log('🎯 Seeding targets...');
  let targetCount = 0;

  for (const period of [...cashFlowPeriods, currentPeriod]) {
    const [year, month] = period.split('-').map(Number);
    for (const proj of allProjects) {
      const baseTarget = 50_000_000;
      
      // Upsert header to ensure we get an ID
      const [header] = await db
        .insert(targetHeaders)
        .values({
          departmentId: proj.departmentId,
          projectId: proj.id,
          fiscalYear: year,
          createdBy: financeUserId,
        })
        .onConflictDoUpdate({
          target: [targetHeaders.departmentId, targetHeaders.projectId, targetHeaders.fiscalYear],
          set: { updatedBy: financeUserId }
        })
        .returning();

      if (header) {
        await db.insert(targetDetails).values([
          { targetHeaderId: header.id, targetType: 'revenue', month: month, amount: String(baseTarget) },
          { targetHeaderId: header.id, targetType: 'cash_in', month: month, amount: String(baseTarget * 0.8) },
          { targetHeaderId: header.id, targetType: 'cash_out', month: month, amount: String(baseTarget * 0.6) },
        ]).onConflictDoNothing();
        targetCount++;
      }
    }
  }
  console.log(`   ✅ ${targetCount} target headers seeded`);

  // ── Balance Sheets (current period) ──────────────────────
  console.log('📑 Seeding balance sheets (current period)...');
  const bsDepts = [
    { deptId: asiOnmDeptId, cashAndBank: 50_000_000, ar: 75_000_000, inv: 100_000_000, land: 500_000_000, building: 300_000_000, equip: 150_000_000, ap: 60_000_000, bankCur: 40_000_000, bankLt: 150_000_000, capital: 500_000_000, eat: 0, retained: 250_000_000, div: 30_000_000 },
    { deptId: tsiOnmDeptId, cashAndBank: 40_000_000, ar: 60_000_000, inv: 80_000_000, land: 400_000_000, building: 250_000_000, equip: 120_000_000, ap: 50_000_000, bankCur: 30_000_000, bankLt: 120_000_000, capital: 400_000_000, eat: 0, retained: 200_000_000, div: 25_000_000 },
  ];

  for (const bs of bsDepts) {
    const corpId = allDepts.find(d => d.id === bs.deptId)?.corporateId || asiId;
    await db.insert(balanceSheets).values({
      corporateId: corpId,
      period: currentPeriod,
      cashAndBank: String(bs.cashAndBank),
      accountsReceivable: String(bs.ar),
      inventory: String(bs.inv),
      land: String(bs.land),
      building: String(bs.building),
      equipment: String(bs.equip),
      accountsPayable: String(bs.ap),
      bankLoanCurrent: String(bs.bankCur),
      bankLoanLongTerm: String(bs.bankLt),
      capital: String(bs.capital),
      earningsAfterTax: String(bs.eat),
      retainedEarnings: String(bs.retained),
      dividends: String(bs.div),
      createdBy: financeUserId,
    }).onConflictDoNothing();
  }
  console.log('   ✅ Balance sheets seeded');

  // ── Income Statements (current period) ───────────────────
  console.log('📑 Seeding income statements (current period)...');
  const isDepts = [
    { deptId: asiOnmDeptId, revenue: 500_000_000, cogs: 300_000_000, opex: 80_000_000, interest: 15_000_000, tax: 15_000_000 },
    { deptId: tsiOnmDeptId, revenue: 400_000_000, cogs: 240_000_000, opex: 65_000_000, interest: 12_000_000, tax: 12_000_000 },
  ];

  for (const is_ of isDepts) {
    const corpId = allDepts.find(d => d.id === is_.deptId)?.corporateId || asiId;
    await db.insert(incomeStatements).values({
      corporateId: corpId,
      period: currentPeriod,
      revenue: String(is_.revenue),
      cogs: String(is_.cogs),
      operatingExpenses: String(is_.opex),
      interestExpense: String(is_.interest),
      taxExpense: String(is_.tax),
      createdBy: financeUserId,
    }).onConflictDoNothing();
  }
  console.log('   ✅ Income statements seeded');

  // ── Historical Financial Data (2024-01 to 2026-12) ───────
  console.log('📊 Seeding 36-month historical financial data...');

  const financeUser = allUsers.find((u) => u.email === 'finance.leader@tsi.local' || u.email === 'admin.system@cfd.local');
  const seedActorId = financeUser?.id ?? SYSTEM_ACTOR_ID;

  const periods: string[] = [];
  for (let y = 2024; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      periods.push(`${y}-${String(m).padStart(2, '0')}`);
    }
  }
  console.log(`   📅 Generating data for ${periods.length} periods (2024-01 to 2026-12)...`);

  // Map corporate code -> corporate id
  const corpMap = new Map<string, string>();
  for (const corp of allCorps) {
    corpMap.set(corp.code, corp.id);
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
      const corporateId = corpMap.get(profile.code);
      if (!corporateId) continue;

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

      await db.insert(incomeStatements).values({
        corporateId: corporateId,
        period,
        revenue: String(Math.round(revenue)),
        cogs: String(Math.round(cogs)),
        operatingExpenses: String(Math.round(opex)),
        interestExpense: String(Math.round(interest)),
        taxExpense: String(Math.round(tax)),
        createdBy: seedActorId,
      }).onConflictDoNothing();

      await db.insert(balanceSheets).values({
        corporateId: corporateId,
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
        createdBy: seedActorId,
      }).onConflictDoNothing();

      recordCount++;
    }
  }

  console.log(`   ✅ Generated ${recordCount} historical financial records (balance sheets + income statements)`);
  console.log('   🏢 Companies: ASI, TSI, SUB3, SUB4, SUB5');

  // ── Cash Flow Projections (2024-2026) ───────────────────
  console.log('📈 Seeding cash flow projections (2024-2026)...');
  const projectionYears = [2024, 2025, 2026];
  for (const year of projectionYears) {
    for (const corp of allCorps) {
      // Upsert Header
      const [header] = await db
        .insert(cashFlowProjectionHeaders)
        .values({
          corporateId: corp.id,
          fiscalYear: year,
          initialBalance: '500000000',
          notes: `Seeded projection for ${year}`,
          createdBy: seedActorId,
        })
        .onConflictDoUpdate({
          target: [cashFlowProjectionHeaders.corporateId, cashFlowProjectionHeaders.fiscalYear],
          set: { updatedBy: seedActorId }
        })
        .returning();

      if (header) {
        // Clean old details to avoid duplicates if re-running
        await db.delete(cashFlowProjectionDetails).where(eq(cashFlowProjectionDetails.headerId, header.id));
        
        const details = [];
        for (let month = 1; month <= 12; month++) {
          details.push({
            headerId: header.id,
            month,
            group: 'operating' as const,
            type: 'cash-in' as const,
            category: 'Collection',
            amount: (200000000 + Math.random() * 50000000).toFixed(0),
            notes: 'Monthly collection projection',
          });
          details.push({
            headerId: header.id,
            month,
            group: 'operating' as const,
            type: 'cash-out' as const,
            category: 'Payroll',
            amount: '120000000',
            notes: 'Staff salaries',
          });
          details.push({
            headerId: header.id,
            month,
            group: 'operating' as const,
            type: 'cash-out' as const,
            category: 'Operational',
            amount: (50000000 + Math.random() * 20000000).toFixed(0),
            notes: 'Opex',
          });
        }
        await db.insert(cashFlowProjectionDetails).values(details);
      }
    }
  }
  console.log('   ✅ Cash flow projections seeded for all companies (2024-2026)');

  console.log('\n🎉 CFD schema seeding complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
