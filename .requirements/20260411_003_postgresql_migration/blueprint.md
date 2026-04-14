# PostgreSQL Migration — Blueprint

## Architecture

```
src/db/
├── connection.ts          # PostgreSQL connection pool (node-postgres)
├── schema/
│   ├── public.ts          # public schema (12 tables)
│   ├── cfd.ts             # cfd schema (8 tables)
│   ├── crm.ts             # crm schema (13 tables)
│   └── index.ts           # barrel export
├── views/
│   ├── financialSummary.ts   # v_financial_summary VIEW SQL
│   └── financialRatios.ts    # v_financial_ratios VIEW SQL
├── functions/
│   └── calculateOcfRatios.ts # fn_calculate_ocf_ratios PG function SQL
├── initCRM.ts             # (legacy — to be replaced)
├── initFinancialRatio.ts  # (legacy — to be replaced)
├── initMafindaDashboard.ts # (legacy — to be replaced)
└── migrations/            # (legacy — to be replaced by drizzle migrations)
drizzle/                   # generated migrations by drizzle-kit
drizzle.config.ts          # drizzle-kit configuration
.env                       # DATABASE_URL
```

## Schema Design

### public schema (12 tables)

| Table | PK | Key FKs | Unique Constraints |
|-------|----|---------|--------------------|
| roles | UUID | — | (name) |
| users | UUID | — | (email) |
| corporates | UUID | — | (code) |
| departments | UUID | corporates | (corporate_id, code) |
| projects | UUID | departments | (department_id, code) |
| user_corporate_accesses | UUID | users, roles, corporates, departments | partial indexes for scope |
| audit_logs | UUID | departments, users | — |
| system_configs | VARCHAR key PK | — | — |
| approval_workflows | UUID | — | (module, entity_type, action) |
| approval_workflow_steps | UUID | approval_workflows | (workflow_id, step_order) |
| approvals | UUID | approval_workflows, approval_workflow_steps, users, departments | — |
| approval_histories | UUID | approvals, approval_workflow_steps, users | — |

### cfd schema (8 tables + 2 views + 1 function)

| Table/View | PK | Key FKs | Unique Constraints |
|------------|----|---------|--------------------|
| target_headers | UUID | departments, projects | (department_id, project_id, fiscal_year, fiscal_month) |
| target_details | UUID | target_headers | (target_header_id, target_type, cost_center) |
| weekly_cash_flows | UUID | departments | (entity_type, entity_id, period, week) |
| balance_sheets | UUID | departments | (department_id, period) |
| income_statements | UUID | departments | (department_id, period) |
| thresholds | UUID | corporates | (corporate_id, ratio_name) |
| alerts | UUID | corporates, departments, users | — |
| v_financial_summary | VIEW | — | — |
| v_financial_ratios | VIEW | — | — |
| fn_calculate_ocf_ratios | FUNCTION | — | — |

### crm schema (13 tables)

| Table | PK | Key FKs |
|-------|----|---------|
| customers | UUID | self-ref (parent_customer_id) |
| contacts | UUID | customers |
| interactions | UUID | users |
| opportunities | UUID | customers, corporates, users |
| opportunity_value_history | UUID | opportunities, users |
| stage_transitions | UUID | opportunities, users |
| competitors | UUID | opportunities, users |
| qualifications | UUID | opportunities, users |
| proposals | UUID | opportunities, users |
| proposal_documents | UUID | proposals, users |
| proposal_versions | UUID | proposals, users |
| cost_estimations | UUID | opportunities, users |
| contracts | UUID | opportunities, customers, users |
| contract_documents | UUID | contracts, users |
| sales_targets | UUID | users |

## Approval Flow (public schema)

```
User submit → approval_workflows (lookup config)
           → approvals (staging, status=pending, payload=JSONB)
           → approval_workflow_steps (determine sequence)
           → approval_histories (each approve/reject action)
           → callback_handler invoked on final approve
           → main table INSERT by module handler
```

## Financial Ratio Computation

