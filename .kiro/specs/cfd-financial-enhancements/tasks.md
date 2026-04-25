# Implementation Plan: CFD Financial Enhancements

## Overview

Implementasi dilakukan secara sequential: database schema → migration → backend services → backend routes → update kode existing → frontend components → i18n → navigasi → permission seed → tests. Setiap task bersifat atomic dan dapat dieksekusi oleh coding agent secara mandiri.

## Tasks

- [x] 1. Database Schema — Tambah tabel baru di `public` schema
  - Tambahkan definisi tabel berikut ke `src/db/schema/public.ts`:
    - `banks` (id, code unique, name, swift_code, status check, audit fields)
    - `corporate_sectors` (id, code unique, label_id, label_en, status, audit fields)
    - `currencies` (id, code unique, label, status, audit fields)
    - `cost_center_categories` (id, code unique, label_id, label_en, status, audit fields)
    - `attachments` (id, entity_type, entity_id, file_name, file_path, file_size, mime_type, audit fields + index on entity_type/entity_id)
    - `notification_configs` (id, module, event_type, role_id FK roles, is_active, audit fields + unique on module/event_type/role_id)
  - Export semua tabel baru dari `src/db/schema/index.ts` (atau file barrel yang ada)
  - _Requirements: 2.1, 4.1, 6.5, 7.1, 8.1, 9.1_

- [x] 2. Database Schema — Tambah tabel baru di `cfd` schema
  - Tambahkan definisi tabel berikut ke `src/db/schema/cfd.ts`:
    - `cash_realizations` (id, entity_type check, department_id FK, project_id FK nullable, transaction_date date, category check, amount, notes, audit fields + check constraint project required when entity_type=project)
    - `bank_loans` (id, bank_id FK public.banks, corporate_id FK, amount, start_date date, tenor int, interest_type check, interest_rate, status check default ongoing, alert_min_days default 5, audit fields)
    - `bank_loan_installments` (id, bank_loan_id FK cascade delete, installment_date date, amount, status check default unpaid, paid_date date nullable)
  - Import `banks` dari `public.ts` untuk FK di `bank_loans`
  - _Requirements: 1.5, 5.1, 5.6_

- [x] 3. Drizzle Migration — Generate dan review file SQL migration
  - Jalankan `npx drizzle-kit generate` untuk menghasilkan file migration baru di `drizzle/`
  - Review file SQL yang dihasilkan: pastikan semua tabel, constraint, index, dan FK sudah benar
  - Jalankan `npx drizzle-kit migrate` untuk mengaplikasikan migration ke database
  - _Requirements: 1.5, 2.1, 4.1, 5.1, 5.6, 6.5, 7.1, 8.1, 9.1_

- [x] 4. Migration Script — Migrasi data dari `system_configs` ke tabel master
  - Buat file `scripts/migrate-system-configs-to-tables.ts`
  - Baca nilai dari `system_configs` untuk key: `corporate_sectors`, `currencies`, `cost_center_categories`
  - INSERT ke tabel `public.corporate_sectors`, `public.currencies`, `public.cost_center_categories` menggunakan `onConflictDoNothing` berdasarkan `code`
  - Gunakan `SYSTEM_ACTOR_ID` sebagai `createdBy`
  - Log jumlah record yang dimigrasikan per tabel
  - _Requirements: 7.2, 8.2, 9.2_

- [x] 5. Backend Service — `attachmentService.ts`
  - Buat file `src/services/financial/attachmentService.ts`
  - Implementasikan fungsi `getAttachmentConfig(db)`: baca `allowed_extensions` dan `max_file_size` dari `system_configs` (dengan default fallback: extensions = ['png','jpg','doc','docx','xls','xlsx','pdf'], size = 10MB)
  - Implementasikan `validateFile(file, config)`: validasi ekstensi dan ukuran, throw error deskriptif jika gagal
  - Implementasikan `saveAttachment(db, entityType, entityId, file, userId)`: simpan file ke `assets/attachments/realisasi/:entityId/`, INSERT metadata ke `public.attachments`, return record
  - Implementasikan `deleteAttachment(db, attachmentId)`: hapus file dari disk dan DELETE record dari DB
  - Gunakan `multer` untuk file handling; konfigurasi `fileFilter` dan `limits` berdasarkan config dari DB
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 2.9_

