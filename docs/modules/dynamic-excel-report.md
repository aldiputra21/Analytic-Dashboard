# Dynamic Excel Report — Module Documentation

## Overview

Fitur **Dynamic Excel Report** memungkinkan admin CFD mengkonfigurasi laporan Excel secara dinamis melalui UI tanpa perlu coding. Setiap konfigurasi mendefinisikan query SQL, filter input, mapping kolom output, dan template file Excel. User yang memiliki akses (berdasarkan role) dapat men-generate laporan secara asinkron, menerima notifikasi saat laporan siap, dan mengunduh hasilnya.

Penambahan laporan baru tidak memerlukan perubahan kode — cukup tambah entri `report_configs` melalui UI admin.

---

## Architecture

### Komponen Utama

```
Routes Layer
  ├── reportConfigs.ts   — CRUD konfigurasi laporan (admin)
  └── reportOutputs.ts   — Generate, download, dropdown options (user)

Services Layer
  ├── reportConfigService.ts   — CRUD report_configs, validateReportQuery, parseStartRowFromTemplate
  ├── reportOutputService.ts   — createReportOutput, processReportOutput, downloadReportOutput, buildParameterizedQuery
  └── reportCleanupService.ts  — runCleanup (hapus file expired)

Infrastructure
  ├── readonlyConnection.ts    — Koneksi DB read-only untuk eksekusi query laporan (timeout 30s)
  └── notificationService.ts   — Notifikasi real-time ke user
```

### Alur Async Generate Laporan

```
User → POST /api/frs/report-outputs
     → INSERT report_outputs (status='pending')
     → Notifikasi "laporan sedang dibuat"
     → 202 Accepted

setImmediate → processReportOutput(outputId)
             → UPDATE status='processing'
             → Baca template .xlsx (ExcelJS)
             → Eksekusi query via readonlyDb (timeout 30s)
             → Tulis data ke Excel (start_row, format per ColumnConfig)
             → Tulis ringkasan filter ke cell_info_filter
             → Simpan file ke report_output_path

  [Sukses] → UPDATE status='completed', output_path, filename, file_size
           → UPDATE notifikasi "laporan siap diunduh" + link download

  [Gagal]  → UPDATE status='failed', error_message
           → UPDATE notifikasi "gagal membuat laporan"
```

### Alur Cleanup Retensi (Cron 00:05)

```
notificationCron → runCleanup()
                 → SELECT report_outputs WHERE retention_type='days'
                   AND completed_at < now() - retention_days

  Per entri expired:
    → Hapus file fisik (jika ada; jika tidak ada, tetap lanjut)
    → UPDATE status='expired', deleted_at=now()
    → INSERT audit_logs (action='report_expired')

  → Return { deleted: N, errors: K }
```

Diagram sequence lengkap tersedia di [design.md](../../.kiro/specs/dynamic-excel-report/design.md).

---

## API Endpoints

Semua endpoint berada di bawah prefix `/api/frs/`. Semua endpoint memerlukan autentikasi (`authenticate` middleware).

### Report Configs (`/api/frs/report-configs`)

| Method | Path | Permission | Deskripsi |
| --- | --- | --- | --- |
| `GET` | `/api/frs/report-configs` | `public.report_configs.read` | List semua konfigurasi (search, pagination) |
| `GET` | `/api/frs/report-configs/menu` | Authenticated | List konfigurasi aktif yang dapat diakses user (berdasarkan role) |
| `GET` | `/api/frs/report-configs/:id` | `public.report_configs.read` | Detail satu konfigurasi |
| `POST` | `/api/frs/report-configs` | `public.report_configs.write` | Buat konfigurasi baru (validasi Zod + query safety) |
| `PUT` | `/api/frs/report-configs/:id` | `public.report_configs.write` | Update konfigurasi |
| `PATCH` | `/api/frs/report-configs/:id/status` | `public.report_configs.write` | Toggle `is_active` tanpa buka modal |
| `DELETE` | `/api/frs/report-configs/:id` | `public.report_configs.delete` | Hapus konfigurasi |
| `POST` | `/api/frs/report-configs/:id/parse-template` | `public.report_configs.write` | Upload `.xlsx` dan parse `start_row` |

