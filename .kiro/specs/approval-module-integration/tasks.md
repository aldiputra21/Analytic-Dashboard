# Implementation Plan: Approval Module Integration

## Overview

Mengintegrasikan sistem approval dinamis ke 10 modul CFD mengikuti pola 6-langkah yang sudah terbukti dari modul Neraca (Balance Sheet). Setiap modul memerlukan: seed data workflow, callback handler, workflow catalog entry, shared form component, form registry entry, dan modifikasi manager component.

Urutan implementasi: seed data terlebih dahulu (fondasi), lalu backend callbacks, lalu frontend (catalog → forms → registry → managers).

## Tasks

- [x] 1. Seed approval workflows untuk 10 modul baru di `scripts/seed-public.ts`
  - Tambahkan 30 entries `approval_workflows` (3 action × 10 modul) dengan `onConflictDoUpdate` pada `(module, entityType, action)`
  - Gunakan `roleMap.get('role_name')!` untuk semua `makerRole` dan `requiredRole` — tidak boleh hardcode UUID
  - Modul finansial (6 modul): `makerRole = finance_staff`, step 1 `finance_manager`, step 2 `finance_leader`
  - Modul master data (4 modul): `makerRole = corporate_admin`, step 1 `finance_manager`, step 2 `finance_leader`
  - Action `delete` untuk semua modul: 1 step saja dengan `requiredRole = finance_leader`
  - Gunakan pola `if (existingSteps.length === 0)` untuk insert `approval_workflow_steps` agar aman di-re-seed
  - Sertakan `nameEn` dan `subjectFields` yang relevan per modul (lihat design.md § Data Models)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

  - [ ]* 1.1 Write property test: seed idempoten
    - **Property 9: Seed idempoten — dapat dijalankan ulang tanpa error**
    - Jalankan seed dua kali berturut-turut, verifikasi tidak ada error duplikasi
    - **Validates: Requirements 11.2**

  - [ ]* 1.2 Write property test: steps guard
    - **Property 10: Seed steps menggunakan pola existingSteps guard**
    - Verifikasi `approval_workflow_steps` hanya diinsert jika `existingSteps.length === 0`
    - **Validates: Requirements 11.3**

- [x] 2. Checkpoint — Verifikasi seed data
  - Jalankan `npx tsx scripts/seed-public.ts` dan pastikan 30 workflow entries terbuat tanpa error
  - Verifikasi `roleMap.get()` tidak throw (semua role sudah ada dari seed sebelumnya)
  - Tanyakan ke user jika ada pertanyaan sebelum lanjut ke backend.

- [x] 3. Daftarkan 30 callback handlers di `src/services/approval/approvalCallbacks.ts`
  - Import semua tabel DB yang diperlukan dari `../../db/schema`
  - Daftarkan 3 handler per modul (create/edit/delete) menggunakan `registerCallback`
  - Handler `create`: strip `id` dari payload, gunakan `requestedBy` sebagai `createdBy`
  - Handler `edit`: strip `id`, `createdBy`, `createdAt` dari payload, gunakan `requestedBy` sebagai `updatedBy`
  - Handler `delete`: verifikasi `entityId` tidak null sebelum delete
  - Modul header-detail (Proyeksi Laba Rugi, Proyeksi Arus Kas): callback `create` insert header + details dalam transaksi; callback `delete` cascade delete details terlebih dahulu
  - _Requirements: 1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4, 8.4, 9.4, 10.4, 12.1, 12.2, 12.3, 12.4_

  - [x] 3.1 Implementasi callbacks modul finansial (6 modul)
    - `handleIncomeStatementCreate/Edit/Delete`
    - `handleIncomeStatementProjectionCreate/Edit/Delete` (header-detail, gunakan transaksi)
    - `handleWeeklyCashFlowCreate/Edit/Delete`
    - `handleRealizationCreate/Edit/Delete`
    - `handleCashFlowProjectionCreate/Edit/Delete` (header-detail, gunakan transaksi)
    - `handleBankLoanCreate/Edit/Delete`
    - _Requirements: 1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 12.1, 12.2, 12.3, 12.4_

  - [x] 3.2 Implementasi callbacks modul master data (4 modul)
    - `handleCorporateCreate/Edit/Delete`
    - `handleDepartmentCreate/Edit/Delete`
    - `handleCostCenterCreate/Edit/Delete`
    - `handleProjectCreate/Edit/Delete`
    - _Requirements: 7.4, 8.4, 9.4, 10.4, 12.1, 12.2, 12.3, 12.4_

  - [ ]* 3.3 Write property test: requestedBy sebagai createdBy
    - **Property 3: Callback create menggunakan requestedBy sebagai createdBy**
    - Untuk setiap callback create, verifikasi record yang diinsert memiliki `createdBy === requestedBy`
    - **Validates: Requirements 12.2**

  - [ ]* 3.4 Write property test: strip audit fields pada edit
    - **Property 4: Callback edit meng-strip audit fields dari payload**
    - Berikan payload yang mengandung `id`, `createdBy`, `createdAt` — verifikasi field tersebut tidak ada di update query
    - **Validates: Requirements 12.3**

  - [ ]* 3.5 Write property test: entityId guard pada delete
    - **Property 5: Callback delete memverifikasi entityId**
    - Panggil callback delete dengan `entityId = null` dan `entityId = undefined` — verifikasi keduanya throw error
    - **Validates: Requirements 12.4**

  - [ ]* 3.6 Write property test: callback atomicity
    - **Property 2: Callback atomicity — rollback saat callback gagal**
    - Simulasikan callback yang throw exception pada final approve — verifikasi status approval tetap `pending` dan tidak ada data di tabel modul
    - **Validates: Requirements 1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4, 8.4, 9.4, 10.4**

