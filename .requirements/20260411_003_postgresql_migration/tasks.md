# PostgreSQL Migration — Tasks

## Phase 1: Schema Definition (Current)
- [x] Create requirement folder (.requirements/20260411_003_postgresql_migration/)
- [x] Write specs.md
- [x] Write blueprint.md
- [x] Write tasks.md
- [x] Create src/db/schema/public.ts (12 tables)
- [x] Create src/db/schema/cfd.ts (8 tables)
- [x] Create src/db/schema/crm.ts (15 tables)
- [x] Create src/db/schema/index.ts (barrel export)
- [x] Create src/db/views/financialSummary.ts
- [x] Create src/db/views/financialRatios.ts
- [x] Create src/db/functions/calculateOcfRatios.ts
- [x] Create src/db/connection.ts
- [x] Create drizzle.config.ts
- [x] .env.example (already existed)
- [x] Validate — no TypeScript errors

## Phase 2: Migration Generation
- [x] Run drizzle-kit generate to create SQL migrations
- [x] Review generated SQL (587 lines, 34 tables, all FK/CHECK/indexes correct)
- [x] Create PostgreSQL database (Neon cloud)
- [x] Run drizzle-kit migrate (applied 2026-04-11T12:31:26Z)

## Phase 3: API Conversion

### 3.1 MAFINDA Services (5 files — foundational, least dependencies)
- [x] Convert `src/services/mafinda/departmentService.ts` → Drizzle (public.departments)
- [x] Convert `src/services/mafinda/projectService.ts` → Drizzle (public.projects)
- [x] Convert `src/services/mafinda/targetService.ts` → Drizzle (cfd.target_headers + target_details)
- [x] Convert `src/services/mafinda/financialStatementService.ts` → Drizzle (cfd.balance_sheets, income_statements, weekly_cash_flows)
- [x] Convert `src/services/mafinda/dashboardService.ts` → Drizzle (aggregation queries)

### 3.2 Financial Services (key files)
- [x] Convert `src/services/financial/authService.ts` → Drizzle (public.users, merge frs_users)
- [x] Convert `src/services/financial/subsidiaryService.ts` → Drizzle (public.corporates)
- [x] Convert `src/services/financial/ratioCalculator.ts` → Drizzle (views: v_financial_ratios)
- [x] Convert `src/services/financial/auditLogService.ts` → Drizzle (public.audit_logs)
- [x] Convert `src/services/financial/alertEngine.ts` → Drizzle (cfd.alerts, cfd.thresholds)
- [x] Convert `src/services/financial/benchmarkingService.ts` → Drizzle
- [x] Convert `src/services/financial/bulkImportService.ts` → Drizzle
- [x] Convert `src/services/financial/userService.ts` → Drizzle (public.users + user_corporate_accesses)
- [x] Convert `src/services/financial/thresholdService.ts` → Drizzle (cfd.thresholds, JSONB)
- [x] Convert `src/services/financial/financialDataService.ts` → Drizzle (read-only, v_financial_summary view)
- [x] Convert `src/services/financial/trendAnalyzer.ts` → Drizzle (v_financial_ratios + v_financial_summary)
- [x] Convert `src/services/financial/reportGenerator.ts` → Drizzle (v_financial_summary + corporates)
- [x] Convert `src/services/financial/backupService.ts` → PostgreSQL (pg_dump/pg_restore)
- [x] Convert `src/services/financial/scheduledReportService.ts` → stubbed (no table in new schema)
- [x] Convert `src/services/financial/archivalService.ts` → stubbed (no archive table, use PG partitioning)
- [x] Skipped: `exportService.ts` (no DB), `dataValidator.ts` (no DB), `apiFetch.ts` (no DB)

### 3.3 CRM Services (2 files)
- [x] Convert `src/services/crm/pipelineEngine.ts` → Drizzle (crm.opportunities, stage_transitions, etc.)
- [x] Skipped: `src/services/crm/feasibilityCalculator.ts` → no DB (pure calculation)

### 3.4 Helpers & Middleware
- [x] Convert `src/helpers/crmAuditLog.ts` → Drizzle (public.audit_logs with module='crm')
- [x] Convert `src/middleware/crmRbac.ts` → Drizzle (public.user_corporate_accesses + roles)
- [x] Convert `src/middleware/frsRbac.ts` → Drizzle (public.user_corporate_accesses)
- [x] Skipped: `src/middleware/frsAuth.ts` → no DB (pure JWT)

