# Implementation Plan: Dynamic Excel Report

## Overview

Implementasi fitur Dynamic Excel Report menggunakan pendekatan **bottom-up**: mulai dari fondasi database dan tipe data, lalu backend services dan API routes, kemudian frontend, dan diakhiri dengan seed data dan dokumentasi. Setiap langkah membangun di atas langkah sebelumnya sehingga tidak ada kode yang tergantung (orphaned).

Design menggunakan TypeScript — semua implementasi menggunakan TypeScript.

---

## Tasks

- [x] 1. Database schema — tabel baru dan migration
  - Tambahkan definisi tabel `reportConfigs` dan `reportOutputs` ke `src/db/schema/public.ts` sesuai Drizzle schema di design document
  - Pastikan audit fields (`created_by`, `created_at`, `updated_by`, `updated_at`) ada di `reportConfigs` sesuai konvensi AGENTS.md
  - Tambahkan export kedua tabel baru ke `src/db/schema/index.ts`
  - Buat file migration SQL baru di `drizzle/` (misal `0004_dynamic_excel_report.sql`) dengan `CREATE TABLE report_configs` dan `CREATE TABLE report_outputs` beserta foreign key ke `users`
  - Update `drizzle/meta/_journal.json` untuk mencatat migration baru
  - _Requirements: 2.11, 6.1, 6.2, 11.2_

- [x] 2. TypeScript types dan Zod schemas
  - Buat file `src/types/financial/reportConfig.ts` dengan interface `FilterConfig`, `ColumnConfig`, dan type `ReportOutputStatus` sesuai design document
  - Buat file `src/services/financial/reportConfigService.ts` (stub awal) yang mengekspor `filterConfigSchema`, `columnConfigSchema`, dan `reportConfigCreateSchema` menggunakan Zod
  - Pastikan `filterConfigSchema` memvalidasi `paramName` hanya alphanumeric dan underscore, `type` enum, `order` integer positif
  - Pastikan `columnConfigSchema` memvalidasi `fieldName` non-empty, `order` integer positif, `dataType` enum
  - _Requirements: 12.3, 12.4, 3.1, 3.3_

  - [ ]* 2.1 Write property test untuk FilterConfig round-trip serialization
    - **Property 3: FilterConfig round-trip serialization**
    - Install `fast-check` sebagai devDependency: `npm install --save-dev fast-check`
    - Buat `src/services/financial/__tests__/reportConfigService.test.ts`
    - Implementasikan property test sesuai contoh di design document (Property 3)
    - **Validates: Requirements 12.1, 12.3**

  - [ ]* 2.2 Write property test untuk ColumnConfig round-trip serialization
    - **Property 4: ColumnConfig round-trip serialization**
    - Tambahkan ke file test yang sama
    - Implementasikan property test sesuai contoh di design document (Property 4)
    - **Validates: Requirements 12.2, 12.4**

- [x] 3. Read-only database connection
  - Buat file `src/db/readonlyConnection.ts` yang membuat koneksi PostgreSQL terpisah menggunakan `DATABASE_READONLY_URL` (atau fallback ke `DATABASE_URL` dengan `statement_timeout = 30000ms`)
  - Ekspor `readonlyDb` sebagai Drizzle instance yang hanya digunakan untuk SELECT query
  - Tambahkan `DATABASE_READONLY_URL` ke `.env.example` dengan komentar penjelasan
  - _Requirements: 3.5, 3.7_

