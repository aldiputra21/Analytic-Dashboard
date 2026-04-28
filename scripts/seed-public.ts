// scripts/seed-public.ts — Seed public schema data with New RBAC Roles
// Run with: npx tsx scripts/seed-public.ts

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
  console.log('🚀 Seeding public schema data with New RBAC...');

  const permissionCatalog: Array<{ key: string; module: string; description: string }> = [
    // Dashboard & Global
    { key: 'cfd.dashboard.read', module: 'cfd', description: 'Read dashboard' },
    { key: 'approvals.read', module: 'public', description: 'Read approvals' },

    // Admin Permission & Role Management
    { key: 'cfd.permissions.read', module: 'cfd', description: 'Read permissions' },
    { key: 'cfd.permissions.write', module: 'cfd', description: 'Manage permissions' },
    { key: 'cfd.roles.read', module: 'cfd', description: 'Read roles' },
    { key: 'cfd.roles.write', module: 'cfd', description: 'Manage roles' },
    { key: 'cfd.users.reset_password', module: 'cfd', description: 'Force reset user password' },
    { key: 'cfd.audit_log.read', module: 'cfd', description: 'Read audit logs' },

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
    { key: 'public.system_configs.read', module: 'public', description: 'Read system configs' },
    { key: 'public.system_configs.write', module: 'public', description: 'Manage system configs' },

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
    system_admin: permissionCatalog.map((p) => p.key),
    global_admin: [
      'cfd.dashboard.read',
      'approvals.read',
      'cfd.corporates.read',
      'cfd.corporates.write',
      'cfd.cost_centers.read',
      'cfd.cost_centers.write',
      'cfd.users.read',
      'cfd.users.write',
      'cfd.users.manage_users',
      'cfd.audit_log.read',
      'public.notification_configs.read',
      'public.notification_configs.write',
      'public.notification_configs.delete',
      'public.banks.read',
      'public.banks.write',
      'public.corporate_sectors.read',
      'public.corporate_sectors.write',
      'public.currencies.read',
      'public.currencies.write',
      'public.cost_center_categories.read',
      'public.cost_center_categories.write',
      'crm.dashboard.read',
      'crm.customers.read',
      'crm.reports.read',
    ],
    global_executive: permissionCatalog.filter(p => p.key.endsWith('.read')).map(p => p.key),
    corporate_admin: [
      'cfd.dashboard.read',
      'approvals.read',
      'cfd.users.read',
      'cfd.users.write',
      'cfd.users.manage_users',
      'public.departments.read',
      'public.departments.write',
      'public.projects.read',
      'public.projects.write',
      'cfd.audit_log.read',
    ],
    corporate_executive: permissionCatalog
      .filter(p => p.key.endsWith('.read'))
      .map(p => p.key),
    finance_leader: [
      'cfd.dashboard.read',
      'approvals.read',
      'cfd.statements.read',
      'cfd.reports.read',
      'cfd.reports.export',
      'cfd.balance_sheets.read',
      'cfd.income_statements.read',
      'cfd.weekly_cash_flows.read',
      'cfd.realizations.read',
    ],
    finance_manager: [
      'cfd.dashboard.read',
      'approvals.read',
      'cfd.statements.read',
      'cfd.reports.read',
      'cfd.reports.export',
      'cfd.balance_sheets.read',
      'cfd.income_statements.read',
      'cfd.weekly_cash_flows.read',
      'cfd.realizations.read',
    ],
    finance_staff: [
      'cfd.dashboard.read',
      'cfd.statements.read',
      'cfd.statements.write',
      'cfd.balance_sheets.read',
      'cfd.balance_sheets.write',
      'cfd.income_statements.read',
      'cfd.income_statements.write',
      'cfd.weekly_cash_flows.read',
      'cfd.weekly_cash_flows.write',
      'cfd.realizations.read',
      'cfd.realizations.write',
    ],
    dept_leader: [
      'cfd.dashboard.read',
      'approvals.read',
      'public.targets.read',
      'crm.dashboard.read',
      'crm.customers.read',
      'crm.opportunities.read',
      'crm.proposals.read',
      'crm.contracts.read',
      'crm.reports.read',
    ],
    dept_manager: [
      'cfd.dashboard.read',
      'approvals.read',
      'public.targets.read',
      'crm.dashboard.read',
      'crm.customers.read',
      'crm.opportunities.read',
      'crm.proposals.read',
      'crm.contracts.read',
      'crm.reports.read',
    ],
    dept_staff: [
      'cfd.dashboard.read',
      'public.targets.read',
      'public.targets.write',
      'crm.dashboard.read',
      'crm.customers.read',
      'crm.customers.write',
      'crm.opportunities.read',
      'crm.opportunities.write',
      'crm.proposals.read',
      'crm.proposals.write',
      'crm.contracts.read',
      'crm.contracts.write',
      'crm.interactions.read',
      'crm.interactions.write',
    ],
  };

  // ── Roles ─────────────────────────────────────────────────
  console.log('📋 Seeding roles...');
  const roleDefinitions = [
    { name: 'system_admin', scope: 'system', description: 'System Administrator' },
    { name: 'global_admin', scope: 'system', description: 'Holding Administrator' },
    { name: 'global_executive', scope: 'system', description: 'Holding Executive' },
    { name: 'corporate_admin', scope: 'corporate', description: 'Corporate Administrator' },
    { name: 'corporate_executive', scope: 'corporate', description: 'Corporate BOD' },
    { name: 'finance_leader', scope: 'corporate', description: 'Finance Leader' },
    { name: 'finance_manager', scope: 'corporate', description: 'Finance Manager' },
    { name: 'finance_staff', scope: 'corporate', description: 'Finance Staff' },
    { name: 'dept_leader', scope: 'department', description: 'Department Leader' },
    { name: 'dept_manager', scope: 'department', description: 'Department Manager' },
    { name: 'dept_staff', scope: 'department', description: 'Department Staff' },
  ];

  for (const roleDef of roleDefinitions) {
    await db
      .insert(roles)
      .values({ ...roleDef, createdBy: SYSTEM_ACTOR_ID })
      .onConflictDoUpdate({
        target: roles.name,
        set: { scope: roleDef.scope, description: roleDef.description },
      });
  }

  const allRoles = await db.select().from(roles);
  const roleMap = new Map(allRoles.map((r) => [r.name, r.id]));
  console.log('   ✅ Roles ready');

  // ── Users ─────────────────────────────────────────────────
  console.log('👥 Seeding users...');
  const userDefinitions = [
    { username: 'admin_system', email: 'admin.system@cfd.local', fullName: 'System Administrator' },
    { username: 'admin_global', email: 'admin.global@cfd.local', fullName: 'Global Administrator' },
    { username: 'admin_tsi', email: 'admin.tsi@cfd.local', fullName: 'TSI IT Admin' },
    { username: 'exec_global', email: 'exec.global@cfd.local', fullName: 'Global Executive' },
    { username: 'exec_tsi', email: 'exec.tsi@cfd.local', fullName: 'TSI Executive' },
    { username: 'finance_leader_tsi', email: 'finance.leader@tsi.local', fullName: 'TSI Finance Leader' },
    { username: 'finance_staff_tsi', email: 'finance.staff@tsi.local', fullName: 'TSI Finance Staff' },
    { username: 'dept_leader_onm_tsi', email: 'dept.leader.onm@tsi.local', fullName: 'TSI ONM Leader' },
    { username: 'dept_staff_onm_tsi', email: 'dept.staff.onm@tsi.local', fullName: 'TSI ONM Staff' },
  ];

  const defaultPassword = await bcrypt.hash('Admin@123456', 10);

  for (const userDef of userDefinitions) {
    await db
      .insert(users)
      .values({
        ...userDef,
        passwordHash: defaultPassword,
        createdBy: 'system',
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { username: userDef.username, fullName: userDef.fullName },
      });
  }

  const allUsers = await db.select().from(users);
  const userMap = new Map(allUsers.map((u) => [u.username, u.id]));
  console.log('   ✅ Users ready');

  // ── Permissions ───────────────────────────────────────────
  console.log('🛂 Seeding permissions...');
  for (const permission of permissionCatalog) {
    await db.insert(permissions).values({
      key: permission.key,
      module: permission.module,
      description: permission.description,
      createdBy: SYSTEM_ACTOR_ID,
    }).onConflictDoUpdate({
      target: permissions.key,
      set: { description: permission.description },
    });
  }

  const allPermissions = await db.select({ id: permissions.id, key: permissions.key }).from(permissions);
  const permissionByKey = new Map(allPermissions.map((p) => [p.key, p.id]));

  console.log('🔗 Mapping permissions to roles...');
  for (const [roleName, permissionKeys] of Object.entries(rolePermissionMap)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;
    for (const permissionKey of permissionKeys) {
      const permissionId = permissionByKey.get(permissionKey);
      if (!permissionId) continue;
      await db.insert(rolePermissions).values({
        roleId,
        permissionId,
        grantedBy: userMap.get('admin_system')!,
      }).onConflictDoNothing();
    }
  }
  console.log('   ✅ Permissions ready');

  // ── Corporates ────────────────────────────────────────────
  console.log('🏢 Seeding corporates...');
  const [asiCorp] = await db
    .insert(corporates)
    .values({ name: 'PT Asia Serv Indonesia', code: 'ASI', industry: 'manufacturing', currency: 'IDR', createdBy: SYSTEM_ACTOR_ID })
    .onConflictDoUpdate({ target: corporates.code, set: { name: 'PT Asia Serv Indonesia' } })
    .returning();

  const [tsiCorp] = await db
    .insert(corporates)
    .values({ name: 'PT Titian Servis Indonesia', code: 'TSI', industry: 'services', currency: 'IDR', createdBy: SYSTEM_ACTOR_ID })
    .onConflictDoUpdate({ target: corporates.code, set: { name: 'PT Titian Servis Indonesia' } })
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
  const allDepts = await db.select().from(departments);
  const tsiOnmDeptId = allDepts.find(d => d.corporateId === tsiId && d.code === 'TSI-ONM')!.id;
  console.log('   ✅ Departments ready');

  // ── User-Corporate Access ─────────────────────────────────
  console.log('🔐 Seeding user access mappings...');
  const accessMappings = [
    { username: 'admin_system', role: 'system_admin', scope: 'system' },
    { username: 'admin_global', role: 'global_admin', scope: 'system' },
    { username: 'exec_global', role: 'global_executive', scope: 'system' },
    // TSI Local Access
    { username: 'admin_tsi', role: 'corporate_admin', scope: 'corporate', corpId: tsiId },
    { username: 'exec_tsi', role: 'corporate_executive', scope: 'corporate', corpId: tsiId },
    { username: 'finance_leader_tsi', role: 'finance_leader', scope: 'corporate', corpId: tsiId },
    { username: 'finance_staff_tsi', role: 'finance_staff', scope: 'corporate', corpId: tsiId },
    // TSI Department Access
    { username: 'dept_leader_onm_tsi', role: 'dept_leader', scope: 'department', corpId: tsiId, deptId: tsiOnmDeptId },
    { username: 'dept_staff_onm_tsi', role: 'dept_staff', scope: 'department', corpId: tsiId, deptId: tsiOnmDeptId },
  ];

  for (const mapping of accessMappings) {
    const userId = userMap.get(mapping.username);
    const roleId = roleMap.get(mapping.role);
    if (userId && roleId) {
      await db
        .insert(userCorporateAccesses)
        .values({
          userId,
          roleId,
          scope: mapping.scope as any,
          corporateId: mapping.corpId,
          departmentId: mapping.deptId,
          grantedBy: userMap.get('admin_system'),
        })
        .onConflictDoNothing();
    }
  }
  // ── System Configs ───────────────────────────────────────
  console.log('⚙️ Seeding system configs...');
  await db.insert(systemConfigs).values([
    { key: 'app_version', value: '1.0.0', description: 'Application Version', createdBy: SYSTEM_ACTOR_ID },
    { key: 'maintenance_mode', value: false, description: 'System Maintenance Mode', createdBy: SYSTEM_ACTOR_ID },
    { key: 'CORPORATE_LOGO_UPLOAD_DIR', value: 'assets/corporate-logos', description: 'Directory for corporate logos', createdBy: SYSTEM_ACTOR_ID },
    { key: 'CORPORATE_LOGO_MAX_SIZE', value: 2097152, description: 'Max size for corporate logos (bytes)', createdBy: SYSTEM_ACTOR_ID },
    { key: 'CORPORATE_LOGO_ALLOWED_FORMATS', value: ['jpg', 'jpeg', 'png', 'webp'], description: 'Allowed formats for corporate logos', createdBy: SYSTEM_ACTOR_ID },
    { key: 'REALIZATION_ATTACHMENT_UPLOAD_DIR', value: 'assets/attachments/realisasi', description: 'Directory for realization attachments', createdBy: SYSTEM_ACTOR_ID },
    { key: 'REALIZATION_ATTACHMENT_MAX_SIZE', value: 10485760, description: 'Max size for realization attachments (bytes)', createdBy: SYSTEM_ACTOR_ID },
    { key: 'REALIZATION_ATTACHMENT_ALLOWED_FORMATS', value: ['png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx', 'pdf'], description: 'Allowed formats for realization attachments', createdBy: SYSTEM_ACTOR_ID },
  ]).onConflictDoNothing();

  // ── Banks ─────────────────────────────────────────────────
  console.log('🏦 Seeding banks...');
  await db.insert(banks).values([
    { name: 'Bank Mandiri', code: 'MANDIRI', createdBy: SYSTEM_ACTOR_ID },
    { name: 'Bank Central Asia', code: 'BCA', createdBy: SYSTEM_ACTOR_ID },
    { name: 'Bank Rakyat Indonesia', code: 'BRI', createdBy: SYSTEM_ACTOR_ID },
    { name: 'Bank Negara Indonesia', code: 'BNI', createdBy: SYSTEM_ACTOR_ID },
  ]).onConflictDoNothing();

  // ── Corporate Sectors ─────────────────────────────────────
  console.log('🏢 Seeding corporate sectors...');
  await db.insert(corporateSectors).values([
    { code: 'MFG', labelId: 'Manufaktur', labelEn: 'Manufacturing', createdBy: SYSTEM_ACTOR_ID },
    { code: 'SVC', labelId: 'Jasa', labelEn: 'Services', createdBy: SYSTEM_ACTOR_ID },
    { code: 'ONG', labelId: 'Minyak & Gas', labelEn: 'Oil & Gas', createdBy: SYSTEM_ACTOR_ID },
    { code: 'MIN', labelId: 'Pertambangan', labelEn: 'Mining', createdBy: SYSTEM_ACTOR_ID },
  ]).onConflictDoNothing();

  // ── Currencies ────────────────────────────────────────────
  console.log('💵 Seeding currencies...');
  await db.insert(currencies).values([
    { code: 'IDR', label: 'Indonesian Rupiah', createdBy: SYSTEM_ACTOR_ID },
    { code: 'USD', label: 'US Dollar', createdBy: SYSTEM_ACTOR_ID },
    { code: 'SGD', label: 'Singapore Dollar', createdBy: SYSTEM_ACTOR_ID },
  ]).onConflictDoNothing();

  // ── Cost Center Categories ────────────────────────────────
  console.log('🏷️ Seeding cost center categories...');
  await db.insert(costCenterCategories).values([
    { code: 'OPEX', labelId: 'Biaya Operasional', labelEn: 'Operational Expenses', createdBy: SYSTEM_ACTOR_ID },
    { code: 'CAPEX', labelId: 'Biaya Modal', labelEn: 'Capital Expenditure', createdBy: SYSTEM_ACTOR_ID },
    { code: 'ADM', labelId: 'Administrasi', labelEn: 'Administrative', createdBy: SYSTEM_ACTOR_ID },
  ]).onConflictDoNothing();

  // ── Projects ──────────────────────────────────────────────
  console.log('🏗️ Seeding initial projects...');
  const projectValues = [
    { departmentId: tsiOnmDeptId, name: 'Project Alpha (Maintenance)', code: 'PROJ-A', createdBy: SYSTEM_ACTOR_ID },
    { departmentId: tsiOnmDeptId, name: 'Project Beta (Repair)', code: 'PROJ-B', createdBy: SYSTEM_ACTOR_ID },
  ];
  for (const pv of projectValues) {
    await db.insert(projects).values(pv).onConflictDoNothing();
  }

  // ── Notification Configs ──────────────────────────────────
  console.log('🔔 Seeding notification configs...');
  const globalAdminRoleId = roleMap.get('global_admin')!;
  const financeLeaderRoleId = roleMap.get('finance_leader')!;

  await db.insert(notificationConfigs).values([
    {
      module: 'cfd',
      eventType: 'RATIO_ALERT',
      roleId: globalAdminRoleId,
      isActive: true,
      createdBy: SYSTEM_ACTOR_ID
    },
    {
      module: 'public',
      eventType: 'APPROVAL_REQUEST',
      roleId: financeLeaderRoleId,
      isActive: true,
      createdBy: SYSTEM_ACTOR_ID
    },
  ]).onConflictDoNothing();

  console.log('   ✅ User access ready');

  console.log('\n🎉 New RBAC Public schema seeding complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