- [x] 4. Tambahkan 10 entries ke `src/components/financial/approval/workflowCatalog.ts`
  - Tambahkan entry untuk setiap modul ke array `WORKFLOW_CATALOG`
  - Setiap entry harus memiliki: `labelId`, `labelEn`, `module`, `entityType`, `viewComponent`, `callbacks` (create/edit/delete)
  - Key `viewComponent` harus identik dengan nilai yang akan didaftarkan di `FORM_REGISTRY` dan di seed data
  - _Requirements: 1.8, 3.8, 4.8, 6.8, 7.8, 8.8, 9.8, 10.8_

- [x] 5. Buat 10 shared form components di `src/components/financial/shared/forms/`
  - Setiap form mengikuti pola `BalanceSheetForm.tsx`: pure rendering dari `payload`, support `readOnly`, tidak ada fetch data
  - Definisikan `XxxPayload` interface dengan index signature `[key: string]: unknown`
  - Gunakan `commonsI18n` untuk label umum; buat file i18n modul hanya untuk string unik
  - Semua label form menggunakan class `font-bold` (standar finansial)

  - [x] 5.1 Buat `IncomeStatementForm.tsx`
    - Fields: `period`, `corporateId`, `revenue`, `cogs`, `operatingExpenses`, `interestExpense`, `taxExpense`, `otherIncome`, `otherExpense`, `notes`
    - Tampilkan kalkulasi: Gross Profit, Operating Profit, Net Income di footer form
    - Sertakan `CorporateSelector` dan `MonthPicker`
    - _Requirements: 1.6_

  - [x] 5.2 Buat `IncomeStatementProjectionForm.tsx`
    - Fields: `departmentId`, `fiscalYear`, detail baris pendapatan dan biaya per kategori
    - **Sticky Status Bar**: tampilkan Total Pendapatan dan Total Biaya mengikuti pola `BalanceSheetForm.tsx` (sticky top-0, z-10)
    - Kalkulasi dihitung dari `payload` — pure function
    - _Requirements: 2.6, 2.7, 2.8_

  - [x] 5.3 Buat `WeeklyCashFlowForm.tsx`
    - Fields: `corporateId`, `weekStart`, `weekEnd`, baris cash in/out per kategori
    - Tampilkan kalkulasi Net Cash Flow di footer form
    - _Requirements: 3.6_

  - [x] 5.4 Buat `RealizationForm.tsx`
    - Fields: `departmentId`, `transactionDate`, `costCenterId`, `projectId`, `amount`, `description`, `attachments`
    - Support `readOnly` untuk semua input termasuk file attachment display
    - _Requirements: 4.6_

  - [x] 5.5 Buat `CashFlowProjectionForm.tsx`
    - Fields: `corporateId`, `fiscalYear`, array `details` (month, group, type, description, amount)
    - **Sticky Status Bar**: tampilkan Total Cash In dan Total Cash Out mengikuti pola `BalanceSheetForm.tsx`
    - Kalkulasi dihitung dari `payload.details` — pure function
    - _Requirements: 5.6, 5.7, 5.8_

  - [x] 5.6 Buat `BankLoanForm.tsx`
    - Fields: `bankId`, `corporateId`, `loanAmount`, `interestRate`, `startDate`, `endDate`, `installmentAmount`, `notes`
    - Tampilkan kalkulasi total bunga dan sisa pokok di footer form
    - _Requirements: 6.6_

  - [x] 5.7 Buat `CorporateForm.tsx`
    - Fields: `name`, `code`, `industry`, `currency`, `address`, `phone`, `email`, `logo`
    - Gunakan `SearchableSelect` untuk `industry` dan `currency`
    - _Requirements: 7.6_

  - [x] 5.8 Buat `DepartmentForm.tsx`
    - Fields: `name`, `code`, `corporateId`
    - Gunakan `CorporateSelector` untuk `corporateId`
    - _Requirements: 8.6_

  - [x] 5.9 Buat `CostCenterForm.tsx`
    - Fields: `name`, `code`, `corporateId`, `categoryId`, `description`
    - Gunakan `SearchableSelect` untuk `categoryId`
    - _Requirements: 9.6_

  - [x] 5.10 Buat `ProjectForm.tsx`
    - Fields: `name`, `code`, `corporateId`, `departmentId`, `startDate`, `endDate`, `description`
    - Gunakan `CorporateSelector` dan `SearchableSelect` untuk `departmentId`
    - _Requirements: 10.6_

  - [ ]* 5.11 Write property test: shared form pure rendering
    - **Property 7: Shared form tidak melakukan fetch data**
    - Render setiap form dengan berbagai `payload` — verifikasi tidak ada panggilan ke `apiFetch` atau `fetch`
    - **Validates: Requirements 1.6, 2.8, 3.6, 4.6, 5.8, 6.6, 7.6, 8.6, 9.6, 10.6**

  - [ ]* 5.12 Write property test: sticky status bar selalu terlihat
    - **Property 8: Sticky status bar selalu terlihat saat scroll**
    - Verifikasi `IncomeStatementProjectionForm` dan `CashFlowProjectionForm` memiliki elemen dengan class `sticky top-0` yang berisi kalkulasi total
    - **Validates: Requirements 2.7, 5.7**

