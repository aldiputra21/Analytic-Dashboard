# Database Architecture — Corporate Finance Dashboard (CFD)

This document provides a detailed overview of the database structure, schemas, and key files used in the project.

**Database:** PostgreSQL (hosted on Neon) with Drizzle ORM

## Schemas (3)

### 1. `public`

Core tables for authentication, authorization, and system-wide settings.

- `roles`, `permissions`, `role_permissions`
- `users` (including `authz_version`, reset token fields)
- `corporates`, `departments`, `projects`
- `user_corporate_accesses` (multi-corporate access mapping)
- `notifications`, `audit_logs`, `system_configs`
- `approval_workflows`, `approval_workflow_steps`, `approvals`, `approval_histories`
- `attachments` (dengan field `status` dan `approval_id` untuk staging mechanism)
- `notification_broadcasts`, `notification_configs`
- `banks`, `corporate_sectors`, `currencies`, `cost_center_categories`
- `report_configs`, `report_outputs` (Dynamic Excel Report)

### Approval Tables — Field Penting

**`approval_workflows`**
| Kolom | Deskripsi |
|---|---|
| `view_component` | Key string dipetakan ke komponen React di `formRegistry.tsx` |
| `subject_fields` | Array field untuk extract subject dari payload (dot-notation support) |
| `callback_handler` | Key di `callbackRegistry.ts` yang dipanggil saat final approve |
| `is_active` | Jika `false`, modul kembali ke flow normal tanpa approval |

**`approvals`**
| Kolom | Deskripsi |
|---|---|
| `status` | `draft` \| `pending` \| `approved` \| `rejected` \| `cancelled` (default: `draft`) |
| `original_data` | Snapshot data sebelum diubah (hanya untuk action `edit`) |
| `subject` | Nilai yang di-extract dari payload sesuai `subject_fields` |
| `title` | String ringkas auto-generated dari subject values |
| `corporate_id` | Scope corporate untuk filtering approver |

**`approval_histories`**
| Kolom | Deskripsi |
|---|---|
| `action` | `created` \| `submit` \| `approve` \| `reject` \| `cancel` |
| `payload` | Snapshot payload saat action `submit`/`resubmit` (NULL untuk lainnya) |
| `step_id` | Nullable — NULL untuk action `created` dan `cancel` |

**`attachments`**
| Kolom | Deskripsi |
|---|---|
| `status` | `active` \| `staging` \| `orphaned` |
| `approval_id` | FK ke `approvals` — diisi saat file diupload melalui approval flow |
| `entity_id` | Nullable — NULL saat masih staging |

### Tabel Dynamic Excel Report

#### `report_configs`

Menyimpan konfigurasi laporan Excel yang dapat dikonfigurasi oleh admin tanpa perlu coding. Setiap entri mendefinisikan query SQL, filter input, mapping kolom output, template file, dan pengaturan akses.

| Kolom | Tipe | Deskripsi |
| --- | --- | --- |
| `id` | UUID PK | Primary key, auto-generated |
| `title_id` | VARCHAR(200) | Judul laporan dalam Bahasa Indonesia |
| `title_en` | VARCHAR(200) | Judul laporan dalam Bahasa Inggris |
| `filters` | JSONB | Array `FilterConfig[]` — konfigurasi filter input (lihat JSONB Fields) |
| `columns` | JSONB | Array `ColumnConfig[]` — konfigurasi kolom output Excel (lihat JSONB Fields) |
| `query` | TEXT | Query SQL SELECT yang dieksekusi saat generate laporan |
| `template_filename` | VARCHAR(255) | Nama file template `.xlsx` (nullable) |
| `cell_info_filter` | VARCHAR(10) | Alamat cell Excel untuk ringkasan filter, contoh: `A3` (nullable) |
| `start_row` | INTEGER | Baris pertama penulisan data di Excel (default: 1) |
| `allowed_roles` | JSONB | Array `string[]` — nama role yang dapat mengakses laporan ini |
| `retention_type` | VARCHAR(20) | Kebijakan retensi file output: `'immediate'` atau `'days'` |
| `retention_days` | INTEGER | Jumlah hari retensi jika `retention_type = 'days'` (nullable) |
| `is_active` | BOOLEAN | Status aktif/nonaktif laporan (default: `true`) |
| `created_by` | VARCHAR(100) | Username/ID user yang membuat |
| `created_at` | TIMESTAMPTZ | Waktu pembuatan |
| `updated_by` | VARCHAR(100) | Username/ID user yang terakhir mengubah (nullable) |
| `updated_at` | TIMESTAMPTZ | Waktu perubahan terakhir (nullable) |

#### `report_outputs`

Merepresentasikan satu request generate laporan. Menyimpan status proses (dari `pending` hingga `completed`/`failed`) dan metadata file output yang dihasilkan.

