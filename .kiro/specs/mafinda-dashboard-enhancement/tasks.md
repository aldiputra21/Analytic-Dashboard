# Rencana Implementasi: MAFINDA Dashboard Enhancement

## Ikhtisar

Implementasi dilakukan secara inkremental: mulai dari fondasi database dan API, kemudian komponen UI, dan diakhiri dengan integrasi penuh. Setiap task membangun di atas task sebelumnya.

Stack: React + TypeScript + Vite (frontend), Express.js (backend), SQLite (database), Tailwind CSS, Recharts.

---

## Tasks

- [x] 1. Buat skema database baru (migration)
  - Buat file `src/db/migrations/003_mafinda_dashboard_schema.sql`
  - Buat tabel: `mafinda_departments`, `mafinda_projects`, `mafinda_targets`, `mafinda_balance_sheets`, `mafinda_income_statements`, `mafinda_cash_flows`, `mafinda_revenue_realizations`
  - Tambahkan semua index yang diperlukan sesuai desain
  - Daftarkan migration di database initialization (ikuti pola migration 001 dan 002 yang sudah ada)
  - _Requirements: 7.6, 7.7, 7.8, 8.7, 8.8, 8.9_

- [x] 2. Implementasi service layer untuk manajemen departemen & proyek
  - [x] 2.1 Buat `src/services/mafinda/departmentService.ts`
    - Implementasi fungsi: `getAllDepartments`, `getDepartmentById`, `createDepartment`, `updateDepartment`, `deleteDepartment`
    - `createDepartment` harus melempar error 409 jika nama sudah ada
    - `deleteDepartment` harus mengembalikan daftar proyek aktif yang terdampak
    - _Requirements: 7.1, 7.5, 7.9_

  - [ ]* 2.2 Tulis property test untuk departmentService
    - **Property 9: Konflik Nama Departemen** — untuk setiap nama departemen yang sudah ada, upaya membuat departemen baru dengan nama yang sama harus mengembalikan error 409
    - **Validates: Requirements 7.9**
    - _Gunakan fast-check, minimum 100 iterasi_

  - [x] 2.3 Buat `src/services/mafinda/projectService.ts`
    - Implementasi fungsi: `getProjectsByDepartment`, `getProjectById`, `createProject`, `updateProject`, `deleteProject`
    - `createProject` harus melempar error 409 jika nama proyek sudah ada dalam departemen yang sama
    - _Requirements: 7.2, 7.10_

  - [ ]* 2.4 Tulis property test untuk projectService
    - **Property 10: Konflik Nama Proyek dalam Departemen** — untuk setiap nama proyek yang sudah ada dalam departemen tertentu, upaya membuat proyek baru dengan nama yang sama di departemen yang sama harus mengembalikan error 409
    - **Validates: Requirements 7.10**

- [x] 3. Implementasi service layer untuk target keuangan
  - [x] 3.1 Buat `src/services/mafinda/targetService.ts`
    - Implementasi fungsi: `getTargets`, `upsertTarget`, `deleteTarget`
    - `upsertTarget` harus menggunakan INSERT OR REPLACE untuk memastikan unikuitas per (entityType, entityId, period, periodType)
    - _Requirements: 7.3, 7.4_

  - [ ]* 3.2 Tulis property test untuk targetService
    - **Property 7: Unikuitas Target per Entitas-Periode** — untuk setiap kombinasi (entityType, entityId, period, periodType), operasi upsert berulang harus menghasilkan tepat satu record, bukan duplikat
    - **Validates: Requirements 7.3, 7.4**

- [x] 4. Implementasi service layer untuk laporan keuangan
  - [x] 4.1 Buat `src/services/mafinda/financialStatementService.ts`
    - Implementasi fungsi: `saveBalanceSheet`, `getBalanceSheets`, `saveIncomeStatement`, `getIncomeStatements`, `saveCashFlow`, `getCashFlows`
    - Semua fungsi save harus memvalidasi bahwa field keuangan tidak bernilai negatif
    - Fungsi save harus mengembalikan data yang tersimpan
    - _Requirements: 8.1, 8.2, 8.3, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [ ]* 4.2 Tulis property test untuk financialStatementService
    - **Property 6: Round-Trip Serialisasi Data Keuangan** — untuk setiap objek laporan keuangan valid, menyimpan lalu membaca kembali harus menghasilkan objek yang ekuivalen
    - **Property 8: Validasi Input Non-Negatif** — untuk setiap field keuangan non-negatif, nilai negatif harus ditolak dengan error 400
    - **Validates: Requirements 8.6, 8.7, 8.8, 8.9, 8.10**