- [x] 4. reportConfigService — CRUD dan query validation
  - Lengkapi `src/services/financial/reportConfigService.ts` dengan fungsi:
    - `validateReportQuery(query: string): { valid: boolean; error?: string }` — strip komentar SQL (`--` dan `/* */`), validasi diawali SELECT, tolak dangerous keywords sebagai whole-word match (case-insensitive)
    - `parseStartRowFromTemplate(templatePath: string): Promise<number>` — baca file `.xlsx` dengan ExcelJS dan deteksi baris pertama yang berisi data
    - `listReportConfigs(params)` — list dengan search (case-insensitive pada `title_id` dan `title_en`), pagination
    - `getReportConfigById(id)`, `createReportConfig(data, userId)`, `updateReportConfig(id, data, userId)`, `deleteReportConfig(id, userId)`
    - `getMenuConfigs(userRoles: string[])` — ambil semua config aktif yang `allowed_roles` overlap dengan `userRoles`
    - `filterReportConfigs(configs, query)` — filter in-memory untuk property test
  - Semua operasi write menggunakan Drizzle ORM, catat ke `audit_logs` via `auditLogService`
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.5, 2.11, 3.1, 3.2, 3.3, 3.4, 3.8, 11.1, 11.3_

  - [ ]* 4.1 Write unit tests untuk validateReportQuery
    - Buat test cases: query SELECT valid, query dengan komentar `--` dan `/* */`, query dengan INSERT embedded, query dengan UPDATE, query kosong, query dengan whitespace di awal
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 4.2 Write property test untuk validateReportQuery idempoten
    - **Property 1: validateReportQuery idempoten**
    - Tambahkan ke `src/services/financial/__tests__/reportConfigService.test.ts`
    - Implementasikan property test sesuai contoh di design document (Property 1)
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 4.3 Write property test untuk pencarian case-insensitive
    - **Property 6: Pencarian laporan case-insensitive**
    - Implementasikan property test untuk `filterReportConfigs` sesuai contoh di design document (Property 6)
    - **Validates: Requirements 1.2**

- [x] 5. reportOutputService — generate, process, dan download
  - Buat file `src/services/financial/reportOutputService.ts` dengan fungsi:
    - `buildParameterizedQuery(query: string, filterValues: Record<string, unknown>): { sql: string; params: unknown[] }` — ganti placeholder `${PARAM}` dan `{{PARAM}}` menjadi `$1..$N` dengan parameterized array
    - `assertValidStatusTransition(from: string, to: string): void` — throw jika transisi tidak valid (hanya maju: pending→processing→completed|failed, completed→downloaded_deleted)
    - `createReportOutput(configId, userId, filterValues)` — INSERT ke `report_outputs` status `pending`, kirim notifikasi "generating" via `notificationService`, trigger `processReportOutput` via `setImmediate`
    - `processReportOutput(outputId)` — UPDATE status `processing`, baca template ExcelJS, eksekusi query via `readonlyDb` dengan timeout 30s, tulis data ke Excel sesuai `Column_Config` (start_row, format), tulis ringkasan filter ke `cell_info_filter`, simpan file ke `report_output_path`, UPDATE status `completed` + metadata file; jika error UPDATE status `failed` + `error_message`
    - `downloadReportOutput(outputId, requestingUserId)` — verifikasi ownership (403 jika bukan owner), cek file ada (404 jika tidak), stream file; jika `retention_type='immediate'` hapus file dan UPDATE status `downloaded_deleted`
    - `getDropdownOptions(configId, paramName, userRoles)` — eksekusi `dropdownQuery` via `readonlyDb` untuk filter tipe dropdown+query
  - Nama file output: `{slug-laporan}_{timestamp}_{userId}.xlsx`
  - Baca path dari `system_configs` key `report_output_path` dan `report_template_path`; fallback ke default jika tidak ada (log warning)
  - Semua error di `processReportOutput` di-catch, tidak boleh crash server
  - _Requirements: 3.6, 3.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 7.1, 7.2, 7.3, 8.1, 8.2, 8.6, 9.1, 9.2, 9.3, 10.5_

  - [ ]* 5.1 Write property test untuk buildParameterizedQuery
    - **Property 2: buildParameterizedQuery — jumlah parameter konsisten**
    - Buat `src/services/financial/__tests__/reportOutputService.test.ts`
    - Implementasikan property test sesuai contoh di design document (Property 2)
    - **Validates: Requirements 3.6**

  - [ ]* 5.2 Write property test untuk status transition hanya maju
    - **Property 5: Status transition hanya maju**
    - Tambahkan ke file test yang sama
    - Implementasikan property test sesuai contoh di design document (Property 5)
    - **Validates: Requirements 6.1, 6.2, 6.8, 6.9**

  - [ ]* 5.3 Write property test untuk download authorization owner-only
    - **Property 7: Download authorization — owner-only**
    - Implementasikan property test sesuai contoh di design document (Property 7) menggunakan mock
    - **Validates: Requirements 8.1**

  - [ ]* 5.4 Write unit tests untuk processReportOutput error cases
    - Test: template file tidak ditemukan → status `failed`
    - Test: query timeout → status `failed` dengan pesan timeout
    - Test: write file gagal → status `failed`
    - _Requirements: 6.8, 6.9_

