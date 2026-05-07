// scripts/seed-public.ts — Seed public schema data with New RBAC Roles
// Run with: npx tsx scripts/seed-public.ts

import 'dotenv/config';
import { eq } from 'drizzle-orm';
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
  approvalWorkflows,
  approvalWorkflowSteps,
  reportConfigs,
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
    { key: 'cfd.cash_flow_projections.read', module: 'cfd', description: 'Read cash flow projections' },
    { key: 'cfd.cash_flow_projections.write', module: 'cfd', description: 'Manage cash flow projections' },
    { key: 'cfd.cash_flow_projections.delete', module: 'cfd', description: 'Delete cash flow projections' },
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
    { key: 'public.notification.broadcast', module: 'public', description: 'Broadcast notifications to users and roles' },

    // Approval Config Management
    { key: 'public.approval_configs.read', module: 'public', description: 'Read approval workflow configs' },
    { key: 'public.approval_configs.write', module: 'public', description: 'Manage approval workflow configs' },
    { key: 'public.approval_configs.delete', module: 'public', description: 'Delete approval workflow configs' },

    // Dynamic Report Configs
    { key: 'public.report_configs.read', module: 'public', description: 'Read dynamic report configurations' },
    { key: 'public.report_configs.write', module: 'public', description: 'Manage dynamic report configurations' },
    { key: 'public.report_configs.delete', module: 'public', description: 'Delete dynamic report configurations' },

    // Upload Permissions — 11 modules (Export & Upload Module)
    { key: 'cfd.balance_sheets.upload', module: 'cfd', description: 'Upload balance sheets via Excel template' },
    { key: 'cfd.income_statements.upload', module: 'cfd', description: 'Upload income statements via Excel template' },
    { key: 'cfd.weekly_cash_flows.upload', module: 'cfd', description: 'Upload weekly cash flows via Excel template' },
    { key: 'cfd.realizations.upload', module: 'cfd', description: 'Upload cash realizations via Excel template' },
    { key: 'cfd.cash_flow_projections.upload', module: 'cfd', description: 'Upload cash flow projections via Excel template' },
    { key: 'cfd.bank_loans.upload', module: 'cfd', description: 'Upload bank loans via Excel template' },
    { key: 'cfd.corporates.upload', module: 'cfd', description: 'Upload corporates via Excel template' },
    { key: 'cfd.cost_centers.upload', module: 'cfd', description: 'Upload cost centers via Excel template' },
    { key: 'public.targets.upload', module: 'public', description: 'Upload income statement projections (targets) via Excel template' },
    { key: 'public.departments.upload', module: 'public', description: 'Upload departments via Excel template' },
    { key: 'public.projects.upload', module: 'public', description: 'Upload projects via Excel template' },

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
    system_admin: permissionCatalog.map((p) => p.key),    global_admin: [
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
      'public.approval_configs.read',
      'cfd.users.read',
      'cfd.users.write',
      'cfd.users.manage_users',
      'public.departments.read',
      'public.departments.write',
      'public.projects.read',
      'public.projects.write',
      'cfd.cost_centers.read',
      'cfd.cost_centers.write',
      'cfd.cost_centers.delete',
      'cfd.audit_log.read',
      'cfd.cash_flow_projections.read',
      'cfd.corporates.upload',
      'public.departments.upload',
      'cfd.cost_centers.upload',
      'public.projects.upload',
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
      'cfd.cost_centers.read',
      'cfd.cost_centers.write',
      'cfd.realizations.read',
      'cfd.cash_flow_projections.read',
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
      'cfd.cost_centers.read',
      'cfd.cost_centers.write',
      'cfd.realizations.read',
      'cfd.cash_flow_projections.read',
    ],
    finance_staff: [
      'cfd.dashboard.read',
      'approvals.read',
      'cfd.statements.read',
      'cfd.statements.write',
      'cfd.balance_sheets.read',
      'cfd.balance_sheets.write',
      'cfd.balance_sheets.upload',
      'cfd.income_statements.read',
      'cfd.income_statements.write',
      'cfd.income_statements.upload',
      'public.targets.upload',
      'cfd.weekly_cash_flows.read',
      'cfd.weekly_cash_flows.write',
      'cfd.weekly_cash_flows.upload',
      'cfd.realizations.read',
      'cfd.realizations.write',
      'cfd.realizations.upload',
      'cfd.cost_centers.read',
      'cfd.cost_centers.write',
      'cfd.cash_flow_projections.read',
      'cfd.cash_flow_projections.write',
      'cfd.cash_flow_projections.upload',
      'cfd.bank_loans.upload',
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
      'approvals.read',
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
    { username: 'finance_manager_tsi', email: 'finance.manager@tsi.local', fullName: 'TSI Finance Manager' },
    { username: 'dept_leader_onm_tsi', email: 'dept.leader.onm@tsi.local', fullName: 'TSI ONM Leader' },
    { username: 'dept_manager_onm_tsi', email: 'dept.manager.onm@tsi.local', fullName: 'TSI ONM Manager' },
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

  // ── Corporate Sectors ─────────────────────────────────────
  console.log('🏢 Seeding corporate sectors...');
  await db.insert(corporateSectors).values([
    { code: 'BM', labelId: 'Bahan Baku',            labelEn: 'Basic Materials',          createdBy: SYSTEM_ACTOR_ID },
    { code: 'CS', labelId: 'Layanan Konsumen',       labelEn: 'Consumer Services',        createdBy: SYSTEM_ACTOR_ID },
    { code: 'EG', labelId: 'Energi',                 labelEn: 'Energy',                   createdBy: SYSTEM_ACTOR_ID },
    { code: 'FN', labelId: 'Keuangan',               labelEn: 'Finance',                  createdBy: SYSTEM_ACTOR_ID },
    { code: 'HC', labelId: 'Kesehatan',              labelEn: 'Healthcare',               createdBy: SYSTEM_ACTOR_ID },
    { code: 'IF', labelId: 'Infrastruktur',          labelEn: 'Infrastructure',           createdBy: SYSTEM_ACTOR_ID },
    { code: 'IN', labelId: 'Perindustrian',          labelEn: 'Industrials',              createdBy: SYSTEM_ACTOR_ID },
    { code: 'IT', labelId: 'Teknologi Informasi',    labelEn: 'Information Technology',   createdBy: SYSTEM_ACTOR_ID },
    { code: 'RT', labelId: 'Perdagangan & Ritel',    labelEn: 'Trade & Retail',           createdBy: SYSTEM_ACTOR_ID },
  ]).onConflictDoNothing();

  // ── Corporates ────────────────────────────────────────────
  // NOTE: industry must reference a valid corporate_sectors.code (FK constraint)
  // Seeds above (corporate_sectors + currencies) must run first.
  console.log('🏢 Seeding corporates...');
  const [asiCorp] = await db
    .insert(corporates)
    .values({ name: 'PT Asia Serv Indonesia', code: 'ASI', industry: 'EG', currency: 'IDR', createdBy: SYSTEM_ACTOR_ID })
    .onConflictDoUpdate({ target: corporates.code, set: { name: 'PT Asia Serv Indonesia', industry: 'IN' } })
    .returning();

  const [tsiCorp] = await db
    .insert(corporates)
    .values({ name: 'PT Titian Servis Indonesia', code: 'TSI', industry: 'EG', currency: 'IDR', createdBy: SYSTEM_ACTOR_ID })
    .onConflictDoUpdate({ target: corporates.code, set: { name: 'PT Titian Servis Indonesia', industry: 'CS' } })
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
    { username: 'finance_manager_tsi', role: 'finance_manager', scope: 'corporate', corpId: tsiId },
    { username: 'finance_staff_tsi', role: 'finance_staff', scope: 'corporate', corpId: tsiId },
    // TSI Department Access
    { username: 'dept_leader_onm_tsi', role: 'dept_leader', scope: 'department', corpId: tsiId, deptId: tsiOnmDeptId },
    { username: 'dept_manager_onm_tsi', role: 'dept_manager', scope: 'department', corpId: tsiId, deptId: tsiOnmDeptId },
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
    { 
      key: 'cfd_default_thresholds', 
      value: {
        roa: { healthy_min: 5, moderate_min: 2, risky_max: 0 },
        roe: { healthy_min: 10, moderate_min: 5, risky_max: 0 },
        npm: { healthy_min: 10, moderate_min: 5, risky_max: 0 },
        der: { healthy_max: 1.0, moderate_max: 2.0, risky_min: 2.0 },
        currentRatio: { healthy_min: 2.0, moderate_min: 1.0, risky_max: 1.0 },
        quickRatio: { healthy_min: 1.0, moderate_min: 0.5, risky_max: 0.5 },
        cashRatio: { healthy_min: 0.5, moderate_min: 0.2, risky_max: 0.2 },
        ocfRatio: { healthy_min: 1.0, moderate_min: 0.5, risky_max: 0 },
        dscr: { healthy_min: 1.5, moderate_min: 1.0, risky_max: 1.0 }
      }, 
      description: 'Default financial ratio thresholds for alerts', 
      createdBy: SYSTEM_ACTOR_ID 
    },
    {
      key: 'cfd_industry_thresholds',
      value: {
        manufacturing: {
          roa: { healthy_min: 4, moderate_min: 2, risky_max: 0 },
          der: { healthy_max: 1.5, moderate_max: 2.5, risky_min: 2.5 },
          currentRatio: { healthy_min: 1.5, moderate_min: 1.0, risky_max: 1.0 },
        },
        retail: {
          npm: { healthy_min: 5, moderate_min: 2, risky_max: 0 },
          currentRatio: { healthy_min: 1.5, moderate_min: 1.0, risky_max: 1.0 },
          der: { healthy_max: 1.5, moderate_max: 2.5, risky_min: 2.5 },
        },
        banking: {
          roa: { healthy_min: 1, moderate_min: 0.5, risky_max: 0 },
          roe: { healthy_min: 12, moderate_min: 8, risky_max: 0 },
          der: { healthy_max: 8.0, moderate_max: 12.0, risky_min: 12.0 },
        },
        property: {
          der: { healthy_max: 2.0, moderate_max: 3.0, risky_min: 3.0 },
          currentRatio: { healthy_min: 1.5, moderate_min: 1.0, risky_max: 1.0 },
        },
        technology: {
          npm: { healthy_min: 15, moderate_min: 8, risky_max: 0 },
          roa: { healthy_min: 8, moderate_min: 4, risky_max: 0 },
        },
      },
      description: 'Industry-specific threshold overrides',
      createdBy: SYSTEM_ACTOR_ID
    },
    { key: 'report_template_path', value: './storage/report-templates', description: 'Folder penyimpanan template Excel untuk laporan dinamis', createdBy: SYSTEM_ACTOR_ID },
    { key: 'report_output_path', value: './storage/report-outputs', description: 'Folder penyimpanan file output laporan dinamis', createdBy: SYSTEM_ACTOR_ID },
  ]).onConflictDoNothing();

  const cronScheduleConfig = {
    key: 'cron_schedule',
    value: { notificationHour: 0, notificationMinute: 0, cleanupHour: 0, cleanupMinute: 5 },
    description: 'Jadwal cron harian (0-23 untuk jam, 0-59 untuk menit). notificationHour/notificationMinute: cron notifikasi cicilan pinjaman. cleanupHour/cleanupMinute: cron pembersihan file laporan.',
    createdBy: SYSTEM_ACTOR_ID,
  };
  await db.insert(systemConfigs).values(cronScheduleConfig).onConflictDoUpdate({
    target: systemConfigs.key,
    set: { value: cronScheduleConfig.value, description: cronScheduleConfig.description },
  });

  // ── Upload Template Configs ───────────────────────────────
  console.log('📁 Seeding upload template configs...');

  // 2.1 — Base path for storing user-uploaded files
  await db.insert(systemConfigs).values({
    key: 'upload_base_path',
    value: './storage/uploads',
    description: 'Base directory path for storing user-uploaded files',
    createdBy: SYSTEM_ACTOR_ID,
  }).onConflictDoNothing();

  // 2.2 — Per-module template configs for all 11 modules
  // startRecord: row number in Excel where data starts (1-indexed)
  //   Row 1 = instructions, Row 2 = empty, Row 3 = column headers, Row 4 = data start
  const uploadTemplateConfigs = [
    // ── Financial Modules (7) ──────────────────────────────

    // 1. Balance Sheet (Neraca)
    {
      key: 'upload_template_balance_sheet',
      value: {
        startRecord: 4,
        columnOrder: [
          'corporate_id',
          'period',
          'cash_and_bank',
          'accounts_receivable',
          'work_in_progress',
          'inventory',
          'prepaid_expenses',
          'land',
          'building',
          'equipment',
          'other_fixed_assets',
          'accounts_payable',
          'bank_loan_current',
          'other_current_liabilities',
          'bank_loan_long_term',
          'other_long_term_liabilities',
          'shareholder_loan',
          'capital',
          'earnings_after_tax',
          'retained_earnings',
          'dividends',
          'notes',
        ],
      },
      description: 'Upload template config for Balance Sheet (Neraca) module',
      createdBy: SYSTEM_ACTOR_ID,
    },

    // 2. Income Statement (Laba Rugi)
    {
      key: 'upload_template_income_statement',
      value: {
        startRecord: 4,
        columnOrder: [
          'corporate_id',
          'period',
          'revenue',
          'cogs',
          'operating_expenses',
          'interest_expense',
          'tax_expense',
          'other_income',
          'other_expense',
          'notes',
        ],
      },
      description: 'Upload template config for Income Statement (Laba Rugi) module',
      createdBy: SYSTEM_ACTOR_ID,
    },

    // 3. Income Statement Projection (Proyeksi Laba Rugi)
    // Uses flat format: each row contains header_ref + detail columns
    {
      key: 'upload_template_income_statement_projection',
      value: {
        startRecord: 4,
        columnOrder: [
          'header_ref',       // identifier linking detail rows to header (e.g., "DEPT-2026")
          'department_id',
          'project_id',       // optional project FK
          'fiscal_year',
          'month',
          'account_code',
          'account_name',
          'amount',
          'notes',
        ],
      },
      description: 'Upload template config for Income Statement Projection (Proyeksi Laba Rugi) module — flat format with header_ref identifier',
      createdBy: SYSTEM_ACTOR_ID,
    },

    // 4. Weekly Cash Flow (Arus Kas Mingguan)
    {
      key: 'upload_template_weekly_cash_flow',
      value: {
        startRecord: 4,
        columnOrder: [
          'corporate_id',
          'entity_type',
          'entity_id',
          'period',
          'week',
          'operating_cash_in',
          'operating_cash_out',
          'investing_cash_in',
          'investing_cash_out',
          'financing_cash_in',
          'financing_cash_out',
          'notes',
        ],
      },
      description: 'Upload template config for Weekly Cash Flow (Arus Kas Mingguan) module',
      createdBy: SYSTEM_ACTOR_ID,
    },

    // 5. Realization (Realisasi)
    {
      key: 'upload_template_realization',
      value: {
        startRecord: 4,
        columnOrder: [
          'entity_type',
          'department_id',
          'project_id',
          'transaction_date',
          'category',
          'cost_center_id',
          'amount',
          'notes',
        ],
      },
      description: 'Upload template config for Realization (Realisasi) module',
      createdBy: SYSTEM_ACTOR_ID,
    },

    // 6. Cash Flow Projection (Proyeksi Arus Kas)
    // Wide format: 1 row = 1 header with 12 months × cash_in & cash_out columns
    // Row 3 = month names (merged 2 cols each), Row 4 = cash in/cash out sub-headers, Row 5+ = data
    {
      key: 'upload_template_cash_flow_projection',
      value: {
        startRecord: 5,
        columnOrder: [
          'corporate',        // display label resolved to corporate_id UUID during upload
          'fiscal_year',
          'initial_balance',
          'notes',
          'jan_cash_in', 'jan_cash_out',
          'feb_cash_in', 'feb_cash_out',
          'mar_cash_in', 'mar_cash_out',
          'apr_cash_in', 'apr_cash_out',
          'may_cash_in', 'may_cash_out',
          'jun_cash_in', 'jun_cash_out',
          'jul_cash_in', 'jul_cash_out',
          'aug_cash_in', 'aug_cash_out',
          'sep_cash_in', 'sep_cash_out',
          'oct_cash_in', 'oct_cash_out',
          'nov_cash_in', 'nov_cash_out',
          'dec_cash_in', 'dec_cash_out',
        ],
      },
      description: 'Upload template config for Cash Flow Projection (Proyeksi Arus Kas) module — wide format per fiscal year',
      createdBy: SYSTEM_ACTOR_ID,
    },

    // 7. Bank Loan (Pinjaman Bank)
    {
      key: 'upload_template_bank_loan',
      value: {
        startRecord: 4,
        columnOrder: [
          'corporate_id',
          'bank_id',
          'credit_type',
          'amount',
          'start_date',
          'tenor',
          'interest_type',
          'interest_rate',
          'alert_min_days',
        ],
      },
      description: 'Upload template config for Bank Loan (Pinjaman Bank) module',
      createdBy: SYSTEM_ACTOR_ID,
    },

    // ── Master Data Modules (4) ────────────────────────────

    // 8. Corporate (Perusahaan)
    {
      key: 'upload_template_corporate',
      value: {
        startRecord: 4,
        columnOrder: [
          'name',
          'code',
          'industry',
          'currency',
          'fiscal_year_start_month',
          'tax_rate',
        ],
      },
      description: 'Upload template config for Corporate (Perusahaan) master data module',
      createdBy: SYSTEM_ACTOR_ID,
    },

    // 9. Department (Departemen)
    {
      key: 'upload_template_department',
      value: {
        startRecord: 4,
        columnOrder: [
          'corporate_id',
          'name',
          'code',
          'description',
          'head_name',
        ],
      },
      description: 'Upload template config for Department (Departemen) master data module',
      createdBy: SYSTEM_ACTOR_ID,
    },

    // 10. Cost Center
    {
      key: 'upload_template_cost_center',
      value: {
        startRecord: 4,
        columnOrder: [
          'corporate_id',
          'name',
          'code',
          'category',
          'description',
        ],
      },
      description: 'Upload template config for Cost Center master data module',
      createdBy: SYSTEM_ACTOR_ID,
    },

    // 11. Project (Proyek)
    {
      key: 'upload_template_project',
      value: {
        startRecord: 4,
        columnOrder: [
          'department_id',
          'name',
          'code',
          'description',
          'start_date',
          'end_date',
          'status',
        ],
      },
      description: 'Upload template config for Project (Proyek) master data module',
      createdBy: SYSTEM_ACTOR_ID,
    },
  ];

  for (const config of uploadTemplateConfigs) {
    await db.insert(systemConfigs).values(config).onConflictDoUpdate({
      target: systemConfigs.key,
      set: { value: config.value, description: config.description },
    });
  }

  console.log(`   ✅ Upload template base path config seeded`);
  console.log(`   ✅ ${uploadTemplateConfigs.length} per-module upload template configs seeded`);

  // ── Notification Configs ─────────────────────────────────
  console.log('🔔 Seeding notification configs...');
  
  const getRoleIds = (names: string[]) => 
    allRoles.filter(r => names.includes(r.name)).map(r => r.id);

  const ratioRoles = getRoleIds([
    'system_admin', 
    'finance_leader', 
    'finance_manager', 
    'global_executive', 
    'corporate_executive'
  ]);

  const loanRoles = getRoleIds([
    'finance_leader', 
    'finance_manager', 
    'finance_staff'
  ]);

  await db.insert(notificationConfigs).values([
    {
      module: 'cfd',
      eventType: 'ratio-breach',
      targetRoles: ratioRoles,
      createdBy: SYSTEM_ACTOR_ID,
    },
    {
      module: 'cfd',
      eventType: 'loan-installment-due',
      targetRoles: loanRoles,
      createdBy: SYSTEM_ACTOR_ID,
    }
  ]).onConflictDoNothing();

  // ── Banks ─────────────────────────────────────────────────
  console.log('🏦 Seeding banks...');
  await db.insert(banks).values([
    { name: 'Bank Mandiri', code: 'MANDIRI', createdBy: SYSTEM_ACTOR_ID },
    { name: 'Bank Central Asia', code: 'BCA', createdBy: SYSTEM_ACTOR_ID },
    { name: 'Bank Rakyat Indonesia', code: 'BRI', createdBy: SYSTEM_ACTOR_ID },
    { name: 'Bank Negara Indonesia', code: 'BNI', createdBy: SYSTEM_ACTOR_ID },
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


  console.log('   ✅ User access ready');

  // ── Approval Workflows (PoC: Balance Sheet) ───────────────
  console.log('✅ Seeding approval workflows...');

  const financeLeaderRoleId = roleMap.get('finance_leader')!;
  const financeManagerRoleId = roleMap.get('finance_manager')!;
  const financeStaffRoleId = roleMap.get('finance_staff')!;
  const corporateAdminRoleId = roleMap.get('corporate_admin')!;

  const balanceSheetSubjectFields: Array<{ field: string; label: string; type: 'string' | 'currency' | 'date' | 'number' }> = [
    { field: 'corporateName', label: 'Perusahaan', type: 'string' },
    { field: 'period', label: 'Periode', type: 'date' },
  ];

  const workflowDefs = [
    {
      module: 'cfd',
      entityType: 'balance_sheet',
      action: 'create',
      name: 'Persetujuan Input Neraca',
      nameEn: 'Balance Sheet Input Approval',
      description: 'Workflow persetujuan untuk input data neraca baru',
      callbackHandler: 'handleBalanceSheetCreate',
      viewComponent: 'BalanceSheetApprovalForm',
      makerRole: financeStaffRoleId,
      subjectFields: balanceSheetSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd',
      entityType: 'balance_sheet',
      action: 'edit',
      name: 'Persetujuan Ubah Neraca',
      nameEn: 'Balance Sheet Edit Approval',
      description: 'Workflow persetujuan untuk perubahan data neraca',
      callbackHandler: 'handleBalanceSheetEdit',
      viewComponent: 'BalanceSheetApprovalForm',
      makerRole: financeStaffRoleId,
      subjectFields: balanceSheetSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd',
      entityType: 'balance_sheet',
      action: 'delete',
      name: 'Persetujuan Hapus Neraca',
      nameEn: 'Balance Sheet Delete Approval',
      description: 'Workflow persetujuan untuk penghapusan data neraca',
      callbackHandler: 'handleBalanceSheetDelete',
      viewComponent: 'BalanceSheetApprovalForm',
      makerRole: financeStaffRoleId,
      subjectFields: balanceSheetSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
  ];

  for (const wf of workflowDefs) {
    const { steps, ...workflowData } = wf;

    // Upsert workflow
    const [workflow] = await db
      .insert(approvalWorkflows)
      .values({ ...workflowData, createdBy: SYSTEM_ACTOR_ID })
      .onConflictDoUpdate({
        target: [approvalWorkflows.module, approvalWorkflows.entityType, approvalWorkflows.action],
        set: {
          name: workflowData.name,
          nameEn: workflowData.nameEn,
          description: workflowData.description,
          callbackHandler: workflowData.callbackHandler,
          viewComponent: workflowData.viewComponent,
          makerRole: workflowData.makerRole,
          subjectFields: workflowData.subjectFields,
          updatedBy: SYSTEM_ACTOR_ID,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Replace steps — hanya jika belum ada history yang referensi steps ini
    // (untuk menghindari FK violation saat re-seed dengan data existing)
    const existingSteps = await db.select({ id: approvalWorkflowSteps.id })
      .from(approvalWorkflowSteps)
      .where(eq(approvalWorkflowSteps.workflowId, workflow.id));

    if (existingSteps.length === 0) {
      // Tidak ada steps — insert baru
      await db.insert(approvalWorkflowSteps).values(
        steps.map(s => ({ ...s, workflowId: workflow.id }))
      );
    } else {
      // Ada steps existing — upsert per step_order (tidak delete agar tidak break FK)
      for (const step of steps) {
        const existing = existingSteps.find((_, i) => i === step.stepOrder - 1);
        if (!existing) {
          await db.insert(approvalWorkflowSteps).values({ ...step, workflowId: workflow.id });
        }
        // Jika sudah ada, biarkan — perubahan step dilakukan via ApprovalConfigManager
      }
    }

    console.log(`   ✅ Workflow: ${workflow.name}`);
  }

  // ── Approval Workflows — 10 New Modules (30 entries) ─────
  console.log('✅ Seeding approval workflows for 10 new modules...');

  type SubjectField = { field: string; label: string; type: 'string' | 'currency' | 'date' | 'number' };

  // Subject fields per module
  const incomeStatementSubjectFields: SubjectField[] = [
    { field: 'corporateName', label: 'Perusahaan', type: 'string' },
    { field: 'period', label: 'Periode', type: 'date' },
  ];
  const incomeStatementProjectionSubjectFields: SubjectField[] = [
    { field: 'departmentName', label: 'Departemen', type: 'string' },
    { field: 'fiscalYear', label: 'Tahun Fiskal', type: 'number' },
  ];
  const weeklyCashFlowSubjectFields: SubjectField[] = [
    { field: 'corporateName', label: 'Perusahaan', type: 'string' },
    { field: 'weekStart', label: 'Minggu Mulai', type: 'date' },
  ];
  const realizationSubjectFields: SubjectField[] = [
    { field: 'departmentName', label: 'Departemen', type: 'string' },
    { field: 'transactionDate', label: 'Tanggal Transaksi', type: 'date' },
  ];
  const cashFlowProjectionSubjectFields: SubjectField[] = [
    { field: 'corporateName', label: 'Perusahaan', type: 'string' },
    { field: 'fiscalYear', label: 'Tahun Fiskal', type: 'number' },
  ];
  const bankLoanSubjectFields: SubjectField[] = [
    { field: 'bankName', label: 'Bank', type: 'string' },
    { field: 'loanAmount', label: 'Jumlah Pinjaman', type: 'currency' },
  ];
  const corporateSubjectFields: SubjectField[] = [
    { field: 'name', label: 'Nama', type: 'string' },
    { field: 'code', label: 'Kode', type: 'string' },
  ];
  const departmentSubjectFields: SubjectField[] = [
    { field: 'name', label: 'Nama', type: 'string' },
    { field: 'corporateName', label: 'Perusahaan', type: 'string' },
  ];
  const costCenterSubjectFields: SubjectField[] = [
    { field: 'name', label: 'Nama', type: 'string' },
    { field: 'code', label: 'Kode', type: 'string' },
  ];
  const projectSubjectFields: SubjectField[] = [
    { field: 'name', label: 'Nama', type: 'string' },
    { field: 'corporateName', label: 'Perusahaan', type: 'string' },
  ];

  const newModuleWorkflowDefs = [
    // ── 1. Income Statement (Laba Rugi) ──────────────────────
    {
      module: 'cfd', entityType: 'income_statement', action: 'create',
      name: 'Persetujuan Input Laba Rugi', nameEn: 'Income Statement Input Approval',
      description: 'Workflow persetujuan untuk input data laba rugi baru',
      callbackHandler: 'handleIncomeStatementCreate', viewComponent: 'IncomeStatementApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: incomeStatementSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'income_statement', action: 'edit',
      name: 'Persetujuan Ubah Laba Rugi', nameEn: 'Income Statement Edit Approval',
      description: 'Workflow persetujuan untuk perubahan data laba rugi',
      callbackHandler: 'handleIncomeStatementEdit', viewComponent: 'IncomeStatementApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: incomeStatementSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'income_statement', action: 'delete',
      name: 'Persetujuan Hapus Laba Rugi', nameEn: 'Income Statement Delete Approval',
      description: 'Workflow persetujuan untuk penghapusan data laba rugi',
      callbackHandler: 'handleIncomeStatementDelete', viewComponent: 'IncomeStatementApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: incomeStatementSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },

    // ── 2. Income Statement Projection (Proyeksi Laba Rugi) ──
    {
      module: 'cfd', entityType: 'income_statement_projection', action: 'create',
      name: 'Persetujuan Input Proyeksi Laba Rugi', nameEn: 'Income Statement Projection Input Approval',
      description: 'Workflow persetujuan untuk input data proyeksi laba rugi baru',
      callbackHandler: 'handleIncomeStatementProjectionCreate', viewComponent: 'IncomeStatementProjectionApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: incomeStatementProjectionSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'income_statement_projection', action: 'edit',
      name: 'Persetujuan Ubah Proyeksi Laba Rugi', nameEn: 'Income Statement Projection Edit Approval',
      description: 'Workflow persetujuan untuk perubahan data proyeksi laba rugi',
      callbackHandler: 'handleIncomeStatementProjectionEdit', viewComponent: 'IncomeStatementProjectionApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: incomeStatementProjectionSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'income_statement_projection', action: 'delete',
      name: 'Persetujuan Hapus Proyeksi Laba Rugi', nameEn: 'Income Statement Projection Delete Approval',
      description: 'Workflow persetujuan untuk penghapusan data proyeksi laba rugi',
      callbackHandler: 'handleIncomeStatementProjectionDelete', viewComponent: 'IncomeStatementProjectionApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: incomeStatementProjectionSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },

    // ── 3. Weekly Cash Flow (Arus Kas Mingguan) ───────────────
    {
      module: 'cfd', entityType: 'weekly_cash_flow', action: 'create',
      name: 'Persetujuan Input Arus Kas Mingguan', nameEn: 'Weekly Cash Flow Input Approval',
      description: 'Workflow persetujuan untuk input data arus kas mingguan baru',
      callbackHandler: 'handleWeeklyCashFlowCreate', viewComponent: 'WeeklyCashFlowApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: weeklyCashFlowSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'weekly_cash_flow', action: 'edit',
      name: 'Persetujuan Ubah Arus Kas Mingguan', nameEn: 'Weekly Cash Flow Edit Approval',
      description: 'Workflow persetujuan untuk perubahan data arus kas mingguan',
      callbackHandler: 'handleWeeklyCashFlowEdit', viewComponent: 'WeeklyCashFlowApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: weeklyCashFlowSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'weekly_cash_flow', action: 'delete',
      name: 'Persetujuan Hapus Arus Kas Mingguan', nameEn: 'Weekly Cash Flow Delete Approval',
      description: 'Workflow persetujuan untuk penghapusan data arus kas mingguan',
      callbackHandler: 'handleWeeklyCashFlowDelete', viewComponent: 'WeeklyCashFlowApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: weeklyCashFlowSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },

    // ── 4. Realization (Realisasi) ────────────────────────────
    {
      module: 'cfd', entityType: 'realization', action: 'create',
      name: 'Persetujuan Input Realisasi', nameEn: 'Realization Input Approval',
      description: 'Workflow persetujuan untuk input data realisasi baru',
      callbackHandler: 'handleRealizationCreate', viewComponent: 'RealizationApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: realizationSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'realization', action: 'edit',
      name: 'Persetujuan Ubah Realisasi', nameEn: 'Realization Edit Approval',
      description: 'Workflow persetujuan untuk perubahan data realisasi',
      callbackHandler: 'handleRealizationEdit', viewComponent: 'RealizationApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: realizationSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'realization', action: 'delete',
      name: 'Persetujuan Hapus Realisasi', nameEn: 'Realization Delete Approval',
      description: 'Workflow persetujuan untuk penghapusan data realisasi',
      callbackHandler: 'handleRealizationDelete', viewComponent: 'RealizationApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: realizationSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },

    // ── 5. Cash Flow Projection (Proyeksi Arus Kas) ───────────
    {
      module: 'cfd', entityType: 'cash_flow_projection', action: 'create',
      name: 'Persetujuan Input Proyeksi Arus Kas', nameEn: 'Cash Flow Projection Input Approval',
      description: 'Workflow persetujuan untuk input data proyeksi arus kas baru',
      callbackHandler: 'handleCashFlowProjectionCreate', viewComponent: 'CashFlowProjectionApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: cashFlowProjectionSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'cash_flow_projection', action: 'edit',
      name: 'Persetujuan Ubah Proyeksi Arus Kas', nameEn: 'Cash Flow Projection Edit Approval',
      description: 'Workflow persetujuan untuk perubahan data proyeksi arus kas',
      callbackHandler: 'handleCashFlowProjectionEdit', viewComponent: 'CashFlowProjectionApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: cashFlowProjectionSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'cash_flow_projection', action: 'delete',
      name: 'Persetujuan Hapus Proyeksi Arus Kas', nameEn: 'Cash Flow Projection Delete Approval',
      description: 'Workflow persetujuan untuk penghapusan data proyeksi arus kas',
      callbackHandler: 'handleCashFlowProjectionDelete', viewComponent: 'CashFlowProjectionApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: cashFlowProjectionSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },

    // ── 6. Bank Loan (Pinjaman Bank) ──────────────────────────
    {
      module: 'cfd', entityType: 'bank_loan', action: 'create',
      name: 'Persetujuan Input Pinjaman Bank', nameEn: 'Bank Loan Input Approval',
      description: 'Workflow persetujuan untuk input data pinjaman bank baru',
      callbackHandler: 'handleBankLoanCreate', viewComponent: 'BankLoanApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: bankLoanSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'bank_loan', action: 'edit',
      name: 'Persetujuan Ubah Pinjaman Bank', nameEn: 'Bank Loan Edit Approval',
      description: 'Workflow persetujuan untuk perubahan data pinjaman bank',
      callbackHandler: 'handleBankLoanEdit', viewComponent: 'BankLoanApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: bankLoanSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'bank_loan', action: 'delete',
      name: 'Persetujuan Hapus Pinjaman Bank', nameEn: 'Bank Loan Delete Approval',
      description: 'Workflow persetujuan untuk penghapusan data pinjaman bank',
      callbackHandler: 'handleBankLoanDelete', viewComponent: 'BankLoanApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: bankLoanSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },

    // ── 7. Corporate (Perusahaan) — Master Data ───────────────
    {
      module: 'cfd', entityType: 'corporate', action: 'create',
      name: 'Persetujuan Input Perusahaan', nameEn: 'Corporate Input Approval',
      description: 'Workflow persetujuan untuk input data perusahaan baru',
      callbackHandler: 'handleCorporateCreate', viewComponent: 'CorporateApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: corporateSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'corporate', action: 'edit',
      name: 'Persetujuan Ubah Perusahaan', nameEn: 'Corporate Edit Approval',
      description: 'Workflow persetujuan untuk perubahan data perusahaan',
      callbackHandler: 'handleCorporateEdit', viewComponent: 'CorporateApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: corporateSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'corporate', action: 'delete',
      name: 'Persetujuan Hapus Perusahaan', nameEn: 'Corporate Delete Approval',
      description: 'Workflow persetujuan untuk penghapusan data perusahaan',
      callbackHandler: 'handleCorporateDelete', viewComponent: 'CorporateApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: corporateSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },

    // ── 8. Department (Departemen) — Master Data ──────────────
    {
      module: 'cfd', entityType: 'department', action: 'create',
      name: 'Persetujuan Input Departemen', nameEn: 'Department Input Approval',
      description: 'Workflow persetujuan untuk input data departemen baru',
      callbackHandler: 'handleDepartmentCreate', viewComponent: 'DepartmentApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: departmentSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'department', action: 'edit',
      name: 'Persetujuan Ubah Departemen', nameEn: 'Department Edit Approval',
      description: 'Workflow persetujuan untuk perubahan data departemen',
      callbackHandler: 'handleDepartmentEdit', viewComponent: 'DepartmentApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: departmentSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'department', action: 'delete',
      name: 'Persetujuan Hapus Departemen', nameEn: 'Department Delete Approval',
      description: 'Workflow persetujuan untuk penghapusan data departemen',
      callbackHandler: 'handleDepartmentDelete', viewComponent: 'DepartmentApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: departmentSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },

    // ── 9. Cost Center — Master Data ──────────────────────────
    {
      module: 'cfd', entityType: 'cost_center', action: 'create',
      name: 'Persetujuan Input Cost Center', nameEn: 'Cost Center Input Approval',
      description: 'Workflow persetujuan untuk input data cost center baru',
      callbackHandler: 'handleCostCenterCreate', viewComponent: 'CostCenterApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: costCenterSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'cost_center', action: 'edit',
      name: 'Persetujuan Ubah Cost Center', nameEn: 'Cost Center Edit Approval',
      description: 'Workflow persetujuan untuk perubahan data cost center',
      callbackHandler: 'handleCostCenterEdit', viewComponent: 'CostCenterApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: costCenterSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'cost_center', action: 'delete',
      name: 'Persetujuan Hapus Cost Center', nameEn: 'Cost Center Delete Approval',
      description: 'Workflow persetujuan untuk penghapusan data cost center',
      callbackHandler: 'handleCostCenterDelete', viewComponent: 'CostCenterApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: costCenterSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },

    // ── 10. Project (Proyek) — Master Data ────────────────────
    {
      module: 'cfd', entityType: 'project', action: 'create',
      name: 'Persetujuan Input Proyek', nameEn: 'Project Input Approval',
      description: 'Workflow persetujuan untuk input data proyek baru',
      callbackHandler: 'handleProjectCreate', viewComponent: 'ProjectApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: projectSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'project', action: 'edit',
      name: 'Persetujuan Ubah Proyek', nameEn: 'Project Edit Approval',
      description: 'Workflow persetujuan untuk perubahan data proyek',
      callbackHandler: 'handleProjectEdit', viewComponent: 'ProjectApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: projectSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'project', action: 'delete',
      name: 'Persetujuan Hapus Proyek', nameEn: 'Project Delete Approval',
      description: 'Workflow persetujuan untuk penghapusan data proyek',
      callbackHandler: 'handleProjectDelete', viewComponent: 'ProjectApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: projectSubjectFields,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
  ];

  for (const wf of newModuleWorkflowDefs) {
    const { steps, ...workflowData } = wf;

    const [workflow] = await db
      .insert(approvalWorkflows)
      .values({ ...workflowData, createdBy: SYSTEM_ACTOR_ID })
      .onConflictDoUpdate({
        target: [approvalWorkflows.module, approvalWorkflows.entityType, approvalWorkflows.action],
        set: {
          name: workflowData.name,
          nameEn: workflowData.nameEn,
          description: workflowData.description,
          callbackHandler: workflowData.callbackHandler,
          viewComponent: workflowData.viewComponent,
          makerRole: workflowData.makerRole,
          subjectFields: workflowData.subjectFields,
          updatedBy: SYSTEM_ACTOR_ID,
          updatedAt: new Date(),
        },
      })
      .returning();

    const existingSteps = await db.select({ id: approvalWorkflowSteps.id })
      .from(approvalWorkflowSteps)
      .where(eq(approvalWorkflowSteps.workflowId, workflow.id));

    if (existingSteps.length === 0) {
      await db.insert(approvalWorkflowSteps).values(
        steps.map(s => ({ ...s, workflowId: workflow.id }))
      );
    }

    console.log(`   ✅ Workflow: ${workflow.name}`);
  }

  // ── Approval Workflows — Upload Workflows (11 modules) ───
  console.log('✅ Seeding upload approval workflows for 11 modules...');

  // Subject fields for upload workflows
  const uploadSubjectFields: SubjectField[] = [
    { field: 'fileName', label: 'Nama File', type: 'string' },
    { field: 'totalRows', label: 'Total Baris', type: 'number' },
  ];

  const uploadWorkflowDefs = [
    // ── Financial Modules (7) ────────────────────────────────
    {
      module: 'cfd', entityType: 'balance_sheet_upload', action: 'upload',
      name: 'Persetujuan Upload Neraca', nameEn: 'Balance Sheet Upload Approval',
      description: 'Workflow persetujuan untuk upload data neraca',
      callbackHandler: 'handleBalanceSheetUpload', viewComponent: 'BalanceSheetUploadApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: uploadSubjectFields, isActive: true,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'income_statement_upload', action: 'upload',
      name: 'Persetujuan Upload Laba Rugi', nameEn: 'Income Statement Upload Approval',
      description: 'Workflow persetujuan untuk upload data laba rugi',
      callbackHandler: 'handleIncomeStatementUpload', viewComponent: 'IncomeStatementUploadApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: uploadSubjectFields, isActive: true,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'income_statement_projection_upload', action: 'upload',
      name: 'Persetujuan Upload Proyeksi Laba Rugi', nameEn: 'Income Statement Projection Upload Approval',
      description: 'Workflow persetujuan untuk upload data proyeksi laba rugi',
      callbackHandler: 'handleIncomeStatementProjectionUpload', viewComponent: 'IncomeStatementProjectionUploadApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: uploadSubjectFields, isActive: true,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'weekly_cash_flow_upload', action: 'upload',
      name: 'Persetujuan Upload Arus Kas Mingguan', nameEn: 'Weekly Cash Flow Upload Approval',
      description: 'Workflow persetujuan untuk upload data arus kas mingguan',
      callbackHandler: 'handleWeeklyCashFlowUpload', viewComponent: 'WeeklyCashFlowUploadApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: uploadSubjectFields, isActive: true,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'realization_upload', action: 'upload',
      name: 'Persetujuan Upload Realisasi', nameEn: 'Realization Upload Approval',
      description: 'Workflow persetujuan untuk upload data realisasi',
      callbackHandler: 'handleRealizationUpload', viewComponent: 'RealizationUploadApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: uploadSubjectFields, isActive: true,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'cash_flow_projection_upload', action: 'upload',
      name: 'Persetujuan Upload Proyeksi Arus Kas', nameEn: 'Cash Flow Projection Upload Approval',
      description: 'Workflow persetujuan untuk upload data proyeksi arus kas',
      callbackHandler: 'handleCashFlowProjectionUpload', viewComponent: 'CashFlowProjectionUploadApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: uploadSubjectFields, isActive: true,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'bank_loan_upload', action: 'upload',
      name: 'Persetujuan Upload Pinjaman Bank', nameEn: 'Bank Loan Upload Approval',
      description: 'Workflow persetujuan untuk upload data pinjaman bank',
      callbackHandler: 'handleBankLoanUpload', viewComponent: 'BankLoanUploadApprovalForm',
      makerRole: financeStaffRoleId, subjectFields: uploadSubjectFields, isActive: true,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },

    // ── Master Data Modules (4) ──────────────────────────────
    {
      module: 'cfd', entityType: 'corporate_upload', action: 'upload',
      name: 'Persetujuan Upload Perusahaan', nameEn: 'Corporate Upload Approval',
      description: 'Workflow persetujuan untuk upload data perusahaan',
      callbackHandler: 'handleCorporateUpload', viewComponent: 'CorporateUploadApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: uploadSubjectFields, isActive: false, // Inactive per requirement
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'department_upload', action: 'upload',
      name: 'Persetujuan Upload Departemen', nameEn: 'Department Upload Approval',
      description: 'Workflow persetujuan untuk upload data departemen',
      callbackHandler: 'handleDepartmentUpload', viewComponent: 'DepartmentUploadApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: uploadSubjectFields, isActive: true,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'cost_center_upload', action: 'upload',
      name: 'Persetujuan Upload Cost Center', nameEn: 'Cost Center Upload Approval',
      description: 'Workflow persetujuan untuk upload data cost center',
      callbackHandler: 'handleCostCenterUpload', viewComponent: 'CostCenterUploadApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: uploadSubjectFields, isActive: true,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
    {
      module: 'cfd', entityType: 'project_upload', action: 'upload',
      name: 'Persetujuan Upload Proyek', nameEn: 'Project Upload Approval',
      description: 'Workflow persetujuan untuk upload data proyek',
      callbackHandler: 'handleProjectUpload', viewComponent: 'ProjectUploadApprovalForm',
      makerRole: corporateAdminRoleId, subjectFields: uploadSubjectFields, isActive: true,
      steps: [
        { stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId, isActive: true },
        { stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId, isActive: true },
      ],
    },
  ];

  for (const wf of uploadWorkflowDefs) {
    const { steps, ...workflowData } = wf;

    const [workflow] = await db
      .insert(approvalWorkflows)
      .values({ ...workflowData, createdBy: SYSTEM_ACTOR_ID })
      .onConflictDoUpdate({
        target: [approvalWorkflows.module, approvalWorkflows.entityType, approvalWorkflows.action],
        set: {
          name: workflowData.name,
          nameEn: workflowData.nameEn,
          description: workflowData.description,
          callbackHandler: workflowData.callbackHandler,
          viewComponent: workflowData.viewComponent,
          makerRole: workflowData.makerRole,
          subjectFields: workflowData.subjectFields,
          isActive: workflowData.isActive,
          updatedBy: SYSTEM_ACTOR_ID,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Use if (existingSteps.length === 0) pattern to avoid FK conflicts
    const existingSteps = await db.select({ id: approvalWorkflowSteps.id })
      .from(approvalWorkflowSteps)
      .where(eq(approvalWorkflowSteps.workflowId, workflow.id));

    if (existingSteps.length === 0) {
      await db.insert(approvalWorkflowSteps).values(
        steps.map(s => ({ ...s, workflowId: workflow.id }))
      );
    }

    console.log(`   ✅ Upload Workflow: ${workflow.name}`);
  }

  // ── Report Configs ───────────────────────────────────────
  console.log('📊 Seeding report configs...');

  const monthlyColumns = (startOrder: number) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const cols: any[] = [];
    let currentOrder = startOrder;
    months.forEach((month) => {
      cols.push({
        fieldName: `${month.toLowerCase()}_estimated`,
        order: currentOrder++,
        dataType: 'currency' as const,
        headerLabelId: 'Estimasi',
        headerLabelEn: 'Estimated'
      });
      cols.push({
        fieldName: `${month.toLowerCase()}_actual`,
        order: currentOrder++,
        dataType: 'currency' as const,
        headerLabelId: 'Aktual',
        headerLabelEn: 'Actual'
      });
    });
    return cols;
  };

  const reportConfigDefs = [
    {
      id: 'a2b3c4d5-e6f7-4a8b-9c0d-e1f2a3b4c5d6',
      titleId: 'Laba Rugi Proyek',
      titleEn: 'Project Profit & Loss',
      templateFilename: 'Laba Rugi Proyek.xlsx',
      cellInfoFilter: 'A2',
      startRow: 6,
      writeHeader: false,
      retentionType: 'immediate',
      allowedRoles: ['system_admin', 'finance_staff', 'finance_manager', 'finance_leader'],
      filters: [
        {
          paramName: 'periode',
          labelId: 'Periode',
          labelEn: 'Period',
          type: 'month_range' as const,
          order: 1,
          required: true
        }
      ],
      columns: [
        { fieldName: 'no', order: 1, dataType: 'string' as const, headerLabelId: 'NO', headerLabelEn: 'NO' },
        { fieldName: 'description', order: 2, dataType: 'string' as const, headerLabelId: 'DESCRIPTION', headerLabelEn: 'DESCRIPTION' },
        { fieldName: 'total_estimated', order: 3, dataType: 'currency' as const, headerLabelId: 'ESTIMATED', headerLabelEn: 'ESTIMATED' },
        { fieldName: 'total_actual', order: 4, dataType: 'currency' as const, headerLabelId: 'ACTUAL', headerLabelEn: 'ACTUAL' },
        { fieldName: 'total_balance', order: 5, dataType: 'currency' as const, headerLabelId: 'BALANCE', headerLabelEn: 'BALANCE' },
        ...monthlyColumns(6)
      ],
      query: `WITH params AS (
  SELECT
    EXTRACT(YEAR FROM (\${periode_from} || '-01')::date)::integer AS yr,
    (\${periode_from} || '-01')::date AS dt_from,
    ((\${periode_to} || '-01')::date + INTERVAL '1 month' - INTERVAL '1 day') AS dt_to
),
estimated AS (
  SELECT
    td.month,
    SUM(CASE WHEN td.target_type = 'revenue'   THEN td.amount::numeric ELSE 0 END) AS revenue,
    SUM(CASE WHEN td.target_type = 'cash_out'  THEN td.amount::numeric ELSE 0 END) AS cost
  FROM cfd.target_details td
  JOIN cfd.target_headers th ON th.id = td.target_header_id
  WHERE th.project_id IS NOT NULL
    AND th.fiscal_year = (SELECT yr FROM params)
  GROUP BY td.month
),
actual AS (
  SELECT
    EXTRACT(MONTH FROM cr.transaction_date)::integer AS month,
    SUM(CASE WHEN cr.category = 'cash-in'  THEN cr.amount::numeric ELSE 0 END) AS revenue,
    SUM(CASE WHEN cr.category = 'cash-out' THEN cr.amount::numeric ELSE 0 END) AS cost
  FROM cfd.cash_realizations cr
  WHERE cr.entity_type = 'project'
    AND cr.transaction_date BETWEEN (SELECT dt_from FROM params) AND (SELECT dt_to FROM params)
  GROUP BY EXTRACT(MONTH FROM cr.transaction_date)
),
monthly AS (
  SELECT g.m AS month,
    COALESCE(e.revenue, 0) AS est_rev, COALESCE(e.cost, 0) AS est_cost,
    COALESCE(a.revenue, 0) AS act_rev, COALESCE(a.cost, 0) AS act_cost
  FROM generate_series(1, 12) g(m)
  LEFT JOIN estimated e ON e.month = g.m
  LEFT JOIN actual    a ON a.month = g.m
),
totals AS (
  SELECT SUM(est_rev) AS tot_est_rev, SUM(act_rev) AS tot_act_rev,
         SUM(est_cost) AS tot_est_cost, SUM(act_cost) AS tot_act_cost
  FROM monthly
),
gpm AS (
  SELECT month,
    CASE WHEN est_rev = 0 THEN 0::numeric ELSE ROUND((est_rev - est_cost) / est_rev * 100, 2) END AS est_gpm,
    CASE WHEN act_rev = 0 THEN 0::numeric ELSE ROUND((act_rev - act_cost) / act_rev * 100, 2) END AS act_gpm
  FROM monthly
)
SELECT no, description, total_estimated, total_actual, total_balance,
  januari_estimated, januari_actual, februari_estimated, februari_actual,
  maret_estimated, maret_actual, april_estimated, april_actual,
  mei_estimated, mei_actual, juni_estimated, juni_actual,
  juli_estimated, juli_actual, agustus_estimated, agustus_actual,
  september_estimated, september_actual, oktober_estimated, oktober_actual,
  november_estimated, november_actual, desember_estimated, desember_actual
FROM (
  SELECT 1 AS no, 'PROJECT REVENUE' AS description,
    t.tot_est_rev AS total_estimated, t.tot_act_rev AS total_actual, t.tot_est_rev - t.tot_act_rev AS total_balance,
    MAX(CASE WHEN m.month=1  THEN m.est_rev ELSE 0 END) AS januari_estimated,  MAX(CASE WHEN m.month=1  THEN m.act_rev ELSE 0 END) AS januari_actual,
    MAX(CASE WHEN m.month=2  THEN m.est_rev ELSE 0 END) AS februari_estimated, MAX(CASE WHEN m.month=2  THEN m.act_rev ELSE 0 END) AS februari_actual,
    MAX(CASE WHEN m.month=3  THEN m.est_rev ELSE 0 END) AS maret_estimated,    MAX(CASE WHEN m.month=3  THEN m.act_rev ELSE 0 END) AS maret_actual,
    MAX(CASE WHEN m.month=4  THEN m.est_rev ELSE 0 END) AS april_estimated,    MAX(CASE WHEN m.month=4  THEN m.act_rev ELSE 0 END) AS april_actual,
    MAX(CASE WHEN m.month=5  THEN m.est_rev ELSE 0 END) AS mei_estimated,      MAX(CASE WHEN m.month=5  THEN m.act_rev ELSE 0 END) AS mei_actual,
    MAX(CASE WHEN m.month=6  THEN m.est_rev ELSE 0 END) AS juni_estimated,     MAX(CASE WHEN m.month=6  THEN m.act_rev ELSE 0 END) AS juni_actual,
    MAX(CASE WHEN m.month=7  THEN m.est_rev ELSE 0 END) AS juli_estimated,     MAX(CASE WHEN m.month=7  THEN m.act_rev ELSE 0 END) AS juli_actual,
    MAX(CASE WHEN m.month=8  THEN m.est_rev ELSE 0 END) AS agustus_estimated,  MAX(CASE WHEN m.month=8  THEN m.act_rev ELSE 0 END) AS agustus_actual,
    MAX(CASE WHEN m.month=9  THEN m.est_rev ELSE 0 END) AS september_estimated,MAX(CASE WHEN m.month=9  THEN m.act_rev ELSE 0 END) AS september_actual,
    MAX(CASE WHEN m.month=10 THEN m.est_rev ELSE 0 END) AS oktober_estimated,  MAX(CASE WHEN m.month=10 THEN m.act_rev ELSE 0 END) AS oktober_actual,
    MAX(CASE WHEN m.month=11 THEN m.est_rev ELSE 0 END) AS november_estimated, MAX(CASE WHEN m.month=11 THEN m.act_rev ELSE 0 END) AS november_actual,
    MAX(CASE WHEN m.month=12 THEN m.est_rev ELSE 0 END) AS desember_estimated, MAX(CASE WHEN m.month=12 THEN m.act_rev ELSE 0 END) AS desember_actual
  FROM monthly m, totals t GROUP BY t.tot_est_rev, t.tot_act_rev, t.tot_est_cost, t.tot_act_cost
  UNION ALL
  SELECT 2, 'PROJECT COST',
    t.tot_est_cost, t.tot_act_cost, t.tot_est_cost - t.tot_act_cost,
    MAX(CASE WHEN m.month=1  THEN m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=1  THEN m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=2  THEN m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=2  THEN m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=3  THEN m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=3  THEN m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=4  THEN m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=4  THEN m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=5  THEN m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=5  THEN m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=6  THEN m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=6  THEN m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=7  THEN m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=7  THEN m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=8  THEN m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=8  THEN m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=9  THEN m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=9  THEN m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=10 THEN m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=10 THEN m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=11 THEN m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=11 THEN m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=12 THEN m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=12 THEN m.act_cost ELSE 0 END)
  FROM monthly m, totals t GROUP BY t.tot_est_rev, t.tot_act_rev, t.tot_est_cost, t.tot_act_cost
  UNION ALL
  SELECT 3, 'PROJECT GROSS PROFIT',
    t.tot_est_rev - t.tot_est_cost, t.tot_act_rev - t.tot_act_cost,
    (t.tot_est_rev - t.tot_est_cost) - (t.tot_act_rev - t.tot_act_cost),
    MAX(CASE WHEN m.month=1  THEN m.est_rev-m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=1  THEN m.act_rev-m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=2  THEN m.est_rev-m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=2  THEN m.act_rev-m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=3  THEN m.est_rev-m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=3  THEN m.act_rev-m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=4  THEN m.est_rev-m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=4  THEN m.act_rev-m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=5  THEN m.est_rev-m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=5  THEN m.act_rev-m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=6  THEN m.est_rev-m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=6  THEN m.act_rev-m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=7  THEN m.est_rev-m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=7  THEN m.act_rev-m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=8  THEN m.est_rev-m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=8  THEN m.act_rev-m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=9  THEN m.est_rev-m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=9  THEN m.act_rev-m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=10 THEN m.est_rev-m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=10 THEN m.act_rev-m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=11 THEN m.est_rev-m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=11 THEN m.act_rev-m.act_cost ELSE 0 END),
    MAX(CASE WHEN m.month=12 THEN m.est_rev-m.est_cost ELSE 0 END), MAX(CASE WHEN m.month=12 THEN m.act_rev-m.act_cost ELSE 0 END)
  FROM monthly m, totals t GROUP BY t.tot_est_rev, t.tot_act_rev, t.tot_est_cost, t.tot_act_cost
  UNION ALL
  SELECT 4, 'GROSS PROFIT PERCENTAGE (%)',
    CASE WHEN t.tot_est_rev=0 THEN 0::numeric ELSE ROUND((t.tot_est_rev-t.tot_est_cost)/t.tot_est_rev*100,2) END,
    CASE WHEN t.tot_act_rev=0 THEN 0::numeric ELSE ROUND((t.tot_act_rev-t.tot_act_cost)/t.tot_act_rev*100,2) END,
    0::numeric,
    MAX(CASE WHEN g.month=1  THEN g.est_gpm ELSE 0 END), MAX(CASE WHEN g.month=1  THEN g.act_gpm ELSE 0 END),
    MAX(CASE WHEN g.month=2  THEN g.est_gpm ELSE 0 END), MAX(CASE WHEN g.month=2  THEN g.act_gpm ELSE 0 END),
    MAX(CASE WHEN g.month=3  THEN g.est_gpm ELSE 0 END), MAX(CASE WHEN g.month=3  THEN g.act_gpm ELSE 0 END),
    MAX(CASE WHEN g.month=4  THEN g.est_gpm ELSE 0 END), MAX(CASE WHEN g.month=4  THEN g.act_gpm ELSE 0 END),
    MAX(CASE WHEN g.month=5  THEN g.est_gpm ELSE 0 END), MAX(CASE WHEN g.month=5  THEN g.act_gpm ELSE 0 END),
    MAX(CASE WHEN g.month=6  THEN g.est_gpm ELSE 0 END), MAX(CASE WHEN g.month=6  THEN g.act_gpm ELSE 0 END),
    MAX(CASE WHEN g.month=7  THEN g.est_gpm ELSE 0 END), MAX(CASE WHEN g.month=7  THEN g.act_gpm ELSE 0 END),
    MAX(CASE WHEN g.month=8  THEN g.est_gpm ELSE 0 END), MAX(CASE WHEN g.month=8  THEN g.act_gpm ELSE 0 END),
    MAX(CASE WHEN g.month=9  THEN g.est_gpm ELSE 0 END), MAX(CASE WHEN g.month=9  THEN g.act_gpm ELSE 0 END),
    MAX(CASE WHEN g.month=10 THEN g.est_gpm ELSE 0 END), MAX(CASE WHEN g.month=10 THEN g.act_gpm ELSE 0 END),
    MAX(CASE WHEN g.month=11 THEN g.est_gpm ELSE 0 END), MAX(CASE WHEN g.month=11 THEN g.act_gpm ELSE 0 END),
    MAX(CASE WHEN g.month=12 THEN g.est_gpm ELSE 0 END), MAX(CASE WHEN g.month=12 THEN g.act_gpm ELSE 0 END)
  FROM gpm g, totals t GROUP BY t.tot_est_rev, t.tot_act_rev, t.tot_est_cost, t.tot_act_cost
) result ORDER BY no`
    },
    {
      id: 'b3c4d5e6-f7a8-4b9c-0d1e-f2a3b4c5d6e7',
      titleId: 'Laba Rugi Proyek per Cost Center',
      titleEn: 'Project Profit & Loss per Cost Center',
      templateFilename: 'Laba Rugi Proyek per Cost Center.xlsx',
      cellInfoFilter: 'A2',
      startRow: 6,
      writeHeader: false,
      retentionType: 'immediate',
      allowedRoles: ['system_admin', 'finance_staff', 'finance_manager', 'finance_leader'],
      filters: [
        {
          paramName: 'periode',
          labelId: 'Periode',
          labelEn: 'Period',
          type: 'month_range' as const,
          order: 1,
          required: true
        }
      ],
      columns: [
        { fieldName: 'no', order: 1, dataType: 'string' as const, headerLabelId: 'NO', headerLabelEn: 'NO' },
        { fieldName: 'cost_center', order: 2, dataType: 'string' as const, headerLabelId: 'COST CENTER', headerLabelEn: 'COST CENTER' },
        { fieldName: 'total_estimated', order: 3, dataType: 'currency' as const, headerLabelId: 'ESTIMATED', headerLabelEn: 'ESTIMATED' },
        { fieldName: 'total_actual', order: 4, dataType: 'currency' as const, headerLabelId: 'ACTUAL', headerLabelEn: 'ACTUAL' },
        { fieldName: 'total_balance', order: 5, dataType: 'currency' as const, headerLabelId: 'BALANCE', headerLabelEn: 'BALANCE' },
        ...monthlyColumns(6)
      ],
      query: `WITH params AS (
  SELECT
    EXTRACT(YEAR FROM (\${periode_from} || '-01')::date)::integer AS yr,
    (\${periode_from} || '-01')::date AS dt_from,
    ((\${periode_to} || '-01')::date + INTERVAL '1 month' - INTERVAL '1 day') AS dt_to
),
all_cc AS (SELECT id, name FROM cfd.cost_centers WHERE is_active = true),
estimated_by_cc AS (
  SELECT cc.id AS cost_center_id, td.month,
    SUM(CASE WHEN td.target_type='revenue'  THEN td.amount::numeric ELSE 0 END) AS revenue,
    SUM(CASE WHEN td.target_type='cash_out' THEN td.amount::numeric ELSE 0 END) AS cost
  FROM cfd.target_details td
  JOIN cfd.target_headers th ON th.id = td.target_header_id
  JOIN cfd.cost_centers cc ON cc.code = td.cost_center
  WHERE th.project_id IS NOT NULL AND td.cost_center IS NOT NULL
    AND th.fiscal_year = (SELECT yr FROM params)
  GROUP BY cc.id, td.month
),
actual_by_cc AS (
  SELECT cr.cost_center_id, EXTRACT(MONTH FROM cr.transaction_date)::integer AS month,
    SUM(CASE WHEN cr.category='cash-in'  THEN cr.amount::numeric ELSE 0 END) AS revenue,
    SUM(CASE WHEN cr.category='cash-out' THEN cr.amount::numeric ELSE 0 END) AS cost
  FROM cfd.cash_realizations cr
  WHERE cr.entity_type='project' AND cr.cost_center_id IS NOT NULL
    AND cr.transaction_date BETWEEN (SELECT dt_from FROM params) AND (SELECT dt_to FROM params)
  GROUP BY cr.cost_center_id, EXTRACT(MONTH FROM cr.transaction_date)
),
monthly_by_cc AS (
  SELECT cc.id AS cost_center_id, cc.name AS cost_center_name, g.m AS month,
    COALESCE(e.revenue,0) AS est_rev, COALESCE(e.cost,0) AS est_cost,
    COALESCE(a.revenue,0) AS act_rev, COALESCE(a.cost,0) AS act_cost
  FROM all_cc cc CROSS JOIN generate_series(1,12) g(m)
  LEFT JOIN estimated_by_cc e ON e.cost_center_id=cc.id AND e.month=g.m
  LEFT JOIN actual_by_cc    a ON a.cost_center_id=cc.id AND a.month=g.m
),
cc_totals AS (
  SELECT cost_center_id, cost_center_name,
    SUM(est_rev) AS tot_est_rev, SUM(act_rev) AS tot_act_rev,
    SUM(est_cost) AS tot_est_cost, SUM(act_cost) AS tot_act_cost
  FROM monthly_by_cc GROUP BY cost_center_id, cost_center_name
)
SELECT
  ROW_NUMBER() OVER (ORDER BY t.cost_center_name) AS no,
  t.cost_center_name AS cost_center,
  t.tot_est_rev AS total_estimated, t.tot_act_rev AS total_actual,
  t.tot_est_rev - t.tot_act_rev AS total_balance,
  MAX(CASE WHEN m.month=1  THEN m.est_rev ELSE 0 END) AS januari_estimated,  MAX(CASE WHEN m.month=1  THEN m.act_rev ELSE 0 END) AS januari_actual,
  MAX(CASE WHEN m.month=2  THEN m.est_rev ELSE 0 END) AS februari_estimated, MAX(CASE WHEN m.month=2  THEN m.act_rev ELSE 0 END) AS februari_actual,
  MAX(CASE WHEN m.month=3  THEN m.est_rev ELSE 0 END) AS maret_estimated,    MAX(CASE WHEN m.month=3  THEN m.act_rev ELSE 0 END) AS maret_actual,
  MAX(CASE WHEN m.month=4  THEN m.est_rev ELSE 0 END) AS april_estimated,    MAX(CASE WHEN m.month=4  THEN m.act_rev ELSE 0 END) AS april_actual,
  MAX(CASE WHEN m.month=5  THEN m.est_rev ELSE 0 END) AS mei_estimated,      MAX(CASE WHEN m.month=5  THEN m.act_rev ELSE 0 END) AS mei_actual,
  MAX(CASE WHEN m.month=6  THEN m.est_rev ELSE 0 END) AS juni_estimated,     MAX(CASE WHEN m.month=6  THEN m.act_rev ELSE 0 END) AS juni_actual,
  MAX(CASE WHEN m.month=7  THEN m.est_rev ELSE 0 END) AS juli_estimated,     MAX(CASE WHEN m.month=7  THEN m.act_rev ELSE 0 END) AS juli_actual,
  MAX(CASE WHEN m.month=8  THEN m.est_rev ELSE 0 END) AS agustus_estimated,  MAX(CASE WHEN m.month=8  THEN m.act_rev ELSE 0 END) AS agustus_actual,
  MAX(CASE WHEN m.month=9  THEN m.est_rev ELSE 0 END) AS september_estimated,MAX(CASE WHEN m.month=9  THEN m.act_rev ELSE 0 END) AS september_actual,
  MAX(CASE WHEN m.month=10 THEN m.est_rev ELSE 0 END) AS oktober_estimated,  MAX(CASE WHEN m.month=10 THEN m.act_rev ELSE 0 END) AS oktober_actual,
  MAX(CASE WHEN m.month=11 THEN m.est_rev ELSE 0 END) AS november_estimated, MAX(CASE WHEN m.month=11 THEN m.act_rev ELSE 0 END) AS november_actual,
  MAX(CASE WHEN m.month=12 THEN m.est_rev ELSE 0 END) AS desember_estimated, MAX(CASE WHEN m.month=12 THEN m.act_rev ELSE 0 END) AS desember_actual
FROM monthly_by_cc m
JOIN cc_totals t ON t.cost_center_id = m.cost_center_id
GROUP BY t.cost_center_id, t.cost_center_name, t.tot_est_rev, t.tot_act_rev, t.tot_est_cost, t.tot_act_cost
ORDER BY t.cost_center_name`
    }
  ];

  for (const { id, ...rest } of reportConfigDefs) {
    await db.insert(reportConfigs)
      .values({ id, ...rest, createdBy: SYSTEM_ACTOR_ID })
      .onConflictDoUpdate({
        target: reportConfigs.id,
        set: { ...rest, updatedBy: SYSTEM_ACTOR_ID, updatedAt: new Date() },
      });
  }
  console.log('   ✅ Report configs ready');

  console.log('\n🎉 New RBAC Public schema seeding complete!');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
