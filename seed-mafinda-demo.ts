// seed-mafinda-demo.ts — Seed MAFINDA demo data (cash flows + targets)
// Run with: npx tsx seed-mafinda-demo.ts

import 'dotenv/config';
import { db } from './src/db/connection';
import { users, projects, departments } from './src/db/schema/public';
import { weeklyCashFlows, targetHeaders, targetDetails } from './src/db/schema/cfd';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🌱 Seeding MAFINDA demo data...');

  // ── Resolve user IDs ──────────────────────────────────────
  const allUsers = await db.select().from(users);
  const financeUser = allUsers.find((u) => u.email === 'finance@cfd.local');
  const bankingUser = allUsers.find((u) => u.email === 'banking@cfd.local');

  if (!financeUser || !bankingUser) {
    console.error('❌ Required users not found. Run init-and-seed.ts first.');
    process.exit(1);
  }

  console.log(`📝 Using Finance Analyst: ${financeUser.id}`);
  console.log(`📝 Using Banking Officer: ${bankingUser.id}`);

  // ── Resolve projects ──────────────────────────────────────
  const allProjects = await db.select().from(projects);
  if (allProjects.length === 0) {
    console.error('❌ No projects found. Run init-and-seed.ts first.');
    process.exit(1);
  }

  // ── Periods ───────────────────────────────────────────────
  const periods = [
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
  ];
  const currentPeriod = new Date().toISOString().slice(0, 7);

  let count = 0;

  // ── Seed historical data ──────────────────────────────────
  console.log('📊 Seeding historical approved data...');

  for (const period of periods) {
    const [year, month] = period.split('-').map(Number);

    for (const proj of allProjects) {
      const baseTarget = 50_000_000;

      // Target header + details
      const [header] = await db
        .insert(targetHeaders)
        .values({
          departmentId: proj.departmentId,
          projectId: proj.id,
          fiscalYear: year,
          fiscalMonth: month,
          createdBy: financeUser.id,
        })
        .onConflictDoNothing()
        .returning();

      if (header) {
        await db.insert(targetDetails).values([
          { targetHeaderId: header.id, targetType: 'revenue', amount: String(baseTarget) },
          { targetHeaderId: header.id, targetType: 'cash_in', amount: String(baseTarget * 0.8) },
          { targetHeaderId: header.id, targetType: 'cash_out', amount: String(baseTarget * 0.6) },
        ]).onConflictDoNothing();
      }
      count++;

      // Weekly cash flows (W1-W5)
      for (const week of ['W1', 'W2', 'W3', 'W4', 'W5'] as const) {
        const weeklyBase = baseTarget / 5;
        const cashIn = weeklyBase * (0.7 + Math.random() * 0.3);
        const cashOut = weeklyBase * (0.4 + Math.random() * 0.2);

        await db
          .insert(weeklyCashFlows)
          .values({
            departmentId: proj.departmentId,
            entityType: 'project',
            entityId: proj.id,
            period,
            week,
            operatingCashIn: String(Math.round(cashIn)),
            operatingCashOut: String(Math.round(cashOut)),
            investingCashIn: '0',
            investingCashOut: '0',
            financingCashIn: '0',
            financingCashOut: '0',
            notes: `Historical data for ${period} ${week}`,
            createdBy: bankingUser.id,
          })
          .onConflictDoNothing();
        count++;
      }
    }
  }

  // ── Seed current period ───────────────────────────────────
  console.log('📊 Seeding current period data...');
  const [curYear, curMonth] = currentPeriod.split('-').map(Number);

  for (const [projIdx, proj] of allProjects.entries()) {
    const baseTarget = 50_000_000;

    // Current period target
    const [header] = await db
      .insert(targetHeaders)
      .values({
        departmentId: proj.departmentId,
        projectId: proj.id,
        fiscalYear: curYear,
        fiscalMonth: curMonth,
        createdBy: financeUser.id,
      })
      .onConflictDoNothing()
      .returning();

    if (header) {
      await db.insert(targetDetails).values([
        { targetHeaderId: header.id, targetType: 'revenue', amount: String(baseTarget) },
        { targetHeaderId: header.id, targetType: 'cash_in', amount: String(baseTarget * 0.8) },
        { targetHeaderId: header.id, targetType: 'cash_out', amount: String(baseTarget * 0.6) },
      ]).onConflictDoNothing();
    }
    count++;

    // W1 and W2 (approved data)
    for (const week of ['W1', 'W2'] as const) {
      const weeklyBase = baseTarget / 5;
      const cashIn = weeklyBase * (0.7 + Math.random() * 0.3);
      const cashOut = weeklyBase * (0.4 + Math.random() * 0.2);

      await db
        .insert(weeklyCashFlows)
        .values({
          departmentId: proj.departmentId,
          entityType: 'project',
          entityId: proj.id,
          period: currentPeriod,
          week,
          operatingCashIn: String(Math.round(cashIn)),
          operatingCashOut: String(Math.round(cashOut)),
          investingCashIn: '0',
          investingCashOut: '0',
          financingCashIn: '0',
          financingCashOut: '0',
          notes: `Current period ${week}`,
          createdBy: bankingUser.id,
        })
        .onConflictDoNothing();
      count++;
    }
  }

  console.log(`✅ Seeded ${count} records successfully!`);
  console.log(`📊 Data includes:`);
  console.log(`   - ${periods.length} historical periods`);
  console.log(`   - ${allProjects.length} projects`);
  console.log('   - Weekly cash flow data (W1-W5)');
  console.log('   - Targets for each project/period');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