- [x] 6. Backend Service — `installmentScheduler.ts`
  - Buat file `src/services/financial/installmentScheduler.ts`
  - Implementasikan `generateFlatInstallments(loanId, startDate, tenor, installmentAmount)`: return array `tenor` record dengan `installment_date = startDate + k months` (k=1..N), `amount = installmentAmount`, `status = 'unpaid'`
  - Implementasikan `validateEffectiveInstallments(installments, loanAmount)`: validasi jumlah installments === tenor dan sum amount ≈ loanAmount (toleransi 0.01)
  - Fungsi ini murni (pure function), tidak ada DB call — mudah di-unit test
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 7. Backend Service — `notificationCron.ts`
  - Buat file `src/services/financial/notificationCron.ts`
  - Implementasikan `queryDueInstallments(db, today)`: query `cfd.bank_loan_installments` JOIN `cfd.bank_loans` WHERE `status='unpaid'` AND `installment_date` BETWEEN `(today - alert_min_days)` AND `today` AND `loan.status='ongoing'`
  - Implementasikan `getActiveNotificationConfigs(db, module, eventType)`: query `public.notification_configs` WHERE `module=module` AND `event_type=eventType` AND `is_active=true`
  - Implementasikan `getUsersByRole(db, roleId)`: query `public.user_corporate_accesses` WHERE `role_id=roleId`
  - Implementasikan `runInstallmentNotificationCron(db)`: orkestrasi — query installments, query configs, dispatch notifikasi via `createNotification()`, log summary `[NotificationCron] Done: sent=N, skipped=M, errors=K`
  - Daftarkan cron job (00:00 daily) di `server.ts` menggunakan `node-cron` atau `setInterval`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.8, 6.9_

- [x] 8. Backend Routes — Master Banks (`/api/banks`)
  - Buat file `src/routes/financial/banks.ts`
  - Implementasikan endpoint: `GET /` (list + search + filter status + pagination), `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`
  - Tambahkan endpoint dropdown: `GET /dropdown` (return semua active banks tanpa pagination)
  - Gunakan Zod schema untuk validasi: `code` dan `name` required, `code` unique (handle 409 conflict)
  - Middleware: `authenticate` + `requirePermission('public.banks.read'/'write'/'delete')`
  - Backend HARUS apply `status = 'active'` secara otomatis untuk endpoint dropdown (jangan terima parameter status dari frontend)
  - Mount di `src/routes/financial/index.ts`: `router.use('/banks', createBanksRouter())`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 9. Backend Routes — Master Corporate Sectors, Currencies, Cost Center Categories
  - Buat tiga file route:
    - `src/routes/financial/corporateSectors.ts` → mount di `/api/corporate-sectors`
    - `src/routes/financial/currencies.ts` → mount di `/api/currencies`
    - `src/routes/financial/costCenterCategories.ts` → mount di `/api/cost-center-categories`
  - Setiap route: `GET /` (list + search + filter status + pagination), `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`
  - Tambahkan endpoint dropdown untuk setiap route: `GET /dropdown` (return semua active items tanpa pagination)
  - Validasi Zod: `code` unique per tabel (handle 409), `label_id`/`label_en` required untuk sectors dan categories
  - Middleware: `authenticate` (read terbuka untuk semua authenticated user; write/delete hanya owner)
  - Backend HARUS apply `status = 'active'` secara otomatis untuk endpoint dropdown (jangan terima parameter status dari frontend)
  - Mount ketiga router di `src/routes/financial/index.ts`
  - _Requirements: 7.1–7.5, 8.1–8.5, 9.1–9.5_

- [x] 10. Backend Routes — Cash Realizations (`/api/cash-realizations`)
  - Buat file `src/routes/financial/cashRealizations.ts`
  - Implementasikan endpoint:
    - `GET /` — list dengan filter: `entityType`, `category`, `dateFrom`, `dateTo`, search, pagination
    - `POST /` — create realization, validasi Zod `createRealizationSchema` (termasuk refine project_id required jika entity_type=project)
    - `GET /:id`, `PUT /:id`, `DELETE /:id`
    - `POST /:id/attachments` — multipart upload, gunakan `attachmentService` untuk validasi + simpan
  - Middleware: `authenticate` + `requirePermission('cfd.realizations.read'/'write'/'delete')`
  - Mount di `src/routes/financial/index.ts`
  - _Requirements: 1.1–1.8, 2.1–2.9_

