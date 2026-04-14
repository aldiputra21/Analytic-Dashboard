# Specs — Initial Requirements: Corporate Finance Dashboard (CFD)

**Requirement ID:** 20260406_001_initial_requirements
**Tanggal Dibuat:** 2026-04-06
**Status:** Documented (existing mockup)

---

## 1. Latar Belakang

Corporate Finance Dashboard (CFD) adalah aplikasi web full-stack milik PT Titian Servis Indonesia untuk mendukung monitoring keuangan korporat multi-subsidiary dan manajemen hubungan pelanggan (CRM) B2B. Proyek ini berkembang secara iteratif dari dua sistem terpisah menjadi satu aplikasi terintegrasi dengan dua modul utama:

1. **CFD** — Corporate Finance Dashboard: sistem monitoring rasio keuangan + manajemen data keuangan operasional
2. **CRM** — Customer Relationship Management: pipeline B2B dari lead hingga kontrak

Dokumen ini merekam spesifikasi dari seluruh sistem yang telah dibangun sebagai baseline untuk enhancement selanjutnya.

> **Catatan penamaan kode:** Secara internal, bagian manajemen keuangan operasional CFD masih menggunakan nama folder/hook "MAFINDA" (legacy naming dari iterasi sebelumnya). Ini adalah internal code name, bukan nama modul yang ditampilkan ke user.

---

## 2. Modul & Fitur

### 2.1 CFD — Corporate Finance Dashboard (Aktif)

Modul CFD terdiri dari dua sub-sistem yang berjalan dalam satu app shell (`FRSApp.tsx`):

#### 2.1.A FRS — Financial Ratio System

**Tujuan:** Memungkinkan holding company (Owner/BOD) untuk memonitor kesehatan keuangan seluruh subsidiary secara real-time melalui rasio keuangan standar.

**Komponen:** `src/components/financial/`

**User Roles:**
| Role | Akses |
|---|---|
| `owner` | Full access: semua subsidiary, manajemen user, konfigurasi sistem |
| `bod` | Read-only: semua subsidiary, laporan konsolidasi |
| `subsidiary_manager` | Read/write: hanya subsidiary yang ditugaskan |

**Fitur:**

##### Authentication & Authorization
- Login form dengan JWT (30 menit expiry)
- Rate limiting pada endpoint auth
- Protected routes berdasarkan role
- Audit log untuk semua operasi

##### Subsidiary Management
- CRUD subsidiaries (nama, industri, mata uang)
- Assign subsidiary_manager ke satu/beberapa subsidiary
- Konfigurasi threshold per rasio per subsidiary

##### Financial Data Entry (FRS)
- Form input manual: P&L lengkap + balance sheet
- Bulk import via CSV/XLSX
- Versioning data (restatement/koreksi dengan histori)
- Validasi input menggunakan Zod

##### Ratio Calculation Engine
9 rasio keuangan yang dihitung otomatis:
1. ROA (Return on Assets) = (Net Profit / Total Assets) × 100
2. ROE (Return on Equity) = (Net Profit / Total Equity) × 100
3. NPM (Net Profit Margin) = (Net Profit / Revenue) × 100
4. DER (Debt to Equity Ratio) = Total Liabilities / Total Equity
5. Current Ratio = Current Assets / Current Liabilities
6. Quick Ratio = (Current Assets − Inventory) / Current Liabilities
7. Cash Ratio = Cash / Current Liabilities
8. DSCR (Debt Service Coverage Ratio) = OCF / (Interest + Short-term Debt + Current LTD)
9. OCF Ratio = Operating Cash Flow / Current Liabilities

Health Score: 0–100 berdasarkan weighted average rasio vs threshold

##### Alert Engine
- Evaluasi otomatis rasio vs threshold yang dikonfigurasi
- 3 level severity: Critical, Warning, Info
- Alert acknowledgement oleh user
- Panel notifikasi di dashboard

##### Dashboard & Visualisasi (FRS)
- Health Score gauge (0–100)
- Ratio cards dengan indikator warna (merah/kuning/hijau)
- Trend chart dengan moving average (3 bulan, 12 bulan)
- Comparison chart antar-subsidiary (bar/radar)
- Period selector (bulanan/kuartalan/tahunan)
- Company selector untuk navigasi antar-subsidiary

