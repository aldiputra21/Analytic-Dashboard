# Requirements Document

## Introduction

Fitur ini menambahkan beberapa kapabilitas baru pada aplikasi Corporate Finance Dashboard (CFD):

1. **Menu Realisasi** — pencatatan realisasi kas (cash-in/cash-out) per departemen/proyek, terpisah dari Arus Kas, lengkap dengan lampiran file multi-file yang aman.
2. **Master Bank** — manajemen data bank (CRUD) sebagai referensi untuk modul pinjaman.
3. **Data Pinjaman Bank** — pencatatan pinjaman bank beserta jadwal cicilan, dengan logika generate otomatis (flat) atau input manual per bulan (effective).
4. **Cron Notifikasi Cicilan** — pengiriman notifikasi otomatis H-N sebelum jatuh tempo cicilan, dengan konfigurasi penerima berbasis role yang dinamis.
5. **Migrasi Master Tabel dari `system_configs`** — tiga konfigurasi (`corporate_sectors`, `currencies`, `cost_center_categories`) dipindahkan dari JSON di `system_configs` ke tabel master masing-masing agar dapat dikelola secara mandiri.

---

## Glossary

- **CFD**: Corporate Finance Dashboard — aplikasi utama yang menjadi konteks fitur ini.
- **Realization_Module**: Modul Menu Realisasi pada CFD.
- **Cash_Realization**: Entitas realisasi kas (cash-in atau cash-out) yang dicatat per departemen/proyek.
- **Attachment_Service**: Layanan pengelolaan lampiran file yang bersifat shared/commons, dapat digunakan oleh modul lain.
- **Bank_Master**: Modul master data bank.
- **Loan_Module**: Modul Data Pinjaman Bank pada CFD.
- **Installment_Scheduler**: Komponen yang bertanggung jawab men-generate jadwal cicilan berdasarkan tipe bunga.
- **Notification_Cron**: Proses terjadwal (cron job) yang berjalan tengah malam untuk mengirim notifikasi cicilan jatuh tempo.
- **Notification_Config**: Konfigurasi dinamis penerima notifikasi per modul/event/role.
- **Master_Migration**: Proses migrasi data dari `system_configs` ke tabel master relasional.
- **System**: Sistem CFD secara keseluruhan (backend + frontend).
- **User**: Pengguna yang telah terautentikasi dan memiliki akses ke CFD.
- **Admin**: Pengguna dengan role `owner` yang memiliki akses penuh ke seluruh konfigurasi sistem.
- **SearchableSelect**: Komponen dropdown dengan fitur pencarian, wajib digunakan untuk field dengan banyak opsi.
- **i18n**: Sistem internasionalisasi (Bahasa Indonesia / Bahasa Inggris) menggunakan file translasi di `src/i18n/`.

---

## Requirements

### Requirement 1: Menu Realisasi — Pencatatan Data

**User Story:** Sebagai User, saya ingin mencatat realisasi kas (cash-in/cash-out) per departemen atau proyek, sehingga saya dapat memantau realisasi keuangan secara aktual dan terpisah dari data Arus Kas mingguan.

#### Acceptance Criteria

1. THE Realization_Module SHALL menyediakan menu tersendiri yang terpisah dari menu Arus Kas di navigasi CFD.
2. WHEN User membuat entri realisasi baru, THE Realization_Module SHALL mewajibkan pengisian field: `entity_type` (department/project), `department_id`, `transaction_date`, `category` (cash-in/cash-out), dan `amount`.
3. WHEN `entity_type` bernilai `project`, THE Realization_Module SHALL mewajibkan pengisian `project_id`.
4. WHEN `entity_type` bernilai `department`, THE Realization_Module SHALL mengizinkan `project_id` kosong (opsional).
5. THE Realization_Module SHALL menyimpan entri realisasi ke tabel `cfd.cash_realizations` dengan field: `id` (UUID), `entity_type`, `department_id`, `project_id`, `transaction_date`, `category`, `amount`, `notes`, dan audit fields (`created_by`, `created_at`, `updated_by`, `updated_at`).
6. THE Realization_Module SHALL menampilkan daftar realisasi dalam tabel dengan fitur search, filter (by entity_type, category, date range), dan pagination.
7. WHEN User memilih departemen atau proyek pada form, THE Realization_Module SHALL menggunakan komponen `SearchableSelect`.
8. THE Realization_Module SHALL menggunakan file translasi i18n dan tidak melakukan hardcode label.

---

### Requirement 2: Menu Realisasi — Lampiran File

**User Story:** Sebagai User, saya ingin melampirkan satu atau lebih file pendukung pada setiap entri realisasi, sehingga ada bukti dokumen yang tersimpan dan dapat diakses kembali.

#### Acceptance Criteria

