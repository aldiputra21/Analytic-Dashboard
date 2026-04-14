// migrate-sqlite-to-pg.ts — SQLite → PostgreSQL data migration (ARCHIVED)
// This script was used for one-time migration on April 11, 2026.
// better-sqlite3 has been uninstalled; re-install it if you need to re-run:
//   npm install better-sqlite3 @types/better-sqlite3
// Run with: npx tsx migrate-sqlite-to-pg.ts
//
// Prerequisites:
//   - finance.db must exist (SQLite source)
//   - DATABASE_URL must be set (PostgreSQL target)
//   - PostgreSQL schema must be already created (via drizzle-kit migrate)
//
// Mapping summary (blueprint.md):
//   roles           → public.roles
//   users + frs_users → public.users  (MERGED)
//   companies + subsidiaries → public.corporates  (MERGED)
//   divisions       → public.departments
//   projects        → public.projects
//   user_company_access → public.user_corporate_accesses
//   frs_thresholds  → cfd.thresholds (JSONB)
//   frs_alerts      → cfd.alerts
//   frs_audit_log + approval_audit_log → public.audit_logs (MERGED)
//   balance_sheets  → cfd.balance_sheets
//   income_statements → cfd.income_statements
//   targets         → cfd.target_headers + target_details (SPLIT)
//   weekly_cash_flow → cfd.weekly_cash_flows
//
// Dropped (no equivalent in new schema):
//   frs_financial_data, frs_calculated_ratios, frs_scheduled_reports,
//   frs_financial_data_history, frs_financial_data_archive, frs_threshold_history,
//   financial_statements, mafinda_*, crm_* (all empty)

import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { db } from './src/db/connection';
import {
  roles,
  users,
  corporates,
  departments,
  projects,
  userCorporateAccesses,
  auditLogs,
} from './src/db/schema/public';
import {
  thresholds,
  alerts,
  balanceSheets,
  incomeStatements,
  targetHeaders,
  targetDetails,
  weeklyCashFlows,
} from './src/db/schema/cfd';
import { sql } from 'drizzle-orm';

// ============================================================================
// ID Mapping — old TEXT/INTEGER IDs → new UUIDs
// ============================================================================

const idMap = new Map<string, string>();

function mapId(oldId: string | number): string {
  const key = String(oldId);
  const existing = idMap.get(key);
  if (existing) return existing;
  // Generate a new UUID via crypto
  const newId = crypto.randomUUID();
  idMap.set(key, newId);
  return newId;
}

function getMappedId(oldId: string | number): string {
  const key = String(oldId);
  const existing = idMap.get(key);
  if (!existing) throw new Error(`No mapping for old ID: ${key}`);
  return existing;
}

// ============================================================================
// SQLite helpers
// ============================================================================

const sqlite = new Database('finance.db', { readonly: true });

function queryAll<T>(query: string): T[] {
  return sqlite.prepare(query).all() as T[];
}

// ============================================================================
// Migration functions
// ============================================================================

async function migrateRoles() {
  console.log('📋 Migrating roles...');

  interface OldRole {
    id: string;
    name: string;
    permissions: string;
  }

  const oldRoles = queryAll<OldRole>('SELECT * FROM roles');

  for (const r of oldRoles) {
    const newId = mapId(r.id);
    const perms: string[] = JSON.parse(r.permissions);

    // Determine scope from old role ID
    const scope = ['SUPER_ADMIN', 'CORP_ADMIN', 'ADMIN'].includes(r.id) ? 'system' : 'corporate';

    await db
      .insert(roles)
      .values({
        id: newId,
        name: r.name,
        scope,
        permissions: perms,
        createdBy: 'migration',
      })
      .onConflictDoNothing({ target: roles.name });
  }

  console.log(`   ✅ ${oldRoles.length} roles migrated`);
}