##### Benchmarking & Laporan
- Tabel ranking cross-subsidiary per rasio
- Gap analysis vs benchmark industri
- Consolidated report (level holding)
- Trend analysis multi-subsidiary
- Export: CSV, Excel (xlsx), PDF (jspdf)
- Scheduled report via email (nodemailer)

##### Admin Panel
- User management (hanya Owner)
- Threshold configuration per rasio per subsidiary
- Audit log viewer (append-only, tamper-evident)
- DB backup & restore

---

#### 2.1.B Financial Management (CFD Operasional)

**Tujuan:** Dashboard keuangan operasional untuk manajemen cash flow, laporan keuangan, dan target per department/project.

**Komponen (aktif):**
- `src/components/MAFINDA/dashboard/` — widget KPI di-embed langsung dalam FRSDashboard
- `src/components/MAFINDA/data-entry/` — form input laporan keuangan
- `src/components/MAFINDA/management/` — manajemen department, project, target

**Fitur:**

##### Dashboard KPI (di-embed dalam FRS Dashboard)
- KPI cards: revenue, profit, aset (FinancialSummaryCards)
- Cash flow chart per department (CashFlowChart)
- Revenue vs target chart (RevenueTargetChart)
- Revenue cost breakdown (RevenueCostCards)
- Department performance (DepartmentPerformance)
- Historical data chart 12 bulan (HistoricalDataChart)
- Asset composition chart (AssetCompositionChart)
- Equity & liability chart (EquityLiabilityChart)
- 3D-style composition pie (CompositionPie3D)

##### Input Keuangan
- Income statement form (P&L lengkap, kalkulasi otomatis)
- Balance sheet form (struktur akuntansi Indonesia)
- Cash flow statement form
- Histori data keuangan per department/period

##### Manajemen
- CRUD Department
- CRUD Project per department (dengan tanggal, budget, status)
- Financial target setting per project/period
- Notasi currency Rupiah

---

### 2.2 CRM — Customer Relationship Management (Aktif)

**Tujuan:** Mengelola pipeline penjualan B2B dari prospek awal hingga kontrak, terintegrasi dalam satu app shell dengan CFD.

**Komponen:** `src/components/MAFINDA/crm/`

**User Roles:**
| Role | Akses |
|---|---|
| `owner` / `bod` | Full access ke semua CRM |
| `subsidiary_manager` | Akses CRM sesuai subsidiary |

**Fitur:**

##### Customer & Contact Management
- Profil perusahaan B2B: nama, alamat, industri, NPWP
- Hierarki customer (parent-child)
- Kontak per customer (PIC, Decision Maker): nama, jabatan, email, telepon

##### Pipeline Management
- 6 stage pipeline: Lead → Qualification → Tender → Proposal → Negotiation → Contract
- Validasi transisi stage (enforced pre-conditions)
- Probability konversi default per stage (STAGE_PROBABILITY)
- Kanban board drag-drop visual
- Funnel chart visualisasi pipeline
- Stale opportunity detection (>14 hari tanpa aktivitas)

##### Qualification & Feasibility
- Form analisis kualifikasi (dimensi teknis + bisnis)
- Feasibility Score 0–100 dengan bobot kriteria
- Rekomendasi otomatis: Proceed / Hold / Reject

##### Proposal & Tender
- Proposal management dengan versioning (v1.0, v1.1, dst.)
- Status tracking: Draft → Internal Review → Submitted → Evaluation → Revision
- Modal buat proposal baru (NewProposalModal)

##### Contract Management
- Contract generation setelah Negotiation
- Status tracking kontrak
- Modal buat kontrak baru (NewContractModal)

##### Approval Workflow
- Approval bertingkat untuk proposal, contract, budget
- Dashboard approval per role

##### Reimbursement Management
- Pengajuan reimburse terhubung ke opportunity/project
- Upload receipt
- Approval flow

