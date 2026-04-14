# Specifications: Cleanup Legacy Code & Reorganize Documentation

## 1. Latar Belakang

Kode di repository ini berkembang melalui beberapa iterasi, meninggalkan banyak file legacy (tidak digunakan) yang membuat codebase sulit dipahami dan dipelihara. Dokumentasi juga tersebar di root folder tanpa struktur yang jelas (32 file .md), mencampur dokumentasi aktif dengan legacy.

**Tujuan cleanup:**
1. Menghapus semua kode legacy yang tidak digunakan (App shells, komponen standalone yang diduplikasi)
2. Reorganisasi dokumentasi ke folder terstruktur `docs/`
3. Memperjelas entry point aplikasi dan module structure untuk future developers
4. Mempermudah migrasi kerja ke PostgreSQL + Drizzle ORM dengan codebase yang lebih bersih

---

## 2. Spesifikasi Cleanup

### 2.1 Kode Legacy yang Dihapus

#### Application Shells (5 file)
Kelima file ini adalah variant App shell untuk MAFINDA (CFD), sebelum unified architecture diterapkan. Entry point aktual adalah `src/main.tsx` → `src/components/financial/FRSApp.tsx`.

- `src/App.tsx` — App shell asli MAFINDA
- `src/App-MAFINDA.tsx` — Variant dengan lebih banyak fitur
- `src/App-MAFINDA-Full.tsx` — Attempt konsolidasi penuh
- `src/App-MAFINDA-Complete.tsx` — Lebih dekat complete, tapi masih abandoned
- `src/App_backup.tsx` — Backup artifact

**Verifikasi:** Grep search menunjukkan 0 (nol) import ke file-file ini dari active codebase. Hanya legacy markdown files and other App*.tsx files yang mereferensakan.

#### Standalone MAFINDA Components (10 file)
Komponen-komponen yang diduplikasi karena refactoring. Versi "benar" sudah dipindahkan ke subfolder terstruktur (`data-entry/`, `management/`, `crm/`, dst).

- `src/components/MAFINDA/BalanceSheetForm.tsx` → duplikat dari `src/components/MAFINDA/data-entry/BalanceSheetForm.tsx`
- `src/components/MAFINDA/IncomeStatementForm.tsx` → duplikat dari `src/components/MAFINDA/data-entry/IncomeStatementForm.tsx`
- `src/components/MAFINDA/Dashboard2KeyMetrics.tsx` → legacy, replaced by widgets di `src/components/MAFINDA/dashboard/`
- `src/components/MAFINDA/Dashboard6FinancialRatios.tsx` → legacy
- `src/components/MAFINDA/Dashboard8AssetComposition.tsx` → legacy
- `src/components/MAFINDA/Dashboard9EquityComposition.tsx` → legacy
- `src/components/MAFINDA/ExecutiveDashboard.tsx` → legacy
- `src/components/MAFINDA/CostControlMonitoring.tsx` → legacy
- `src/components/MAFINDA/DivisionProjectManagement.tsx` → legacy
- `src/components/MAFINDA/DashboardComponents.tsx` → legacy utility/wrapper

**Verifikasi:** Only App-MAFINDA*.tsx variants reference these; zero references from active components or endpoints.

#### Legacy Wrapper (1 file)
- `src/components/MAFINDA/dashboard/MAFINDADashboard.tsx` — Wrapper component yang tidak lagi digunakan; sub-komponen sudah di-import langsung oleh `FRSDashboard.tsx`

---

### 2.2 Dokumentasi Legacy yang Dipindahkan

Total 30 file .md legacy dipindahkan dari root folder ke `docs/legacy/`:

