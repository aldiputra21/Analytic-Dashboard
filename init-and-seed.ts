// init-and-seed.ts — PostgreSQL seed script using Drizzle ORM
// Run with: npx tsx init-and-seed.ts

import 'dotenv/config';
import { db } from './src/db/connection';
import {
  roles,
  users,
  corporates,
  departments,
  projects,
  userCorporateAccesses,
} from './src/db/schema/public';
import {
  targetHeaders,
  targetDetails,
  weeklyCashFlows,
  balanceSheets,
  incomeStatements,
} from './src/db/schema/cfd';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🚀 Initializing database...');

  // ── Roles ─────────────────────────────────────────────────
  console.log('📋 Seeding roles...');
  const [adminRole] = await db
    .insert(roles)
    .values({
      name: 'Admin',
      scope: 'system',
      permissions: [
        'view_dashboard',
        'upload_data',
        'edit_benchmark',
        'manage_user',
        'access_alert',
        'export_report',
        'approve_all',
        'manage_divisions',
        'manage_projects',
      ],
      description: 'Full system administrator',
      createdBy: 'system',
    })
    .onConflictDoNothing({ target: roles.name })
    .returning();

  const [financeRole] = await db
    .insert(roles)
    .values({
      name: 'Finance Analyst',
      scope: 'corporate',
      permissions: [
        'view_dashboard',
        'read:target',
        'write:target',
        'approve:cash_flow',
        'read:cash_flow',
        'write:financial_statements',
        'read:financial_statements',
        'read:dashboard',
      ],
      description: 'Finance team analyst',
      createdBy: 'system',
    })
    .onConflictDoNothing({ target: roles.name })
    .returning();

  const [bankingRole] = await db
    .insert(roles)
    .values({
      name: 'Banking Officer',
      scope: 'corporate',
      permissions: [
        'view_dashboard',
        'write:cash_flow',
        'read:cash_flow',
        'read:target',
        'read:dashboard',
      ],
      description: 'Banking operations officer',
      createdBy: 'system',
    })
    .onConflictDoNothing({ target: roles.name })
    .returning();

  // Fetch roles in case onConflictDoNothing returned nothing
  const allRoles = await db.select().from(roles);
  const adminRoleId = adminRole?.id ?? allRoles.find((r) => r.name === 'Admin')!.id;
  const financeRoleId = financeRole?.id ?? allRoles.find((r) => r.name === 'Finance Analyst')!.id;
  const bankingRoleId = bankingRole?.id ?? allRoles.find((r) => r.name === 'Banking Officer')!.id;

  console.log('   ✅ Roles ready');

  // ── Users ─────────────────────────────────────────────────
  console.log('👥 Seeding users...');
  const passwordHash = await bcrypt.hash('admin123', 10);

  const [adminUser] = await db
    .insert(users)
    .values({
      username: 'admin',
      email: 'admin@cfd.local',
      passwordHash,
      fullName: 'Administrator',
      createdBy: 'system',
    })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const [financeUser] = await db
    .insert(users)
    .values({
      username: 'finance',
      email: 'finance@cfd.local',
      passwordHash: await bcrypt.hash('finance123', 10),
      fullName: 'Finance Analyst',
      createdBy: 'system',
    })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const [bankingUser] = await db
    .insert(users)
    .values({
      username: 'banking',
      email: 'banking@cfd.local',
      passwordHash: await bcrypt.hash('banking123', 10),
      fullName: 'Banking Officer',
      createdBy: 'system',
    })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const [ownerUser] = await db
    .insert(users)
    .values({
      username: 'owner',
      email: 'owner@holding.com',
      passwordHash: await bcrypt.hash('Admin@123456', 10),
      fullName: 'Owner',
      createdBy: 'system',
    })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const allUsers = await db.select().from(users);
  const adminUserId = adminUser?.id ?? allUsers.find((u) => u.email === 'admin@cfd.local')!.id;
  const financeUserId = financeUser?.id ?? allUsers.find((u) => u.email === 'finance@cfd.local')!.id;
  const bankingUserId = bankingUser?.id ?? allUsers.find((u) => u.email === 'banking@cfd.local')!.id;
  const ownerUserId = ownerUser?.id ?? allUsers.find((u) => u.email === 'owner@cfd.local')!.id;

  console.log('   ✅ Users ready');

  // ── Corporates ────────────────────────────────────────────
  console.log('🏢 Seeding corporates...');
  const [asiCorp] = await db
    .insert(corporates)
    .values({
      name: 'PT Asia Serv Indonesia',
      code: 'ASI',
      industry: 'Industrial Services',
      currency: 'IDR',
      createdBy: 'system',
    })
    .onConflictDoNothing({ target: corporates.code })
    .returning();

  const [tsiCorp] = await db
    .insert(corporates)
    .values({
      name: 'PT Titian Servis Indonesia',
      code: 'TSI',
      industry: 'Services',
      currency: 'IDR',
      createdBy: 'system',
    })
    .onConflictDoNothing({ target: corporates.code })
    .returning();

  const allCorps = await db.select().from(corporates);
  const asiId = asiCorp?.id ?? allCorps.find((c) => c.code === 'ASI')!.id;
  const tsiId = tsiCorp?.id ?? allCorps.find((c) => c.code === 'TSI')!.id;

  console.log('   ✅ Corporates ready');

  // ── Departments ───────────────────────────────────────────
  console.log('📁 Seeding departments...');
  const deptValues = [
    { corporateId: asiId, name: 'ONM (Operational)', code: 'ASI-ONM', createdBy: 'system' },
    { corporateId: asiId, name: 'WS (Workshop)', code: 'ASI-WS', createdBy: 'system' },
    { corporateId: tsiId, name: 'ONM (Operational)', code: 'TSI-ONM', createdBy: 'system' },
    { corporateId: tsiId, name: 'WS (Workshop)', code: 'TSI-WS', createdBy: 'system' },
  ];

  for (const dv of deptValues) {
    await db.insert(departments).values(dv).onConflictDoNothing();
  }

  const allDepts = await db.select().from(departments);
  const deptMap = Object.fromEntries(allDepts.map((d) => [`${d.corporateId}_${d.code}`, d.id]));

  const asiOnmDeptId = deptMap[`${asiId}_ASI-ONM`];
  const asiWsDeptId = deptMap[`${asiId}_ASI-WS`];
  const tsiOnmDeptId = deptMap[`${tsiId}_TSI-ONM`];
  const tsiWsDeptId = deptMap[`${tsiId}_TSI-WS`];

  console.log('   ✅ Departments ready');

  // ── Projects ──────────────────────────────────────────────
  console.log('📊 Seeding projects...');
  const projValues = [
    { departmentId: asiOnmDeptId, code: 'ALPHA', name: 'Project Alpha', description: 'Main operational project for ASI', createdBy: 'system' },
    { departmentId: asiOnmDeptId, code: 'BETA', name: 'Project Beta', description: 'Secondary operational project', createdBy: 'system' },
    { departmentId: asiWsDeptId, code: 'MAINT', name: 'Workshop Maintenance', description: 'Regular maintenance services', createdBy: 'system' },
    { departmentId: tsiOnmDeptId, code: 'GAMMA', name: 'Project Gamma', description: 'Main operational project for TSI', createdBy: 'system' },
    { departmentId: tsiWsDeptId, code: 'WSSVC', name: 'Workshop Services', description: 'Workshop service operations', createdBy: 'system' },
  ];

  for (const pv of projValues) {
    await db.insert(projects).values(pv).onConflictDoNothing();
  }

  const allProjects = await db.select().from(projects);

  console.log('   ✅ Projects ready');

  // ── User-Corporate Access ─────────────────────────────────
  console.log('🔐 Seeding user access...');
  for (const userId of [adminUserId, ownerUserId, financeUserId, bankingUserId]) {
    const roleId =
      userId === adminUserId
        ? adminRoleId
        : userId === ownerUserId
        ? adminRoleId
        : userId === financeUserId
          ? financeRoleId
          : bankingRoleId;

    for (const corpId of [asiId, tsiId]) {
      await db
        .insert(userCorporateAccesses)
        .values({
          userId,
          roleId,
          scope: userId === adminUserId || userId === ownerUserId ? 'system' : 'corporate',
          corporateId: userId === adminUserId || userId === ownerUserId ? undefined : corpId,
        })
        .onConflictDoNothing();
    }
  }

  console.log('   ✅ User access ready');

  // ── Weekly Cash Flows ─────────────────────────────────────
  console.log('💰 Seeding weekly cash flows...');

  const periods = [
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
  ];
  const currentPeriod = new Date().toISOString().slice(0, 7);

  let cfCount = 0;
  for (const period of periods) {
    for (const proj of allProjects) {
      for (const week of ['W1', 'W2', 'W3', 'W4', 'W5'] as const) {
        const base = 10_000_000;
        await db
          .insert(weeklyCashFlows)
          .values({
            departmentId: proj.departmentId,
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

  for (const period of [...periods, currentPeriod]) {
    const [year, month] = period.split('-').map(Number);
    for (const proj of allProjects) {
      const baseTarget = 50_000_000;
      const [header] = await db
        .insert(targetHeaders)
        .values({
          departmentId: proj.departmentId,
          projectId: proj.id,
          fiscalYear: year,
          fiscalMonth: month,
          createdBy: financeUserId,
        })
        .onConflictDoNothing()
        .returning();

      if (header) {
        await db.insert(targetDetails).values([
          { targetHeaderId: header.id, targetType: 'revenue', amount: String(baseTarget) },
          { targetHeaderId: header.id, targetType: 'cash_in', amount: String(baseTarget * 0.8) },
          { targetHeaderId: header.id, targetType: 'cash_out', amount: String(baseTarget * 0.6) },
        ]).onConflictDoNothing();
        targetCount++;
      }
    }
  }

  console.log(`   ✅ ${targetCount} target headers seeded`);

  // ── Balance Sheets ────────────────────────────────────────
  console.log('📑 Seeding balance sheets...');

  // Seed for each department for current period
  const bsDepts = [
    { deptId: asiOnmDeptId, cashAndBank: 50_000_000, ar: 75_000_000, inv: 100_000_000, land: 500_000_000, building: 300_000_000, equip: 150_000_000, ap: 60_000_000, bankCur: 40_000_000, bankLt: 150_000_000, capital: 500_000_000, eat: 0, retained: 250_000_000, div: 30_000_000 },
    { deptId: tsiOnmDeptId, cashAndBank: 40_000_000, ar: 60_000_000, inv: 80_000_000, land: 400_000_000, building: 250_000_000, equip: 120_000_000, ap: 50_000_000, bankCur: 30_000_000, bankLt: 120_000_000, capital: 400_000_000, eat: 0, retained: 200_000_000, div: 25_000_000 },
  ];

  for (const bs of bsDepts) {
    await db
      .insert(balanceSheets)
      .values({
        departmentId: bs.deptId,
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
      })
      .onConflictDoNothing();
  }

  console.log('   ✅ Balance sheets seeded');

  // ── Income Statements ─────────────────────────────────────
  console.log('📑 Seeding income statements...');

  const isDepts = [
    { deptId: asiOnmDeptId, revenue: 500_000_000, cogs: 300_000_000, opex: 80_000_000, interest: 15_000_000, tax: 15_000_000 },
    { deptId: tsiOnmDeptId, revenue: 400_000_000, cogs: 240_000_000, opex: 65_000_000, interest: 12_000_000, tax: 12_000_000 },
  ];

  for (const is_ of isDepts) {
    await db
      .insert(incomeStatements)
      .values({
        departmentId: is_.deptId,
        period: currentPeriod,
        revenue: String(is_.revenue),
        cogs: String(is_.cogs),
        operatingExpenses: String(is_.opex),
        interestExpense: String(is_.interest),
        taxExpense: String(is_.tax),
        createdBy: financeUserId,
      })
      .onConflictDoNothing();
  }

  console.log('   ✅ Income statements seeded');

  console.log('\n🎉 Database initialization complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