- [x] 5. Implementasi service layer untuk dashboard
  - [x] 5.1 Buat `src/services/mafinda/dashboardService.ts`
    - Implementasi fungsi: `getDeptRevenueTarget`, `getRevenueCostSummary`, `getCashFlowData`, `getAssetComposition`, `getEquityLiabilityComposition`, `getHistoricalData`
    - `getDeptRevenueTarget` harus menghitung `achievementRate = (realization / target) * 100`
    - `getCashFlowData` harus menghitung `netCashFlow = cashIn - cashOut`
    - `getAssetComposition` harus memastikan `currentAssets + fixedAssets + otherAssets = totalAssets`
    - `getEquityLiabilityComposition` harus memastikan `totalEquity + totalLiabilities = totalAssets`
    - _Requirements: 1.3, 1.6, 2.5, 3.4, 3.5, 3.6, 4.5, 5.5, 6.5_

  - [ ]* 5.2 Tulis property test untuk dashboardService
    - **Property 1: Konsistensi Achievement Rate** — untuk setiap pasangan (target > 0, realization >= 0), achievementRate harus sama dengan (realization / target) * 100
    - **Property 3: Net Cash Flow Konsisten** — untuk setiap pasangan (cashIn, cashOut), netCashFlow harus sama dengan cashIn - cashOut
    - **Property 4: Komposisi Aset Menjumlah ke Total** — untuk setiap set komponen aset, totalAssets harus sama dengan jumlah semua komponen
    - **Property 5: Komposisi Ekuitas & Liabilitas Menjumlah ke Total Pasiva** — totalEquity + totalLiabilities harus sama dengan totalAssets
    - **Property 2: Filter Departemen Menghasilkan Subset** — revenue dengan filter departemen harus <= revenue tanpa filter
    - **Validates: Requirements 1.3, 2.3, 2.4, 3.4, 3.6, 4.4, 5.4**

- [x] 6. Checkpoint — Pastikan semua tests service layer lulus
  - Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan.

- [x] 7. Implementasi API routes untuk manajemen
  - [x] 7.1 Buat `src/routes/management/departments.ts`
    - Implementasi: `GET /api/departments`, `POST /api/departments`, `PUT /api/departments/:id`, `DELETE /api/departments/:id`
    - Validasi request body untuk POST dan PUT
    - Tangani error 409 dari departmentService
    - _Requirements: 7.1, 7.6, 7.9_

  - [x] 7.2 Buat `src/routes/management/projects.ts`
    - Implementasi: `GET /api/projects`, `POST /api/projects`, `PUT /api/projects/:id`, `DELETE /api/projects/:id`
    - Support query param `departmentId` untuk filter
    - Tangani error 409 dari projectService
    - _Requirements: 7.2, 7.7, 7.10_

  - [x] 7.3 Buat `src/routes/management/targets.ts`
    - Implementasi: `GET /api/targets`, `POST /api/targets` (upsert), `DELETE /api/targets/:id`
    - Support query params: `entityType`, `entityId`, `period`
    - _Requirements: 7.3, 7.4, 7.8_

  - [x] 7.4 Buat `src/routes/management/financialStatements.ts`
    - Implementasi endpoint untuk neraca: `GET /api/financial-statements/balance-sheet`, `POST /api/financial-statements/balance-sheet`
    - Implementasi endpoint untuk laba rugi: `GET /api/financial-statements/income-statement`, `POST /api/financial-statements/income-statement`
    - Implementasi endpoint untuk arus kas: `GET /api/financial-statements/cash-flow`, `POST /api/financial-statements/cash-flow`
    - Semua POST harus mengembalikan status 201 dengan data tersimpan
    - _Requirements: 8.7, 8.8, 8.9, 8.10_