- [x] 11. Backend Routes — Attachments Download (`/api/attachments`)
  - Buat file `src/routes/financial/attachments.ts`
  - Implementasikan endpoint:
    - `GET /:id/download` — verifikasi auth + permission `cfd.realizations.read`, stream file dari disk; return 403 jika tidak ada akses, 404 jika file tidak ditemukan
    - `DELETE /:id` — hapus metadata DB + file fisik via `attachmentService.deleteAttachment()`
  - Mount di `src/routes/financial/index.ts`
  - _Requirements: 2.6, 2.7_

- [x] 12. Backend Routes — Bank Loans (`/api/bank-loans`)
  - Buat file `src/routes/financial/bankLoans.ts`
  - Implementasikan endpoint:
    - `GET /` — list dengan filter status + search + pagination
    - `POST /` — create loan; jika `interest_type=flat` gunakan `installmentScheduler.generateFlatInstallments()` dan INSERT batch ke `bank_loan_installments`; jika `effective` validasi via `validateEffectiveInstallments()` lalu INSERT installments dari body; gunakan DB transaction
    - `GET /:id`, `PUT /:id`, `DELETE /:id`
    - `GET /:id/installments` — list cicilan untuk satu pinjaman
    - `PATCH /:id/installments/:installmentId/mark-paid` — set `status='paid'`, `paid_date=today`; cek apakah semua cicilan paid → jika ya, update `bank_loans.status='paid'`
  - Middleware: `authenticate` + `requirePermission('cfd.bank_loans.read'/'write'/'delete')`
  - Mount di `src/routes/financial/index.ts`
  - _Requirements: 5.1–5.11_

- [x] 13. Backend Routes — Notification Configs (`/api/notification-configs`)
  - Buat file `src/routes/financial/notificationConfigs.ts`
  - Implementasikan endpoint: `GET /` (filter module + eventType + pagination), `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`
  - Validasi Zod: `module`, `event_type`, `role_id` required; unique constraint (handle 409)
  - Middleware: `authenticate` + owner-only untuk write/delete
  - Mount di `src/routes/financial/index.ts`
  - _Requirements: 6.5, 6.6, 6.7_

- [x] 14. Checkpoint — Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

- [x] 15. Update `CorporateManager.tsx` — Gunakan endpoint master baru
  - Di fungsi `fetchConfigs()`, ganti fetch dari `/api/system-configs` ke:
    - `/api/corporate-sectors?status=active&pageSize=100` untuk `sectors`
    - `/api/currencies?status=active&pageSize=100` untuk `currencies`
  - Update `getSectorLabel()`: gunakan `s.labelId` / `s.labelEn` (bukan `s.label.id` / `s.label.en`)
  - Update form default value untuk `sector` dan `currency` agar menggunakan `code` dari data baru
  - _Requirements: 7.3, 8.3_

- [x] 16. Update `CostCenterManager.tsx` — Gunakan endpoint master baru
  - Ganti fetch `cost_center_categories` dari `system_configs` ke `/api/cost-center-categories?status=active&pageSize=100`
  - Update label rendering: gunakan `labelId` / `labelEn` sesuai bahasa aktif
  - _Requirements: 9.3_

- [x] 17. Update `TargetManager.tsx` — Gunakan endpoint master baru
  - Ganti fetch `cost_center_categories` dari `system_configs` ke `/api/cost-center-categories?status=active&pageSize=100`
  - Update label rendering: gunakan `labelId` / `labelEn` sesuai bahasa aktif
  - _Requirements: 9.3_

- [x] 18. Update `scripts/seed-public.ts` — Tambah seed tabel master baru
  - Import tabel `banks`, `corporateSectors`, `currencies`, `costCenterCategories`, `notificationConfigs` dari schema
  - Tambah seed data untuk `corporate_sectors` (4 sektor), `currencies` (3 mata uang), `cost_center_categories` (5 kategori) ke tabel masing-masing menggunakan `onConflictDoNothing`
  - Tambah seed data untuk `banks` (minimal 3 bank: BCA, Mandiri, BNI)
  - Tambah permission keys baru ke `permissionCatalog`: `cfd.realizations.read/write/delete`, `cfd.bank_loans.read/write/delete`, `public.banks.read/write/delete`
  - Tambah permission keys baru ke `rolePermissionMap` untuk role `owner` (semua) dan `subsidiary_manager` (read + write untuk realizations dan bank_loans)
  - _Requirements: 7.2, 8.2, 9.2, 10.1, 10.4_