async function migrateUsers() {
  console.log('👥 Migrating users...');

  // --- MAFINDA users (username-based, plaintext passwords) ---
  interface OldUser {
    id: number;
    username: string;
    password: string;
    role_id: string;
    status: string;
  }

  const oldUsers = queryAll<OldUser>('SELECT * FROM users');

  for (const u of oldUsers) {
    const newId = mapId(u.id);
    const passwordHash = await bcrypt.hash(u.password || 'changeme', 10);

    await db
      .insert(users)
      .values({
        id: newId,
        email: `${u.username}@cfd.local`,
        passwordHash,
        fullName: u.username.charAt(0).toUpperCase() + u.username.slice(1),
        isActive: u.status === 'Active',
        createdBy: 'migration',
      })
      .onConflictDoNothing({ target: users.email });
  }

  // --- FRS users (proper password hash, different schema) ---
  interface OldFrsUser {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    role: string;
    full_name: string;
    is_active: number;
    last_login: string | null;
    created_at: string;
  }

  const frsUsers = queryAll<OldFrsUser>('SELECT * FROM frs_users');

  for (const fu of frsUsers) {
    const newId = mapId(fu.id);

    // Check if email already exists from MAFINDA users
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`${users.email} = ${fu.email}`)
      .limit(1);

    if (existing.length > 0) {
      // Map old FRS ID to existing PG user
      idMap.set(fu.id, existing[0].id);
      console.log(`   ⚠️  FRS user ${fu.username} already exists as ${fu.email}, linked`);
      continue;
    }

    await db
      .insert(users)
      .values({
        id: newId,
        email: fu.email,
        passwordHash: fu.password_hash,
        fullName: fu.full_name,
        isActive: fu.is_active === 1,
        lastLogin: fu.last_login ? new Date(fu.last_login) : undefined,
        createdBy: 'migration',
      })
      .onConflictDoNothing({ target: users.email });
  }

  console.log(`   ✅ ${oldUsers.length} MAFINDA users + ${frsUsers.length} FRS users migrated`);
}

async function migrateCorporates() {
  console.log('🏢 Migrating corporates...');

  // --- companies table ---
  interface OldCompany {
    id: string;
    name: string;
    color: string;
    industry: string;
    fiscal_year_start: string;
    currency: string;
    tax_rate: number;
    status: string;
  }

  const oldCompanies = queryAll<OldCompany>('SELECT * FROM companies');

  for (const c of oldCompanies) {
    const newId = mapId(c.id);

    await db
      .insert(corporates)
      .values({
        id: newId,
        name: c.name,
        code: c.id, // old TEXT id becomes code (e.g., 'ASI', 'TSI')
        industry: c.industry,
        fiscalYearStartMonth: parseInt(c.fiscal_year_start) || 1,
        currency: c.currency || 'IDR',
        taxRate: String(c.tax_rate || 0),
        isActive: c.status === 'Active',
        createdBy: 'migration',
      })
      .onConflictDoNothing({ target: corporates.code });
  }

  // --- subsidiaries table (FRS) → merge into corporates ---
  interface OldSubsidiary {
    id: string;
    name: string;
    industry_sector: string;
    fiscal_year_start_month: number;
    currency: string;
    tax_rate: number;
    is_active: number;
    created_by: string;
  }

  const oldSubs = queryAll<OldSubsidiary>('SELECT * FROM subsidiaries');

  for (const s of oldSubs) {
    // Generate a short code from name
    const code = s.name
      .replace(/^PT\s+/i, '')
      .substring(0, 10)
      .toUpperCase()
      .replace(/\s+/g, '_');

    // Check if already exists by name
    const existing = await db
      .select({ id: corporates.id })
      .from(corporates)
      .where(sql`${corporates.name} = ${s.name}`)
      .limit(1);

    if (existing.length > 0) {
      idMap.set(s.id, existing[0].id);
      console.log(`   ⚠️  Subsidiary "${s.name}" already exists as corporate, linked`);
      continue;
    }

    const newId = mapId(s.id);

    await db
      .insert(corporates)
      .values({
        id: newId,
        name: s.name,
        code,
        industry: s.industry_sector,
        fiscalYearStartMonth: s.fiscal_year_start_month,
        currency: s.currency,
        taxRate: String(s.tax_rate),
        isActive: s.is_active === 1,
        createdBy: idMap.get(s.created_by) ?? 'migration',
      })
      .onConflictDoNothing({ target: corporates.code });
  }

  console.log(`   ✅ ${oldCompanies.length} companies + ${oldSubs.length} subsidiaries migrated`);
}

