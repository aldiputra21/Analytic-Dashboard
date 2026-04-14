# PostgreSQL Migration — Specification

## Overview
Migrate the CFD (Corporate Financial Dashboard) application from SQLite (better-sqlite3) to PostgreSQL using Drizzle ORM, consolidating 50+ legacy tables across 4 sources into a clean 33-table schema across 3 PostgreSQL schemas.

## Goals
1. **Eliminate table duplication** — Merge 9 duplication groups (users, companies, departments, etc.) into single authoritative tables
2. **Typed schema** — Drizzle ORM for type-safe queries, migrations, and schema management
3. **Multi-schema** — `public`, `cfd`, `crm` schemas for domain separation
4. **Common approval module** — Reusable maker/checker/approver workflow across all modules
5. **Financial ratio computation via VIEWs** — Replace `frs_financial_data` + `frs_calculated_ratios` tables with computed views from balance_sheets + income_statements

## Schema Summary

| Schema | Tables | Views | Functions | Purpose |
|--------|--------|-------|-----------|---------|
| public | 12 | 0 | 0 | Shared: users, roles, corporates, departments, projects, audit, approval |
| cfd | 8 | 2 | 1 | Financial: targets, cash flows, balance sheets, income statements, thresholds, alerts |
| crm | 13 | 0 | 0 | CRM: customers, opportunities, proposals, contracts |
| **Total** | **33** | **2** | **1** | |

## Tables Dropped (dead code)
- `cost_control_budgets` — no UI, no POST route
- `frs_scheduled_reports` — no UI
- `frs_financial_data_archive` — no UI, no trigger
- `projection_parameters` — no route, no code

## Tables Merged
- `frs_users` + `users` → `public.users`
- `companies` + `subsidiaries` → `public.corporates`
- `frs_user_subsidiary_access` + `user_company_access` → `public.user_corporate_accesses`
- `frs_audit_log` + `crm_audit_log` + `approval_audit_log` → `public.audit_logs`
- `crm_user_roles` → absorbed into `public.roles` + `public.user_corporate_accesses`

## Tables Replaced
- `frs_financial_data` → `cfd.v_financial_summary` VIEW
- `frs_calculated_ratios` → `cfd.v_financial_ratios` VIEW

## Key Design Decisions
1. UUID primary keys everywhere (`gen_random_uuid()`)
2. NUMERIC(18,2) for all monetary fields
3. TIMESTAMPTZ for all timestamps
4. JSONB for flexible fields (permissions, thresholds, approval payloads)
5. VARCHAR(7) `period` field for YYYY-MM date periods
6. Approval via common module (staging table pattern with callback handler)
7. Role-based access via `user_corporate_accesses` with scope (system/corporate/department)
8. Calculated fields NOT stored — computed at query time via VIEWs
9. OCF Ratio & DSCR via PostgreSQL function for consistency
10. Regular VIEWs (not materialized), optimize later if needed

## Non-Goals (this phase)
- Data migration from SQLite → PostgreSQL (separate task)
- Frontend component refactoring
- API route refactoring
- Authentication flow changes