- [x] 19. i18n Files — Buat file translasi untuk semua modul baru
  - Buat `src/i18n/bank.ts` — translasi untuk BankManager (title, subtitle, tableHead, modal, alerts, pagination, status, searchPlaceholder)
  - Buat `src/i18n/corporate-sector.ts` — translasi untuk CorporateSectorManager
  - Buat `src/i18n/currency.ts` — translasi untuk CurrencyManager
  - Buat `src/i18n/cost-center-category.ts` — translasi untuk CostCenterCategoryManager
  - Buat `src/i18n/realization.ts` — translasi untuk RealizationManager (termasuk label entity_type, category, attachment)
  - Buat `src/i18n/bank-loan.ts` — translasi untuk BankLoanManager (termasuk label interest_type, installment, mark-paid)
  - Buat `src/i18n/notification-config.ts` — translasi untuk NotificationConfigManager
  - Setiap file mengekspor objek `{ id: {...}, en: {...} }` mengikuti pola `src/i18n/corporate.ts`
  - _Requirements: 1.8, 4.8, 5.11_

- [x] 20. Frontend Component — `BankManager.tsx`
  - Buat `src/components/financial/admin/BankManager.tsx`
  - Ikuti pola `CorporateManager.tsx`: table + search + filter status + pagination + modal form
  - Form fields: `code` (uppercase), `name`, `swift_code` (opsional), `status` (active/inactive)
  - Gunakan i18n dari `src/i18n/bank.ts`
  - Permission check: `public.banks.read`, `public.banks.write`, `public.banks.delete`
  - _Requirements: 4.1–4.8_

- [x] 21. Frontend Component — Master Manager Tiga Tabel (Sectors, Currencies, CostCenterCategories)
  - Buat `src/components/financial/admin/CorporateSectorManager.tsx`
    - Form fields: `code`, `label_id`, `label_en`, `status`
    - i18n: `src/i18n/corporate-sector.ts`
  - Buat `src/components/financial/admin/CurrencyManager.tsx`
    - Form fields: `code`, `label`, `status`
    - i18n: `src/i18n/currency.ts`
  - Buat `src/components/financial/admin/CostCenterCategoryManager.tsx`
    - Form fields: `code`, `label_id`, `label_en`, `status`
    - i18n: `src/i18n/cost-center-category.ts`
  - Semua komponen mengikuti pola `CorporateManager.tsx`
  - _Requirements: 7.4, 8.4, 9.4_

- [x] 22. Frontend Component — `NotificationConfigManager.tsx`
  - Buat `src/components/financial/admin/NotificationConfigManager.tsx`
  - Table: tampilkan module, event_type, role name, is_active
  - Form: `module` (text), `event_type` (text), `role_id` (SearchableSelect dari `/api/frs/users` atau endpoint roles), `is_active` (toggle)
  - i18n: `src/i18n/notification-config.ts`
  - Permission: owner-only untuk write/delete
  - _Requirements: 6.7_

- [x] 23. Frontend Component — `RealizationManager.tsx`
  - Buat `src/components/financial/cfd/RealizationManager.tsx`
  - Table: tampilkan entity_type, department/project name, transaction_date, category (badge), amount, jumlah lampiran
  - Filter: entity_type, category, date range (dateFrom/dateTo)
  - Form fields:
    - `entity_type` (radio/select: department/project)
    - `department_id` (SearchableSelect, required)
    - `project_id` (SearchableSelect, tampil dan required hanya jika entity_type=project)
    - `transaction_date` (date input)
    - `category` (select: cash-in/cash-out)
    - `amount` (number)
    - `notes` (textarea, opsional)
  - Setelah create/edit, tampilkan section upload lampiran: multi-file input, list lampiran yang sudah ada dengan tombol download dan delete
  - i18n: `src/i18n/realization.ts`
  - Permission: `cfd.realizations.read/write/delete`
  - _Requirements: 1.1–1.8, 2.1–2.9_

