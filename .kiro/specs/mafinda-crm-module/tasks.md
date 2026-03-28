# Implementation Plan: Modul CRM MAFINDA

## Overview

Implementasi modul CRM MAFINDA dilakukan secara inkremental, dimulai dari fondasi data dan role management, kemudian membangun setiap sub-modul secara berurutan mengikuti alur pipeline bisnis, dan diakhiri dengan integrasi ke MAFINDA_Project dan dashboard analytics.

Semua kode menggunakan **TypeScript** (frontend: React 18+, backend: Express.js), mengikuti konvensi yang sudah ada di codebase MAFINDA.

## Tasks

- [x] 1. Setup fondasi CRM: database schema, types, dan CRM role extension
  - Buat file migrasi SQL untuk semua tabel CRM baru (`crm_user_roles`, `crm_customers`, `crm_contacts`, `crm_interactions`, `crm_opportunities`, `crm_opportunity_value_history`, `crm_stage_transitions`, `crm_competitors`, `crm_qualifications`, `crm_proposals`, `crm_proposal_documents`, `crm_proposal_versions`, `crm_cost_estimations`, `crm_contracts`, `crm_contract_documents`, `crm_sales_targets`, `crm_audit_log`) sesuai schema di design.md
  - Buat file TypeScript types/interfaces untuk semua entitas CRM (`src/types/crm.ts`) sesuai type definitions di design.md
  - Tambahkan konstanta `STAGE_PROBABILITY` dan `STAGE_TRANSITION_REQUIREMENTS` ke types
  - Buat middleware `crmRbac.ts` yang mengextend sistem RBAC MAFINDA yang sudah ada untuk mendukung role `Sales_Manager`, `Sales_Executive`, `BD_Manager`
  - Buat helper `crmAuditLog.ts` untuk mencatat semua operasi CRM ke tabel `crm_audit_log`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 9.8_

  - [ ]* 1.1 Tulis property test untuk CRM RBAC enforcement
    - **Property 23: RBAC Enforcement**
    - **Validates: Requirements 9.2, 9.3, 9.4, 2.10**

  - [ ]* 1.2 Tulis property test untuk audit log completeness
    - **Property 24: Audit Log Completeness**
    - **Validates: Requirements 9.6**

- [x] 2. Implementasi Customer & Contact Management
  - Buat `src/routes/crm/customers.ts` dengan endpoint: `POST /api/crm/customers`, `GET /api/crm/customers`, `GET /api/crm/customers/:id`, `PUT /api/crm/customers/:id`
  - Buat `src/routes/crm/contacts.ts` dengan endpoint: `POST /api/crm/customers/:id/contacts`, `PUT /api/crm/contacts/:id`, `DELETE /api/crm/contacts/:id`
  - Buat `src/routes/crm/interactions.ts` dengan endpoint: `POST /api/crm/interactions`, `GET /api/crm/interactions`
  - Implementasikan validasi: nama perusahaan wajib, minimal satu PIC wajib, keunikan (company_name + npwp)
  - Buat komponen React `CustomerProfileForm.tsx`, `ContactForm.tsx`, `InteractionLogForm.tsx`, `CustomerList.tsx`
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
  - Buat `src/services/crm/pipelineEngine.ts` yang mengimplementasikan validasi transisi stage berdasarkan `STAGE_TRANSITION_REQUIREMENTS`, termasuk pengecekan `qualification_approved` untuk transisi ke Tender
  - Buat `src/routes/crm/opportunities.ts` dengan endpoint: `POST /api/crm/opportunities`, `GET /api/crm/opportunities`, `GET /api/crm/opportunities/:id`, `PUT /api/crm/opportunities/:id`, `POST /api/crm/opportunities/:id/transition`
  - Implementasikan logika `isStale`: opportunity dianggap stale jika tidak ada interaksi dalam 14 hari terakhir
  - Implementasikan kalkulasi `totalPipelineValue` per stage dan `weightedForecast` = sum(value * probability / 100)
  - Buat endpoint `GET /api/crm/pipeline/kanban` dan `GET /api/crm/pipeline/funnel`
  - Buat komponen React `PipelineKanbanBoard.tsx`, `OpportunityCard.tsx`, `PipelineFunnelChart.tsx`, `OpportunityForm.tsx`
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

