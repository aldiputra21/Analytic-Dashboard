# Security, Notification, and Permission Refactor (2026-04-17)

## Summary
Dokumentasi ini merangkum perubahan arsitektur terbaru agar konsisten dengan implementasi aktif di codebase.

## Excel Import/Export
- Library `xlsx` sudah diganti ke `exceljs`.
- Export Excel sekarang asynchronous (`exportToExcel` mengembalikan `Promise<Buffer>`).
- Bulk import mendukung:
  - CSV (`.csv`)
  - Excel OpenXML (`.xlsx`)
- Format `.xls` tidak lagi didukung di flow bulk import FRS.

## Notification Refactor
- Alert CFD difan-out ke inbox notifikasi per-user melalui tabel `public.notifications`.
- Route notifikasi tersedia di:
  - `GET /api/frs/notifications/stream` (SSE)
  - `GET /api/frs/notifications` (polling fallback)
  - `PATCH /api/frs/notifications/:id/read`
  - `PATCH /api/frs/notifications/:id/archive`
- Endpoint alerts sudah diadaptasi untuk akses user-spesifik (recipient-aware) melalui model notifikasi.

## Permission Refactor
- Permission dimodelkan secara ternormalisasi dengan tabel:
  - `public.permissions`
  - `public.role_permissions`
- Resolusi izin efektif user dilakukan dari relasi role assignment (`user_corporate_accesses`) + mapping role-permission.
- Middleware RBAC FRS/CRM menggunakan permission key terstruktur (misalnya `cfd.alerts.read`).

## Authz Versioning
- Tabel `public.users` memiliki kolom `authz_version`.
- JWT memuat `authzVersion`.
- Middleware auth memverifikasi sinkronisasi versi token vs DB untuk invalidasi sesi ketika role/permission berubah.