- [x] 6. reportCleanupService
  - Buat file `src/services/financial/reportCleanupService.ts` dengan fungsi `runCleanup(dbClient?)`:
    - Query semua `report_outputs` dengan `retention_type='days'` dan `completed_at < now() - retention_days`
    - Untuk setiap entri: hapus file fisik (jika ada, jika tidak ada tetap lanjut), UPDATE status `expired` + `deleted_at`, INSERT ke `audit_logs` (action `report_expired`)
    - Return `{ deleted: N, errors: K }`
    - Jika file fisik tidak ditemukan saat cleanup: tetap UPDATE status `expired`, jangan hentikan proses
  - _Requirements: 8.3, 8.4, 8.5, 8.7, 11.4_

  - [ ]* 6.1 Write unit tests untuk runCleanup
    - Test: tidak ada entri expired → return `{ deleted: 0, errors: 0 }`
    - Test: beberapa entri expired, file ada → hapus file dan UPDATE status
    - Test: entri expired, file fisik tidak ada → tetap UPDATE status `expired` tanpa error
    - _Requirements: 8.3, 8.4, 8.7_

- [ ]* 7. Checkpoint — pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

- [x] 8. API route reportConfigs
  - Buat file `src/routes/financial/reportConfigs.ts` dengan endpoint:
    - `GET /` — list configs (search, pagination), require permission `public.report_configs.read`
    - `GET /menu` — list configs aktif untuk menu (filter by user roles dari token), no auth permission khusus (cukup authenticated)
    - `GET /:id` — detail config, require `public.report_configs.read`
    - `POST /` — create config (validasi Zod `reportConfigCreateSchema` + `validateReportQuery`), require `public.report_configs.write`
    - `PUT /:id` — update config, require `public.report_configs.write`
    - `PATCH /:id/status` — toggle is_active tanpa buka modal, require `public.report_configs.write`
    - `DELETE /:id` — delete config, require `public.report_configs.delete`
    - `POST /:id/parse-template` — upload `.xlsx` dan parse `start_row`, require `public.report_configs.write`
  - Gunakan middleware RBAC berbasis permission (bukan role_name)
  - Validasi semua input dengan Zod, kembalikan error 422 dengan detail field jika tidak valid
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.9, 2.6, 2.8, 3.1, 3.2, 3.3, 3.4, 3.8, 10.1, 10.2, 10.3, 10.7, 11.5_

  - [ ]* 8.1 Write integration tests untuk reportConfigs API
    - Buat `src/routes/financial/__tests__/reportConfigs.test.ts`
    - Test: auth required (401), permission check (403), create valid config (201), create dengan query berbahaya (400), list dengan search dan pagination
    - _Requirements: 10.1, 10.2, 10.3, 3.1, 3.3_

- [x] 9. API route reportOutputs
  - Buat file `src/routes/financial/reportOutputs.ts` dengan endpoint:
    - `POST /` — create output (trigger generate), verifikasi role user ada di `allowed_roles` config (403 jika tidak), require authenticated
    - `GET /:id/download` — download file output, verifikasi ownership (403), file tidak ada (404)
    - `POST /dropdown/:configId/:paramName` — ambil opsi dropdown dari `dropdownQuery`, require authenticated
  - Semua endpoint require `authenticate` middleware
  - _Requirements: 5.8, 5.9, 6.1, 8.1, 8.6, 10.4, 10.5, 10.6_

  - [ ]* 9.1 Write integration tests untuk reportOutputs API
    - Buat `src/routes/financial/__tests__/reportOutputs.test.ts`
    - Test: create output dengan role valid (202), create output dengan role tidak valid (403), download oleh owner (200), download oleh non-owner (403), download file tidak ada (404)
    - _Requirements: 10.5, 10.6, 8.1, 8.6_