- [x] 8. Implementasi API routes untuk dashboard
  - Buat `src/routes/dashboard/mafindaDashboard.ts`
  - Implementasi: `GET /api/dashboard/dept-revenue-target`, `GET /api/dashboard/revenue-cost-summary`, `GET /api/dashboard/cash-flow`, `GET /api/dashboard/asset-composition`, `GET /api/dashboard/equity-liability-composition`, `GET /api/dashboard/historical-data`
  - Semua endpoint harus memvalidasi query params yang diperlukan
  - _Requirements: 1.6, 2.5, 3.5, 4.5, 5.5, 6.5_

- [x] 9. Daftarkan routes baru di server utama
  - Tambahkan import dan `app.use()` untuk semua routes baru di file server utama (ikuti pola routes yang sudah ada di `src/routes/`)
  - _Requirements: semua_

- [x] 10. Checkpoint — Pastikan semua API endpoint berfungsi
  - Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan.

- [x] 11. Implementasi komponen UI untuk manajemen
  - [x] 11.1 Buat `src/components/MAFINDA/management/DepartmentManager.tsx`
    - Form tambah/edit/hapus departemen
    - Tampilkan konfirmasi sebelum hapus departemen yang memiliki proyek aktif
    - Tampilkan error toast jika nama duplikat (409)
    - _Requirements: 7.1, 7.5_

  - [x] 11.2 Buat `src/components/MAFINDA/management/ProjectManager.tsx`
    - Form tambah/edit/hapus proyek dengan dropdown departemen
    - Field: nama, departemen, deskripsi, tanggal mulai, tanggal selesai
    - Tampilkan error toast jika nama duplikat dalam departemen (409)
    - _Requirements: 7.2_

  - [x] 11.3 Buat `src/components/MAFINDA/management/TargetManager.tsx`
    - Form penetapan target per departemen dan per proyek
    - Field: entitas (dept/proyek), periode, target revenue, target biaya operasional
    - Tampilkan tabel target yang sudah ada dengan opsi edit
    - _Requirements: 7.3, 7.4_

  - [x] 11.4 Buat `src/hooks/mafinda/useManagement.ts`
    - Custom hook yang mengabstraksi semua API calls untuk manajemen
    - State: departments, projects, targets, isLoading, error
    - Actions: createDepartment, updateDepartment, deleteDepartment, createProject, updateProject, deleteProject, upsertTarget
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 12. Implementasi komponen UI untuk input data keuangan
  - [x] 12.1 Buat `src/components/MAFINDA/data-entry/BalanceSheetForm.tsx`
    - Form input neraca dengan field sesuai desain
    - Validasi: semua field wajib, nilai tidak boleh negatif
    - Tampilkan konfirmasi jika periode sudah ada
    - Aktifkan tombol simpan hanya jika semua field valid
    - _Requirements: 8.1, 8.4, 8.5, 8.6_

  - [x] 12.2 Buat `src/components/MAFINDA/data-entry/IncomeStatementForm.tsx`
    - Form input laba rugi dengan field sesuai desain
    - Validasi: semua field wajib, nilai tidak boleh negatif
    - Tampilkan konfirmasi jika periode sudah ada
    - _Requirements: 8.2, 8.4, 8.5, 8.6_

  - [x] 12.3 Buat `src/components/MAFINDA/data-entry/CashFlowStatementForm.tsx`
    - Form input arus kas dengan field sesuai desain
    - Dropdown opsional untuk departemen dan proyek
    - Validasi: field wajib (period, cash values), nilai tidak boleh negatif
    - _Requirements: 8.3, 8.4, 8.5, 8.6_

  - [x] 12.4 Buat `src/components/MAFINDA/data-entry/FinancialHistoryTable.tsx`
    - Tabel riwayat input data keuangan
    - Filter berdasarkan jenis laporan (neraca/laba rugi/arus kas) dan periode
    - _Requirements: 8.11_