async function migrateDepartments() {
  console.log('📁 Migrating departments...');

  interface OldDivision {
    id: string;
    company_id: string;
    name: string;
    created_at: string;
  }

  const oldDivisions = queryAll<OldDivision>('SELECT * FROM divisions');

  for (const d of oldDivisions) {
    const newId = mapId(d.id);
    const corporateId = getMappedId(d.company_id);
    // Generate code from the old ID (e.g., "DIV_ASI_ONM" → "ASI-ONM")
    const code = d.id.replace('DIV_', '').replace(/_/g, '-');

    await db
      .insert(departments)
      .values({
        id: newId,
        corporateId,
        name: d.name,
        code,
        createdBy: 'migration',
      })
      .onConflictDoNothing();
  }

  console.log(`   ✅ ${oldDivisions.length} departments migrated`);
}

async function migrateProjects() {
  console.log('📊 Migrating projects...');

  interface OldProject {
    id: string;
    division_id: string;
    name: string;
    description: string | null;
    created_at: string;
  }

  const oldProjects = queryAll<OldProject>('SELECT * FROM projects');

  for (const p of oldProjects) {
    const newId = mapId(p.id);
    const departmentId = getMappedId(p.division_id);
    // Generate code from old ID (e.g., "PROJ_ASI_ONM_1" → "ASI-ONM-1")
    const code = p.id.replace('PROJ_', '').replace(/_/g, '-');

    await db
      .insert(projects)
      .values({
        id: newId,
        departmentId,
        code,
        name: p.name,
        description: p.description,
        createdBy: 'migration',
      })
      .onConflictDoNothing();
  }

  console.log(`   ✅ ${oldProjects.length} projects migrated`);
}

async function migrateUserAccess() {
  console.log('🔐 Migrating user-corporate access...');

  interface OldAccess {
    user_id: number;
    company_id: string;
  }

  const oldAccess = queryAll<OldAccess>('SELECT * FROM user_company_access');

  // Look up the MAFINDA user's role to get the corresponding new role ID
  interface OldUser {
    id: number;
    role_id: string;
  }
  const oldUsers = queryAll<OldUser>('SELECT id, role_id FROM users');
  const userRoleMap = new Map(oldUsers.map((u) => [u.id, u.role_id]));

  for (const a of oldAccess) {
    const userId = getMappedId(a.user_id);
    const corporateId = getMappedId(a.company_id);
    const oldRoleId = userRoleMap.get(a.user_id);
    const roleId = oldRoleId ? getMappedId(oldRoleId) : undefined;

    if (!roleId) {
      console.log(`   ⚠️  Skipping access for user ${a.user_id} — no role mapping`);
      continue;
    }

    const scope = ['SUPER_ADMIN', 'CORP_ADMIN', 'ADMIN'].includes(oldRoleId!) ? 'system' : 'corporate';

    await db
      .insert(userCorporateAccesses)
      .values({
        userId,
        roleId,
        scope,
        corporateId: scope === 'system' ? undefined : corporateId,
      })
      .onConflictDoNothing();
  }

  console.log(`   ✅ ${oldAccess.length} access records migrated`);
}