1. THE Attachment_Service SHALL menyimpan metadata lampiran ke tabel `public.cash_realization_attachments` dengan field: `id` (UUID), `entity_type`, `entity_id`, `file_name`, `file_path`, `file_size`, `mime_type`, dan audit fields.
2. THE Attachment_Service SHALL menyimpan file fisik di path `assets/attachments/realisasi/:id` di server.
3. WHEN User mengunggah file, THE Attachment_Service SHALL memvalidasi ekstensi file terhadap daftar ekstensi yang diizinkan yang tersimpan di `system_configs`.
4. WHEN User mengunggah file, THE Attachment_Service SHALL memvalidasi ukuran file tidak melebihi batas maksimal yang tersimpan di `system_configs` (default: 10MB).
5. IF ekstensi file tidak diizinkan atau ukuran file melebihi batas, THEN THE Attachment_Service SHALL menolak unggahan dan mengembalikan pesan error yang deskriptif.
6. WHEN User mengakses URL unduhan file, THE System SHALL memverifikasi bahwa User memiliki hak akses terhadap entitas terkait sebelum mengizinkan unduhan.
7. IF User tidak memiliki hak akses terhadap entitas terkait, THEN THE System SHALL mengembalikan HTTP 403 dan menolak pengiriman file.
8. THE Attachment_Service SHALL mendukung unggahan multi-file dalam satu entri realisasi.
9. WHERE konfigurasi ekstensi yang diizinkan tersedia di `system_configs`, THE Attachment_Service SHALL membaca konfigurasi tersebut saat startup dan menggunakannya untuk validasi (default: png, jpg, doc, docx, xls, xlsx, pdf).

---

### Requirement 3: Dashboard — Kalkulasi Realisasi

**User Story:** Sebagai User, saya ingin melihat data realisasi kas terintegrasi di dashboard CFD, sehingga saya dapat membandingkan rencana arus kas dengan realisasi aktual.

#### Acceptance Criteria

1. WHEN dashboard CFD menghitung total kas, THE System SHALL menggabungkan data dari tabel `cfd.weekly_cash_flows` dan `cfd.cash_realizations`.
2. THE System SHALL menampilkan ringkasan realisasi (total cash-in dan cash-out) yang dapat difilter berdasarkan periode dan entitas (departemen/proyek).

---

### Requirement 4: Master Bank

**User Story:** Sebagai Admin, saya ingin mengelola data master bank, sehingga data bank tersedia sebagai referensi untuk pencatatan pinjaman.

#### Acceptance Criteria

1. THE Bank_Master SHALL menyimpan data bank ke tabel `public.banks` dengan field: `id` (UUID), `code`, `name`, `swift_code`, `status` (active/inactive), dan audit fields.
2. THE Bank_Master SHALL menyediakan operasi CRUD (Create, Read, Update, Delete) untuk data bank.
3. THE Bank_Master SHALL menampilkan daftar bank dalam tabel dengan fitur search (by name/code), filter (by status), dan pagination.
4. WHEN Admin membuat atau memperbarui data bank, THE Bank_Master SHALL mewajibkan pengisian field `code` dan `name`.
5. THE Bank_Master SHALL memastikan `code` bank bersifat unik di seluruh tabel `public.banks`.
6. IF Admin mencoba menyimpan bank dengan `code` yang sudah ada, THEN THE Bank_Master SHALL mengembalikan pesan error yang deskriptif.
7. WHEN User memilih bank pada form dropdown, THE System SHALL menyediakan endpoint `/api/banks/dropdown` yang mengembalikan semua bank aktif tanpa pagination. Backend HARUS apply filter `status = 'active'` secara otomatis; frontend TIDAK mengirimkan parameter status.
8. THE Bank_Master SHALL menggunakan file translasi i18n dan tidak melakukan hardcode label.

---

### Requirement 5: Data Pinjaman Bank — Pencatatan Pinjaman

**User Story:** Sebagai User, saya ingin mencatat data pinjaman bank beserta detail cicilan, sehingga saya dapat memantau kewajiban pembayaran cicilan secara terpusat.

#### Acceptance Criteria

