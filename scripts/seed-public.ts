// scripts/seed-public.ts — Seed public schema data
// Run with: npx tsx scripts/seed-public.ts
//
// Seeds:
//   - roles (owner, bod, subsidiary_manager)
//   - permissions (24 cfd.* keys)
//   - role_permissions
//   - users (admin, finance, banking, owner)
//   - corporates (ASI, TSI)
//   - departments (4 departments)
//   - projects (5 projects)
//   - user_corporate_accesses

import 'dotenv/config';
import { db } from '../src/db/connection';
import {
  roles,
  permissions,
  rolePermissions,
  users,
  corporates,
  departments,
  projects,
  userCorporateAccesses,
  systemConfigs,
  banks,
  corporateSectors,
  currencies,
  costCenterCategories,
  notificationConfigs,
} from '../src/db/schema/public';
import bcrypt from 'bcryptjs';

const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

async function main() {
  console.log('🚀 Seeding public schema data...');

  const permissionCatalog: Array<{ key: string; module: string; description: string }> = [
    // Dashboard & Global
    { key: 'cfd.dashboard.read', module: 'cfd', description: 'Read dashboard' },
    { key: 'approvals.read', module: 'public', description: 'Read approvals' },

    // FRS / Corporate Finance
    { key: 'cfd.corporates.read', module: 'cfd', description: 'Read corporates' },
    { key: 'cfd.corporates.write', module: 'cfd', description: 'Manage corporates' },
    { key: 'cfd.corporates.delete', module: 'cfd', description: 'Delete corporates' },
    { key: 'cfd.cost_centers.read', module: 'cfd', description: 'Read cost centers' },
    { key: 'cfd.cost_centers.write', module: 'cfd', description: 'Manage cost centers' },
    { key: 'cfd.cost_centers.delete', module: 'cfd', description: 'Delete cost centers' },
    { key: 'cfd.benchmarking.read', module: 'cfd', description: 'Read benchmarking analysis' },
    { key: 'cfd.trends.read', module: 'cfd', description: 'Read trend analysis' },
    { key: 'cfd.alerts.read', module: 'cfd', description: 'Read alerts' },
    { key: 'cfd.alerts.write', module: 'cfd', description: 'Acknowledge or manage alerts' },
    { key: 'cfd.thresholds.read', module: 'cfd', description: 'Read thresholds' },
    { key: 'cfd.thresholds.write', module: 'cfd', description: 'Write thresholds' },
    { key: 'cfd.thresholds.configure', module: 'cfd', description: 'Configure thresholds' },
    { key: 'cfd.reports.read', module: 'cfd', description: 'Read reports' },
    { key: 'cfd.reports.write', module: 'cfd', description: 'Write report configs' },
    { key: 'cfd.reports.export', module: 'cfd', description: 'Export reports' },
    { key: 'cfd.reports.schedule', module: 'cfd', description: 'Schedule reports' },
    { key: 'cfd.users.read', module: 'cfd', description: 'Read users' },
    { key: 'cfd.users.write', module: 'cfd', description: 'Create/update users' },
    { key: 'cfd.users.delete', module: 'cfd', description: 'Delete users' },
    { key: 'cfd.users.manage_users', module: 'cfd', description: 'Manage user roles and access' },
    { key: 'cfd.notifications.read', module: 'cfd', description: 'Read notifications' },
    { key: 'cfd.notifications.write', module: 'cfd', description: 'Manage notifications' },

    // Management Modules
    { key: 'public.departments.read', module: 'public', description: 'Read departments' },
    { key: 'public.departments.write', module: 'public', description: 'Manage departments' },
    { key: 'public.departments.delete', module: 'public', description: 'Delete departments' },
    { key: 'public.projects.read', module: 'public', description: 'Read projects' },
    { key: 'public.projects.write', module: 'public', description: 'Manage projects' },
    { key: 'public.projects.delete', module: 'public', description: 'Delete projects' },
    { key: 'public.targets.read', module: 'public', description: 'Read targets' },
    { key: 'public.targets.write', module: 'public', description: 'Manage targets' },
    { key: 'public.targets.delete', module: 'public', description: 'Delete targets' },
    { key: 'cfd.statements.read', module: 'cfd', description: 'Read financial statements' },
    { key: 'cfd.statements.write', module: 'cfd', description: 'Manage financial statements' },

    // Financial Data Refinement
    { key: 'cfd.balance_sheets.read', module: 'cfd', description: 'Read balance sheets' },
    { key: 'cfd.balance_sheets.write', module: 'cfd', description: 'Manage balance sheets' },
    { key: 'cfd.balance_sheets.delete', module: 'cfd', description: 'Delete balance sheets' },
    { key: 'cfd.income_statements.read', module: 'cfd', description: 'Read income statements' },
    { key: 'cfd.income_statements.write', module: 'cfd', description: 'Manage income statements' },
    { key: 'cfd.income_statements.delete', module: 'cfd', description: 'Delete income statements' },
    { key: 'cfd.weekly_cash_flows.read', module: 'cfd', description: 'Read weekly cash flows' },
    { key: 'cfd.weekly_cash_flows.write', module: 'cfd', description: 'Manage weekly cash flows' },
    { key: 'cfd.weekly_cash_flows.delete', module: 'cfd', description: 'Delete weekly cash flows' },

    // CFD Financial Enhancements
    { key: 'cfd.realizations.read', module: 'cfd', description: 'Read cash realizations' },
    { key: 'cfd.realizations.write', module: 'cfd', description: 'Manage cash realizations' },
    { key: 'cfd.realizations.delete', module: 'cfd', description: 'Delete cash realizations' },
    { key: 'cfd.bank_loans.read', module: 'cfd', description: 'Read bank loans' },
    { key: 'cfd.bank_loans.write', module: 'cfd', description: 'Manage bank loans' },
    { key: 'cfd.bank_loans.delete', module: 'cfd', description: 'Delete bank loans' },
    { key: 'public.banks.read', module: 'public', description: 'Read banks' },
    { key: 'public.banks.write', module: 'public', description: 'Manage banks' },
    { key: 'public.banks.delete', module: 'public', description: 'Delete banks' },
    { key: 'public.corporate_sectors.read', module: 'public', description: 'Read corporate sectors' },
    { key: 'public.corporate_sectors.write', module: 'public', description: 'Manage corporate sectors' },
    { key: 'public.corporate_sectors.delete', module: 'public', description: 'Delete corporate sectors' },
    { key: 'public.currencies.read', module: 'public', description: 'Read currencies' },
    { key: 'public.currencies.write', module: 'public', description: 'Manage currencies' },
    { key: 'public.currencies.delete', module: 'public', description: 'Delete currencies' },
    { key: 'public.cost_center_categories.read', module: 'public', description: 'Read cost center categories' },
    { key: 'public.cost_center_categories.write', module: 'public', description: 'Manage cost center categories' },
    { key: 'public.cost_center_categories.delete', module: 'public', description: 'Delete cost center categories' },
    { key: 'public.notification_configs.read', module: 'public', description: 'Read notification configs' },
    { key: 'public.notification_configs.write', module: 'public', description: 'Manage notification configs' },
    { key: 'public.notification_configs.delete', module: 'public', description: 'Delete notification configs' },

    // CRM Module
    { key: 'crm.dashboard.read', module: 'crm', description: 'Read CRM dashboard' },
    { key: 'crm.customers.read', module: 'crm', description: 'Read customers' },
    { key: 'crm.customers.write', module: 'crm', description: 'Manage customers' },
    { key: 'crm.customers.delete', module: 'crm', description: 'Delete customers' },
    { key: 'crm.opportunities.read', module: 'crm', description: 'Read opportunities' },
    { key: 'crm.opportunities.write', module: 'crm', description: 'Manage opportunities' },
    { key: 'crm.opportunities.delete', module: 'crm', description: 'Delete opportunities' },
    { key: 'crm.proposals.read', module: 'crm', description: 'Read proposals' },
    { key: 'crm.proposals.write', module: 'crm', description: 'Manage proposals' },
    { key: 'crm.proposals.delete', module: 'crm', description: 'Delete proposals' },
    { key: 'crm.contracts.read', module: 'crm', description: 'Read contracts' },
    { key: 'crm.contracts.write', module: 'crm', description: 'Manage contracts' },
    { key: 'crm.contracts.delete', module: 'crm', description: 'Delete contracts' },
    { key: 'crm.reimburse.read', module: 'crm', description: 'Read reimbursements' },
    { key: 'crm.reimburse.write', module: 'crm', description: 'Manage reimbursements' },
    { key: 'crm.reimburse.delete', module: 'crm', description: 'Delete reimbursements' },
    { key: 'crm.interactions.read', module: 'crm', description: 'Read interactions' },
    { key: 'crm.interactions.write', module: 'crm', description: 'Log interactions' },
    { key: 'crm.qualifications.read', module: 'crm', description: 'Read qualifications' },
    { key: 'crm.qualifications.write', module: 'crm', description: 'Manage/Approve qualifications' },
    { key: 'crm.pipeline.read', module: 'crm', description: 'Read pipeline/kanban' },
    { key: 'crm.reports.read', module: 'crm', description: 'Read CRM reports' },
  ];

  const rolePermissionMap: Record<string, string[]> = {
    owner: permissionCatalog.map((p) => p.key),
    bod: permissionCatalog.filter(p => p.key.endsWith('.read')).map(p => p.key),
    subsidiary_manager: [
      'cfd.dashboard.read',
      'approvals.read',
      'cfd.corporates.read',
      'cfd.benchmarking.read',
      'cfd.trends.read',
      'cfd.alerts.read',
      'cfd.alerts.write',
      'cfd.thresholds.read',
      'cfd.reports.read',
      'cfd.reports.export',
      'cfd.notifications.read',
      'cfd.notifications.write',
      // Management
      'public.departments.read',
      'public.departments.write',
      'public.projects.read',
      'public.projects.write',
      'public.targets.read',
      'public.targets.write',
      'cfd.statements.read',
      'cfd.statements.write',
      // Refined permissions
      'cfd.balance_sheets.read',
      'cfd.balance_sheets.write',
      'cfd.income_statements.read',
      'cfd.income_statements.write',
      'cfd.weekly_cash_flows.read',
      'cfd.weekly_cash_flows.write',
      // Master tables (read only)
      'public.banks.read',
      'public.corporate_sectors.read',
      'public.currencies.read',
      'public.cost_center_categories.read',
      'public.notification_configs.read',
      // CRM write access for managers
      'crm.dashboard.read',
      'crm.customers.read',
      'crm.customers.write',
      'crm.opportunities.read',
      'crm.opportunities.write',
      'crm.proposals.read',
      'crm.proposals.write',
      'crm.contracts.read',
      'crm.qualifications.read',
      'crm.qualifications.write',
      'crm.reimburse.read',
      'crm.reimburse.write',
      // CFD Financial Enhancements
      'cfd.realizations.read',
      'cfd.realizations.write',
      'cfd.bank_loans.read',
      'cfd.bank_loans.write',
    ],
  };

  // ── Roles ─────────────────────────────────────────────────
  console.log('📋 Seeding roles...');
  const [ownerRole] = await db
    .insert(roles)
    .values({ name: 'owner', scope: 'system', description: 'Owner', createdBy: SYSTEM_ACTOR_ID })
    .onConflictDoNothing({ target: roles.name })
    .returning();

  const [bodRole] = await db
    .insert(roles)
    .values({ name: 'bod', scope: 'corporate', description: 'Board of Directors', createdBy: SYSTEM_ACTOR_ID })
    .onConflictDoNothing({ target: roles.name })
    .returning();

  const [subsidiaryManagerRole] = await db
    .insert(roles)
    .values({ name: 'subsidiary_manager', scope: 'corporate', description: 'Subsidiary Manager', createdBy: SYSTEM_ACTOR_ID })
    .onConflictDoNothing({ target: roles.name })
    .returning();

  const allRoles = await db.select().from(roles);
  const ownerRoleId = ownerRole?.id ?? allRoles.find((r) => r.name === 'owner')!.id;
  const bodRoleId = bodRole?.id ?? allRoles.find((r) => r.name === 'bod')!.id;
  const subsidiaryManagerRoleId = subsidiaryManagerRole?.id ?? allRoles.find((r) => r.name === 'subsidiary_manager')!.id;
  console.log('   ✅ Roles ready');

  // ── Users ─────────────────────────────────────────────────
  console.log('👥 Seeding users...');
  const [adminUser] = await db
    .insert(users)
    .values({ username: 'admin', email: 'admin@cfd.local', passwordHash: await bcrypt.hash('admin123', 10), fullName: 'Administrator', createdBy: 'system' })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const [financeUser] = await db
    .insert(users)
    .values({ username: 'finance', email: 'finance@cfd.local', passwordHash: await bcrypt.hash('finance123', 10), fullName: 'Finance Analyst', createdBy: 'system' })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const [bankingUser] = await db
    .insert(users)
    .values({ username: 'banking', email: 'banking@cfd.local', passwordHash: await bcrypt.hash('banking123', 10), fullName: 'Banking Officer', createdBy: 'system' })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const [ownerUser] = await db
    .insert(users)
    .values({ username: 'owner', email: 'owner@holding.com', passwordHash: await bcrypt.hash('Admin@123456', 10), fullName: 'Owner', createdBy: 'system' })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const allUsers = await db.select().from(users);
  const adminUserId = adminUser?.id ?? allUsers.find((u) => u.email === 'admin@cfd.local')!.id;
  const financeUserId = financeUser?.id ?? allUsers.find((u) => u.email === 'finance@cfd.local')!.id;
  const bankingUserId = bankingUser?.id ?? allUsers.find((u) => u.email === 'banking@cfd.local')!.id;
  const ownerUserId = ownerUser?.id ?? allUsers.find((u) => u.email === 'owner@holding.com')!.id;
  console.log('   ✅ Users ready');

  // ── Permissions ───────────────────────────────────────────
  console.log('🛂 Seeding permissions...');
  for (const permission of permissionCatalog) {
    await db.insert(permissions).values({
      key: permission.key,
      module: permission.module,
      description: permission.description,
      createdBy: SYSTEM_ACTOR_ID,
    }).onConflictDoNothing({ target: permissions.key });
  }

  const allPermissions = await db.select({ id: permissions.id, key: permissions.key }).from(permissions);
  const permissionByKey = new Map(allPermissions.map((p) => [p.key, p.id]));

  const roleByName = new Map(allRoles.map((role) => [role.name, role.id]));
  for (const [roleName, permissionKeys] of Object.entries(rolePermissionMap)) {
    const roleId = roleByName.get(roleName);
    if (!roleId) continue;
    for (const permissionKey of permissionKeys) {
      const permissionId = permissionByKey.get(permissionKey);
      if (!permissionId) continue;
      await db.insert(rolePermissions).values({
        roleId,
        permissionId,
        grantedBy: adminUserId,
      }).onConflictDoNothing({ target: [rolePermissions.roleId, rolePermissions.permissionId] });
    }
  }
  console.log('   ✅ Permissions ready');

  // ── Corporates ────────────────────────────────────────────
  console.log('🏢 Seeding corporates...');
  const [asiCorp] = await db
    .insert(corporates)
    .values({ name: 'PT Asia Serv Indonesia', code: 'ASI', industry: 'manufacturing', currency: 'IDR', createdBy: SYSTEM_ACTOR_ID })
    .onConflictDoNothing({ target: corporates.code })
    .returning();

  const [tsiCorp] = await db
    .insert(corporates)
    .values({ name: 'PT Titian Servis Indonesia', code: 'TSI', industry: 'services', currency: 'IDR', createdBy: SYSTEM_ACTOR_ID })
    .onConflictDoNothing({ target: corporates.code })
    .returning();

  const allCorps = await db.select().from(corporates);
  const asiId = asiCorp?.id ?? allCorps.find((c) => c.code === 'ASI')!.id;
  const tsiId = tsiCorp?.id ?? allCorps.find((c) => c.code === 'TSI')!.id;
  console.log('   ✅ Corporates ready');

  // ── Departments ───────────────────────────────────────────
  console.log('📁 Seeding departments...');
  const deptValues = [
    { corporateId: asiId, name: 'ONM (Operational)', code: 'ASI-ONM', createdBy: SYSTEM_ACTOR_ID },
    { corporateId: asiId, name: 'WS (Workshop)', code: 'ASI-WS', createdBy: SYSTEM_ACTOR_ID },
    { corporateId: tsiId, name: 'ONM (Operational)', code: 'TSI-ONM', createdBy: SYSTEM_ACTOR_ID },
    { corporateId: tsiId, name: 'WS (Workshop)', code: 'TSI-WS', createdBy: SYSTEM_ACTOR_ID },
  ];

  for (const dv of deptValues) {
    await db.insert(departments).values(dv).onConflictDoNothing();
  }
  console.log('   ✅ Departments ready');

  // ── System Configs ────────────────────────────────────────
  console.log('⚙️  Seeding system configs...');
  const configValues = [
    {
      key: 'corporate_sectors',
      value: [
        { code: 'technology', label: { id: 'Teknologi', en: 'Technology' } },
        { code: 'retail', label: { id: 'Retail', en: 'Retail' } },
        { code: 'services', label: { id: 'Jasa', en: 'Services' } },
        { code: 'manufacturing', label: { id: 'Manufaktur', en: 'Manufacturing' } },
      ],
      description: 'Daftar sektor perusahaan',
      createdBy: SYSTEM_ACTOR_ID,
    },
    {
      key: 'currencies',
      value: [
        { code: 'IDR', label: 'Rupiah' },
        { code: 'USD', label: 'US Dollar' },
        { code: 'SGD', label: 'Singapore Dollar' },
      ],
      description: 'Daftar mata uang',
      createdBy: SYSTEM_ACTOR_ID,
    },
    {
      key: 'cost_center_categories',
      value: [
        { code: 'hrd', label: { id: 'HRD', en: 'HRD' } },
        { code: 'atk', label: { id: 'Alat Tulis Kantor', en: 'Office Stationery' } },
        { code: 'operational', label: { id: 'Operasional', en: 'Operational' } },
        { code: 'marketing', label: { id: 'Pemasaran', en: 'Marketing' } },
        { code: 'it', label: { id: 'IT', en: 'IT' } },
      ],
      description: 'Daftar kategori cost center',
      createdBy: SYSTEM_ACTOR_ID,
    },
    {
      key: 'max_logo_size',
      value: 2097152,
      description: 'Ukuran maksimal logo perusahaan (dalam bytes)',
      createdBy: SYSTEM_ACTOR_ID,
    },
  ];

  for (const config of configValues) {
    await db.insert(systemConfigs).values(config).onConflictDoUpdate({
      target: systemConfigs.key,
      set: { value: config.value },
    });
  }
  console.log('   ✅ System configs ready');

  // ── Banks ─────────────────────────────────────────────────
  console.log('🏦 Seeding banks...');
  const bankValues = [
    { code: 'BCA', name: 'Bank Central Asia', createdBy: SYSTEM_ACTOR_ID },
    { code: 'MANDIRI', name: 'Bank Mandiri', createdBy: SYSTEM_ACTOR_ID },
    { code: 'BNI', name: 'Bank Negara Indonesia', createdBy: SYSTEM_ACTOR_ID },
    { code: 'BRI', name: 'Bank Rakyat Indonesia', createdBy: SYSTEM_ACTOR_ID },
    { code: 'CIMB', name: 'CIMB Niaga', createdBy: SYSTEM_ACTOR_ID },
  ];
  for (const bv of bankValues) {
    await db.insert(banks).values(bv).onConflictDoNothing({ target: banks.code });
  }
  console.log('   ✅ Banks ready');

  // ── Corporate Sectors ─────────────────────────────────────
  console.log('🏭 Seeding corporate sectors...');
  const sectorValues = [
    { code: 'technology', labelId: 'Teknologi', labelEn: 'Technology', createdBy: SYSTEM_ACTOR_ID },
    { code: 'retail', labelId: 'Retail', labelEn: 'Retail', createdBy: SYSTEM_ACTOR_ID },
    { code: 'services', labelId: 'Jasa', labelEn: 'Services', createdBy: SYSTEM_ACTOR_ID },
    { code: 'manufacturing', labelId: 'Manufaktur', labelEn: 'Manufacturing', createdBy: SYSTEM_ACTOR_ID },
  ];
  for (const sv of sectorValues) {
    await db.insert(corporateSectors).values(sv).onConflictDoNothing({ target: corporateSectors.code });
  }
  console.log('   ✅ Corporate sectors ready');

  // ── Currencies ────────────────────────────────────────────
  console.log('💱 Seeding currencies...');
  const currencyValues = [
    { code: 'IDR', label: 'Rupiah', createdBy: SYSTEM_ACTOR_ID },
    { code: 'USD', label: 'US Dollar', createdBy: SYSTEM_ACTOR_ID },
    { code: 'EUR', label: 'Euro', createdBy: SYSTEM_ACTOR_ID },
  ];
  for (const cv of currencyValues) {
    await db.insert(currencies).values(cv).onConflictDoNothing({ target: currencies.code });
  }
  console.log('   ✅ Currencies ready');

  // ── Cost Center Categories ────────────────────────────────
  console.log('📂 Seeding cost center categories...');
  const categoryValues = [
    { code: 'hrd', labelId: 'HRD', labelEn: 'HRD', createdBy: SYSTEM_ACTOR_ID },
    { code: 'atk', labelId: 'Alat Tulis Kantor', labelEn: 'Office Stationery', createdBy: SYSTEM_ACTOR_ID },
    { code: 'operational', labelId: 'Operasional', labelEn: 'Operational', createdBy: SYSTEM_ACTOR_ID },
    { code: 'marketing', labelId: 'Pemasaran', labelEn: 'Marketing', createdBy: SYSTEM_ACTOR_ID },
    { code: 'it', labelId: 'IT', labelEn: 'IT', createdBy: SYSTEM_ACTOR_ID },
  ];
  for (const cv of categoryValues) {
    await db.insert(costCenterCategories).values(cv).onConflictDoNothing({ target: costCenterCategories.code });
  }
  console.log('   ✅ Cost center categories ready');

  // ── Projects ──────────────────────────────────────────────
  console.log('📊 Seeding projects...');
  const allDepts = await db.select().from(departments);
  const deptMap = Object.fromEntries(allDepts.map((d) => [`${d.corporateId}_${d.code}`, d.id]));

  const asiOnmDeptId = deptMap[`${asiId}_ASI-ONM`];
  const asiWsDeptId = deptMap[`${asiId}_ASI-WS`];
  const tsiOnmDeptId = deptMap[`${tsiId}_TSI-ONM`];
  const tsiWsDeptId = deptMap[`${tsiId}_TSI-WS`];

  const projValues = [
    { departmentId: asiOnmDeptId, code: 'ALPHA', name: 'Project Alpha', description: 'Main operational project for ASI', createdBy: SYSTEM_ACTOR_ID },
    { departmentId: asiOnmDeptId, code: 'BETA', name: 'Project Beta', description: 'Secondary operational project', createdBy: SYSTEM_ACTOR_ID },
    { departmentId: asiWsDeptId, code: 'MAINT', name: 'Workshop Maintenance', description: 'Regular maintenance services', createdBy: SYSTEM_ACTOR_ID },
    { departmentId: tsiOnmDeptId, code: 'GAMMA', name: 'Project Gamma', description: 'Main operational project for TSI', createdBy: SYSTEM_ACTOR_ID },
    { departmentId: tsiWsDeptId, code: 'WSSVC', name: 'Workshop Services', description: 'Workshop service operations', createdBy: SYSTEM_ACTOR_ID },
  ];

  for (const pv of projValues) {
    await db.insert(projects).values(pv).onConflictDoNothing();
  }
  console.log('   ✅ Projects ready');

  // ── User-Corporate Access ─────────────────────────────────
  console.log('🔐 Seeding user access...');
  for (const userId of [adminUserId, ownerUserId, financeUserId, bankingUserId]) {
    const roleId =
      userId === adminUserId || userId === ownerUserId
        ? ownerRoleId
        : userId === financeUserId
          ? bodRoleId
          : subsidiaryManagerRoleId;

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

  // ── Notification Configs ──────────────────────────────────
  console.log('🔔 Seeding notification configs...');
  const notifConfigValues = [
    {
      module: 'cfd',
      eventType: 'loan_installment_due',
      roleId: subsidiaryManagerRoleId,
      isActive: true,
      createdBy: SYSTEM_ACTOR_ID,
    },
    {
      module: 'cfd',
      eventType: 'loan_installment_due',
      roleId: bodRoleId,
      isActive: true,
      createdBy: SYSTEM_ACTOR_ID,
    },
    {
      module: 'cfd',
      eventType: 'loan_installment_due',
      roleId: ownerRoleId,
      isActive: true,
      createdBy: SYSTEM_ACTOR_ID,
    },
  ];

  for (const ncv of notifConfigValues) {
    await db.insert(notificationConfigs).values(ncv).onConflictDoNothing();
  }
  console.log('   ✅ Notification configs ready');

  console.log('\n🎉 Public schema seeding complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