**Query Parameters untuk `GET /`:**

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `search` | string | Filter case-insensitive pada `title_id` dan `title_en` |
| `page` | integer | Nomor halaman (default: 1) |
| `pageSize` | integer | Ukuran halaman: 10, 25, 50, 100 (default: 25) |

### Report Outputs (`/api/frs/report-outputs`)

| Method | Path | Akses | Deskripsi |
| --- | --- | --- | --- |
| `POST` | `/api/frs/report-outputs` | Authenticated + role di `allowed_roles` | Trigger generate laporan (async, returns 202) |
| `GET` | `/api/frs/report-outputs/:id/download` | Authenticated + ownership | Download file output (403 jika bukan owner, 404 jika file tidak ada) |
| `POST` | `/api/frs/report-outputs/dropdown/:configId/:paramName` | Authenticated + role di `allowed_roles` | Ambil opsi dropdown dari `dropdownQuery` |

---

## Permissions

Tiga permission baru ditambahkan ke tabel `permissions` untuk mengontrol akses ke fitur ini:

| Permission Key | Deskripsi |
| --- | --- |
| `public.report_configs.read` | Akses halaman admin Report Config Manager (list & detail) |
| `public.report_configs.write` | Buat, ubah, toggle status, dan upload template konfigurasi laporan |
| `public.report_configs.delete` | Hapus konfigurasi laporan |

**Catatan:** Akses user ke halaman generate laporan dikontrol melalui field `allowed_roles` di `report_configs`, bukan melalui permission key di atas.

---

## System Configs

Dua key baru di tabel `system_configs` mengontrol lokasi penyimpanan file:

| Key | Tipe Value | Default | Deskripsi |
| --- | --- | --- | --- |
| `report_template_path` | string | `"./storage/report-templates"` | Folder penyimpanan file template Excel yang diupload admin |
| `report_output_path` | string | `"./storage/report-outputs"` | Folder penyimpanan file output laporan yang di-generate user |

Jika key tidak ditemukan di `system_configs`, service akan menggunakan nilai default dan mencatat warning ke log. Nilai dapat diubah melalui tabel `system_configs` tanpa perlu deploy ulang.

---

## Database Tables

Fitur ini menambahkan dua tabel baru ke schema `public`:

- **`report_configs`** — Konfigurasi laporan (query, filter, kolom, template, akses, retensi)
- **`report_outputs`** — Record setiap request generate laporan beserta status dan metadata file output

Dokumentasi lengkap kolom, tipe data, relasi FK, dan struktur JSONB fields tersedia di [docs/database/schema.md](../database/schema.md#tabel-dynamic-excel-report).

---

## Query Safety

Semua query SQL yang disimpan di `report_configs` divalidasi oleh `validateReportQuery` sebelum disimpan:

- Query harus diawali dengan `SELECT` (setelah strip komentar `--` dan `/* */`)
- Query tidak boleh mengandung keyword berbahaya: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `EXEC`, `EXECUTE`, `ALTER`, `CREATE`, `GRANT`, `REVOKE`, `MERGE`, `CALL`, `COPY`, `VACUUM`, `ANALYZE`
- Saat eksekusi, placeholder `${PARAM}` dan `{{PARAM}}` diganti dengan parameterized query (`$1`, `$2`, ...) — tidak ada string concatenation
- Eksekusi menggunakan koneksi read-only (`readonlyConnection.ts`) dengan `statement_timeout = 30000ms`

---

## Nama File Output

File output disimpan dengan format nama:

```
{slug-laporan}_{timestamp}_{userId}.xlsx
```

Contoh: `laporan-keuangan_1714123456789_550e8400-e29b-41d4-a716-446655440000.xlsx`