- [ ] 5. Implementasi Qualification & Feasibility Analysis
  - Buat `src/services/crm/feasibilityCalculator.ts` yang menghitung `feasibility_score` (0-100) dari bobot kriteria teknis dan bisnis, dan menentukan rekomendasi (Proceed/Hold/Reject) berdasarkan threshold score
  - Buat `src/routes/crm/qualifications.ts` dengan endpoint: `POST /api/crm/opportunities/:id/qualification`, `GET /api/crm/opportunities/:id/qualification`, `POST /api/crm/opportunities/:id/qualification/approve`, `GET /api/crm/opportunities/:id/qualification/history`
  - Implementasikan versioning: setiap update qualification menyimpan snapshot versi sebelumnya
  - Buat komponen React `QualificationForm.tsx`, `FeasibilityScoreCard.tsx`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 5.1 Tulis property test untuk kalkulasi feasibility score
    - **Property 10: Kalkulasi Feasibility Score**
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 5.2 Tulis property test untuk versioning dokumen dan estimasi
    - **Property 11: Versioning Dokumen dan Estimasi**
    - **Validates: Requirements 3.7, 4.3, 5.3, 5.8**

- [ ] 6. Implementasi Tender & Proposal Management
  - Buat `src/routes/crm/proposals.ts` dengan endpoint: `POST /api/crm/opportunities/:id/proposals`, `GET /api/crm/opportunities/:id/proposals`, `GET /api/crm/proposals/:id`, `PUT /api/crm/proposals/:id`, `POST /api/crm/proposals/:id/documents`, `POST /api/crm/proposals/:id/submit`, `GET /api/crm/proposals/:id/versions`
  - Implementasikan auto-versioning: proposal baru dimulai dari "v1.0", setiap update menaikkan versi minor (v1.0 → v1.1)
  - Implementasikan validasi file upload: maksimal 25 MB, hanya PDF/DOCX/XLSX
  - Implementasikan logika "Overdue": proposal yang melewati `submission_deadline` tanpa status "Submitted" ditandai Overdue
  - Buat komponen React `ProposalBuilder.tsx`, `DocumentUploader.tsx`, `ProposalVersionHistory.tsx`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8, 4.9, 4.10_

  - [ ]* 6.1 Tulis property test untuk inisialisasi versi proposal
    - **Property 12: Inisialisasi Versi Proposal**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 6.2 Tulis property test untuk validasi ukuran dan tipe file
    - **Property 13: Validasi Ukuran dan Tipe File**
    - **Validates: Requirements 4.4**

  - [ ]* 6.3 Tulis property test untuk kelengkapan metadata proposal submitted
    - **Property 14: Kelengkapan Metadata Proposal Submitted**
    - **Validates: Requirements 4.9**

- [ ] 7. Checkpoint - Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

- [ ] 8. Implementasi Cost & Resource Planning
  - Buat `src/services/crm/costCalculator.ts` yang menghitung `total_cost` = sum semua komponen biaya, dan `margin_percentage` = (opportunity_value - total_cost) / opportunity_value * 100
  - Buat `src/routes/crm/costEstimations.ts` dengan endpoint: `POST /api/crm/opportunities/:id/cost-estimation`, `GET /api/crm/opportunities/:id/cost-estimation`, `PUT /api/crm/cost-estimations/:id`, `GET /api/crm/cost-estimations/:id/versions`
  - Implementasikan validasi margin minimum yang dapat dikonfigurasi oleh Sales_Manager
  - Buat komponen React `CostEstimationForm.tsx`, `ResourcePlanTable.tsx`, `MarginIndicator.tsx`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 5.8_

  - [ ]* 8.1 Tulis property test untuk kalkulasi margin biaya
    - **Property 15: Kalkulasi Margin Biaya**
    - **Validates: Requirements 5.2**

  - [ ]* 8.2 Tulis property test untuk validasi margin minimum
    - **Property 16: Validasi Margin Minimum**
    - **Validates: Requirements 5.6**

- [ ] 9. Implementasi Decision Management (Win/Loss)
  - Tambahkan endpoint `POST /api/crm/opportunities/:id/close` yang menerima `{ status, close_reason, close_category }` dan memvalidasi bahwa `close_reason` dan `close_category` wajib diisi untuk status "Lost" atau "Cancelled"
  - Buat `src/routes/crm/competitors.ts` untuk pencatatan informasi kompetitor
  - Buat `src/services/crm/winLossAnalytics.ts` yang menghitung Win_Rate = Won / (Won + Lost) * 100 per user dan per tim
  - Buat endpoint `GET /api/crm/analytics/win-loss` dan `GET /api/crm/analytics/win-rate`
  - Buat komponen React `CloseOpportunityModal.tsx`, `WinLossReport.tsx`, `CompetitorForm.tsx`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ]* 9.1 Tulis property test untuk validasi alasan penutupan deal
    - **Property 17: Validasi Alasan Penutupan Deal**
    - **Validates: Requirements 6.2**

  - [ ]* 9.2 Tulis property test untuk kalkulasi win rate
    - **Property 18: Kalkulasi Win Rate**
    - **Validates: Requirements 6.6**