| Kolom | Tipe | Deskripsi |
| --- | --- | --- |
| `id` | UUID PK | Primary key, auto-generated |
| `report_config_id` | UUID FK | FK ke `report_configs.id` |
| `user_id` | UUID FK | FK ke `users.id` — user yang men-generate laporan |
| `filter_values` | JSONB | `Record<string, unknown>` — nilai filter yang diinput user saat generate |
| `status` | VARCHAR(30) | Status proses (lihat Status Lifecycle di bawah) |
| `started_at` | TIMESTAMPTZ | Waktu mulai pemrosesan (nullable) |
| `completed_at` | TIMESTAMPTZ | Waktu selesai pemrosesan (nullable) |
| `error_message` | TEXT | Pesan error jika status `failed` (nullable) |
| `output_path` | VARCHAR(500) | Path lengkap file output di server (nullable) |
| `output_filename` | VARCHAR(255) | Nama file output, format: `{slug}_{timestamp}_{userId}.xlsx` (nullable) |
| `file_size` | BIGINT | Ukuran file output dalam bytes (nullable) |
| `downloaded_at` | TIMESTAMPTZ | Waktu pertama kali diunduh (nullable) |
| `deleted_at` | TIMESTAMPTZ | Waktu file dihapus (nullable) |
| `created_at` | TIMESTAMPTZ | Waktu pembuatan entri |
| `created_by` | VARCHAR(100) | Username/ID user yang men-generate |

**Status Lifecycle `report_outputs`:**

```
pending → processing → completed → downloaded_deleted
                     ↘ failed
completed → expired  (via cleanup cron, retention_type='days')
```

#### Foreign Key Relationships

| FK | Referensi | Deskripsi |
| --- | --- | --- |
| `report_outputs.report_config_id` | `report_configs.id` | Setiap output terkait dengan satu konfigurasi laporan |
| `report_outputs.user_id` | `users.id` | Setiap output terkait dengan user yang men-generate |

#### JSONB Fields

**`report_configs.filters` — `FilterConfig[]`**

Setiap elemen array mendefinisikan satu input filter pada halaman generate laporan:

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| `paramName` | string | Nama parameter (alphanumeric + underscore saja), digunakan sebagai placeholder di query |
| `labelId` | string | Label filter dalam Bahasa Indonesia |
| `labelEn` | string | Label filter dalam Bahasa Inggris |
| `type` | `'text'` \| `'date'` \| `'dropdown'` | Tipe input filter |
| `order` | integer | Urutan tampil filter (integer positif) |
| `required` | boolean? | Apakah filter wajib diisi |
| `dropdownSource` | `'json'` \| `'query'`? | Sumber data dropdown (hanya jika `type='dropdown'`) |
| `dropdownItems` | `{value, label}[]`? | Opsi statis (hanya jika `dropdownSource='json'`) |
| `dropdownQuery` | string? | SQL query untuk opsi dinamis (hanya jika `dropdownSource='query'`) |

**`report_configs.columns` — `ColumnConfig[]`**

Setiap elemen array mendefinisikan satu kolom output di file Excel:

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| `fieldName` | string | Nama field dari hasil query SQL |
| `order` | integer | Urutan kolom di Excel (integer positif) |
| `dataType` | `'string'` \| `'number'` \| `'date'` \| `'currency'` | Tipe data kolom |
| `format` | string? | Format string opsional, contoh: `'DD/MM/YYYY'`, `'#,##0.00'` |
| `headerLabelId` | string? | Header kolom dalam Bahasa Indonesia |
| `headerLabelEn` | string? | Header kolom dalam Bahasa Inggris |

**`report_outputs.filter_values` — `Record<string, unknown>`**

Snapshot nilai filter yang diinput user saat men-generate laporan. Key adalah `paramName` dari `FilterConfig`, value adalah nilai yang diinput.

---

### 2. `cfd`
Financial data for the Corporate Finance Dashboard and Financial Ratio System (FRS).
- `thresholds`, `alerts`
- `balance_sheets`, `income_statements`, `cash_flow_statements`
- `target_headers`, `target_details`
- `weekly_cash_flows`

### 3. `crm`
Tables for the Customer Relationship Management module.
- `customers`, `contacts`, `interactions`
- `opportunities`, `opportunity_value_history`, `stage_transitions`
- `competitors`, `qualifications`
- `proposals`, `proposal_documents`, `proposal_versions`, `cost_estimations`
- `contracts`, `contract_documents`
- `sales_targets`

## Key Files

- `src/db/connection.ts` — Database connection via `drizzle-orm/node-postgres`
- `src/db/schema/public.ts` — Public schema definitions
- `src/db/schema/cfd.ts` — CFD schema definitions
- `src/db/schema/crm.ts` — CRM schema definitions
- `src/db/schema/index.ts` — Re-exports all schemas
- `drizzle.config.ts` — Drizzle Kit configuration

## Seed Scripts (Latest in `scripts/`)
Gunakan script di folder `scripts/` untuk mengisi data database:

- `scripts/seed-public.ts` — Mengisi data core (roles, users, corporates, depts, projects).
- `scripts/seed-cfd.ts` — Mengisi data keuangan dan targets.
- `scripts/seed-crm.ts` — Mengisi data demo CRM.
- `scripts/seed-all.ts` — Menjalankan seluruh script di atas secara berurutan.
- `scripts/reset-db.ts` — Menghapus semua data dan melakukan re-seed.

## ID Strategy
The project uses **UUID** for all primary keys to ensure global uniqueness and scalability.
```typescript
id: uuid().primaryKey().defaultRandom(),
```
