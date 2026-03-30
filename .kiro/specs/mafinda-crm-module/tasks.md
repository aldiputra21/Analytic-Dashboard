# Implementation Plan: Modul CRM MAFINDA

## Overview

Implementasi modul CRM MAFINDA dilakukan secara inkremental. Task 1, 2, dan 4 sudah selesai (backend foundation, customer management, pipeline engine). Prioritas utama sekarang adalah:

1. **Wire CRMPage.tsx ke API nyata** (menggantikan data mock)
2. **Implementasi modul yang belum ada** (Proposals, Cost Planning, Win/Loss, Contracts, Approvals, Reimburse)
3. **Integrasi MAFINDA_Project** dan **Analytics Dashboard**

Semua kode menggunakan **TypeScript** (frontend: React 18+, backend: Express.js), mengikuti konvensi yang sudah ada di codebase MAFINDA.

## Tasks

- [x] 1. Setup fondasi CRM: database schema, types, dan CRM role extension
  - File migrasi SQL (`src/db/migrations/001_crm_schema.sql`) sudah dibuat
  - TypeScript types (`src/types/crm.ts`) sudah dibuat
  - Middleware RBAC (`src/middleware/crmRbac.ts`) sudah dibuat
  - Helper audit log (`src/helpers/crmAuditLog.ts`) sudah dibuat
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 9.8_

  - [ ]* 1.1 Tulis property test untuk CRM RBAC enforcement
    - **Property 23: RBAC Enforcement**
    - **Validates: Requirements 9.2, 9.3, 9.4, 2.10**

  - [ ]* 1.2 Tulis property test untuk audit log completeness
    - **Property 24: Audit Log Completeness**
    - **Validates: Requirements 9.6**

- [x] 2. Implementasi Customer & Contact Management
  - Routes `src/routes/crm/customers.ts` dan `src/routes/crm/interactions.ts` sudah dibuat
  - Komponen `CustomerProfileForm.tsx`, `ContactForm.tsx`, `InteractionLogForm.tsx`, `CustomerList.tsx` sudah dibuat
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.10_

  - [ ]* 2.1 Tulis property test untuk kelengkapan data pelanggan
    - **Property 1: Kelengkapan Data Pelanggan**
    - **Validates: Requirements 1.1, 1.2, 1.4**

  - [ ]* 2.2 Tulis property test untuk inisialisasi lead baru
    - **Property 2: Inisialisasi Lead Baru**
    - **Validates: Requirements 1.3**

  - [ ]* 2.3 Tulis property test untuk keunikan data pelanggan
    - **Property 3: Keunikan Data Pelanggan**
    - **Validates: Requirements 1.10**

  - [ ]* 2.4 Tulis property test untuk kelengkapan data interaksi
    - **Property 4: Kelengkapan Data Interaksi**
    - **Validates: Requirements 1.6, 1.7**

- [ ] 3. Checkpoint - Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

- [x] 4. Implementasi Pipeline Engine dan Opportunity Management
  - `src/services/crm/pipelineEngine.ts` sudah dibuat
  - `src/routes/crm/opportunities.ts` sudah dibuat
  - Komponen `PipelineKanbanBoard.tsx`, `OpportunityCard.tsx`, `OpportunityForm.tsx` sudah dibuat
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 2.9, 2.10_

  - [ ]* 4.1 Tulis property test untuk validasi transisi stage pipeline
    - **Property 5: Validasi Transisi Stage Pipeline**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 4.2 Tulis property test untuk audit trail perubahan nilai opportunity
    - **Property 6: Audit Trail Perubahan Nilai Opportunity**
    - **Validates: Requirements 2.5**

  - [ ]* 4.3 Tulis property test untuk kalkulasi total nilai pipeline
    - **Property 7: Kalkulasi Total Nilai Pipeline**
    - **Validates: Requirements 2.6**

  - [ ]* 4.4 Tulis property test untuk kalkulasi weighted sales forecast
    - **Property 8: Kalkulasi Weighted Sales Forecast**
    - **Validates: Requirements 2.8, 8.6**

  - [ ]* 4.5 Tulis property test untuk deteksi opportunity stale
    - **Property 9: Deteksi Opportunity Stale**
    - **Validates: Requirements 2.9**