- [x] 6. Checkpoint — Verifikasi TypeScript dan rendering form
  - Jalankan `npx tsc --noEmit` — zero errors wajib
  - Pastikan semua import di form components tidak ada yang hilang atau unused
  - Tanyakan ke user jika ada pertanyaan sebelum lanjut ke registry dan manager.

- [x] 7. Daftarkan 10 form components ke `src/components/financial/approval/formRegistry.tsx`
  - Import setiap `XxxForm` dan `XxxPayload` dari file shared form yang baru dibuat
  - Tambahkan 10 entries ke `FORM_REGISTRY` menggunakan `createApprovalFormAdapter`
  - Key harus identik dengan `viewComponent` di `workflowCatalog.ts` dan seed data
  - Sertakan `extraProps` yang sesuai per form (e.g., `showCorporateSelector`, `corporateSelectorDisabled`)
  - _Requirements: 1.7, 2.9, 3.7, 4.7, 5.9, 6.7, 7.7, 8.7, 9.7, 10.7_

  - [ ]* 7.1 Write property test: form registry key konsisten
    - **Property 6: Form registry key konsisten dengan view_component di database**
    - Verifikasi setiap `viewComponent` di `WORKFLOW_CATALOG` memiliki key yang sama di `FORM_REGISTRY`
    - **Validates: Requirements 1.7, 2.9, 3.7, 4.7, 5.9, 6.7, 7.7, 8.7, 9.7, 10.7**