1. THE Loan_Module SHALL menyimpan data pinjaman ke tabel `cfd.bank_loans` dengan field: `id` (UUID), `bank_id` (FK ke `public.banks`), `corporate_id` (FK ke `public.corporates`), `amount`, `start_date`, `tenor` (dalam bulan), `interest_type` (flat/effective), `interest_rate`, `status` (ongoing/paid), `alert_min_days` (default: 5), dan audit fields.
2. WHEN User membuat pinjaman baru dengan `interest_type = flat`, THE Installment_Scheduler SHALL menerima satu nominal cicilan dari User dan men-generate jadwal cicilan otomatis sebanyak `tenor` bulan ke tabel `cfd.bank_loan_installments`.
3. WHEN User membuat pinjaman baru dengan `interest_type = effective`, THE Loan_Module SHALL menampilkan form input per bulan (sebanyak `tenor` bulan) di mana User harus mengisi `installment_date` dan `amount` untuk setiap bulan.
4. WHEN `interest_type = effective`, THE Loan_Module SHALL memvalidasi bahwa total `amount` seluruh cicilan sama dengan `amount` pinjaman sebelum menyimpan data.
5. IF total cicilan tidak sama dengan nominal pinjaman (untuk effective), THEN THE Loan_Module SHALL menampilkan pesan error yang deskriptif dan mencegah penyimpanan.
6. THE Loan_Module SHALL menyimpan jadwal cicilan ke tabel `cfd.bank_loan_installments` dengan field: `id` (UUID), `bank_loan_id`, `installment_date`, `amount`, `status` (paid/unpaid), `paid_date`.
7. THE Loan_Module SHALL menampilkan daftar pinjaman beserta status cicilan dan aksi "mark as paid" dalam satu halaman yang terintegrasi.
8. WHEN User menandai cicilan sebagai paid, THE Loan_Module SHALL mengisi `paid_date` dengan tanggal saat ini dan mengubah `status` cicilan menjadi `paid`.
9. WHEN semua cicilan pada sebuah pinjaman berstatus `paid`, THE System SHALL secara otomatis mengubah `status` pinjaman menjadi `paid`.
10. WHEN User memilih bank atau corporate pada form dropdown, THE System SHALL menyediakan endpoint `/api/banks/dropdown` dan `/api/frs/corporates/dropdown` yang mengembalikan semua item aktif tanpa pagination. Backend HARUS apply filter `status = 'active'` secara otomatis; frontend TIDAK mengirimkan parameter status.
11. THE Loan_Module SHALL menggunakan file translasi i18n dan tidak melakukan hardcode label.

---

### Requirement 6: Cron Notifikasi Cicilan

**User Story:** Sebagai User, saya ingin menerima notifikasi otomatis sebelum tanggal jatuh tempo cicilan, sehingga saya tidak melewatkan pembayaran cicilan pinjaman.

#### Acceptance Criteria

1. THE Notification_Cron SHALL berjalan secara terjadwal setiap tengah malam (00:00) setiap hari.
2. WHEN Notification_Cron berjalan, THE Notification_Cron SHALL mengambil semua cicilan dari `cfd.bank_loan_installments` yang memenuhi kondisi: `status = unpaid` DAN `installment_date` berada dalam rentang `(hari ini - alert_min_days)` hingga `hari ini` DAN `status` pinjaman terkait adalah `ongoing`.
3. WHEN cicilan memenuhi kondisi notifikasi, THE Notification_Cron SHALL menyisipkan notifikasi ke tabel `public.notifications` menggunakan `notificationService` yang sudah ada.
4. THE Notification_Cron SHALL mengirim notifikasi kepada User berdasarkan konfigurasi role yang tersimpan di tabel `public.notification_configs`.
5. THE System SHALL menyimpan konfigurasi penerima notifikasi di tabel `public.notification_configs` dengan field: `id` (UUID), `module` (contoh: 'cfd'), `event_type` (contoh: 'loan_installment_due'), `role_id` (FK ke `public.roles`), `is_active`, dan audit fields.
6. WHEN Admin mengubah konfigurasi `notification_configs`, THE Notification_Cron SHALL menggunakan konfigurasi terbaru pada eksekusi berikutnya.
7. THE System SHALL menyediakan antarmuka Admin untuk mengelola konfigurasi `notification_configs` (menentukan role mana yang menerima notifikasi dari modul/event tertentu).
8. IF tidak ada konfigurasi aktif untuk event `loan_installment_due`, THEN THE Notification_Cron SHALL melewati pengiriman notifikasi tanpa error.
9. THE Notification_Cron SHALL mencatat log eksekusi (jumlah notifikasi yang dikirim, error jika ada) untuk keperluan monitoring.

---

### Requirement 7: Migrasi Master — `corporate_sectors`

**User Story:** Sebagai Admin, saya ingin mengelola daftar sektor perusahaan melalui antarmuka CRUD, sehingga data sektor tidak lagi bergantung pada konfigurasi JSON statis di `system_configs`.

#### Acceptance Criteria