- [ ] 5. Wire CRMPage.tsx ke API nyata (menggantikan data mock)
  - [ ] 5.1 Wire tab Dashboard ke `GET /api/crm/dashboard/metrics` dan `GET /api/crm/pipeline/kanban`
    - Ganti data mock metrics cards dengan data dari API
    - Ganti data mock chart Pipeline by Stage, Opportunity Status, Monthly Performance dengan data API
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 5.2 Wire tab Opportunities ke komponen yang sudah ada
    - Integrasikan `PipelineKanbanBoard.tsx` ke dalam tab Opportunities di CRMPage
    - Ganti tabel opportunities mock dengan data dari `GET /api/crm/opportunities`
    - Hubungkan `OpportunityForm.tsx` untuk create/edit opportunity
    - Hubungkan `InteractionLogForm.tsx` ke detail drawer opportunity
    - _Requirements: 2.7, 2.1_

  - [ ] 5.3 Wire tab Customers ke komponen yang sudah ada
    - Integrasikan `CustomerList.tsx` (sudah ada API integration) ke tab Customers di CRMPage
    - Hubungkan `CustomerProfileForm.tsx` dan `ContactForm.tsx` untuk create/edit
    - _Requirements: 1.9_

  - [ ]* 5.4 Tulis property test untuk akurasi filter dashboard
    - **Property 25: Akurasi Filter Dashboard**
    - **Validates: Requirements 8.4**

- [ ] 6. Implementasi Qualification & Feasibility Analysis (wiring frontend ke backend)
  - Backend routes `src/routes/crm/qualifications.ts` sudah ada
  - Komponen `QualificationForm.tsx` dan `FeasibilityScoreCard.tsx` sudah ada
  - [ ] 6.1 Wire `QualificationForm.tsx` ke `POST /api/crm/opportunities/:id/qualification`
    - Hubungkan form ke endpoint backend yang sudah ada
    - Tampilkan `FeasibilityScoreCard.tsx` setelah analisis selesai
    - Integrasikan ke detail drawer Opportunity di CRMPage
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 6.2 Tulis property test untuk kalkulasi feasibility score
    - **Property 10: Kalkulasi Feasibility Score**
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 6.3 Tulis property test untuk versioning analisis kualifikasi
    - **Property 11: Versioning Dokumen dan Estimasi**
    - **Validates: Requirements 3.7**

- [ ] 7. Implementasi Tender & Proposal Management
  - [ ] 7.1 Buat `src/routes/crm/proposals.ts` dengan endpoint lengkap
    - `POST /api/crm/opportunities/:id/proposals` - buat proposal baru (versi awal "v1.0")
    - `GET /api/crm/opportunities/:id/proposals` - list proposal
    - `GET /api/crm/proposals/:id` - detail proposal
    - `PUT /api/crm/proposals/:id` - update (auto-increment versi)
    - `POST /api/crm/proposals/:id/documents` - upload dokumen (max 25 MB, PDF/DOCX/XLSX)
    - `POST /api/crm/proposals/:id/submit` - submit ke klien
    - `GET /api/crm/proposals/:id/versions` - riwayat versi
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8, 4.9, 4.10_

  - [ ] 7.2 Buat komponen React untuk Proposal Management
    - Buat `ProposalBuilder.tsx` - form create/edit proposal dengan version tracking
    - Buat `DocumentUploader.tsx` - komponen upload dokumen dengan validasi ukuran/tipe
    - Buat `ProposalVersionHistory.tsx` - tampilan riwayat versi
    - Wire tab Proposals di CRMPage ke komponen dan API baru
    - _Requirements: 4.1, 4.2, 4.3, 4.8_

  - [ ]* 7.3 Tulis property test untuk inisialisasi versi proposal
    - **Property 12: Inisialisasi Versi Proposal**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 7.4 Tulis property test untuk validasi ukuran dan tipe file proposal
    - **Property 13: Validasi Ukuran dan Tipe File**
    - **Validates: Requirements 4.4**

  - [ ]* 7.5 Tulis property test untuk kelengkapan metadata proposal submitted
    - **Property 14: Kelengkapan Metadata Proposal Submitted**
    - **Validates: Requirements 4.9**

- [ ] 8. Checkpoint - Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