- [x] 10. Register routes baru di index.ts dan update server.ts
  - Di `src/routes/financial/index.ts`: import `createReportConfigsRouter` dan `createReportOutputsRouter`, daftarkan sebagai `router.use('/report-configs', ...)` dan `router.use('/report-outputs', ...)`
  - Di `server.ts`: import `runCleanup` dari `reportCleanupService` dan panggil di dalam `scheduleDailyCron` setelah `runInstallmentNotificationCron` (sekitar pukul 00:05 — tambahkan offset 5 menit)
  - _Requirements: 8.3, 8.4_

- [ ]* 11. Checkpoint — pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

- [x] 12. Frontend i18n — file translasi
  - Buat file `src/i18n/report-config.ts` dengan translasi ID dan EN untuk:
    - Judul halaman admin (`reportConfigManager`), label kolom tabel, label form (semua field di Requirement 2), pesan toast (create/update/delete success/error), pesan validasi
    - Label filter types (`text`, `date`, `dropdown`), label data types (`string`, `number`, `date`, `currency`)
    - Teks notifikasi: `report_generating` ("Laporan sedang dibuat" / "Report is being generated"), `report_ready` ("Laporan siap diunduh" / "Report is ready to download"), `report_failed` ("Gagal membuat laporan" / "Report generation failed")
    - Teks halaman generate laporan: judul, tombol generate, pesan processing, error states
  - Periksa `src/i18n/commons.ts` terlebih dahulu — gunakan string yang sudah ada di commons, hanya tambahkan string unik ke file modul
  - _Requirements: 1.8, 4.3, 4.4, 5.1, 5.7, 7.1, 7.2, 7.3, 7.4, 7.6_

- [x] 13. Frontend admin component — ReportConfigManager
  - Buat file `src/components/financial/admin/ReportConfigManager.tsx` mengikuti pola `CorporateManager.tsx` sebagai template:
    - Tabel dengan kolom: judul laporan (sesuai bahasa aktif), status aktif/nonaktif (toggle inline), jumlah filter, tanggal diperbarui
    - Search bar (case-insensitive), pagination dengan pilihan 10/25/50/100
    - Skeleton loading saat fetch, error state dengan tombol retry menggunakan `commonsI18n`
    - Tombol tambah/ubah (require `public.report_configs.write`), tombol hapus dengan dialog konfirmasi (require `public.report_configs.delete`)
    - Modal form dengan tab: Info Dasar, Filter, Kolom Output, Template & Output
    - Tab Filter: inline array editor untuk `FilterConfig[]` — tambah/hapus/urutkan item; field per item: paramName, labelId, labelEn, type, order, required; jika type=dropdown tampilkan pilihan source (json/query) dan field terkait
    - Tab Kolom Output: inline array editor untuk `ColumnConfig[]` — tambah/hapus/urutkan item; field per item: fieldName, order, dataType, format (opsional), headerLabelId, headerLabelEn
    - Tab Template & Output: upload `.xlsx`, tampilkan `report_template_path` dari system_configs, input `cell_info_filter`, input `start_row` (auto-parse dari template jika upload), `SearchableSelect` multi-select untuk `allowed_roles`, pilihan retensi (immediate atau N hari)
    - Toggle status aktif/nonaktif via `PATCH /:id/status` tanpa buka modal
    - Semua string dari `src/i18n/report-config.ts` dan `commonsI18n`, tidak ada hardcode
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 10.1, 10.2, 10.3_

