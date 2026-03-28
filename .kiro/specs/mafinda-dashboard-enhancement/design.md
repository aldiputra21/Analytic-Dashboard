# Dokumen Desain: MAFINDA Dashboard Enhancement

## Ikhtisar

Fitur ini memperluas aplikasi MAFINDA dengan menambahkan dashboard keuangan yang komprehensif, manajemen departemen/proyek/target, dan modul input data laporan keuangan. Implementasi mengikuti arsitektur yang sudah ada: React + TypeScript (frontend), Express.js (backend), SQLite (database).

Fitur baru diintegrasikan ke dalam aplikasi MAFINDA yang sudah ada dengan menambahkan:
- Tabel database baru untuk departemen, proyek, target, dan laporan keuangan
- API endpoints baru di `src/routes/dashboard/` dan `src/routes/management/`
- Komponen React baru di `src/components/MAFINDA/dashboard/` dan `src/components/MAFINDA/management/`

---

## Arsitektur

```mermaid
graph TB
    subgraph Frontend ["Frontend (React + TypeScript)"]
        A[MAFINDAApp.tsx] --> B[DashboardPage]
        A --> C[ManagementPage]
        A --> D[DataEntryPage]
        
        B --> B1[RevenueTargetChart]
        B --> B2[RevenueCostCards]
        B --> B3[CashFlowChart]
        B --> B4[AssetCompositionChart]
        B --> B5[EquityLiabilityChart]
        B --> B6[HistoricalDataChart]
        
        C --> C1[DepartmentManager]
        C --> C2[ProjectManager]
        C --> C3[TargetManager]
        
        D --> D1[BalanceSheetForm]
        D --> D2[IncomeStatementForm]
        D --> D3[CashFlowForm]
        D --> D4[FinancialHistoryTable]
    end

    subgraph Backend ["Backend (Express.js)"]
        E[/api/dashboard/*] --> F[dashboardService]
        G[/api/departments/*] --> H[departmentService]
        I[/api/projects/*] --> J[projectService]
        K[/api/targets/*] --> L[targetService]
        M[/api/financial-statements/*] --> N[financialStatementService]
    end

    subgraph Database ["Database (SQLite)"]
        O[(mafinda_departments)]
        P[(mafinda_projects)]
        Q[(mafinda_targets)]
        R[(mafinda_balance_sheets)]
        S[(mafinda_income_statements)]
        T[(mafinda_cash_flows)]
    end

    Frontend --> Backend
    Backend --> Database
```

---

## Komponen dan Antarmuka

### Komponen Frontend

#### 1. `DashboardPage.tsx`
Halaman utama dashboard yang mengorkestrasikan semua widget visualisasi.

```typescript
interface DashboardPageProps {
  companyId: string;
}

interface DashboardFilters {
  period: string;          // format: "YYYY-MM"
  periodType: 'monthly' | 'quarterly' | 'annual';
  departmentId?: string;
  projectId?: string;
  historicalMonths: 3 | 6 | 12 | 24;
}
```

#### 2. `RevenueTargetChart.tsx`
Grafik batang target vs realisasi revenue per departemen.

```typescript
interface RevenueTargetData {
  departmentId: string;
  departmentName: string;
  target: number;
  realization: number;
  achievementRate: number;  // (realization / target) * 100
}

interface RevenueTargetChartProps {
  data: RevenueTargetData[];
  period: string;
  isLoading: boolean;
}
```

#### 3. `RevenueCostCards.tsx`
Card ringkasan revenue dan biaya operasional dengan filter departemen.

```typescript
interface RevenueCostSummary {
  revenue: number;
  revenueChange: number;       // persentase perubahan vs periode sebelumnya
  operationalCost: number;
  operationalCostChange: number;
  departmentId?: string;
  departmentName?: string;
  period: string;
}
```

#### 4. `CashFlowChart.tsx`
Grafik area arus kas dengan filter departemen dan proyek.

```typescript
interface CashFlowDataPoint {
  period: string;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
}

interface CashFlowChartProps {
  data: CashFlowDataPoint[];
  departmentId?: string;
  projectId?: string;
  isLoading: boolean;
}
```

#### 5. `AssetCompositionChart.tsx`
Grafik donut komposisi aset.

```typescript
interface AssetComposition {
  currentAssets: number;
  fixedAssets: number;
  otherAssets: number;
  totalAssets: number;
  period: string;
}
```