- [ ] 9. Implementasi Cost & Resource Planning
  - [ ] 9.1 Buat `src/services/crm/costCalculator.ts`
    - Hitung `total_cost` = sum semua komponen biaya
    - Hitung `margin_percentage` = (opportunity_value - total_cost) / opportunity_value * 100
    - Validasi margin minimum yang dapat dikonfigurasi
    - _Requirements: 5.2, 5.6_

  - [ ] 9.2 Buat `src/routes/crm/costEstimations.ts` dengan endpoint lengkap
    - `POST /api/crm/opportunities/:id/cost-estimation`
    - `GET /api/crm/opportunities/:id/cost-estimation`
    - `PUT /api/crm/cost-estimations/:id`
    - `GET /api/crm/cost-estimations/:id/versions`
    - _Requirements: 5.1, 5.3, 5.4, 5.7, 5.8_

  - [ ] 9.3 Buat komponen React `CostEstimationForm.tsx`, `ResourcePlanTable.tsx`, `MarginIndicator.tsx`
    - Integrasikan ke detail drawer Opportunity di CRMPage
    - _Requirements: 5.1, 5.4_

  - [ ]* 9.4 Tulis property test untuk kalkulasi margin biaya
    - **Property 15: Kalkulasi Margin Biaya**
    - **Validates: Requirements 5.2**

  - [ ]* 9.5 Tulis property test untuk validasi margin minimum
    - **Property 16: Validasi Margin Minimum**
    - **Validates: Requirements 5.6**

- [ ] 10. Implementasi Decision Management (Win/Loss)
  - [ ] 10.1 Tambahkan endpoint close deal dan analytics ke routes opportunities
    - `POST /api/crm/opportunities/:id/close` - wajib `close_reason` dan `close_category` untuk Lost/Cancelled
    - `GET /api/crm/analytics/win-loss` - laporan Win/Loss
    - `GET /api/crm/analytics/win-rate` - win rate per user/tim
    - Buat `src/services/crm/winLossAnalytics.ts` untuk kalkulasi Win_Rate
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7, 6.8_

  - [ ] 10.2 Buat komponen React untuk Win/Loss
    - Buat `CloseOpportunityModal.tsx` - modal dengan form alasan penutupan
    - Buat `CompetitorForm.tsx` - form pencatatan kompetitor
    - Buat `WinLossReport.tsx` - tampilan laporan Win/Loss
    - _Requirements: 6.2, 6.3, 6.4_

  - [ ]* 10.3 Tulis property test untuk validasi alasan penutupan deal
    - **Property 17: Validasi Alasan Penutupan Deal**
    - **Validates: Requirements 6.2**

  - [ ]* 10.4 Tulis property test untuk kalkulasi win rate
    - **Property 18: Kalkulasi Win Rate**
    - **Validates: Requirements 6.6**

- [ ] 11. Implementasi Contract Management
  - [ ] 11.1 Buat `src/services/crm/contractService.ts`
    - Auto-populate data kontrak dari opportunity Won
    - Alur approval internal: BD_Manager → Sales_Manager
    - State machine kontrak: Draft → Internal_Review → Approved → Pending_Client_Signature → Signed
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [ ] 11.2 Buat `src/routes/crm/contracts.ts` dengan endpoint lengkap
    - `POST /api/crm/opportunities/:id/contracts`
    - `GET /api/crm/contracts/:id`, `PUT /api/crm/contracts/:id`
    - `POST /api/crm/contracts/:id/approve`, `POST /api/crm/contracts/:id/sign`
    - `POST /api/crm/contracts/:id/documents`, `GET /api/crm/contracts`
    - _Requirements: 7.1, 7.8, 7.10_

  - [ ] 11.3 Buat komponen React dan wire tab Contracts di CRMPage
    - Buat `ContractForm.tsx`, `ContractApprovalFlow.tsx`
    - Wire tab Contracts di CRMPage ke API nyata (ganti data mock)
    - _Requirements: 7.1, 7.3_

  - [ ]* 11.4 Tulis property test untuk propagasi data kontrak dari opportunity
    - **Property 19: Propagasi Data Kontrak dari Opportunity**
    - **Validates: Requirements 7.2**