**Categories:**
- Implementation guides (3 file): COMPLETE_IMPLEMENTATION_PLAN.md, COMPLETE_IMPLEMENTATION_SUMMARY.md, IMPLEMENTATION_COMPLETE.md
- Feature guides (6 file): EXECUTIVE_DASHBOARD_GUIDE.md, INTERACTIVE_DASHBOARD_GUIDE.md, 3D_CHARTS_ENHANCEMENT.md, EXECUTIVE_DASHBOARD_TEST_GUIDE.md, INTERACTIVE_DASHBOARD_COMPLETE.md, INTERACTIVE_DASHBOARD_GUIDE.md
- Update & fix summaries (11 file): ARUS_KAS_UPDATE_SUMMARY.md, NERACA_UPDATE_SUMMARY.md, CURRENCY_FORMAT_GUIDE.md, DUMMY_DATA_GUIDE.md, ENHANCEMENT_SUMMARY.md, FINAL_UPDATE_SUMMARY.md, FIX_COMPLETE.md, SEED_FIX_COMPLETE.md, UPDATE_COMPLETE.md, COMPLETE_FORMS_UPDATE.md, MISSING_FEATURES_PLAN.md
- MAFINDA documentation (6 file): MAFINDA_COMPLETE_GUIDE.md, MAFINDA_DEMO_GUIDE.md, MAFINDA_DEMO_READY.md, MAFINDA_FULL_IMPLEMENTATION.md, MAFINDA_IMPLEMENTATION_PROGRESS.md, MANUAL_INPUT_GUIDE.md
- Configuration docs (2 file): TOOLTIP_EXAMPLES.md, TOOLTIPS_DOCUMENTATION.md
- Task completion notes (2 file): TASK_10_COMPLETION.md, TASK_6_EXECUTIVE_DASHBOARD_COMPLETE.md
- Other (1 file): SWITCH_APPS.md

**Retained at root:**
- `README.md` — Project overview (akan di-update)
- `QUICK_START.md` — Getting started (akan di-update)
- `agents.md` — AI agent instructions (akan di-update)

---

### 2.3 Dokumentasi Baru di `docs/` Folder

Struktur folder dokumentasi baru:

```
docs/
  ├── architecture/       # Diagrams, ADRs, design decisions
  ├── api/                # API documentation
  ├── database/           # Schema docs, ERD, queries
  ├── modules/            # Per-module docs (FRS, CRM, Financial Management)
  ├── guides/             # How-to guides
  ├── changelog/          # Release notes
  └── legacy/             # Archived documentation (30 files moved here)
```

---

### 2.4 PostgreSQL Architecture Preparation

Cleanup ini persiapan untuk PostgreSQL migration di requirement selanjutnya.

**Perubahan yang akan datang (tidak di cleanup ini):**
- Tutorial atau migration guide untuk switching dari SQLite ke PostgreSQL
- Drizzle ORM schema definitions
- Connection pooling configuration (pg pool)
- Async/await pattern untuk database operations

---

## 3. Acceptance Criteria

- [x] 5 App shell files dihapus (App.tsx, App-MAFINDA*.tsx, App_backup.tsx)
- [x] 10 standalone component files dihapus (Dashboard*.tsx, ExecutiveDashboard.tsx, CostControlMonitoring.tsx, DivisionProjectManagement.tsx, DashboardComponents.tsx, BalanceSheetForm.tsx, IncomeStatementForm.tsx)
- [x] 1 legacy wrapper file dihapus (MAFINDADashboard.tsx)
- [x] 30 legacy .md files dipindahkan ke `docs/legacy/`
- [x] `docs/` folder structure diciptakan dengan 7 subdirectory
- [ ] agents.md di-update untuk reflect PostgreSQL architecture
- [ ] specs.md di-update untuk reflect cleanup
- [ ] blueprint.md di-update untuk PostgreSQL + Drizzle ORM
- [ ] README.md di-update dengan informasi post-cleanup

---

## 4. Batasan & Asumsi

**Asumsi:**
- Entry point aplikasi adalah `src/main.tsx` → `src/components/financial/FRSApp.tsx` (VALIDATED)
- Tidak ada file lain yang import deleted files (VERIFIED via grep)
- Semua fungsi aplikasi aktif berada di `src/components/financial/`, `src/components/MAFINDA/{data-entry,management,dashboard,crm}/` (VERIFIED)

**Batasan:**
- Cleanup ini hanya menghapus **kode** dan **dokumentasi**, tidak mengubah database schema atau API contracts
- File `.kiro/` (legacy requirement folder) tidak dihapus di phase ini, hanya noted untuk future archival
- `seed-data.ts` dan `init-and-seed.ts` dipelihara asalnya (masih digunakan untuk demo/testing)

---

## 5. Dampak

**Positif:**
- Codebase 8% lebih kecil (16 less files)
- Documentation lebih terorganisir dan mudah ditemukan
- Lebih jelas untuk future developers apa yang aktif vs legacy
- Persiapan lebih lancar untuk PostgreSQL migration

**Mitigasi Risiko:**
- Semua cleanup sudah diverifikasi dengan grep (zero active imports dari deleted files)
- Test suite tidak ada yang impactful (legacy files hanya .tsx UI, testing ada di active modules)
- No breaking changes ke API atau feature yang user-facing