- [x] 8. Integrasi `useApproval` ke manager components — Modul Finansial
  - Setiap manager: tambah state `activeDraftApprovalId`, import `useApproval`, `ApprovalDetailModal`, `approvalI18n`
  - Panggil `approvalHook.recheck()` saat modal dibuka
  - Intercept `handleSave()`: Zod validation → approval check → `createDraft()` atau flow normal
  - Intercept `handleDelete()`: approval check → `createDraft()` atau flow normal delete
  - Nonaktifkan tombol Simpan saat `approvalHook.isChecking === true`
  - Render `<ApprovalDetailModal>` dengan `activeDraftApprovalId` di JSX (dalam `AnimatePresence`)
  - Tidak ada perubahan pada flow normal (jika `hasWorkflow = false`, biarkan berjalan seperti sebelumnya)

  - [x] 8.1 Modifikasi `data-entry/IncomeStatementManager.tsx`
    - `useApproval('cfd', 'income_statement', 'create/edit/delete')`
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 12.5, 12.6, 12.7, 12.9_

  - [x] 8.2 Modifikasi `admin/TargetManager.tsx`
    - `useApproval('cfd', 'income_statement_projection', 'create/edit/delete')`
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 12.5, 12.6, 12.7, 12.9_

  - [x] 8.3 Modifikasi `data-entry/WeeklyCashFlowManager.tsx`
    - `useApproval('cfd', 'weekly_cash_flow', 'create/edit/delete')`
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 12.5, 12.6, 12.7, 12.9_

  - [x] 8.4 Modifikasi `cfd/RealizationManager.tsx`
    - `useApproval('cfd', 'realization', 'create/edit/delete')`
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 12.5, 12.6, 12.7, 12.9_

  - [x] 8.5 Modifikasi `admin/CashFlowProjectionManager.tsx`
    - `useApproval('cfd', 'cash_flow_projection', 'create/edit/delete')`
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 12.5, 12.6, 12.7, 12.9_

  - [x] 8.6 Modifikasi `cfd/BankLoanManager.tsx`
    - `useApproval('cfd', 'bank_loan', 'create/edit/delete')`
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 12.5, 12.6, 12.7, 12.9_

- [x] 9. Integrasi `useApproval` ke manager components — Modul Master Data
  - Pola identik dengan task 8; perhatikan `makerRole = corporate_admin` (bukan `finance_staff`)

  - [x] 9.1 Modifikasi `admin/CorporateManager.tsx`
    - `useApproval('cfd', 'corporate', 'create/edit/delete')`
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 12.5, 12.6, 12.7, 12.9_

  - [x] 9.2 Modifikasi `admin/DepartmentManager.tsx`
    - `useApproval('cfd', 'department', 'create/edit/delete')`
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 12.5, 12.6, 12.7, 12.9_

  - [x] 9.3 Modifikasi `admin/CostCenterManager.tsx`
    - `useApproval('cfd', 'cost_center', 'create/edit/delete')`
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 12.5, 12.6, 12.7, 12.9_

  - [x] 9.4 Modifikasi `admin/ProjectManager.tsx`
    - `useApproval('cfd', 'project', 'create/edit/delete')`
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 12.5, 12.6, 12.7, 12.9_

  - [ ]* 9.5 Write property test: approval bypass saat workflow tidak aktif
    - **Property 1: Approval bypass saat workflow tidak aktif atau user tidak punya maker role**
    - Mock `useApproval` dengan `isActive = false` dan `hasMakerRole = false` — verifikasi `hasWorkflow === false` dan flow normal berjalan
    - **Validates: Requirements 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5**

- [x] 10. Checkpoint — Verifikasi TypeScript dan integrasi end-to-end
  - Jalankan `npx tsc --noEmit` — zero errors wajib
  - Pastikan tidak ada import yang hilang atau unused di semua file yang dimodifikasi
  - Tanyakan ke user jika ada pertanyaan sebelum lanjut ke dokumentasi.

- [x] 11. Update dokumentasi `docs/guides/integrating-approval.md`
  - Tambahkan 10 modul baru ke tabel "Modul yang Sudah Terintegrasi"
  - Setiap baris: Modul, Entity Type, Actions, Callback Keys, Shared Form, View Component Key
  - _Requirements: 12.8_

## Notes

- Tasks bertanda `*` adalah opsional dan dapat dilewati untuk implementasi lebih cepat
- Urutan task 1 → 3 → 4 → 5 → 7 → 8/9 harus diikuti karena ada dependensi antar komponen
- Setiap task mereferensikan requirements spesifik untuk traceability
- Pola referensi: `BalanceSheetForm.tsx`, `approvalCallbacks.ts` (Balance Sheet section), `workflowCatalog.ts`
- Modul header-detail (Proyeksi Laba Rugi, Proyeksi Arus Kas) memerlukan perhatian khusus pada callback transaksi
- `system_admin` akan selalu bypass approval karena tidak memiliki role `finance_staff` atau `corporate_admin`