```
balance_sheets + income_statements
  → v_financial_summary (VIEW: computed totals)
    → v_financial_ratios (VIEW: 7 ratios computed)
      → fn_calculate_ocf_ratios (FUNCTION: OCF + DSCR from weekly_cash_flows)
        → thresholds (compare ratios)
          → alerts (generated when threshold breached)
```

---

## Phase 3: API Conversion Plan

### Table Name Mapping (Old SQLite → New PostgreSQL)

#### Public Schema
| Old Table | New Table | Notes |
|---|---|---|
| `roles` | `public.roles` | + scope, permissions JSONB, audit fields |
| `users` | `public.users` | Merged with `frs_users` — single auth |
| `frs_users` | `public.users` | MERGED — ambil password_hash, security fields |
| `companies` | `public.corporates` | RENAMED + logo, fiscal_year_start_month, currency, tax_rate |
| `divisions` | `public.departments` | RENAMED + code (unique per corporate) |
| `projects` (legacy) | `public.projects` | RENAMED + code, source_type/source_id |
| `mafinda_departments` | `public.departments` | MERGED — satu tabel departments |
| `mafinda_projects` | `public.projects` | MERGED — satu tabel projects |
| `user_company_access` | `public.user_corporate_accesses` | REDESIGNED — scope-based (system/corporate/department) |
| `frs_user_subsidiary_access` | `public.user_corporate_accesses` | MERGED ke satu access table |
| `crm_user_roles` | `public.user_corporate_accesses` | MERGED — role via access table |
| `parameters` | `public.system_configs` | RENAMED — key as PK, value as JSONB |
| `frs_audit_log` | `public.audit_logs` | MERGED — satu audit log + module field |
| `crm_audit_log` | `public.audit_logs` | MERGED — satu audit log + module field |
| `approval_audit_log` | `public.audit_logs` | MERGED — satu audit log |
| — (new) | `public.approval_workflows` | NEW — configurable approval flow |
| — (new) | `public.approval_workflow_steps` | NEW — multi-step approval |
| `crm_approvals` | `public.approvals` | REDESIGNED — generic approval module |
| — (new) | `public.approval_histories` | NEW — approval action trail |

#### CFD Schema
| Old Table | New Table | Notes |
|---|---|---|
| `mafinda_targets` | `cfd.target_headers` + `cfd.target_details` | SPLIT — master-detail pattern |
| `mafinda_cash_flows` | `cfd.weekly_cash_flows` | RENAMED + entity polymorphic (dept/project) |
| `weekly_cash_flow` (legacy) | `cfd.weekly_cash_flows` | MERGED |
| `mafinda_balance_sheets` | `cfd.balance_sheets` | MOVED to cfd schema, same structure |
| `balance_sheets` (legacy) | `cfd.balance_sheets` | MERGED |
| `mafinda_income_statements` | `cfd.income_statements` | MOVED to cfd schema, same structure |
| `income_statements` (legacy) | `cfd.income_statements` | MERGED |
| `frs_thresholds` | `cfd.thresholds` | REDESIGNED — JSONB per ratio |
| `frs_alerts` | `cfd.alerts` | MOVED to cfd schema |

#### CRM Schema
| Old Table | New Table | Notes |
|---|---|---|
| `crm_customers` | `crm.customers` | DROP prefix, + parent_customer_id self-ref |
| `crm_contacts` | `crm.contacts` | DROP prefix |
| `crm_interactions` | `crm.interactions` | DROP prefix, polymorphic entity_type |
| `crm_opportunities` | `crm.opportunities` | DROP prefix, + corporate_id |
| `crm_opportunity_value_history` | `crm.opportunity_value_history` | DROP prefix |
| `crm_stage_transitions` | `crm.stage_transitions` | DROP prefix |
| `crm_competitors` | `crm.competitors` | DROP prefix |
| `crm_qualifications` | `crm.qualifications` | DROP prefix, approval via generic module |
| `crm_proposals` | `crm.proposals` | DROP prefix |
| `crm_proposal_documents` | `crm.proposal_documents` | DROP prefix |
| `crm_proposal_versions` | `crm.proposal_versions` | DROP prefix |
| `crm_cost_estimations` | `crm.cost_estimations` | DROP prefix |
| `crm_contracts` | `crm.contracts` | DROP prefix, no project_id |
| `crm_contract_documents` | `crm.contract_documents` | DROP prefix |
| `crm_sales_targets` | `crm.sales_targets` | DROP prefix |