##### Interaction Log
- Log setiap interaksi: kunjungan/telepon/email/meeting
- Terhubung ke opportunity & contact

---

### 2.3 File Legacy / Tidak Digunakan

File-file berikut tidak aktif dalam app namun masih ada di repository:

| File | Catatan |
|---|---|
| `src/App.tsx` | Legacy MAFINDA app shell — tidak di-import di `main.tsx` |
| `src/App-MAFINDA.tsx` | Legacy |
| `src/App-MAFINDA-Full.tsx` | Legacy |
| `src/App-MAFINDA-Complete.tsx` | Legacy |
| `src/components/MAFINDA/BalanceSheetForm.tsx` | Duplikat → gunakan `MAFINDA/data-entry/BalanceSheetForm.tsx` |
| `src/components/MAFINDA/IncomeStatementForm.tsx` | Duplikat → gunakan `MAFINDA/data-entry/IncomeStatementForm.tsx` |
| `src/components/MAFINDA/Dashboard2KeyMetrics.tsx` | Legacy |
| `src/components/MAFINDA/Dashboard6FinancialRatios.tsx` | Legacy |
| `src/components/MAFINDA/Dashboard8AssetComposition.tsx` | Legacy |
| `src/components/MAFINDA/Dashboard9EquityComposition.tsx` | Legacy |
| `src/components/MAFINDA/ExecutiveDashboard.tsx` | Legacy |
| `src/components/MAFINDA/CostControlMonitoring.tsx` | Legacy |
| `src/components/MAFINDA/DivisionProjectManagement.tsx` | Legacy |
| `src/components/MAFINDA/DashboardComponents.tsx` | Legacy |
| `src/components/MAFINDA/dashboard/MAFINDADashboard.tsx` | Legacy wrapper — sub-komponen-nya aktif di FRSDashboard |

---

## 3. Spesifikasi Teknis Non-Fungsional

### 3.1 Keamanan
- Password hashing: bcryptjs
- HTTP security headers: helmet
- Rate limiting: express-rate-limit (auth endpoints)
- Input validation: Zod pada semua API endpoints
- JWT expiry: 30 menit
- Audit log: append-only, tidak dapat diedit

### 3.2 Database
- SQLite via better-sqlite3 (`finance.db`)
- Migration idempotent: `CREATE TABLE IF NOT EXISTS`
- 3 migration files + core tables inline di `server.ts`

### 3.3 API
- RESTful JSON API
- Prefix: `/api/frs/*`, `/api/crm/*`, `/api/management/*`, `/api/dashboard/*`
- Auth: JWT Bearer token di Authorization header

### 3.4 Frontend
- SPA dengan state-based routing (bukan React Router)
- Lazy loading untuk semua halaman (code splitting)
- React Query untuk data fetching & caching
- Toast notifications untuk feedback user
- Error boundary untuk fault isolation

### 3.5 Testing
- Unit & API tests: Vitest + supertest
- Property-based testing: fast-check
- Coverage: @vitest/coverage-v8

---

## 4. Batasan & Asumsi

- Database menggunakan SQLite (file-based), cocok untuk single-server deployment
- Tidak ada multi-tenancy (satu instance = satu holding)
- Email (scheduled reports) bersifat opsional, graceful-degrade jika SMTP tidak dikonfigurasi
- Gemini AI API key opsional (fitur AI hanya aktif jika key tersedia)
- Aplikasi berjalan sebagai monolith (Express + Vite SSR/proxy dalam satu proses saat development)
- Routing menggunakan state-based (bukan URL-based), sehingga URL tidak berubah antar halaman

---

## 5. Acceptance Criteria (Baseline)

- [x] App dapat login menggunakan JWT dengan role berbeda
- [x] FRS: input data keuangan, kalkulasi rasio, melihat dashboard, export laporan
- [x] CFD Management: CRUD department, project, target; input laporan keuangan
- [x] CRM: pipeline kanban, customer management, opportunity tracking, proposal & contract
- [x] Auth bekerja benar untuk semua role (owner, bod, subsidiary_manager)
- [x] Database migrations berjalan tanpa error
- [x] Build production berhasil (`npm run build`)
