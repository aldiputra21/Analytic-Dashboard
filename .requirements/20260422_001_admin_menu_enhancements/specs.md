# Corporate & Management Menu Enhancements (Perusahaan, Cost Center, Department, Proyek, Target)

## Background & Objectives
Meningkatkan UI/UX dan fungsionalitas dari menu-menu master data administrasi dan manajemen, termasuk Perusahaan (Corporate), Cost Center, Department, Proyek (Project), dan Target. Peningkatan ini difokuskan pada standarisasi tampilan (seperti menu Neraca), penerapan read-only view, penyempurnaan interaksi (seperti skeleton loading, animate presence), dan perbaikan integrasi data (penggunaan `system_configs` dan `user_corporate_accesses`).

## Features & Improvements
### 1. Perusahaan (Corporate)
- **UI/UX:** Skeleton loading di datatables, AnimatePresence untuk datatables dan form dialog.
- **Action:** Tambahan action 'View' (read-only mode).
- **Data Integrasi:** 
  - Field sektor menggunakan kode dari `system_configs` (key: `corporate_sectors`).
  - Currency menggunakan `system_configs` (key: `currencies`).
  - Upload logo disimpan di database dan filesystem (nama file = id corporate).
- **Form Layout:** Input kode dan sektor di baris atas (40%-60%). Chevron dropdown diperbaiki. Dropdown sektor dari `system_configs`. Bulan awal tahun fiskal menggunakan translation. Tambah slider status.
- **Datatables:** Konfirmasi dialog sebelum ubah status, hint tooltip ("klik untuk mengaktifkan/menonaktifkan").
- **Hapus Data:** Tombol cancel berfungsi, style disesuaikan dengan menu neraca.

### 2. Cost Center
- **Datatables:** Hilangkan tombol refresh dan dropdown entri, ganti dengan tombol filter. Footer datatables standar (page info, record per page & paging) seperti menu neraca.
- **Action:** Tambahan action 'View'.
- **Data Integrasi:** Kategori disimpan sebagai kode, daftar di `system_configs` (key: `cost_center_categories`).
- **Form Layout:** Hilangkan section header. Layout 2 kolom (50%). Baris 1: parent & kategori. Baris 2: kode & nama. Baris 3: deskripsi & status. Chevron diperbaiki. Dropdown kategori dari `system_configs`.
- **Lain-lain:** Perbaikan dialog hapus data dan interaksi status (konfirmasi & hint).

### 3. Department
- **Datatables:** Perbaikan data kosong (0 records bug di backend/frontend). Standarisasi header dan footer seperti cost center.
- **Action:** Tambahan action 'View'.
- **Form Layout:** Hilangkan section header. Layout 2 kolom (50%). Baris 1: perusahaan & kode. Baris 2: nama & kepala department. Baris 3: deskripsi & status. Dropdown perusahaan berdasarkan `user_corporate_accesses` user. Chevron diperbaiki.
- **Lain-lain:** Perbaikan dialog hapus data dan interaksi status.

### 4. Proyek (Project)
- **Datatables:** Standarisasi header dan footer (tanpa refresh, tambah tombol filter, footer paging).
- **Action:** Tambahan action 'View'.
- **Form Layout:** Input department menggunakan Searchable Dropdown berdasarkan `user_corporate_accesses`. Chevron status diperbaiki. Hilangkan slider status, ganti menjadi dropdown.
- **Lain-lain:** Perbaikan dialog hapus data.

### 5. Target
- **Datatables:** Standarisasi header dan footer.
- **Action:** Tambahan action 'View'.
- **Form Layout:** Lebar dropdown department 70%, tahun 30%. Department berdasarkan `user_corporate_accesses`. Dropdown tahun = tahun ini + 5 tahun ke depan (saat read-only/edit). Tambahkan slider "Terkait Proyek?". Dropdown proyek muncul jika slider ON (berdasarkan department). Chevron diperbaiki. Border eye-catching di notes. Scroll ke alert jika error.
- **Lain-lain:** Perbaikan dialog hapus data.

## General UI Rules
- Semua label input, tombol, section, dan message menggunakan translation (tidak hardcoded).
- Font input & dropdown tidak bold (normal).
- Cursor menjadi pointer (hand) saat hover dropdown dan tombol.
- Alert dapat di-close.
- Referensi layout (footer, hapus dialog): Menu Neraca (`BalanceSheetManager.tsx`).

## Acceptance Criteria
- Semua form dialog dan datatable mematuhi general rules di atas.
- Modifikasi status melalui datatable diubah dengan validasi dialog dan API sukses mengupdate database.
- Action view pada setiap menu menampilkan data dengan input field read-only.
- Implementasi seed untuk `system_configs` berhasil (Sektor, Currency, Kategori Cost Center).
- Form dapat menyimpan data dengan field yang terupdate dengan benar (upload gambar corporate dsb).