#### Dropped Tables (tidak ada di skema baru)
| Old Table | Reason |
|---|---|
| `subsidiaries` (FRS) | Digantikan `public.corporates` |
| `frs_financial_data` | Digantikan VIEW `v_financial_summary` |
| `frs_calculated_ratios` | Digantikan VIEW `v_financial_ratios` |
| `frs_scheduled_reports` | No UI — dropped |
| `frs_financial_data_history` | Archived via audit_logs |
| `frs_financial_data_archive` | No UI — dropped |
| `frs_threshold_history` | Archived via audit_logs |
| `cost_control_budgets` | No UI — dropped |
| `projection_parameters` | No UI — dropped |
| `financial_statements` | Legacy backward-compat — dropped |
| `mafinda_revenue_realizations` | Covered by weekly_cash_flows |
| `crm_reimbursements` | To be handled via approval module if needed |
| `frs_roles` / `frs_permissions` | Merged into `public.roles` + permissions JSONB |

### ID Type Migration
| Old | New | Notes |
|---|---|---|
| `TEXT` (manual ID) | `UUID` (gen_random_uuid) | Auto-generated, no manual ID creation |
| `INTEGER` autoincrement | `UUID` | All PKs now UUID |

### Query Pattern Conversion

```typescript
// OLD (SQLite sync)
import Database from 'better-sqlite3';
function getUsers(db: Database.Database) {
  return db.prepare('SELECT * FROM users WHERE is_active = 1').all();
}

// NEW (PostgreSQL async via Drizzle)
import { db } from '@/src/db/connection';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
async function getUsers() {
  return await db.select().from(users).where(eq(users.isActive, true));
}
```

### Service Layer Pattern Change

```typescript
// OLD: Services receive db as parameter
export function createDepartmentService(db: Database.Database) {
  return {
    getAll: (companyId: string) => {
      return db.prepare('SELECT * FROM divisions WHERE company_id = ?').all(companyId);
    }
  };
}

// NEW: Services import db directly, all methods async
import { db } from '@/src/db/connection';
import { departments } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
export const departmentService = {
  getAll: async (corporateId: string) => {
    return await db.select().from(departments).where(eq(departments.corporateId, corporateId));
  }
};
```

### Route Handler Pattern Change

```typescript
// OLD: Route receives db, sync handler
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM companies').all();
  res.json(rows);
});

// NEW: Async handler, import service
router.get('/', async (req, res) => {
  try {
    const rows = await corporateService.getAll();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Conversion Order (bottom-up)

```
1. Services (leaf layer — no dependencies on other app code)
   ├── src/services/mafinda/*    (5 files)
   ├── src/services/financial/*  (19 files)
   ├── src/services/crm/*        (2 files)
   └── src/helpers/*              (1 file)

2. Middleware (depends on schema only)
   ├── src/middleware/frsRbac.ts
   └── src/middleware/crmRbac.ts

3. Routes (depends on services + middleware)
   ├── src/routes/management/*    (4 files)
   ├── src/routes/dashboard/*     (1 file)
   ├── src/routes/financial/*     (12 files)
   └── src/routes/crm/*           (4 files)

4. server.ts (top-level — depends on everything)
   - Remove all inline CREATE TABLE / db.exec()
   - Remove init* calls
   - Remove inline route handlers
   - Wire up Drizzle connection + new routers

5. Tests (adapt to async + new schema)
   └── src/routes/__tests__/*
   └── src/services/**/__tests__/*

6. Init/Seed files (rewrite for Drizzle)
   ├── init-and-seed.ts
   ├── seed-data.ts
   └── seed-mafinda-demo.ts
```

## Dependencies
- drizzle-orm@0.45.2 (installed)
- drizzle-kit@0.31.10 (installed)
- pg@8.20.0 (installed)
- @types/pg@8.20.0 (installed)