- [ ] 12. Implementasi Approval Workflow (backend + frontend wiring)
  - [ ] 12.1 Tambahkan tabel `crm_approvals` dan `crm_approval_documents` ke migrasi SQL
    - Update `src/db/migrations/001_crm_schema.sql` atau buat migrasi baru
    - Tambahkan TypeScript types `ApprovalItem`, `ApprovalType`, `ApprovalStatus` ke `src/types/crm.ts`
    - _Requirements: 11.1, 11.2_

  - [ ] 12.2 Buat `src/routes/crm/approvals.ts` dengan endpoint lengkap
    - `POST /api/crm/approvals` - buat approval item baru
    - `GET /api/crm/approvals` - list dengan filter status/type
    - `GET /api/crm/approvals/:id` - detail
    - `POST /api/crm/approvals/:id/approve` - setujui (catat approver + timestamp)
    - `POST /api/crm/approvals/:id/reject` - tolak (wajib alasan)
    - `GET /api/crm/approvals/stats` - statistik total/pending/approved/rejected
    - Implementasikan side-effect: approval proposal → update status proposal; approval contract → update status kontrak
    - _Requirements: 11.3, 11.4, 11.5, 11.6, 11.7, 11.9, 11.10, 11.11_

  - [ ] 12.3 Wire tab Approvals di CRMPage ke API nyata
    - Ganti data mock di fungsi `Approvals()` dengan data dari `GET /api/crm/approvals`
    - Hubungkan tombol Approve/Reject ke endpoint API
    - Tampilkan statistik dari `GET /api/crm/approvals/stats`
    - _Requirements: 11.7, 11.8_

  - [ ]* 12.4 Tulis property test untuk inisialisasi status approval item
    - **Property 26: Inisialisasi Status Approval Item**
    - **Validates: Requirements 11.3**

  - [ ]* 12.5 Tulis property test untuk konsistensi status approval
    - **Property 27: Konsistensi Status Approval**
    - **Validates: Requirements 11.4, 11.5**

  - [ ]* 12.6 Tulis property test untuk kelengkapan metadata rejection
    - **Property 28: Kelengkapan Metadata Rejection**
    - **Validates: Requirements 11.5**

- [ ] 13. Implementasi Reimburse Management (backend + frontend wiring)
  - [ ] 13.1 Tambahkan tabel `crm_reimburse_requests` dan `crm_reimburse_receipts` ke migrasi SQL
    - Update migrasi SQL atau buat migrasi baru
    - Tambahkan TypeScript types `ReimburseRequest`, `ReimburseCategory`, `ReimburseStatus` ke `src/types/crm.ts`
    - _Requirements: 12.1, 12.2_

  - [ ] 13.2 Buat `src/routes/crm/reimburse.ts` dengan endpoint lengkap
    - `POST /api/crm/reimburse` - buat request baru (auto-generate nomor RMB-YYYY-NNNN)
    - `GET /api/crm/reimburse` - list dengan filter status/category
    - `GET /api/crm/reimburse/:id` - detail
    - `POST /api/crm/reimburse/:id/approve` - Finance_Manager setujui
    - `POST /api/crm/reimburse/:id/reject` - tolak (wajib alasan)
    - `POST /api/crm/reimburse/:id/pay` - konfirmasi pembayaran
    - `POST /api/crm/reimburse/:id/receipts` - upload receipt (max 10 MB, PDF/JPG/PNG)
    - `GET /api/crm/reimburse/stats` - statistik lengkap termasuk jumlah IDR
    - _Requirements: 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10, 12.11_

  - [ ] 13.3 Wire tab Reimburse di CRMPage ke API nyata
    - Ganti data mock di fungsi `Reimburse()` dengan data dari `GET /api/crm/reimburse`
    - Hubungkan tombol "New Request" ke form create reimburse
    - Tampilkan statistik dari `GET /api/crm/reimburse/stats`
    - _Requirements: 12.10, 12.11_

  - [ ]* 13.4 Tulis property test untuk keunikan nomor reimburse
    - **Property 29: Keunikan Nomor Reimburse**
    - **Validates: Requirements 12.3, 12.12**

  - [ ]* 13.5 Tulis property test untuk validasi ukuran dan tipe file receipt
    - **Property 30: Validasi Ukuran dan Tipe File Receipt**
    - **Validates: Requirements 12.8, 12.9**

  - [ ]* 13.6 Tulis property test untuk urutan transisi status reimburse
    - **Property 31: Urutan Transisi Status Reimburse**
    - **Validates: Requirements 12.5, 12.6**