- [x] 14. Frontend user components — DynamicFilterField dan ReportPage
  - Buat file `src/components/financial/reports/DynamicFilterField.tsx`:
    - Props: `filter: FilterConfig`, `value: unknown`, `onChange: (value: unknown) => void`, `language: 'id' | 'en'`
    - Render `<input type="text">` jika `type='text'`
    - Render `<input type="date">` jika `type='date'`
    - Render `SearchableSelect` dengan opsi statis jika `type='dropdown'` dan `dropdownSource='json'`
    - Render `SearchableSelect` dengan fetch async ke `POST /api/frs/report-outputs/dropdown/:configId/:paramName` jika `type='dropdown'` dan `dropdownSource='query'`; tampilkan error inline jika fetch gagal
    - Label dari `filter.labelId` atau `filter.labelEn` sesuai bahasa aktif
  - Buat file `src/components/financial/reports/ReportPage.tsx`:
    - Props: `configId: string`
    - Fetch config dari `GET /api/frs/report-configs/:id`; tampilkan skeleton loading saat fetch, error state dengan retry jika gagal
    - Tampilkan judul halaman dari `titleId` atau `titleEn` sesuai bahasa aktif
    - Render `DynamicFilterField` untuk setiap item di `filters`, diurutkan berdasarkan `order`
    - Validasi semua filter wajib terisi sebelum submit
    - Tombol generate: POST ke `/api/frs/report-outputs`, tampilkan toast "laporan sedang diproses" jika 202; tampilkan toast error jika gagal
    - Semua string dari `src/i18n/report-config.ts` dan `commonsI18n`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

- [x] 15. Update navigasi dan sidebar untuk grup menu laporan
  - Di `src/components/financial/dashboard/DashboardLayout.tsx`:
    - Tambahkan tipe page baru ke `FRSPage` union: `'report-config-manager'` dan `'report-{configId}'` (atau gunakan pattern dinamis)
    - Tambahkan grup baru `'reports-dynamic'` ke `groups` array dengan label dari `navigationI18n`
    - Tambahkan item menu `report-config-manager` ke grup `'system-admin'` dengan permission `public.report_configs.read`
    - Tambahkan fungsi untuk me-render item menu laporan dinamis: fetch dari `GET /api/frs/report-configs/menu`, render satu item per config aktif yang accessible; sembunyikan grup jika tidak ada item
    - Item menu dinamis menggunakan `titleId` atau `titleEn` sesuai bahasa aktif
  - Di `src/components/financial/FRSApp.tsx`:
    - Tambahkan lazy import untuk `ReportConfigManager` dan `ReportPage`
    - Tambahkan case `'report-config-manager'` di `renderPage()` yang render `<ReportConfigManager />`
    - Tambahkan case untuk halaman laporan dinamis yang render `<ReportPage configId={...} />`
  - Di `src/i18n/navigation.ts`: tambahkan label untuk grup dan item menu laporan
  - _Requirements: 1.10, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ]* 16. Checkpoint — pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

- [x] 17. Seed data — permissions baru dan system_configs keys
  - Di `scripts/seed-public.ts` (atau file seed yang relevan): tambahkan 3 permission baru ke tabel `permissions`:
    - `public.report_configs.read`
    - `public.report_configs.write`
    - `public.report_configs.delete`
  - Tambahkan 2 entri ke tabel `system_configs`:
    - `report_template_path` dengan value `"./storage/report-templates"`
    - `report_output_path` dengan value `"./storage/report-outputs"`
  - Pastikan seed bersifat idempotent (gunakan upsert atau cek keberadaan sebelum insert)
  - _Requirements: 9.1, 9.2, 10.1, 10.2, 10.3_

- [x] 18. Dokumentasi update
  - Update `docs/database/schema.md`: tambahkan deskripsi tabel `report_configs` dan `report_outputs` beserta kolom-kolomnya, relasi FK, dan keterangan JSONB fields
  - Buat `docs/modules/dynamic-excel-report.md`: ringkasan arsitektur, alur async generate, daftar API endpoints, daftar permissions, dan konfigurasi `system_configs` keys
  - _Requirements: 9.1, 9.2_

- [ ] 19. Final checkpoint — pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

---

## Notes

- Task bertanda `*` adalah opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceability
- Checkpoint memastikan validasi inkremental di setiap fase utama
- Property tests memvalidasi correctness properties universal; unit tests memvalidasi contoh spesifik dan edge cases
- `fast-check` harus diinstall sebelum menjalankan property tests (Task 2.1)
- Urutan implementasi mengikuti dependency: DB schema → Types → Services → Routes → Frontend → Seed