- [x] 13. Implementasi komponen UI untuk dashboard — visualisasi
  - [x] 13.1 Buat `src/components/MAFINDA/dashboard/RevenueTargetChart.tsx`
    - Grafik batang grouped (target vs realisasi) per departemen menggunakan Recharts BarChart
    - Warna indikator: hijau jika achievement >= 100%, oranye jika 80-99%, merah jika < 80%
    - Tampilkan persentase achievement di atas setiap bar
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [x] 13.2 Buat `src/components/MAFINDA/dashboard/RevenueCostCards.tsx`
    - Dua card: Revenue dan Operational Cost
    - Tampilkan nilai nominal (format Rupiah) dan persentase perubahan vs periode sebelumnya
    - Dropdown filter departemen (All + daftar departemen)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 13.3 Buat `src/components/MAFINDA/dashboard/CashFlowChart.tsx`
    - Grafik area Cash In dan Cash Out menggunakan Recharts AreaChart
    - Dropdown filter departemen dan proyek (proyek muncul setelah departemen dipilih)
    - Tampilkan nilai net cash flow di bawah grafik
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 13.4 Buat `src/components/MAFINDA/dashboard/AssetCompositionChart.tsx`
    - Grafik donut komposisi aset menggunakan Recharts PieChart
    - Tampilkan nilai nominal dan persentase setiap komponen
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 13.5 Buat `src/components/MAFINDA/dashboard/EquityLiabilityChart.tsx`
    - Grafik donut komposisi ekuitas & liabilitas menggunakan Recharts PieChart
    - Tampilkan breakdown komponen ekuitas dan liabilitas
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 13.6 Buat `src/components/MAFINDA/dashboard/HistoricalDataChart.tsx`
    - Grafik multi-line tren historis menggunakan Recharts LineChart
    - Tampilkan Revenue, Net Profit, Total Aset, Total Liabilitas dengan warna berbeda
    - Selector rentang waktu: 3 bulan, 6 bulan, 1 tahun, 2 tahun
    - Tampilkan pesan informatif jika data tidak tersedia
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 14. Buat custom hook untuk dashboard
  - Buat `src/hooks/mafinda/useDashboard.ts`
  - Mengabstraksi semua API calls dashboard dengan state management
  - State: semua data dashboard, isLoading, error
  - Mendukung filter: period, periodType, departmentId, projectId, historicalMonths
  - Auto-refetch ketika filter berubah
  - _Requirements: 1.2, 2.3, 3.2, 3.3, 4.3, 5.3, 6.2_

- [x] 15. Buat halaman utama dan integrasi komponen
  - [x] 15.1 Buat `src/components/MAFINDA/dashboard/MAFINDADashboard.tsx`
    - Halaman dashboard utama yang mengintegrasikan semua widget visualisasi
    - Gunakan `useDashboard` hook
    - Layout grid responsif: RevenueTargetChart (full width), RevenueCostCards (2 col), CashFlowChart (2 col), AssetCompositionChart + EquityLiabilityChart (2 col), HistoricalDataChart (full width)
    - Filter global: period selector dan period type selector
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 5.1, 6.1_

  - [x] 15.2 Buat `src/components/MAFINDA/management/ManagementPage.tsx`
    - Halaman manajemen dengan tab: Departemen, Proyek, Target
    - Integrasikan DepartmentManager, ProjectManager, TargetManager
    - Gunakan `useManagement` hook
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 15.3 Buat `src/components/MAFINDA/data-entry/DataEntryPage.tsx`
    - Halaman input data dengan tab: Neraca, Laba Rugi, Arus Kas, Riwayat
    - Integrasikan semua form dan FinancialHistoryTable
    - _Requirements: 8.1, 8.2, 8.3, 8.11_

- [x] 16. Integrasi ke navigasi aplikasi utama
  - Tambahkan menu navigasi untuk Dashboard, Manajemen, dan Input Data di aplikasi MAFINDA utama
  - Ikuti pola navigasi yang sudah ada di `src/App.tsx` atau komponen navigasi yang relevan
  - _Requirements: semua_

- [x] 17. Checkpoint akhir — Pastikan semua tests lulus dan integrasi berfungsi
  - Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan.

---

## Catatan

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk keterlacakan
- Gunakan komponen Toast yang sudah ada (`src/components/financial/shared/Toast.tsx`) untuk notifikasi
- Ikuti pola format Rupiah yang sudah ada di `src/utils/format.ts`
- Property tests menggunakan `fast-check` (sudah ada di codebase)