- [ ] 14. Checkpoint - Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

- [ ] 15. Implementasi Integrasi MAFINDA_Project
  - [ ] 15.1 Buat `src/services/crm/mafindaIntegration.ts`
    - Validasi data sebelum integrasi (semua field wajib terisi)
    - Buat MAFINDA_Project via internal API call ketika kontrak berstatus "Signed"
    - Simpan `mafinda_project_id` di kontrak
    - Error handling: set `integration_status = 'Failed'`, catat error, kirim notifikasi ke Sales_Manager
    - _Requirements: 10.1, 10.2, 10.3, 10.6_

  - [ ] 15.2 Tambahkan endpoint retry dan sinkronisasi
    - `POST /api/crm/contracts/:id/retry-integration` - retry manual
    - Sinkronisasi: jika MAFINDA_Project dihapus/dinonaktifkan, update referensi di kontrak CRM
    - _Requirements: 7.6, 7.7, 10.4, 10.5_

  - [ ]* 15.3 Tulis property test untuk integrasi kontrak ke MAFINDA Project
    - **Property 20: Integrasi Kontrak ke MAFINDA Project**
    - **Validates: Requirements 7.6, 7.7, 10.1, 10.2, 10.3**

  - [ ]* 15.4 Tulis property test untuk konsistensi referensi MAFINDA Project
    - **Property 21: Konsistensi Referensi MAFINDA Project**
    - **Validates: Requirements 10.5**

  - [ ]* 15.5 Tulis property test untuk validasi format data integrasi
    - **Property 22: Validasi Format Data Integrasi**
    - **Validates: Requirements 10.6**

- [ ] 16. Implementasi Sales Target dan Analytics Dashboard
  - [ ] 16.1 Buat `src/routes/crm/targets.ts` dan `src/services/crm/dashboardService.ts`
    - `POST /api/crm/targets`, `GET /api/crm/targets`
    - Agregasi: total pipeline value, active opportunities, win rate, revenue forecast, KPI per Sales_Executive
    - Filter: periode waktu, Sales_Executive, stage pipeline
    - _Requirements: 8.2, 8.4, 8.5, 8.6, 8.7_

  - [ ] 16.2 Buat endpoint export laporan
    - `POST /api/crm/reports/export` - generate PDF dan XLSX
    - _Requirements: 8.8, 8.9_

  - [ ] 16.3 Buat komponen React analytics
    - Buat `SalesKPICard.tsx`, `TargetVsActualChart.tsx`, `WinLossAnalyticsChart.tsx`, `RevenueForecastChart.tsx`
    - Wire tab Dashboard di CRMPage dengan data analytics lengkap
    - _Requirements: 8.1, 8.5, 8.7, 8.10_

- [ ] 17. Wiring: Daftarkan semua CRM routes ke aplikasi MAFINDA
  - Daftarkan semua CRM routes ke Express app utama di bawah prefix `/api/crm`
  - Tambahkan CRM navigation menu ke sidebar MAFINDA yang sudah ada, dengan visibility berdasarkan CRM role
  - Pastikan user dengan role MAFINDA (Owner, BOD) mendapat akses read-only ke CRM sesuai requirements 9.5
  - Integrasikan `crmRbac.ts` middleware ke semua CRM routes baru (Approvals, Reimburse)
  - _Requirements: 9.1, 9.5, 9.7, 9.8_

- [ ] 18. Final Checkpoint - Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

## Catatan

- Tasks yang ditandai `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Tasks 1, 2, 4 sudah selesai (ditandai `[x]`)
- Prioritas utama: Task 5 (wire CRMPage ke API) → Task 12 (Approvals) → Task 13 (Reimburse) → Task 7 (Proposals) → Task 11 (Contracts)
- Setiap task mereferensikan requirements spesifik untuk traceability
- Checkpoint memastikan validasi inkremental di setiap fase utama
- Property tests memvalidasi correctness properties universal
- Unit tests memvalidasi contoh spesifik dan edge cases