- [ ] 10. Implementasi Contract Management
  - Buat `src/services/crm/contractService.ts` yang menangani pembuatan kontrak dari opportunity Won (auto-populate data dari opportunity), alur approval internal (BD_Manager → Sales_Manager), dan perubahan status kontrak
  - Buat `src/routes/crm/contracts.ts` dengan endpoint: `POST /api/crm/opportunities/:id/contracts`, `GET /api/crm/contracts/:id`, `PUT /api/crm/contracts/:id`, `POST /api/crm/contracts/:id/approve`, `POST /api/crm/contracts/:id/sign`, `POST /api/crm/contracts/:id/documents`, `GET /api/crm/contracts`
  - Implementasikan validasi state machine kontrak: hanya transisi status yang valid yang diizinkan
  - Buat komponen React `ContractForm.tsx`, `ContractApprovalFlow.tsx`, `ContractList.tsx`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.8, 7.10_

  - [ ]* 10.1 Tulis property test untuk propagasi data kontrak dari opportunity
    - **Property 19: Propagasi Data Kontrak dari Opportunity**
    - **Validates: Requirements 7.2**

- [ ] 11. Implementasi Integrasi MAFINDA_Project
  - Buat `src/services/crm/mafindaIntegration.ts` yang menangani: validasi data sebelum integrasi, pembuatan MAFINDA_Project via internal API call, penyimpanan `mafinda_project_id` di kontrak, dan error handling (set `integration_status = 'Failed'`, catat error, kirim notifikasi)
  - Tambahkan endpoint `POST /api/crm/contracts/:id/retry-integration` untuk retry manual
  - Implementasikan listener: ketika kontrak berstatus "Signed", otomatis trigger `mafindaIntegration.createProject(contractId)`
  - Implementasikan sinkronisasi: jika MAFINDA_Project dihapus/dinonaktifkan, update referensi di kontrak CRM
  - _Requirements: 5.5, 7.6, 7.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 11.1 Tulis property test untuk integrasi kontrak ke MAFINDA Project
    - **Property 20: Integrasi Kontrak ke MAFINDA Project**
    - **Validates: Requirements 7.6, 7.7, 10.1, 10.2, 10.3**

  - [ ]* 11.2 Tulis property test untuk konsistensi referensi MAFINDA Project
    - **Property 21: Konsistensi Referensi MAFINDA Project**
    - **Validates: Requirements 10.5**

  - [ ]* 11.3 Tulis property test untuk validasi format data integrasi
    - **Property 22: Validasi Format Data Integrasi**
    - **Validates: Requirements 10.6**

- [ ] 12. Checkpoint - Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

- [ ] 13. Implementasi Sales Target dan Reporting & Analytics Dashboard
  - Buat `src/routes/crm/targets.ts` dengan endpoint: `POST /api/crm/targets`, `GET /api/crm/targets`
  - Buat `src/services/crm/dashboardService.ts` yang mengagregasi: total pipeline value, active opportunities, win rate periode berjalan, revenue forecast, KPI per Sales_Executive, dan perbandingan target vs aktual
  - Buat endpoint `GET /api/crm/dashboard/metrics`, `GET /api/crm/dashboard/pipeline-summary`, `GET /api/crm/analytics/kpi`, `GET /api/crm/analytics/forecast`
  - Implementasikan filter dashboard: periode waktu, Sales_Executive, stage pipeline
  - Buat endpoint `POST /api/crm/reports/export` yang menghasilkan PDF dan XLSX
  - Buat komponen React `CRMDashboard.tsx`, `SalesKPICard.tsx`, `TargetVsActualChart.tsx`, `WinLossAnalyticsChart.tsx`, `RevenueForcastChart.tsx`
  - _Requirements: 8.1, 8.2, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [ ]* 13.1 Tulis property test untuk akurasi filter dashboard
    - **Property 25: Akurasi Filter Dashboard**
    - **Validates: Requirements 8.4**

- [ ] 14. Wiring: Integrasi semua komponen CRM ke aplikasi MAFINDA
  - Daftarkan semua CRM routes ke Express app utama di bawah prefix `/api/crm`
  - Tambahkan CRM navigation menu ke sidebar MAFINDA yang sudah ada, dengan visibility berdasarkan CRM role
  - Buat halaman utama CRM (`/crm`) dengan routing ke semua sub-modul: Customers, Pipeline, Proposals, Contracts, Analytics
  - Integrasikan `crmRbac.ts` middleware ke semua CRM routes
  - Pastikan user dengan role MAFINDA (Owner, BOD) mendapat akses read-only ke CRM sesuai requirements 9.5
  - _Requirements: 9.1, 9.5, 9.7, 9.8_

- [ ] 15. Final Checkpoint - Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

## Catatan

- Tasks yang ditandai `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Checkpoint memastikan validasi inkremental di setiap fase utama
- Property tests memvalidasi correctness properties universal
- Unit tests memvalidasi contoh spesifik dan edge cases