1. THE Master_Migration SHALL membuat tabel `public.corporate_sectors` dengan field: `id` (UUID), `code`, `label_id` (label Bahasa Indonesia), `label_en` (label Bahasa Inggris), `status` (active/inactive), dan audit fields.
2. THE Master_Migration SHALL memigrasikan data yang ada di `system_configs` dengan key `corporate_sectors` ke tabel `public.corporate_sectors`.
3. WHEN kode yang menggunakan `system_configs` key `corporate_sectors` dijalankan (termasuk `CorporateManager.tsx` dan seed), THE System SHALL membaca data dari tabel `public.corporate_sectors` dan bukan dari `system_configs`.
4. THE System SHALL menyediakan antarmuka CRUD untuk mengelola data `corporate_sectors` (tambah, ubah, hapus, aktif/nonaktif).
5. WHEN User memilih sektor pada form dropdown, THE System SHALL menyediakan endpoint `/api/corporate-sectors/dropdown` yang mengembalikan semua sektor aktif tanpa pagination. Backend HARUS apply filter `status = 'active'` secara otomatis; frontend TIDAK mengirimkan parameter status.
6. THE System SHALL memastikan `code` pada `corporate_sectors` bersifat unik.

---

### Requirement 8: Migrasi Master — `currencies`

**User Story:** Sebagai Admin, saya ingin mengelola daftar mata uang melalui antarmuka CRUD, sehingga data mata uang tidak lagi bergantung pada konfigurasi JSON statis di `system_configs`.

#### Acceptance Criteria

1. THE Master_Migration SHALL membuat tabel `public.currencies` dengan field: `id` (UUID), `code`, `label`, `status` (active/inactive), dan audit fields.
2. THE Master_Migration SHALL memigrasikan data yang ada di `system_configs` dengan key `currencies` ke tabel `public.currencies`.
3. WHEN kode yang menggunakan `system_configs` key `currencies` dijalankan (termasuk `CorporateManager.tsx` dan seed), THE System SHALL membaca data dari tabel `public.currencies` dan bukan dari `system_configs`.
4. THE System SHALL menyediakan antarmuka CRUD untuk mengelola data `currencies` (tambah, ubah, hapus, aktif/nonaktif).
5. WHEN User memilih mata uang pada form dropdown, THE System SHALL menyediakan endpoint `/api/currencies/dropdown` yang mengembalikan semua mata uang aktif tanpa pagination. Backend HARUS apply filter `status = 'active'` secara otomatis; frontend TIDAK mengirimkan parameter status.
6. THE System SHALL memastikan `code` pada `currencies` bersifat unik.

---

### Requirement 9: Migrasi Master — `cost_center_categories`

**User Story:** Sebagai Admin, saya ingin mengelola daftar kategori cost center melalui antarmuka CRUD, sehingga data kategori tidak lagi bergantung pada konfigurasi JSON statis di `system_configs`.

#### Acceptance Criteria

1. THE Master_Migration SHALL membuat tabel `public.cost_center_categories` dengan field: `id` (UUID), `code`, `label_id` (label Bahasa Indonesia), `label_en` (label Bahasa Inggris), `status` (active/inactive), dan audit fields.
2. THE Master_Migration SHALL memigrasikan data yang ada di `system_configs` dengan key `cost_center_categories` ke tabel `public.cost_center_categories`.
3. WHEN kode yang menggunakan `system_configs` key `cost_center_categories` dijalankan (termasuk `CostCenterManager.tsx`, `TargetManager.tsx`, dan seed), THE System SHALL membaca data dari tabel `public.cost_center_categories` dan bukan dari `system_configs`.
4. THE System SHALL menyediakan antarmuka CRUD untuk mengelola data `cost_center_categories` (tambah, ubah, hapus, aktif/nonaktif).
5. WHEN User memilih kategori pada form dropdown, THE System SHALL menyediakan endpoint `/api/cost-center-categories/dropdown` yang mengembalikan semua kategori aktif tanpa pagination. Backend HARUS apply filter `status = 'active'` secara otomatis; frontend TIDAK mengirimkan parameter status.
6. THE System SHALL memastikan `code` pada `cost_center_categories` bersifat unik.

---

### Requirement 10: Keamanan & Otorisasi Akses

**User Story:** Sebagai Admin, saya ingin memastikan bahwa setiap fitur baru hanya dapat diakses oleh pengguna yang memiliki izin yang sesuai, sehingga data keuangan tetap aman dan terlindungi.

#### Acceptance Criteria

1. THE System SHALL mendefinisikan permission keys baru untuk setiap modul baru: `cfd.realizations.read`, `cfd.realizations.write`, `cfd.realizations.delete`, `cfd.bank_loans.read`, `cfd.bank_loans.write`, `cfd.bank_loans.delete`, `public.banks.read`, `public.banks.write`, `public.banks.delete`.
2. WHEN User mengakses endpoint API modul baru, THE System SHALL memverifikasi bahwa User memiliki permission key yang sesuai.
3. IF User tidak memiliki permission yang diperlukan, THEN THE System SHALL mengembalikan HTTP 403 dan menolak permintaan.
4. THE System SHALL menyertakan permission keys baru dalam seed data (`scripts/seed-public.ts`) dan memetakannya ke role yang sesuai.