### 3.5 Management Routes (4 files)
- [x] Convert `src/routes/management/departments.ts`
- [x] Convert `src/routes/management/projects.ts`
- [x] Convert `src/routes/management/targets.ts`
- [x] Convert `src/routes/management/financialStatements.ts`

### 3.6 Dashboard Routes (1 file)
- [x] Convert `src/routes/dashboard/mafindaDashboard.ts`

### 3.7 Financial Routes (11 files)
- [x] Convert `src/routes/financial/auth.ts`
- [x] Convert `src/routes/financial/users.ts`
- [x] Convert `src/routes/financial/subsidiaries.ts`
- [x] Convert `src/routes/financial/ratios.ts`
- [x] Convert `src/routes/financial/financialData.ts`
- [x] Convert `src/routes/financial/alerts.ts`
- [x] Convert `src/routes/financial/auditLog.ts`
- [x] Convert `src/routes/financial/reports.ts`
- [x] Convert `src/routes/financial/thresholds.ts`
- [x] Convert `src/routes/financial/backup.ts`
- [x] Convert `src/routes/financial/index.ts` (router wiring)

### 3.8 CRM Routes (4 files)
- [x] Convert `src/routes/crm/customers.ts`
- [x] Convert `src/routes/crm/interactions.ts`
- [x] Convert `src/routes/crm/opportunities.ts`
- [x] Convert `src/routes/crm/qualifications.ts`

### 3.9 server.ts Overhaul
- [x] Remove all inline CREATE TABLE / db.exec() blocks
- [x] Remove initCRM, initFinancialRatio, initMafindaDashboard calls
- [x] Remove better-sqlite3 import and DB_PATH
- [x] Remove all inline route handlers (~1100 lines removed)
- [x] Wire Drizzle connection + new async routers
- [x] Add missing CRM router mounts (opportunities, pipeline, qualifications)

### 3.10 Config & Types
- [x] Update `src/config/frsConfig.ts` — DATABASE_URL validation for postgresql://
- [x] Update/create TypeScript types in `src/types/` to match new schema
- [x] Remove obsolete type definitions (old table shapes)
- [x] Fix `db.execute()` → `.rows` pattern across all active code (13 files)

### 3.11 Tests
- [x] Update `src/routes/__tests__/mafindaApi.test.ts` → async + Drizzle
- [x] Update `src/services/mafinda/__tests__/serviceLayer.test.ts`
- [x] Update `src/services/financial/__tests__/auth.test.ts`
- [x] Update `src/services/financial/__tests__/rbac.test.ts`
- [x] Update `src/services/financial/__tests__/phase2.integration.test.ts`
- [x] Update `src/services/financial/__tests__/phase4.integration.test.ts`
- [x] Update `src/services/financial/__tests__/pbt.properties.test.ts`

### 3.12 Seed Files
- [x] Rewrite `init-and-seed.ts` → Drizzle (public.roles, users, corporates, departments)
- [x] Rewrite `seed-data.ts` → Drizzle (cfd financial data)
- [x] Rewrite `seed-mafinda-demo.ts` → Drizzle

## Phase 4: Data Migration
- [x] Create SQLite → PostgreSQL migration script (`migrate-sqlite-to-pg.ts`)
- [x] Migrate user data (merge frs_users + users → 4 users in public.users)
- [x] Migrate financial data (corporates, departments, projects, thresholds, alerts, balance sheets, income statements, targets, weekly cash flows)
- [x] Migrate CRM data — skipped (all CRM tables empty, no data to migrate)
- [x] Verify data integrity (`verify-migration.ts` — 13/14 tables exact match, 1 expected dedup on user_corporate_accesses)

## Phase 5: Cleanup
- [x] Remove SQLite dependencies (better-sqlite3, @types/better-sqlite3 from package.json)
- [x] Remove legacy init*.ts files (src/db/initCRM.ts, initFinancialRatio.ts, initMafindaDashboard.ts)
- [x] Remove legacy migration SQL files (src/db/migrations/001-004*.sql)
- [x] Update documentation (README.md, QUICK_START.md, agents.md — all updated for PostgreSQL + Drizzle)