#### 6. `EquityLiabilityChart.tsx`
Grafik donut komposisi ekuitas dan liabilitas.

```typescript
interface EquityLiabilityComposition {
  paidInCapital: number;
  retainedEarnings: number;
  otherEquity: number;
  shortTermLiabilities: number;
  longTermLiabilities: number;
  totalEquity: number;
  totalLiabilities: number;
  period: string;
}
```

#### 7. `HistoricalDataChart.tsx`
Grafik tren data keuangan historis multi-metrik.

```typescript
interface HistoricalDataPoint {
  period: string;
  revenue: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
}
```

#### 8. `DepartmentManager.tsx`
Form CRUD untuk manajemen departemen.

```typescript
interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 9. `ProjectManager.tsx`
Form CRUD untuk manajemen proyek.

```typescript
interface Project {
  id: string;
  departmentId: string;
  departmentName: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}
```

#### 10. `TargetManager.tsx`
Form untuk menetapkan target keuangan per departemen/proyek.

```typescript
interface FinancialTarget {
  id: string;
  entityType: 'department' | 'project';
  entityId: string;
  entityName: string;
  period: string;           // format: "YYYY-MM"
  periodType: 'monthly' | 'quarterly' | 'annual';
  revenueTarget: number;
  operationalCostTarget: number;
  createdAt: string;
}
```

#### 11. `BalanceSheetForm.tsx`
Form input data neraca.

```typescript
interface BalanceSheetInput {
  period: string;
  currentAssets: number;
  fixedAssets: number;
  otherAssets: number;
  shortTermLiabilities: number;
  longTermLiabilities: number;
  paidInCapital: number;
  retainedEarnings: number;
  otherEquity: number;
}
```

#### 12. `IncomeStatementForm.tsx`
Form input data laba rugi.

```typescript
interface IncomeStatementInput {
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  operationalExpenses: number;
  interestExpense: number;
  tax: number;
  netProfit: number;
}
```

#### 13. `CashFlowStatementForm.tsx`
Form input data arus kas.

```typescript
interface CashFlowStatementInput {
  period: string;
  departmentId?: string;
  projectId?: string;
  operatingCashIn: number;
  operatingCashOut: number;
  investingCashIn: number;
  investingCashOut: number;
  financingCashIn: number;
  financingCashOut: number;
}
```

### Custom Hooks

```typescript
// src/hooks/mafinda/useDashboard.ts
function useDashboard(filters: DashboardFilters): {
  revenueTargetData: RevenueTargetData[];
  revenueCostSummary: RevenueCostSummary;
  cashFlowData: CashFlowDataPoint[];
  assetComposition: AssetComposition;
  equityLiabilityComposition: EquityLiabilityComposition;
  historicalData: HistoricalDataPoint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// src/hooks/mafinda/useManagement.ts
function useManagement(): {
  departments: Department[];
  projects: Project[];
  targets: FinancialTarget[];
  createDepartment: (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDepartment: (id: string, data: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  createProject: (data: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  upsertTarget: (data: Omit<FinancialTarget, 'id' | 'createdAt'>) => Promise<void>;
}
```

---

## Model Data (Skema Database)

### Tabel Baru: `mafinda_departments`

```sql
CREATE TABLE IF NOT EXISTS mafinda_departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Tabel Baru: `mafinda_projects`

```sql
CREATE TABLE IF NOT EXISTS mafinda_projects (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES mafinda_departments(id),
  UNIQUE(department_id, name)
);

CREATE INDEX IF NOT EXISTS idx_mafinda_projects_dept ON mafinda_projects(department_id);
```

### Tabel Baru: `mafinda_targets`

```sql
CREATE TABLE IF NOT EXISTS mafinda_targets (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('department', 'project')),
  entity_id TEXT NOT NULL,
  period TEXT NOT NULL,           -- format: "YYYY-MM"
  period_type TEXT NOT NULL CHECK(period_type IN ('monthly', 'quarterly', 'annual')),
  revenue_target REAL NOT NULL DEFAULT 0,
  operational_cost_target REAL NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id, period, period_type)
);

CREATE INDEX IF NOT EXISTS idx_mafinda_targets_entity ON mafinda_targets(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_mafinda_targets_period ON mafinda_targets(period);
```

### Tabel Baru: `mafinda_balance_sheets`

```sql
CREATE TABLE IF NOT EXISTS mafinda_balance_sheets (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL UNIQUE,    -- format: "YYYY-MM"
  current_assets REAL NOT NULL DEFAULT 0,
  fixed_assets REAL NOT NULL DEFAULT 0,
  other_assets REAL NOT NULL DEFAULT 0,
  short_term_liabilities REAL NOT NULL DEFAULT 0,
  long_term_liabilities REAL NOT NULL DEFAULT 0,
  paid_in_capital REAL NOT NULL DEFAULT 0,
  retained_earnings REAL NOT NULL DEFAULT 0,
  other_equity REAL NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Tabel Baru: `mafinda_income_statements`

```sql
CREATE TABLE IF NOT EXISTS mafinda_income_statements (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL UNIQUE,    -- format: "YYYY-MM"
  revenue REAL NOT NULL DEFAULT 0,
  cost_of_goods_sold REAL NOT NULL DEFAULT 0,
  operational_expenses REAL NOT NULL DEFAULT 0,
  interest_expense REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  net_profit REAL NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Tabel Baru: `mafinda_cash_flows`

```sql
CREATE TABLE IF NOT EXISTS mafinda_cash_flows (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,           -- format: "YYYY-MM"
  department_id TEXT,
  project_id TEXT,
  operating_cash_in REAL NOT NULL DEFAULT 0,
  operating_cash_out REAL NOT NULL DEFAULT 0,
  investing_cash_in REAL NOT NULL DEFAULT 0,
  investing_cash_out REAL NOT NULL DEFAULT 0,
  financing_cash_in REAL NOT NULL DEFAULT 0,
  financing_cash_out REAL NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES mafinda_departments(id),
  FOREIGN KEY (project_id) REFERENCES mafinda_projects(id),
  UNIQUE(period, department_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_mafinda_cash_flows_period ON mafinda_cash_flows(period);
CREATE INDEX IF NOT EXISTS idx_mafinda_cash_flows_dept ON mafinda_cash_flows(department_id);
CREATE INDEX IF NOT EXISTS idx_mafinda_cash_flows_project ON mafinda_cash_flows(project_id);
```

### Tabel Baru: `mafinda_revenue_realizations`

```sql
CREATE TABLE IF NOT EXISTS mafinda_revenue_realizations (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('department', 'project')),
  entity_id TEXT NOT NULL,
  period TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK(period_type IN ('monthly', 'quarterly', 'annual')),
  revenue REAL NOT NULL DEFAULT 0,
  operational_cost REAL NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id, period, period_type)
);

CREATE INDEX IF NOT EXISTS idx_mafinda_realizations_entity ON mafinda_revenue_realizations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_mafinda_realizations_period ON mafinda_revenue_realizations(period);
```

---

## API Endpoints

### Dashboard Endpoints (`src/routes/dashboard/mafinda.ts`)

| Method | Endpoint | Deskripsi | Query Params |
|--------|----------|-----------|--------------|
| GET | `/api/dashboard/dept-revenue-target` | Target vs realisasi per departemen | `period`, `periodType` |
| GET | `/api/dashboard/revenue-cost-summary` | Ringkasan revenue & biaya | `period`, `departmentId?` |
| GET | `/api/dashboard/cash-flow` | Data arus kas | `period`, `months?`, `departmentId?`, `projectId?` |
| GET | `/api/dashboard/asset-composition` | Komposisi aset | `period` |
| GET | `/api/dashboard/equity-liability-composition` | Komposisi ekuitas & liabilitas | `period` |
| GET | `/api/dashboard/historical-data` | Data historis | `months` |

### Management Endpoints

**Departemen** (`src/routes/management/departments.ts`):
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/departments` | Daftar semua departemen |
| POST | `/api/departments` | Buat departemen baru |
| PUT | `/api/departments/:id` | Update departemen |
| DELETE | `/api/departments/:id` | Hapus departemen |

**Proyek** (`src/routes/management/projects.ts`):
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/projects` | Daftar proyek (filter: `departmentId?`) |
| POST | `/api/projects` | Buat proyek baru |
| PUT | `/api/projects/:id` | Update proyek |
| DELETE | `/api/projects/:id` | Hapus proyek |

**Target** (`src/routes/management/targets.ts`):
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/targets` | Daftar target (filter: `entityType?`, `entityId?`, `period?`) |
| POST | `/api/targets` | Buat/update target (upsert) |
| DELETE | `/api/targets/:id` | Hapus target |

### Financial Statement Endpoints (`src/routes/management/financialStatements.ts`)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/financial-statements/balance-sheet` | Daftar neraca (filter: `period?`) |
| POST | `/api/financial-statements/balance-sheet` | Input data neraca |
| GET | `/api/financial-statements/income-statement` | Daftar laba rugi (filter: `period?`) |
| POST | `/api/financial-statements/income-statement` | Input data laba rugi |
| GET | `/api/financial-statements/cash-flow` | Daftar arus kas (filter: `period?`, `departmentId?`) |
| POST | `/api/financial-statements/cash-flow` | Input data arus kas |

### Contoh Response

**GET /api/dashboard/dept-revenue-target?period=2025-01&periodType=monthly**
```json
{
  "period": "2025-01",
  "periodType": "monthly",
  "departments": [
    {
      "departmentId": "dept-001",
      "departmentName": "ONM",
      "target": 5000000000,
      "realization": 4750000000,
      "achievementRate": 95.0
    }
  ]
}
```

**GET /api/dashboard/cash-flow?period=2025-01&months=6**
```json
{
  "data": [
    {
      "period": "2024-08",
      "cashIn": 3200000000,
      "cashOut": 2800000000,
      "netCashFlow": 400000000
    }
  ]
}
```

---

## Properti Kebenaran (Correctness Properties)

*Properti adalah karakteristik atau perilaku yang harus berlaku di semua eksekusi valid sistem — pada dasarnya, pernyataan formal tentang apa yang harus dilakukan sistem. Properti berfungsi sebagai jembatan antara spesifikasi yang dapat dibaca manusia dan jaminan kebenaran yang dapat diverifikasi mesin.*

### Property 1: Konsistensi Achievement Rate

*Untuk setiap* data departemen dengan target > 0, nilai `achievementRate` yang dikembalikan API harus sama dengan `(realization / target) * 100` yang dihitung secara independen.

**Validates: Requirements 1.3**

---

### Property 2: Filter Departemen Menghasilkan Subset

*Untuk setiap* query dengan filter `departmentId`, total revenue yang dikembalikan harus lebih kecil atau sama dengan total revenue tanpa filter (All departments).

**Validates: Requirements 2.3, 2.4**

---

### Property 3: Net Cash Flow Konsisten

*Untuk setiap* data cash flow, nilai `netCashFlow` harus selalu sama dengan `cashIn - cashOut`.

**Validates: Requirements 3.4**

---

### Property 4: Komposisi Aset Menjumlah ke Total

*Untuk setiap* data komposisi aset, jumlah `currentAssets + fixedAssets + otherAssets` harus sama dengan `totalAssets`.

**Validates: Requirements 4.1, 4.4**

---

### Property 5: Komposisi Ekuitas & Liabilitas Menjumlah ke Total Pasiva

*Untuk setiap* data komposisi ekuitas & liabilitas, jumlah `totalEquity + totalLiabilities` harus sama dengan `totalAssets` (dari neraca periode yang sama).

**Validates: Requirements 5.1, 5.4**

---

### Property 6: Round-Trip Serialisasi Data Keuangan

*Untuk setiap* objek data laporan keuangan yang valid, menyimpan ke database kemudian membaca kembali harus menghasilkan objek yang ekuivalen (semua field numerik sama dalam toleransi floating point).

**Validates: Requirements 8.7, 8.8, 8.9, 8.10**

---

### Property 7: Unikuitas Target per Entitas-Periode

*Untuk setiap* kombinasi (entityType, entityId, period, periodType), hanya boleh ada satu record target dalam database. Operasi upsert harus memperbarui record yang ada, bukan membuat duplikat.

**Validates: Requirements 7.3, 7.4**

---

### Property 8: Validasi Input Non-Negatif

*Untuk setiap* field keuangan yang tidak boleh negatif (revenue, assets, liabilities, capital), API harus menolak nilai negatif dengan kode error 400.

**Validates: Requirements 8.6**

---

### Property 9: Konflik Nama Departemen

*Untuk setiap* upaya membuat departemen dengan nama yang sudah ada, API harus mengembalikan kode 409 tanpa membuat record baru.

**Validates: Requirements 7.9**

---

### Property 10: Konflik Nama Proyek dalam Departemen

*Untuk setiap* upaya membuat proyek dengan nama yang sudah ada dalam departemen yang sama, API harus mengembalikan kode 409 tanpa membuat record baru.

**Validates: Requirements 7.10**

---

## Penanganan Error

### Kode Error Standar

| Kode | Kondisi | Respons |
|------|---------|---------|
| 400 | Input tidak valid (field wajib kosong, nilai negatif) | `{ error: "Pesan validasi spesifik" }` |
| 404 | Resource tidak ditemukan | `{ error: "Resource tidak ditemukan" }` |
| 409 | Konflik data (nama duplikat) | `{ error: "Nama sudah digunakan" }` |
| 500 | Error internal server | `{ error: "Terjadi kesalahan server" }` |

### Strategi Penanganan Error Frontend

- Semua API call dibungkus dalam try-catch
- Error ditampilkan menggunakan komponen Toast yang sudah ada (`src/components/financial/shared/Toast.tsx`)
- Loading state ditampilkan selama fetch data
- Fallback ke nilai nol jika data tidak tersedia, dengan pesan informatif

---

## Strategi Pengujian

### Pendekatan Dual Testing

Pengujian menggunakan dua pendekatan yang saling melengkapi:

1. **Unit Tests**: Memverifikasi contoh spesifik, edge case, dan kondisi error
2. **Property-Based Tests**: Memverifikasi properti universal di semua input menggunakan library `fast-check`

### Unit Tests

Fokus pada:
- Validasi kalkulasi achievement rate dengan nilai spesifik
- Validasi form input (field wajib, format angka)
- Penanganan error API (404, 409, 400)
- Edge case: nilai nol, departemen tanpa proyek, periode tanpa data

### Property-Based Tests

Menggunakan `fast-check` (sudah digunakan di codebase: `src/services/financial/__tests__/pbt.properties.test.ts`).

Konfigurasi: minimum 100 iterasi per property test.

Tag format: **Feature: mafinda-dashboard-enhancement, Property {N}: {deskripsi}**

**Implementasi Property Tests:**

```typescript
// Property 1: Achievement Rate Consistency
// Feature: mafinda-dashboard-enhancement, Property 1: achievement rate consistency
fc.assert(fc.property(
  fc.record({ target: fc.float({ min: 1 }), realization: fc.float({ min: 0 }) }),
  ({ target, realization }) => {
    const result = calculateAchievementRate(target, realization);
    return Math.abs(result - (realization / target) * 100) < 0.001;
  }
), { numRuns: 100 });

// Property 3: Net Cash Flow Consistency
// Feature: mafinda-dashboard-enhancement, Property 3: net cash flow consistency
fc.assert(fc.property(
  fc.record({ cashIn: fc.float({ min: 0 }), cashOut: fc.float({ min: 0 }) }),
  ({ cashIn, cashOut }) => {
    const result = calculateNetCashFlow(cashIn, cashOut);
    return Math.abs(result - (cashIn - cashOut)) < 0.001;
  }
), { numRuns: 100 });

// Property 4: Asset Composition Sum
// Feature: mafinda-dashboard-enhancement, Property 4: asset composition sum
fc.assert(fc.property(
  fc.record({
    currentAssets: fc.float({ min: 0 }),
    fixedAssets: fc.float({ min: 0 }),
    otherAssets: fc.float({ min: 0 })
  }),
  ({ currentAssets, fixedAssets, otherAssets }) => {
    const composition = buildAssetComposition(currentAssets, fixedAssets, otherAssets);
    return Math.abs(composition.totalAssets - (currentAssets + fixedAssets + otherAssets)) < 0.001;
  }
), { numRuns: 100 });
```

### Cakupan Pengujian

| Komponen | Unit Test | Property Test |
|----------|-----------|---------------|
| `calculateAchievementRate` | ✓ | ✓ (Property 1) |
| `calculateNetCashFlow` | ✓ | ✓ (Property 3) |
| `buildAssetComposition` | ✓ | ✓ (Property 4) |
| `buildEquityLiabilityComposition` | ✓ | ✓ (Property 5) |
| API POST /balance-sheet | ✓ | ✓ (Property 6) |
| API POST /departments (conflict) | ✓ | ✓ (Property 9) |
| API POST /projects (conflict) | ✓ | ✓ (Property 10) |
| Filter departemen | ✓ | ✓ (Property 2) |
| Upsert target | ✓ | ✓ (Property 7) |
| Validasi input negatif | ✓ | ✓ (Property 8) |