async function migrateThresholds() {
  console.log('📏 Migrating thresholds...');

  interface OldThreshold {
    id: string;
    subsidiary_id: string;
    ratio_name: string;
    period_type: string;
    healthy_min: number | null;
    moderate_min: number | null;
    risky_max: number | null;
    healthy_max: number | null;
    moderate_max: number | null;
    risky_min: number | null;
    is_default: number;
    updated_by: string;
  }

  const oldThresholds = queryAll<OldThreshold>('SELECT * FROM frs_thresholds');

  // Group by subsidiary_id + ratio_name (new schema has no period_type split)
  // Take the first period_type's values as representative
  const seen = new Set<string>();
  let count = 0;

  for (const t of oldThresholds) {
    const key = `${t.subsidiary_id}_${t.ratio_name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const corporateId = idMap.get(t.subsidiary_id);
    if (!corporateId) {
      console.log(`   ⚠️  No corporate mapping for subsidiary ${t.subsidiary_id}, skipping`);
      continue;
    }

    const thresholdValues: Record<string, number | undefined> = {};
    if (t.healthy_min != null) thresholdValues.healthy_min = t.healthy_min;
    if (t.moderate_min != null) thresholdValues.moderate_min = t.moderate_min;
    if (t.risky_max != null) thresholdValues.risky_max = t.risky_max;
    if (t.healthy_max != null) thresholdValues.healthy_max = t.healthy_max;
    if (t.moderate_max != null) thresholdValues.moderate_max = t.moderate_max;
    if (t.risky_min != null) thresholdValues.risky_min = t.risky_min;

    await db
      .insert(thresholds)
      .values({
        corporateId,
        ratioName: t.ratio_name,
        thresholds: thresholdValues,
        isDefault: t.is_default === 1,
        createdBy: idMap.get(t.updated_by) ?? 'migration',
      })
      .onConflictDoNothing();

    count++;
  }

  console.log(`   ✅ ${count} thresholds migrated (${oldThresholds.length} rows deduplicated across period_types)`);
}

async function migrateAlerts() {
  console.log('🚨 Migrating alerts...');

  interface OldAlert {
    id: string;
    subsidiary_id: string;
    ratio_name: string;
    severity: string;
    current_value: number;
    threshold_value: number;
    message: string;
    status: string;
    acknowledged_at: string | null;
    acknowledged_by: string | null;
    created_at: string;
  }

  const oldAlerts = queryAll<OldAlert>('SELECT * FROM frs_alerts');

  for (const a of oldAlerts) {
    const corporateId = idMap.get(a.subsidiary_id);
    if (!corporateId) continue;

    // Extract period from created_at (YYYY-MM)
    const period = a.created_at.substring(0, 7);

    await db
      .insert(alerts)
      .values({
        corporateId,
        ratioName: a.ratio_name,
        severity: a.severity,
        currentValue: String(a.current_value),
        thresholdValue: String(a.threshold_value),
        message: a.message,
        status: a.status,
        acknowledgedAt: a.acknowledged_at ? new Date(a.acknowledged_at) : undefined,
        acknowledgedBy: a.acknowledged_by ? idMap.get(a.acknowledged_by) : undefined,
        period,
        createdAt: new Date(a.created_at),
      })
      .onConflictDoNothing();
  }

  console.log(`   ✅ ${oldAlerts.length} alerts migrated`);
}

async function migrateAuditLogs() {
  console.log('📝 Migrating audit logs...');

  // --- FRS audit logs ---
  interface OldFrsAudit {
    id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    subsidiary_id: string | null;
    old_values: string | null;
    new_values: string | null;
    justification: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
  }

  const frsAudits = queryAll<OldFrsAudit>('SELECT * FROM frs_audit_log');

  for (const a of frsAudits) {
    const userId = idMap.get(a.user_id);

    await db
      .insert(auditLogs)
      .values({
        userId,
        module: 'frs',
        action: a.action,
        entityType: a.entity_type,
        entityId: a.entity_id ? (idMap.get(a.entity_id) ?? undefined) : undefined,
        oldValues: a.old_values ? JSON.parse(a.old_values) : undefined,
        newValues: a.new_values ? JSON.parse(a.new_values) : undefined,
        justification: a.justification,
        ipAddress: a.ip_address,
        userAgent: a.user_agent,
        createdAt: new Date(a.created_at),
      })
      .onConflictDoNothing();
  }

  // --- Approval audit logs ---
  interface OldApprovalAudit {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    performed_by: number;
    performed_at: string;
    notes: string | null;
  }

  const approvalAudits = queryAll<OldApprovalAudit>('SELECT * FROM approval_audit_log');

  for (const a of approvalAudits) {
    const userId = idMap.get(String(a.performed_by));

    await db
      .insert(auditLogs)
      .values({
        userId,
        module: 'cfd',
        action: a.action,
        entityType: a.entity_type,
        newValues: a.notes ? { notes: a.notes } : undefined,
        createdAt: new Date(a.performed_at),
      })
      .onConflictDoNothing();
  }

  console.log(`   ✅ ${frsAudits.length} FRS + ${approvalAudits.length} approval audit logs migrated`);
}

async function migrateBalanceSheets() {
  console.log('📑 Migrating balance sheets...');

  interface OldBS {
    id: string;
    company_id: string;
    period: string;
    kas: number;
    piutang: number;
    persediaan: number;
    current_assets_lain_lain: number;
    tanah_bangunan: number;
    mesin_peralatan: number;
    kendaraan: number;
    akumulasi_penyusutan: number;
    other_assets: number;
    hutang_usaha: number;
    hutang_bank: number;
    current_liabilities_lain_lain: number;
    hutang_jangka_panjang: number;
    modal: number;
    laba_ditahan: number;
    deviden: number;
    submitted_by: number;
  }

  const oldBS = queryAll<OldBS>('SELECT * FROM balance_sheets');

  // Balance sheets in old schema are per company, but new schema is per department.
  // Map to the first department of the corresponding corporate.
  const allDepts = await db.select().from(departments);

  for (const bs of oldBS) {
    const corporateId = idMap.get(bs.company_id);
    if (!corporateId) continue;

    // Find first department for this corporate
    const dept = allDepts.find((d) => d.corporateId === corporateId);
    if (!dept) {
      console.log(`   ⚠️  No department for corporate ${bs.company_id}, skipping BS`);
      continue;
    }

    const submittedBy = idMap.get(String(bs.submitted_by)) ?? 'migration';

    await db
      .insert(balanceSheets)
      .values({
        departmentId: dept.id,
        period: bs.period,
        cashAndBank: String(bs.kas),
        accountsReceivable: String(bs.piutang),
        inventory: String(bs.persediaan),
        prepaidExpenses: String(bs.current_assets_lain_lain),
        land: String(bs.tanah_bangunan),
        building: '0',
        equipment: String(bs.mesin_peralatan + bs.kendaraan - bs.akumulasi_penyusutan),
        otherFixedAssets: String(bs.other_assets),
        accountsPayable: String(bs.hutang_usaha),
        bankLoanCurrent: String(bs.hutang_bank),
        otherCurrentLiabilities: String(bs.current_liabilities_lain_lain),
        bankLoanLongTerm: String(bs.hutang_jangka_panjang),
        capital: String(bs.modal),
        retainedEarnings: String(bs.laba_ditahan),
        dividends: String(bs.deviden),
        createdBy: submittedBy,
      })
      .onConflictDoNothing();
  }

  console.log(`   ✅ ${oldBS.length} balance sheets migrated`);
}

async function migrateIncomeStatements() {
  console.log('📑 Migrating income statements...');

  interface OldIS {
    id: string;
    company_id: string;
    period: string;
    revenue: number;
    cogs: number;
    operational_expenses: number;
    marketing_sales: number;
    administrative_costs: number;
    it_technology: number;
    human_resources: number;
    maintenance_repairs: number;
    miscellaneous: number;
    other_income: number;
    other_expenses: number;
    tax: number;
    submitted_by: number;
  }

  const oldIS = queryAll<OldIS>('SELECT * FROM income_statements');
  const allDepts = await db.select().from(departments);

  for (const is_ of oldIS) {
    const corporateId = idMap.get(is_.company_id);
    if (!corporateId) continue;

    const dept = allDepts.find((d) => d.corporateId === corporateId);
    if (!dept) continue;

    const submittedBy = idMap.get(String(is_.submitted_by)) ?? 'migration';

    // Consolidate detailed opex into single operating_expenses
    const totalOpex =
      is_.operational_expenses +
      is_.marketing_sales +
      is_.administrative_costs +
      is_.it_technology +
      is_.human_resources +
      is_.maintenance_repairs +
      is_.miscellaneous;

    await db
      .insert(incomeStatements)
      .values({
        departmentId: dept.id,
        period: is_.period,
        revenue: String(is_.revenue),
        cogs: String(is_.cogs),
        operatingExpenses: String(totalOpex),
        interestExpense: '0',
        taxExpense: String(is_.tax),
        createdBy: submittedBy,
      })
      .onConflictDoNothing();
  }

  console.log(`   ✅ ${oldIS.length} income statements migrated`);
}

async function migrateTargets() {
  console.log('🎯 Migrating targets...');

  interface OldTarget {
    id: string;
    project_id: string;
    period: string;
    revenue_target: number;
    cash_in_target: number;
    cash_out_target: number;
    status: string;
    created_by: number;
  }

  const oldTargets = queryAll<OldTarget>('SELECT * FROM targets');

  // Need project → department mapping
  const allProjects = await db.select().from(projects);
  const projMap = new Map(allProjects.map((p) => [p.id, p]));

  let count = 0;
  for (const t of oldTargets) {
    const projectId = idMap.get(t.project_id);
    if (!projectId) continue;

    const proj = projMap.get(projectId);
    if (!proj) continue;

    const [year, month] = t.period.split('-').map(Number);
    const createdBy = idMap.get(String(t.created_by)) ?? 'migration';

    const [header] = await db
      .insert(targetHeaders)
      .values({
        departmentId: proj.departmentId,
        projectId,
        fiscalYear: year,
        fiscalMonth: month,
        createdBy,
      })
      .onConflictDoNothing()
      .returning();

    if (header) {
      await db
        .insert(targetDetails)
        .values([
          { targetHeaderId: header.id, targetType: 'revenue', amount: String(t.revenue_target) },
          { targetHeaderId: header.id, targetType: 'cash_in', amount: String(t.cash_in_target) },
          { targetHeaderId: header.id, targetType: 'cash_out', amount: String(t.cash_out_target) },
        ])
        .onConflictDoNothing();
      count++;
    }
  }

  console.log(`   ✅ ${count} target headers + details migrated (from ${oldTargets.length} flat records)`);
}

async function migrateWeeklyCashFlows() {
  console.log('💰 Migrating weekly cash flows...');

  interface OldCashFlow {
    id: string;
    project_id: string;
    period: string;
    week: string;
    revenue: number;
    cash_in: number;
    cash_out: number;
    notes: string | null;
    submitted_by: number;
  }

  const oldCFs = queryAll<OldCashFlow>('SELECT * FROM weekly_cash_flow');

  // Need project → department mapping
  const allProjects = await db.select().from(projects);
  const projMap = new Map(allProjects.map((p) => [p.id, p]));

  let count = 0;
  for (const cf of oldCFs) {
    const projectId = idMap.get(cf.project_id);
    if (!projectId) continue;

    const proj = projMap.get(projectId);
    if (!proj) continue;

    const createdBy = idMap.get(String(cf.submitted_by)) ?? 'migration';

    // Old schema has simple cash_in/cash_out → map to operatingCashIn/Out
    await db
      .insert(weeklyCashFlows)
      .values({
        departmentId: proj.departmentId,
        entityType: 'project',
        entityId: projectId,
        period: cf.period,
        week: cf.week as 'W1' | 'W2' | 'W3' | 'W4' | 'W5',
        operatingCashIn: String(cf.cash_in),
        operatingCashOut: String(cf.cash_out),
        notes: cf.notes,
        createdBy,
      })
      .onConflictDoNothing();

    count++;
  }

  console.log(`   ✅ ${count} weekly cash flows migrated`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('🚀 SQLite → PostgreSQL Data Migration');
  console.log('=====================================\n');

  // Verify SQLite has data
  const tableCount = sqlite.prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table'").get() as { c: number };
  console.log(`📦 Source: finance.db (${tableCount.c} tables)\n`);

  // Migration order respects foreign key dependencies
  await migrateRoles();
  await migrateUsers();
  await migrateCorporates();
  await migrateDepartments();
  await migrateProjects();
  await migrateUserAccess();
  await migrateThresholds();
  await migrateAlerts();
  await migrateAuditLogs();
  await migrateBalanceSheets();
  await migrateIncomeStatements();
  await migrateTargets();
  await migrateWeeklyCashFlows();

  // Print ID mapping summary
  console.log(`\n📊 Migration Summary`);
  console.log(`   ID mappings created: ${idMap.size}`);

  sqlite.close();
  console.log('\n🎉 Migration complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  sqlite.close();
  process.exit(1);
});
