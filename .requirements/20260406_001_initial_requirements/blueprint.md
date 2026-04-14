# Blueprint — System Design: Corporate Finance Dashboard (CFD)

**Requirement ID:** 20260406_001_initial_requirements
**Tanggal Dibuat:** 2026-04-06
**Status:** Documented (existing mockup)

---

## 1. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (SPA)                        │
│  React 19 + TypeScript + Tailwind CSS + Recharts        │
│  ┌─────────────────────────────────────────────────┐    │
│  │  FRSApp.tsx (app shell — single entry point)    │    │
│  │  ┌───────────────────┐  ┌────────────────────┐  │    │
│  │  │  CFD Module       │  │  CRM Module        │  │    │
│  │  │  (FRS + Fin Mgmt) │  │  (Pipeline B2B)    │  │    │
│  │  └────────┬──────────┘  └─────────┬──────────┘  │    │
│  └───────────┼─────────────────────-─┼─────────────┘    │
└──────────────┼──────────────────────-┼──────────────────┘
               │  HTTP/JSON REST API   │
               ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Express Server (Node.js)                │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │
│  │/api/frs/* │ │/api/crm/*│ │/api/mgmt/*│ │/api/dash/│  │
│  └─────┬─────┘ └────┬─────┘ └─────┬─────┘ └────┬─────┘  │
│        │             │             │             │        │
│  ┌─────▼─────────────▼─────────────▼─────────────▼────┐  │
│  │                  Services Layer                    │  │
│  │  ratioCalculator | alertEngine | pipelineEngine    │  │
│  │  authService | exportService | reportGenerator     │  │
│  └────────────────────────┬───────────────────────────┘  │
└───────────────────────────┼─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              SQLite Database (finance.db)                │
│  better-sqlite3 — single-file, embedded                 │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Layer Architecture

### 2.1 Frontend (Client)

```
src/
├── main.tsx                    # Entry point → FRSApp
├── types/
│   ├── financial/              # FRS TypeScript types
│   │   ├── user.ts             # UserRole, FRSUser, JWTPayload
│   │   ├── ratio.ts            # RatioName, CalculatedRatios, BenchmarkData
│   │   ├── financialData.ts    # FinancialData entity
│   │   ├── alert.ts            # Alert, AlertSeverity
│   │   ├── threshold.ts        # Threshold
│   │   └── subsidiary.ts       # Subsidiary entity
│   └── crm.ts                  # CRM types (roles, stages, entities)
├── types.ts                    # [LEGACY — tidak digunakan]
├── config/
│   └── frsConfig.ts            # FRS constants & ratio metadata
├── hooks/
│   ├── financial/              # FRS React hooks (useAuth, useRatios, useAlerts, dll.)
│   └── mafinda/                # Financial management hooks (useDashboard, useManagement)
├── utils/
│   ├── cn.ts                   # clsx + tailwind-merge
│   └── format.ts               # formatRupiah, number formatting
└── components/
    ├── Tooltip.tsx             # InfoTooltip, LabelWithTooltip
    ├── financial/              # [AKTIF] FRS components
    └── MAFINDA/                # [SEBAGIAN AKTIF] — lihat detail di bawah
```

#### 2.1.1 Active Component Tree — FRSApp

```
main.tsx
└── FRSApp.tsx (root shell)
    ├── LoginForm (inline)
    ├── QueryProvider
    │   └── ToastProvider
    │       └── ErrorBoundary
    │           └── AppContent
    │               └── DashboardLayout (sidebar + page shell)
    │                   │
    │                   ├── [group: Analitik]
    │                   │   ├── FRSDashboard ──────────────────────────┐
    │                   │   │   ├── CompanySelector, PeriodSelector    │
    │                   │   │   ├── HealthScoreGauge                   │
    │                   │   │   ├── RatioCard (×9)                     │
    │                   │   │   ├── AlertPanel                         │
    │                   │   │   ├── TrendChart                         │
    │                   │   │   ├── ComparisonChart                    │
    │                   │   │   └── [MAFINDA widgets embedded] ◄───────┘
    │                   │   │       FinancialSummaryCards
    │                   │   │       RevenueCostCards
    │                   │   │       CashFlowChart
    │                   │   │       RevenueTargetChart
    │                   │   │       DepartmentPerformance
    │                   │   │       HistoricalDataChart
    │                   │   │       AssetCompositionChart
    │                   │   │       EquityLiabilityChart
    │                   │   │       CompositionPie3D
    │                   │   ├── BenchmarkingTable
    │                   │   ├── TrendAnalysis
    │                   │   └── ConsolidatedReport
    │                   │
    │                   ├── [group: Input Data]
    │                   │   ├── FinancialDataForm (FRS data entry)
    │                   │   ├── BulkImport
    │                   │   └── DataEntryPage (MAFINDA: income stmt, BS, cash flow)
    │                   │       ├── IncomeStatementForm
    │                   │       ├── BalanceSheetForm
    │                   │       ├── CashFlowStatementForm
    │                   │       └── FinancialHistoryTable
    │                   │
    │                   ├── [group: CFD]
    │                   │   └── ManagementPage
    │                   │       ├── DepartmentManager
    │                   │       ├── ProjectManager
    │                   │       └── TargetManager
    │                   │
    │                   ├── [group: CRM]
    │                   │   └── CRMPage (tab-based)
    │                   │       ├── Tab: Dashboard (funnel + metrics)
    │                   │       ├── Tab: Opportunities (kanban)
    │                   │       │   ├── PipelineKanbanBoard
    │                   │       │   ├── OpportunityCard, OpportunityForm
    │                   │       │   └── NewOpportunityModal
    │                   │       ├── Tab: Customers
    │                   │       │   ├── CustomerList
    │                   │       │   ├── CustomerProfileForm
    │                   │       │   ├── ContactForm
    │                   │       │   └── NewCustomerModal
    │                   │       ├── Tab: Proposals
    │                   │       │   └── NewProposalModal
    │                   │       ├── Tab: Contracts
    │                   │       │   └── NewContractModal
    │                   │       ├── Tab: Approvals
    │                   │       └── Tab: Reimburse
    │                   │           └── NewReimburseModal
    │                   │
    │                   └── [group: Admin]
    │                       ├── SubsidiaryManager
    │                       ├── UserManager
    │                       ├── ThresholdConfig
    │                       └── AuditLog
```

#### 2.1.2 MAFINDA Folder — Status Aktif/Legacy

```
src/components/MAFINDA/
│
├── [AKTIF] dashboard/          # Dashboard widgets, di-embed di FRSDashboard
│   ├── AssetCompositionChart.tsx
│   ├── CashFlowChart.tsx
│   ├── CompositionPie3D.tsx
│   ├── DepartmentPerformance.tsx
│   ├── EquityLiabilityChart.tsx
│   ├── FinancialSummaryCards.tsx
│   ├── HistoricalDataChart.tsx
│   ├── RevenueCostCards.tsx
│   ├── RevenueTargetChart.tsx
│   └── MAFINDADashboard.tsx    # [LEGACY WRAPPER — tidak digunakan di app aktif]
│
├── [AKTIF] data-entry/
│   ├── DataEntryPage.tsx
│   ├── IncomeStatementForm.tsx
│   ├── BalanceSheetForm.tsx
│   ├── CashFlowStatementForm.tsx
│   └── FinancialHistoryTable.tsx
│
├── [AKTIF] management/
│   ├── ManagementPage.tsx
│   ├── DepartmentManager.tsx
│   ├── ProjectManager.tsx
│   └── TargetManager.tsx
│
├── [AKTIF] crm/
│   ├── CRMPage.tsx
│   ├── CustomerList.tsx
│   ├── CustomerProfileForm.tsx
│   ├── ContactForm.tsx
│   ├── FeasibilityScoreCard.tsx
│   ├── InteractionLogForm.tsx
│   ├── OpportunityCard.tsx
│   ├── OpportunityForm.tsx
│   ├── PipelineFunnelChart.tsx
│   ├── PipelineKanbanBoard.tsx
│   ├── QualificationForm.tsx
│   └── modals/
│       ├── NewOpportunityModal.tsx
│       ├── NewCustomerModal.tsx
│       ├── NewProposalModal.tsx
│       ├── NewContractModal.tsx
│       └── NewReimburseModal.tsx
│
└── [LEGACY — tidak digunakan di app aktif]
    ├── BalanceSheetForm.tsx         # Duplikat dari data-entry/
    ├── IncomeStatementForm.tsx      # Duplikat dari data-entry/
    ├── Dashboard2KeyMetrics.tsx
    ├── Dashboard6FinancialRatios.tsx
    ├── Dashboard8AssetComposition.tsx
    ├── Dashboard9EquityComposition.tsx
    ├── DashboardComponents.tsx
    ├── ExecutiveDashboard.tsx
    ├── CostControlMonitoring.tsx
    └── DivisionProjectManagement.tsx
```

#### 2.1.3 Legacy App Shell Files (tidak digunakan)
```
src/
├── App.tsx                     # [LEGACY] MAFINDA app shell
├── App-MAFINDA.tsx             # [LEGACY]
├── App-MAFINDA-Full.tsx        # [LEGACY]
└── App-MAFINDA-Complete.tsx    # [LEGACY]
```

---

### 2.2 Backend (Server)

```
server.ts (Express entry)
├── Middleware
│   ├── helmet (security headers)
│   ├── express-rate-limit (auth endpoints)
│   ├── express.json()
│   └── CORS
│
├── Database Init (on startup)
│   ├── Core MAFINDA tables (inline dalam server.ts)
│   ├── initCRMSchema() → 001_crm_schema.sql
│   ├── initFinancialRatioSchema() → 002_financial_ratio_schema.sql
│   └── initMafindaDashboardSchema() → 003_mafinda_dashboard_schema.sql
│
├── Route Registration
│   ├── /api/frs/*          → src/routes/financial/index.ts
│   ├── /api/crm/*          → src/routes/crm/
│   ├── /api/management/*   → src/routes/management/
│   ├── /api/dashboard/*    → src/routes/dashboard/
│   └── [inline legacy routes] → /api/companies, /api/users, /api/balance-sheets, dll.
│
└── Vite Dev Server (proxy/middleware di development)
```

#### Middleware Pipeline FRS
```
Request
  └── frsAuth.ts        # Verify JWT, attach user to req
      └── frsRbac.ts    # Check role/permission
          └── Route handler
              └── Zod validation
                  └── Service call → DB query → Response
```

---

### 2.3 Database Schema

#### Core Tables (inline `server.ts`)
```sql
roles (id, name, description, permissions JSON)
users (id, username, password, role_id)
user_company_access (user_id, company_id)
companies (id, name, color, industry, currency, thresholds JSON, ideal_ratios JSON)
divisions (id, company_id, name, type)
projects (id, division_id, name, description)
weekly_cash_flow (id, project_id, period, week, cash_in, cash_out, status)
targets (id, project_id, period, revenue_target, cash_target, status)
balance_sheets (id, company_id, period, [...full balance sheet fields])
income_statements (id, company_id, period, [...full P&L fields])
financial_statements (id, company_id, period, [...KPI aggregates])
parameters (key, value)
```

#### CRM Tables (`001_crm_schema.sql`)
```sql
crm_user_roles (id, user_id, role, subsidiaries JSON)
crm_customers (id, name, industry, tier, parent_customer_id, npwp, ...)
crm_contacts (id, customer_id, name, position, email, phone, ...)
crm_opportunities (id, customer_id, title, stage, probability, value, assigned_to, ...)
crm_interactions (id, opportunity_id, contact_id, type, notes, date, ...)
crm_qualifications (id, opportunity_id, criteria JSON, feasibility_score, status, ...)
```

#### FRS Tables (`002_financial_ratio_schema.sql`)
```sql
subsidiaries (id, name, industry, currency, is_active, created_at)
frs_financial_data (id, subsidiary_id, period, version, [...P&L + BS fields],
                    created_by, created_at, updated_by, updated_at)
frs_calculated_ratios (id, financial_data_id, subsidiary_id, period,
                        roa, roe, npm, der, current_ratio, quick_ratio,
                        cash_ratio, ocf_ratio, dscr, health_score)
frs_thresholds (id, subsidiary_id, ratio_name,
                warning_min, warning_max, critical_min, critical_max)
frs_alerts (id, subsidiary_id, ratio_name, severity, message,
            is_acknowledged, created_at)
frs_audit_log (id, user_id, action, entity, entity_id,
               old_value JSON, new_value JSON, timestamp)
frs_users (id, username, password_hash, role, subsidiary_ids JSON,
           is_active, created_at)
```

#### Financial Management Tables (`003_mafinda_dashboard_schema.sql`)
```sql
mafinda_departments (id, company_id, name, head, budget, created_at)
mafinda_projects (id, department_id, name, start_date, end_date,
                   budget, status, created_at)
mafinda_financial_statements (id, department_id, period,
                                revenue, cost, cash_flow, created_at)
mafinda_targets (id, project_id, period, revenue_target, cost_target, created_at)
```

---

### 2.4 API Endpoint Map

#### FRS (`/api/frs/`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/auth/login` | Public | Login, return JWT |
| POST | `/auth/logout` | JWT | Invalidate token |
| GET | `/auth/me` | JWT | Current user info |
| GET/POST/PUT/DELETE | `/subsidiaries` | JWT | CRUD subsidiary |
| GET/POST | `/financial-data` | JWT | Submit / query financial data |
| POST | `/financial-data/bulk-import` | JWT | Bulk CSV/XLSX import |
| GET | `/ratios` | JWT | Query calculated ratios |
| GET/PUT | `/thresholds` | JWT | Get/update thresholds |
| GET/PUT | `/alerts` | JWT | List alerts / acknowledge |
| GET | `/reports/benchmarking` | JWT | Cross-subsidiary ranking |
| GET | `/reports/consolidated` | JWT | Holding-level rollup |
| GET | `/reports/trend` | JWT | Trend analysis |
| GET | `/reports/export` | JWT | Export CSV/Excel/PDF |
| GET/POST/PUT/DELETE | `/users` | JWT (owner) | User management |
| GET | `/audit-log` | JWT | Audit trail |
| POST | `/backup` | JWT (owner) | DB backup/restore |

#### CRM (`/api/crm/`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET/POST/PUT/DELETE | `/customers` | CRUD customer |
| GET/POST/PUT/DELETE | `/customers/:id/contacts` | CRUD contact per customer |
| GET/POST/PUT/DELETE | `/opportunities` | CRUD opportunity |
| PUT | `/opportunities/:id/stage` | Stage transition (validated) |
| GET/POST | `/interactions` | Log interaction |
| GET/POST/PUT | `/qualifications` | Qualification workflow |

#### Management (`/api/management/`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET/POST/PUT/DELETE | `/departments` | CRUD department |
| GET/POST/PUT/DELETE | `/projects` | CRUD project |
| GET/POST/PUT/DELETE | `/targets` | Financial target setting |
| GET/POST | `/financial-statements` | Income/BS/cashflow CRUD |

#### Dashboard (`/api/dashboard/`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/mafinda` | Aggregated KPIs, cash flow, asset composition |

---

### 2.5 Data Flow: Ratio Calculation

```
User submits financial data
         │
         ▼
FinancialDataForm / BulkImport
         │
         ▼
POST /api/frs/financial-data
         │
         ▼
financialDataService.ts
  ├── Validate input (Zod)
  ├── Store frs_financial_data (versioned, with created_by/created_at)
  │
  ▼
ratioCalculator.ts
  ├── Calculate 9 ratios from P&L + BS
  ├── Calculate health score (weighted average)
  └── Store frs_calculated_ratios
         │
         ▼
alertEngine.ts
  ├── Compare ratios vs frs_thresholds
  ├── Determine severity (Critical/Warning/Info)
  └── Insert frs_alerts (jika threshold dilanggar)
         │
         ▼
Response: calculated ratios + health score
         │
         ▼
FRSDashboard renders:
  ├── RatioCard (×9) dengan color coding
  ├── HealthScoreGauge (0–100)
  └── AlertPanel (jika ada alerts baru)
```

---

### 2.6 Data Flow: CRM Stage Transition

```
User moves opportunity to next stage
         │
         ▼
PUT /api/crm/opportunities/:id/stage
         │
         ▼
pipelineEngine.ts
  ├── Load STAGE_TRANSITION_REQUIREMENTS
  ├── Check requirements for current stage:
  │   ├── Qualification → Tender: qualification approved?
  │   ├── Tender → Proposal: proposal draft exists?
  │   ├── Proposal → Negotiation: proposal submitted?
  │   └── Negotiation → Contract: terms agreed?
  ├── IF requirements not met → 400 Bad Request + detail list
  └── IF met → update stage, update probability (STAGE_PROBABILITY)
         │
         ▼
PipelineKanbanBoard re-renders
  └── OpportunityCard moves to new column
```

---

### 2.7 Authentication Flow

```
POST /api/frs/auth/login { username, password }
         │
         ▼
authService.ts
  ├── Query frs_users by username
  ├── bcrypt.compare(password, password_hash)
  ├── jwt.sign({ userId, role, subsidiaries }, secret, { expiresIn: '30m' })
  └── Return { token, user }
         │
         ▼
Client stores token in memory
         │
         ▼
Subsequent requests: Authorization: Bearer <token>
         │
         ▼
frsAuth.ts middleware
  ├── jwt.verify(token, secret)
  ├── Check token not in invalidation list
  └── Attach user to req.user → frsRbac.ts → handler
```

---

## 3. Decisions Architecture (ADR)

### ADR-001: SQLite sebagai Database
- **Keputusan:** Gunakan SQLite (better-sqlite3)
- **Alasan:** Simplitas deployment (single file), tidak perlu DB server terpisah, cocok untuk MVP
- **Trade-off:** Tidak cocok untuk concurrent writes tinggi, scaling horizontal terbatas

### ADR-002: Single Monolith (Express + Vite)
- **Keputusan:** Backend dan frontend dalam satu repo, Express melayani Vite sebagai middleware
- **Alasan:** Satu `npm run dev` untuk semua; simplitas maintenance
- **Trade-off:** Coupling frontend-backend

### ADR-003: State-based Routing (bukan URL-based)
- **Keputusan:** Navigasi antar halaman menggunakan `useState` (currentPage), bukan React Router
- **Alasan:** Simplitas untuk dashboard-style SPA
- **Trade-off:** URL tidak berubah saat navigasi, deep-link tidak tersedia

### ADR-004: "MAFINDA" sebagai Internal Code Name
- **Keputusan:** Folder/hooks menggunakan nama "MAFINDA" (legacy)
- **Alasan:** Nama ini muncul dari iterasi desain sebelumnya, belum di-rename saat migrasi ke FRSApp
- **Trade-off:** Naming di code berbeda dengan branding user-facing ("CFD")
- **Catatan:** Saat ada refactor, rename folder ke nama yang lebih descriptive (e.g., `financial-management/`)

### ADR-005: JWT tanpa Refresh Token
- **Keputusan:** JWT 30 menit, tidak ada refresh token
- **Alasan:** Simplitas untuk MVP
- **Trade-off:** User harus login ulang setiap 30 menit

---

## 4. Struktur Folder Lengkap (Aktif)

```
root/
├── agents.md
├── index.html
├── package.json
├── tsconfig.json / tsconfig.server.json
├── vite.config.ts / vitest.config.ts
├── server.ts
├── init-and-seed.ts / seed-data.ts / seed-mafinda-demo.ts
│
├── .requirements/
│   └── 20260406_001_initial_requirements/
│       ├── specs.md
│       ├── blueprint.md
│       └── tasks.md
│
├── public/
│
└── src/
    ├── main.tsx                        # Entry point → FRSApp
    ├── types/
    │   ├── financial/                  # FRS types
    │   └── crm.ts
    ├── config/frsConfig.ts
    ├── db/
    │   ├── migrations/
    │   │   ├── 001_crm_schema.sql
    │   │   ├── 002_financial_ratio_schema.sql
    │   │   └── 003_mafinda_dashboard_schema.sql
    │   ├── initCRM.ts
    │   ├── initFinancialRatio.ts
    │   └── initMafindaDashboard.ts
    ├── middleware/
    │   ├── frsAuth.ts
    │   ├── frsRbac.ts
    │   └── crmRbac.ts
    ├── routes/
    │   ├── financial/           # /api/frs/*
    │   ├── crm/                 # /api/crm/*
    │   ├── management/          # /api/management/*
    │   ├── dashboard/           # /api/dashboard/*
    │   └── __tests__/
    ├── services/
    │   ├── financial/           # 17 FRS services
    │   ├── mafinda/             # 5 financial mgmt services
    │   └── crm/                 # pipelineEngine, feasibilityCalculator
    ├── hooks/
    │   ├── financial/
    │   └── mafinda/
    ├── helpers/crmAuditLog.ts
    ├── utils/cn.ts, format.ts
    └── components/
        ├── Tooltip.tsx
        ├── financial/           # FRS components (semua aktif)
        │   ├── FRSApp.tsx
        │   ├── shared/
        │   ├── dashboard/
        │   ├── admin/
        │   ├── data-entry/
        │   └── reports/
        └── MAFINDA/             # Sebagian aktif, sebagian legacy
            ├── dashboard/       # Aktif (kecuali MAFINDADashboard.tsx)
            ├── data-entry/      # Aktif
            ├── management/      # Aktif
            ├── crm/             # Aktif
            └── [root-level *.tsx]  # Legacy — tidak digunakan
```

---

## 1. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (SPA)                        │
│  React 19 + TypeScript + Tailwind CSS + Recharts        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  FRS Module │  │MAFINDA Module│  │  CRM Module   │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬────────┘  │
└─────────┼───────────────┼─────────────────┼────────────┘
          │  HTTP/JSON REST API              │
          ▼                                 ▼
┌─────────────────────────────────────────────────────────┐
│                  Express Server (Node.js)                │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │
│  │/api/frs/*│ │/api/crm/*│ │/api/mgmt/*│ │/api/dash/│  │
│  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └────┬─────┘  │
│       │             │             │             │        │
│  ┌────▼─────────────▼─────────────▼─────────────▼────┐  │
│  │                  Services Layer                   │  │
│  │  ratioCalculator | alertEngine | pipelineEngine   │  │
│  │  authService | exportService | reportGenerator    │  │
│  └────────────────────────┬──────────────────────────┘  │
└───────────────────────────┼─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              SQLite Database (finance.db)                │
│  better-sqlite3 — single-file, embedded                 │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Layer Architecture

### 2.1 Frontend (Client)

```
src/
├── main.tsx                    # Entry point — boot FRSApp atau MAFINDA
├── App.tsx                     # MAFINDA shell (legacy)
├── types.ts                    # MAFINDA legacy types
├── constants.ts                # Shared constants
├── index.css                   # Global CSS (Tailwind base)
│
├── types/
│   ├── financial/              # FRS TypeScript types
│   │   ├── user.ts             # UserRole, FRSUser, JWTPayload
│   │   ├── ratio.ts            # RatioName, CalculatedRatios, BenchmarkData
│   │   ├── financialData.ts    # FinancialData entity
│   │   ├── alert.ts            # Alert, AlertSeverity
│   │   ├── threshold.ts        # Threshold
│   │   └── subsidiary.ts      # Subsidiary entity
│   └── crm.ts                  # CRM types (roles, stages, entities)
│
├── config/
│   └── frsConfig.ts            # FRS constants & config
│
├── hooks/
│   ├── financial/              # FRS React hooks
│   └── mafinda/                # MAFINDA React hooks
│
├── utils/
│   ├── cn.ts                   # clsx + tailwind-merge helper
│   └── format.ts               # Currency & number formatting
│
└── components/
    ├── Tooltip.tsx             # InfoTooltip, LabelWithTooltip
    ├── financial/              # FRS components (lihat 2.1.1)
    └── MAFINDA/                # MAFINDA components (lihat 2.1.2)
```

#### 2.1.1 FRS Component Tree
```
FRSApp.tsx (root)
├── LoginForm (inline)
├── QueryProvider
│   └── ToastProvider
│       └── ErrorBoundary
│           └── DashboardLayout.tsx (sidebar + page shell)
│               ├── FRSDashboard.tsx
│               │   ├── CompanySelector, PeriodSelector
│               │   ├── HealthScoreGauge
│               │   ├── RatioCard (×9)
│               │   ├── AlertPanel
│               │   ├── TrendChart
│               │   └── ComparisonChart
│               ├── FinancialDataForm.tsx
│               ├── BulkImport.tsx
│               ├── DataVersionHistory.tsx
│               ├── BenchmarkingTable.tsx
│               ├── ConsolidatedReport.tsx
│               ├── TrendAnalysis.tsx
│               ├── SubsidiaryManager.tsx
│               ├── UserManager.tsx
│               ├── ThresholdConfig.tsx
│               └── AuditLog.tsx
```

#### 2.1.2 MAFINDA Component Tree
```
App.tsx (MAFINDAApp root)
└── MAFINDADashboard.tsx
    ├── Dashboard (KPIs + Charts)
    │   ├── FinancialSummaryCards
    │   ├── CashFlowChart (W1–W5)
    │   ├── RevenueTargetChart
    │   ├── DepartmentPerformance
    │   ├── HistoricalDataChart
    │   ├── AssetCompositionChart
    │   ├── EquityLiabilityChart
    │   └── CompositionPie3D
    ├── DataEntryPage
    │   ├── IncomeStatementForm
    │   ├── BalanceSheetForm
    │   ├── CashFlowStatementForm
    │   └── FinancialHistoryTable
    ├── ManagementPage
    │   ├── DepartmentManager
    │   ├── ProjectManager
    │   └── TargetManager
    └── CRMPage
        ├── CustomerList + CustomerProfileForm
        ├── PipelineKanbanBoard
        ├── PipelineFunnelChart
        ├── OpportunityCard + OpportunityForm
        ├── QualificationForm
        ├── InteractionLogForm
        └── FeasibilityScoreCard
```

---

### 2.2 Backend (Server)

```
server.ts (Express entry)
├── Middleware
│   ├── helmet (security headers)
│   ├── express-rate-limit (auth endpoints)
│   ├── express.json()
│   └── CORS
│
├── Database Init (on startup)
│   ├── MAFINDA core tables (inline)
│   ├── 001_crm_schema.sql
│   ├── 002_financial_ratio_schema.sql
│   └── 003_mafinda_dashboard_schema.sql
│
├── Route Registration
│   ├── /api/frs/*          → src/routes/financial/index.ts
│   ├── /api/crm/*          → src/routes/crm/
│   ├── /api/management/*   → src/routes/management/
│   ├── /api/dashboard/*    → src/routes/dashboard/
│   └── [inline routes]     → MAFINDA legacy endpoints
│
└── Vite Dev Server (proxy/middleware di development)
```

#### Middleware Pipeline FRS (`src/middleware/`)
```
Request
  └── frsAuth.ts        # Verify JWT, attach user to req
      └── frsRbac.ts    # Check role/permission
          └── Route handler
              └── Zod validation
                  └── Service call
                      └── DB query
                          └── Response
```

---

### 2.3 Database Schema

#### Legacy MAFINDA Tables (di `server.ts`)
```sql
roles (id, name, description, permissions JSON)
users (id, username, password, role_id, company_ids JSON)
user_company_access (user_id, company_id)
companies (id, name, color, industry, currency, thresholds JSON, ideal_ratios JSON)
divisions (id, company_id, name, type)
projects (id, division_id, name, description)
weekly_cash_flow (id, project_id, period, week, cash_in, cash_out, status, notes)
targets (id, project_id, period, revenue_target, cash_target, status)
balance_sheets (id, company_id, period, [full balance sheet fields])
income_statements (id, company_id, period, [full P&L fields])
financial_statements (id, company_id, period, [KPI aggregates])
parameters (key, value)
```

#### CRM Tables (`001_crm_schema.sql`)
```sql
crm_user_roles (id, user_id, role, subsidiaries JSON)
crm_customers (id, name, industry, tier, parent_customer_id, ...)
crm_contacts (id, customer_id, name, position, email, phone, ...)
crm_opportunities (id, customer_id, title, stage, probability, value, ...)
crm_interactions (id, opportunity_id, contact_id, type, notes, date, ...)
crm_qualifications (id, opportunity_id, criteria JSON, status, ...)
```

#### FRS Tables (`002_financial_ratio_schema.sql`)
```sql
subsidiaries (id, name, industry, currency, is_active, created_at)
frs_financial_data (id, subsidiary_id, period, version, [P&L + BS fields], created_by, created_at)
frs_calculated_ratios (id, financial_data_id, subsidiary_id, period, [9 ratios], health_score)
frs_thresholds (id, subsidiary_id, ratio_name, warning_min, warning_max, critical_min, critical_max)
frs_alerts (id, subsidiary_id, ratio_name, severity, message, is_acknowledged, created_at)
frs_audit_log (id, user_id, action, entity, entity_id, old_value JSON, new_value JSON, timestamp)
frs_users (id, username, password_hash, role, subsidiary_ids JSON, is_active, created_at)
```

#### MAFINDA Dashboard Tables (`003_mafinda_dashboard_schema.sql`)
```sql
mafinda_departments (id, company_id, name, head, budget, created_at)
mafinda_projects (id, department_id, name, start_date, end_date, budget, status, created_at)
mafinda_financial_statements (id, department_id, period, revenue, cost, cash_flow, created_at)
mafinda_targets (id, project_id, period, revenue_target, cost_target, created_at)
```

---

### 2.4 API Endpoint Map

#### FRS (`/api/frs/`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/auth/login` | Public | Login, return JWT |
| POST | `/auth/logout` | JWT | Invalidate token |
| GET | `/auth/me` | JWT | Current user info |
| GET/POST/PUT/DELETE | `/subsidiaries` | JWT | CRUD subsidiary |
| GET/POST | `/financial-data` | JWT | Submit / query financial data |
| GET/POST | `/financial-data/bulk-import` | JWT | Bulk CSV/XLSX import |
| GET | `/ratios` | JWT | Query calculated ratios |
| GET/PUT | `/thresholds` | JWT | Get/update thresholds |
| GET/PUT | `/alerts` | JWT | List alerts / acknowledge |
| GET | `/reports/benchmarking` | JWT | Cross-subsidiary ranking |
| GET | `/reports/consolidated` | JWT | Holding-level rollup |
| GET | `/reports/trend` | JWT | Trend analysis |
| GET | `/reports/export` | JWT | Export CSV/Excel/PDF |
| GET/POST/PUT/DELETE | `/users` | JWT (owner) | User management |
| GET | `/audit-log` | JWT | Audit trail |
| POST | `/backup` | JWT (owner) | DB backup/restore |

#### CRM (`/api/crm/`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET/POST/PUT/DELETE | `/customers` | CRUD customer |
| GET/POST/PUT/DELETE | `/customers/:id/contacts` | CRUD contact |
| GET/POST/PUT/DELETE | `/opportunities` | CRUD opportunity |
| PUT | `/opportunities/:id/stage` | Stage transition (validated) |
| GET/POST | `/interactions` | Log interaction |
| GET/POST/PUT | `/qualifications` | Qualification workflow |

#### Management (`/api/management/`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET/POST/PUT/DELETE | `/departments` | CRUD department |
| GET/POST/PUT/DELETE | `/projects` | CRUD project |
| GET/POST/PUT/DELETE | `/targets` | Target setting |
| GET/POST | `/financial-statements` | Financial statement CRUD |

#### Dashboard (`/api/dashboard/`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/mafinda` | Aggregated KPIs, cash flow, composition |

---

### 2.5 Data Flow: Ratio Calculation

```
User submits financial data
         │
         ▼
FinancialDataForm / BulkImport
         │
         ▼
POST /api/frs/financial-data
         │
         ▼
financialDataService.ts
  ├── Validate input (Zod)
  ├── Store frs_financial_data (versioned)
  │
  ▼
ratioCalculator.ts
  ├── Calculate 9 ratios from P&L + BS
  ├── Calculate health score (weighted average)
  └── Store frs_calculated_ratios
         │
         ▼
alertEngine.ts
  ├── Compare ratios vs frs_thresholds
  ├── Determine severity (Critical/Warning/Info)
  └── Insert frs_alerts (jika threshold dilanggar)
         │
         ▼
Response: calculated ratios + health score
         │
         ▼
Dashboard renders:
  ├── RatioCard (×9)
  ├── HealthScoreGauge
  └── AlertPanel (jika ada alerts baru)
```

---

### 2.6 Data Flow: CRM Pipeline Transition

```
Sales user moves opportunity to next stage
         │
         ▼
PUT /api/crm/opportunities/:id/stage
         │
         ▼
pipelineEngine.ts
  ├── Check STAGE_TRANSITION_REQUIREMENTS
  │   ├── Qualification complete? (Qualification → Tender)
  │   ├── Proposal submitted? (Tender → Proposal)
  │   └── ... (enforced per stage)
  ├── IF requirements not met → 400 Bad Request
  └── IF requirements met → update stage + probability
         │
         ▼
PipelineKanbanBoard re-renders
  └── OpportunityCard moves to new column
```

---

### 2.7 Authentication Flow

```
POST /api/frs/auth/login
  { username, password }
         │
         ▼
authService.ts
  ├── Query frs_users by username
  ├── bcrypt.compare(password, password_hash)
  ├── IF match → jwt.sign({ userId, role, subsidiaries }, secret, { expiresIn: '30m' })
  └── Return { token, user }
         │
         ▼
Client stores token (memory / localStorage)
         │
         ▼
Subsequent requests: Authorization: Bearer <token>
         │
         ▼
frsAuth.ts middleware
  ├── jwt.verify(token, secret)
  ├── Check token not in invalidation list
  └── Attach user to req.user
         │
         ▼
frsRbac.ts middleware
  └── Check req.user.role has required permission
```

---

## 3. Keputusan Desain (Architecture Decision Records)

### ADR-001: SQLite sebagai Database
**Keputusan:** Menggunakan SQLite (better-sqlite3) sebagai database  
**Alasan:** Simplistas deployment (satu file), tidak perlu setup database server terpisah, cocok untuk MVP/mockup  
**Trade-off:** Tidak mendukung concurrent writes yang tinggi, tidak ideal untuk scaling horizontal  
**Status:** Accepted (untuk saat ini)

### ADR-002: Monolith (Express + Vite)
**Keputusan:** Backend dan frontend dalam satu repository, Express melayani Vite sebagai middleware  
**Alasan:** Simplitas development, satu `npm run dev` untuk menjalankan semua  
**Trade-off:** Coupling antara frontend dan backend  
**Status:** Accepted

### ADR-003: Dua Modul Terpisah (FRS & MAFINDA)
**Keputusan:** FRS dan MAFINDA diimplementasikan sebagai modul terpisah, switch via `main.tsx`  
**Alasan:** Kedua modul berkembang secara independen, menghindari coupling  
**Trade-off:** User tidak bisa menggunakan keduanya sekaligus dalam satu sesi  
**Status:** Accepted (sementara, mungkin akan diintegrasikan)

### ADR-004: JWT tanpa Refresh Token
**Keputusan:** JWT dengan expiry 30 menit, tidak ada refresh token  
**Alasan:** Simplitas untuk MVP  
**Trade-off:** User harus login ulang setiap 30 menit  
**Status:** Accepted (perlu ditingkatkan untuk production)

---

## 4. Struktur Folder Lengkap

```
root/
├── agents.md                           # AI agent instructions
├── index.html                          # HTML entry point
├── package.json                        # Dependencies & scripts
├── tsconfig.json                       # TypeScript config (frontend)
├── tsconfig.server.json                # TypeScript config (server)
├── vite.config.ts                      # Vite config
├── vitest.config.ts                    # Vitest config
├── server.ts                           # Express server
├── init-and-seed.ts                    # DB init + demo seed
├── seed-data.ts                        # MAFINDA seed data
├── seed-mafinda-demo.ts                # MAFINDA demo seeder
│
├── .requirements/
│   └── 20260406_001_initial_requirements/
│       ├── specs.md                    # ini
│       ├── blueprint.md                # ini
│       └── tasks.md                    # (belum dibuat)
│
├── docs/                               # (akan dibuat)
│
├── public/                             # Static assets
│
└── src/
    ├── App.tsx                         # MAFINDA app shell (legacy)
    ├── App-MAFINDA*.tsx                # MAFINDA app variants
    ├── main.tsx                        # React entry point
    ├── types.ts                        # MAFINDA legacy types
    ├── constants.ts
    ├── index.css
    ├── tooltips.ts
    │
    ├── types/
    │   ├── financial/
    │   │   ├── user.ts
    │   │   ├── ratio.ts
    │   │   ├── financialData.ts
    │   │   ├── alert.ts
    │   │   ├── threshold.ts
    │   │   └── subsidiary.ts
    │   └── crm.ts
    │
    ├── config/
    │   └── frsConfig.ts
    │
    ├── db/
    │   ├── migrations/
    │   │   ├── 001_crm_schema.sql
    │   │   ├── 002_financial_ratio_schema.sql
    │   │   └── 003_mafinda_dashboard_schema.sql
    │   ├── initCRM.ts
    │   ├── initFinancialRatio.ts
    │   └── initMafindaDashboard.ts
    │
    ├── middleware/
    │   ├── frsAuth.ts
    │   ├── frsRbac.ts
    │   └── crmRbac.ts
    │
    ├── routes/
    │   ├── financial/
    │   │   ├── index.ts
    │   │   ├── auth.ts
    │   │   ├── subsidiaries.ts
    │   │   ├── financialData.ts
    │   │   ├── ratios.ts
    │   │   ├── thresholds.ts
    │   │   ├── alerts.ts
    │   │   ├── reports.ts
    │   │   ├── users.ts
    │   │   ├── auditLog.ts
    │   │   └── backup.ts
    │   ├── crm/
    │   │   ├── customers.ts
    │   │   ├── interactions.ts
    │   │   ├── opportunities.ts
    │   │   └── qualifications.ts
    │   ├── management/
    │   │   ├── departments.ts
    │   │   ├── projects.ts
    │   │   ├── targets.ts
    │   │   └── financialStatements.ts
    │   ├── dashboard/
    │   │   └── mafindaDashboard.ts
    │   └── __tests__/
    │
    ├── services/
    │   ├── financial/
    │   │   ├── authService.ts
    │   │   ├── ratioCalculator.ts
    │   │   ├── alertEngine.ts
    │   │   ├── thresholdService.ts
    │   │   ├── financialDataService.ts
    │   │   ├── subsidiaryService.ts
    │   │   ├── userService.ts
    │   │   ├── bulkImportService.ts
    │   │   ├── exportService.ts
    │   │   ├── reportGenerator.ts
    │   │   ├── trendAnalyzer.ts
    │   │   ├── benchmarkingService.ts
    │   │   ├── archivalService.ts
    │   │   ├── backupService.ts
    │   │   ├── scheduledReportService.ts
    │   │   ├── auditLogService.ts
    │   │   ├── dataValidator.ts
    │   │   └── apiFetch.ts
    │   ├── mafinda/
    │   │   ├── dashboardService.ts
    │   │   ├── departmentService.ts
    │   │   ├── projectService.ts
    │   │   ├── targetService.ts
    │   │   └── financialStatementService.ts
    │   └── crm/
    │       ├── pipelineEngine.ts
    │       └── feasibilityCalculator.ts
    │
    ├── hooks/
    │   ├── financial/
    │   └── mafinda/
    │
    ├── helpers/
    │   └── crmAuditLog.ts
    │
    ├── utils/
    │   ├── cn.ts
    │   └── format.ts
    │
    └── components/
        ├── Tooltip.tsx
        ├── financial/
        │   ├── FRSApp.tsx
        │   ├── shared/
        │   │   ├── ProtectedRoute.tsx
        │   │   ├── QueryProvider.tsx
        │   │   ├── ErrorBoundary.tsx
        │   │   └── Toast.tsx
        │   ├── dashboard/
        │   │   ├── DashboardLayout.tsx
        │   │   ├── FRSDashboard.tsx
        │   │   ├── RatioCard.tsx
        │   │   ├── HealthScoreGauge.tsx
        │   │   ├── AlertPanel.tsx
        │   │   ├── TrendChart.tsx
        │   │   ├── ComparisonChart.tsx
        │   │   ├── CompanySelector.tsx
        │   │   └── PeriodSelector.tsx
        │   ├── admin/
        │   │   ├── SubsidiaryManager.tsx
        │   │   ├── UserManager.tsx
        │   │   ├── ThresholdConfig.tsx
        │   │   └── AuditLog.tsx
        │   ├── data-entry/
        │   │   ├── FinancialDataForm.tsx
        │   │   ├── BulkImport.tsx
        │   │   └── DataVersionHistory.tsx
        │   └── reports/
        │       ├── BenchmarkingTable.tsx
        │       ├── ConsolidatedReport.tsx
        │       ├── TrendAnalysis.tsx
        │       └── ExportButton.tsx
        └── MAFINDA/
            ├── dashboard/
            ├── data-entry/
            ├── management/
            └── crm/
```