- [x] 24. Frontend Component — `BankLoanManager.tsx`
  - Buat `src/components/financial/cfd/BankLoanManager.tsx`
  - Table: tampilkan bank name, corporate name, amount, tenor, interest_type, status (badge), progress cicilan (N/M paid)
  - Form create:
    - `bank_id` (SearchableSelect dari `/api/banks`)
    - `corporate_id` (SearchableSelect dari `/api/frs/corporates`)
    - `amount`, `start_date`, `tenor`, `interest_type` (flat/effective), `interest_rate`, `alert_min_days`
    - Jika `interest_type=flat`: satu field `installment_amount`
    - Jika `interest_type=effective`: render `tenor` baris input (installment_date + amount per bulan), tampilkan running total vs loan amount
  - Detail view: tampilkan tabel cicilan dengan kolom installment_date, amount, status, paid_date, dan tombol "Mark as Paid" untuk cicilan unpaid
  - i18n: `src/i18n/bank-loan.ts`
  - Permission: `cfd.bank_loans.read/write/delete`
  - _Requirements: 5.1–5.11_

- [x] 25. Sidebar / Navigation Update
  - Tambahkan menu baru di sidebar/navigasi CFD:
    - Menu "Realisasi" (ikon: `ClipboardList` atau sejenisnya) → render `RealizationManager`
    - Menu "Pinjaman Bank" (ikon: `Landmark`) → render `BankLoanManager`
  - Di section Admin, tambahkan:
    - "Master Bank" → `BankManager`
    - "Sektor Perusahaan" → `CorporateSectorManager`
    - "Mata Uang" → `CurrencyManager`
    - "Kategori Cost Center" → `CostCenterCategoryManager`
    - "Konfigurasi Notifikasi" → `NotificationConfigManager`
  - Semua menu baru harus di-guard dengan permission check yang sesuai
  - _Requirements: 1.1, 4.2, 5.7, 6.7_

- [x]* 26. Checkpoint — Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

- [ ]* 27. Unit Tests — `attachmentService` dan `installmentScheduler`
  - Buat `src/services/financial/__tests__/attachmentService.test.ts`
    - Test `validateFile()`: ekstensi valid, ekstensi tidak valid, ukuran melebihi batas, ukuran tepat di batas
    - Test `getAttachmentConfig()` dengan mock DB yang mengembalikan config dan tanpa config (fallback)
  - Buat `src/services/financial/__tests__/installmentScheduler.test.ts`
    - Test `generateFlatInstallments()`: tenor 1, tenor 12, tenor 60 — verifikasi jumlah record, tanggal, amount, status
    - Test `validateEffectiveInstallments()`: sum tepat, sum kurang, sum lebih, jumlah installments tidak sama dengan tenor
  - _Requirements: 2.3–2.5, 5.2–5.5_

- [ ]* 28. Unit Tests — `notificationCron` dan Zod schemas
  - Buat `src/services/financial/__tests__/notificationCron.test.ts`
    - Mock DB, test `queryDueInstallments()` dengan berbagai kombinasi tanggal dan status
    - Test `runInstallmentNotificationCron()`: verifikasi dispatch hanya untuk installments yang memenuhi kondisi, verifikasi log summary
  - Buat `src/services/financial/__tests__/zodSchemas.test.ts`
    - Test `createRealizationSchema`: entity_type=project tanpa project_id → reject; entity_type=department tanpa project_id → accept
    - Test `createEffectiveLoanSchema`: sum ≠ amount → reject; jumlah installments ≠ tenor → reject; valid → accept
    - Test `createFlatLoanSchema`: validasi semua field required
  - _Requirements: 6.2, 1.3, 1.4, 5.4, 5.5_

- [ ]* 29. Property-Based Tests — Realization dan Attachment
  - Buat `src/services/financial/__tests__/realization.property.test.ts`
  - Gunakan `fast-check` dengan `numRuns: 100`
  - Tag setiap test: `// Feature: cfd-financial-enhancements, Property N: <text>`
  - Implementasikan:
    - [ ]* 29.1 Property test untuk Property 1: entity_type determines project_id requirement
      - **Property 1: Realization entity_type determines project_id requirement**
      - **Validates: Requirements 1.3, 1.4**
    - [ ]* 29.2 Property test untuk Property 2: Realization data round-trip
      - **Property 2: Realization data round-trip**
      - **Validates: Requirements 1.2, 1.5**
    - [ ]* 29.3 Property test untuk Property 3: File upload extension and size validation
      - **Property 3: File upload extension and size validation**
      - **Validates: Requirements 2.3, 2.4, 2.5**
    - [ ]* 29.4 Property test untuk Property 4: Attachment download authorization
      - **Property 4: Attachment download authorization**
      - **Validates: Requirements 2.6, 2.7**

- [ ]* 30. Property-Based Tests — Bank Loans dan Master Tables
  - Buat `src/services/financial/__tests__/bankLoan.property.test.ts`
  - Implementasikan:
    - [ ]* 30.1 Property test untuk Property 7: Flat loan installment generation
      - **Property 7: Flat loan installment generation**
      - **Validates: Requirements 5.2, 5.6**
    - [ ]* 30.2 Property test untuk Property 8: Effective loan total validation
      - **Property 8: Effective loan total validation**
      - **Validates: Requirements 5.4, 5.5**
    - [ ]* 30.3 Property test untuk Property 9: Mark-paid cascades to loan status
      - **Property 9: Mark-paid cascades to loan status**
      - **Validates: Requirements 5.8, 5.9**
  - Buat `src/services/financial/__tests__/masterTables.property.test.ts`
  - Implementasikan:
    - [ ]* 30.4 Property test untuk Property 6: Master table code uniqueness
      - **Property 6: Master table code uniqueness**
      - **Validates: Requirements 4.5, 7.5, 8.5, 9.5**

- [ ]* 31. Property-Based Tests — Notification Cron dan Authorization
  - Buat `src/services/financial/__tests__/notificationCron.property.test.ts`
  - Implementasikan:
    - [ ]* 31.1 Property test untuk Property 10: Cron query selects exactly the right installments
      - **Property 10: Cron query selects exactly the right installments**
      - **Validates: Requirements 6.2**
    - [ ]* 31.2 Property test untuk Property 11: Notification dispatch matches active role configs
      - **Property 11: Notification dispatch matches active role configs**
      - **Validates: Requirements 6.4**
  - Buat `src/services/financial/__tests__/authorization.property.test.ts`
  - Implementasikan:
    - [ ]* 31.3 Property test untuk Property 12: API authorization enforcement
      - **Property 12: API authorization enforcement**
      - **Validates: Requirements 10.2, 10.3**
    - [ ]* 31.4 Property test untuk Property 5: Dashboard aggregation correctness
      - **Property 5: Dashboard aggregation correctness**
      - **Validates: Requirements 3.1**

- [~] 32. Integration Tests
  - Buat `src/services/financial/__tests__/fileUpload.integration.test.ts`
    - [ ]* 32.1 Test upload file end-to-end: upload → verifikasi file ada di disk → download → verifikasi konten
    - [ ]* 32.2 Test upload file dengan ekstensi tidak diizinkan → verifikasi 422
  - Buat `src/services/financial/__tests__/notificationCron.integration.test.ts`
    - [ ]* 32.3 Seed installments → jalankan `runInstallmentNotificationCron()` → verifikasi notifikasi di DB
    - [ ]* 32.4 Verifikasi deduplication: jalankan cron dua kali → tidak ada notifikasi duplikat
  - Buat `src/services/financial/__tests__/masterMigration.integration.test.ts`
    - [ ]* 32.5 Seed `system_configs` → jalankan migration script → verifikasi data di tabel baru → verifikasi `code` unik

- [~] 33. Final Checkpoint — Pastikan semua tests pass
  - Jalankan `npx tsc --noEmit` untuk memastikan tidak ada TypeScript error.
  - Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

## Notes

- Tasks bertanda `*` adalah opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Checkpoint memastikan validasi inkremental sebelum lanjut ke area berikutnya
- Property tests menggunakan `fast-check` dengan minimum `numRuns: 100` sesuai design
- Semua komponen frontend mengikuti pola `CorporateManager.tsx` (table + modal + i18n + SearchableSelect)
- Migration script (`scripts/migrate-system-configs-to-tables.ts`) dijalankan sekali setelah migration Drizzle
