# Requirements Document — Dynamic Excel Report

## Introduction

Fitur **Dynamic Excel Report** memungkinkan admin CFD untuk mengkonfigurasi laporan Excel secara dinamis melalui UI tanpa perlu coding. Setiap konfigurasi laporan mendefinisikan query SQL, filter input, mapping kolom output, dan template file Excel. User yang memiliki akses (berdasarkan role) dapat men-generate laporan tersebut secara asinkron dengan mengisi filter yang telah dikonfigurasi, menerima notifikasi saat laporan siap, dan mengunduh hasilnya.

Fitur ini menggantikan laporan Excel statis yang ada saat ini dengan pendekatan yang sepenuhnya dapat dikonfigurasi, sehingga penambahan laporan baru tidak memerlukan perubahan kode.

---

## Glossary

- **Report_Config_Manager**: Komponen admin UI untuk CRUD konfigurasi laporan Excel.
- **Report_Config**: Satu entri konfigurasi laporan yang tersimpan di database, mencakup query, filter, kolom output, template, dan pengaturan akses.
- **Filter_Config**: Konfigurasi satu input filter dalam sebuah Report_Config (nama parameter, label, tipe, urutan).
- **Column_Config**: Konfigurasi satu kolom output dalam sebuah Report_Config (nama field, urutan, tipe data, format).
- **Report_Generator**: Halaman UI user untuk mengisi filter dan men-trigger generate laporan.
- **Report_Output**: Satu entri di tabel `report_outputs` yang merepresentasikan satu request generate laporan, mencakup status proses (pending hingga completed/failed) dan informasi file output yang dihasilkan.
- **Query_Validator**: Komponen backend yang memvalidasi keamanan query SQL sebelum disimpan dan sebelum dieksekusi.
- **Query_Executor**: Komponen backend yang mengeksekusi query laporan menggunakan read-only DB connection dengan parameterized query.
- **Job_Processor**: Background worker yang memproses antrian generate laporan secara asinkron, membaca dan menulis ke tabel `report_outputs`.
- **Cleanup_Cron**: Cron job yang berjalan di awal hari untuk menghapus Report_Output yang sudah melewati masa retensi.
- **Notification_Service**: Layanan notifikasi yang sudah ada di sistem CFD untuk mengirim notifikasi ke user.
- **ExcelJS**: Library ExcelJS 4.4.0 yang sudah tersedia di project untuk membaca template dan menulis data ke file Excel.
- **system_configs**: Tabel konfigurasi sistem yang sudah ada di schema `public`, digunakan untuk menyimpan path folder penyimpanan file.
- **RBAC**: Role-Based Access Control berbasis permission yang sudah diimplementasikan di CFD.
- **i18n**: Sistem multi-bahasa (Indonesia/English) yang sudah ada di CFD menggunakan file translasi di `src/i18n/`.
- **Drizzle_ORM**: ORM yang digunakan di project untuk semua operasi database.

---

## Requirements

---

### Requirement 1: Konfigurasi Laporan — CRUD Interface

**User Story:** Sebagai admin sistem, saya ingin mengelola konfigurasi laporan Excel melalui antarmuka CRUD yang konsisten dengan modul admin lainnya, sehingga saya dapat menambah, mengubah, menonaktifkan, dan menghapus konfigurasi laporan tanpa perlu coding.

#### Acceptance Criteria

1. THE Report_Config_Manager SHALL menampilkan daftar Report_Config dalam bentuk tabel dengan kolom: judul laporan (sesuai bahasa aktif), status aktif/nonaktif, jumlah filter, dan tanggal diperbarui.
2. THE Report_Config_Manager SHALL mendukung pencarian berdasarkan judul laporan (ID atau EN) secara case-insensitive.
3. THE Report_Config_Manager SHALL mendukung pagination dengan pilihan ukuran halaman 10, 25, 50, dan 100 baris.
4. THE Report_Config_Manager SHALL menampilkan skeleton loading saat data sedang dimuat dan error state dengan tombol retry jika pemuatan gagal.
5. WHEN pengguna dengan permission `public.report_configs.write` membuka form tambah atau ubah, THE Report_Config_Manager SHALL menampilkan form dalam modal.
6. WHEN pengguna dengan permission `public.report_configs.delete` mengklik hapus, THE Report_Config_Manager SHALL menampilkan dialog konfirmasi sebelum menghapus.
7. THE Report_Config_Manager SHALL menggunakan komponen `SearchableSelect` untuk semua input dropdown dengan banyak opsi (role akses, tipe data kolom).
8. THE Report_Config_Manager SHALL menampilkan semua label, placeholder, pesan toast, dan teks UI menggunakan file i18n tanpa hardcode string.
9. WHEN pengguna mengubah status aktif/nonaktif sebuah Report_Config, THE Report_Config_Manager SHALL memperbarui status tanpa membuka modal form.
10. THE Report_Config_Manager SHALL berada dalam grup menu **system-admin** di navigasi sidebar.

---

### Requirement 2: Field Konfigurasi Laporan

**User Story:** Sebagai admin sistem, saya ingin mengisi semua parameter konfigurasi laporan dalam satu form, sehingga laporan dapat berjalan dengan benar saat di-generate oleh user.

#### Acceptance Criteria

1. THE Report_Config_Manager SHALL mewajibkan pengisian field: judul laporan (ID), judul laporan (EN), query laporan, dan minimal satu konfigurasi kolom output.
2. THE Report_Config_Manager SHALL menyimpan judul laporan dalam dua bahasa (ID dan EN) sebagai field terpisah.
3. THE Report_Config_Manager SHALL memungkinkan admin menambah, mengurutkan, dan menghapus item dalam array Filter_Config, di mana setiap item memiliki: nama parameter (alphanumeric dan underscore saja), label ID, label EN, tipe (`text`, `date`, `dropdown`), dan urutan tampil.
4. WHERE tipe filter adalah `dropdown`, THE Report_Config_Manager SHALL memungkinkan admin memilih sumber data dropdown antara array JSON statis atau raw SQL query.
5. THE Report_Config_Manager SHALL memungkinkan admin menambah, mengurutkan, dan menghapus item dalam array Column_Config, di mana setiap item memiliki: nama field dari hasil query, urutan kolom di Excel, tipe data (string, number, date, currency), dan format opsional (contoh: `DD/MM/YYYY`, `#,##0.00`).
6. THE Report_Config_Manager SHALL memungkinkan admin mengupload file template `.xlsx` dengan menyimpan nama file asli di database dan path penyimpanan mengacu pada konfigurasi di tabel `system_configs`.
7. THE Report_Config_Manager SHALL memungkinkan admin mengisi Cell_Info_Filter (contoh: `A3`) sebagai cell tunggal tempat ringkasan filter ditampilkan saat generate.
8. THE Report_Config_Manager SHALL memungkinkan admin mengisi baris mulai konten (start row) sebagai angka integer positif, dengan nilai default yang dibaca otomatis dari template Excel jika memungkinkan.
9. THE Report_Config_Manager SHALL memungkinkan admin memilih satu atau lebih role yang dapat mengakses menu laporan ini menggunakan `SearchableSelect` multi-select.
10. THE Report_Config_Manager SHALL memungkinkan admin memilih retensi file output: hapus langsung setelah download, atau simpan selama N hari (N adalah angka integer positif yang diinput admin).
11. THE Report_Config_Manager SHALL menyimpan semua field konfigurasi ke tabel `report_configs` di schema `public` dengan audit fields (`created_by`, `created_at`, `updated_by`, `updated_at`) dan UUID sebagai primary key.

---

### Requirement 3: Validasi dan Keamanan Query SQL

**User Story:** Sebagai admin sistem, saya ingin sistem memvalidasi query SQL yang saya masukkan sebelum disimpan, sehingga hanya query SELECT yang aman yang dapat dieksekusi dan risiko SQL injection atau perusakan data dapat dicegah.

#### Acceptance Criteria

1. WHEN admin menyimpan Report_Config, THE Query_Validator SHALL menolak query yang tidak diawali dengan keyword `SELECT` (setelah strip komentar dan whitespace).
2. WHEN admin menyimpan Report_Config, THE Query_Validator SHALL menghapus semua komentar SQL (format `--` hingga akhir baris dan format `/* */`) sebelum melakukan validasi keyword.
3. WHEN admin menyimpan Report_Config, THE Query_Validator SHALL menolak query yang mengandung keyword berbahaya: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `EXEC`, `EXECUTE`, `ALTER`, `CREATE`, `GRANT`, `REVOKE`, `MERGE`, `CALL`, `COPY`, `VACUUM`, `ANALYZE` (case-insensitive, sebagai whole-word match).
4. IF query mengandung keyword berbahaya atau bukan SELECT, THEN THE Query_Validator SHALL mengembalikan pesan error spesifik yang menyebutkan keyword yang ditemukan.
5. WHEN Query_Executor menjalankan query laporan, THE Query_Executor SHALL menggunakan read-only database connection atau user PostgreSQL yang hanya memiliki privilege SELECT.
6. WHEN Query_Executor menjalankan query laporan, THE Query_Executor SHALL mengganti placeholder parameter format `${PARAM}` atau `{{PARAM}}` menggunakan parameterized query (bukan string concatenation).
7. WHEN Query_Executor menjalankan query laporan, THE Query_Executor SHALL membatalkan eksekusi query yang melebihi 30 detik dan mengembalikan error timeout ke Job_Processor.
8. THE Query_Validator SHALL memvalidasi bahwa setiap nama parameter dalam query memiliki entri yang sesuai dalam array Filter_Config sebelum menyimpan konfigurasi.

---

### Requirement 4: Grup Menu dan Item Menu Dinamis untuk Laporan

**User Story:** Sebagai user CFD, saya ingin melihat menu laporan yang relevan dengan role saya di sidebar navigasi, sehingga saya dapat mengakses laporan yang saya butuhkan tanpa melihat laporan yang tidak relevan.

#### Acceptance Criteria

1. THE Report_Config_Manager SHALL membuat grup menu baru khusus laporan di sidebar navigasi CFD, terpisah dari grup menu yang sudah ada.
2. WHEN user login, THE Report_Generator SHALL me-render item menu laporan secara dinamis berdasarkan Report_Config yang berstatus aktif dan memiliki role user yang login dalam daftar role akses yang dikonfigurasi.
3. WHEN bahasa aktif adalah Indonesia, THE Report_Generator SHALL menampilkan judul laporan (ID) sebagai label menu.
4. WHEN bahasa aktif adalah English, THE Report_Generator SHALL menampilkan judul laporan (EN) sebagai label menu.
5. IF tidak ada Report_Config aktif yang dapat diakses oleh role user yang login, THEN THE Report_Generator SHALL menyembunyikan grup menu laporan dari sidebar.
6. WHEN admin mengubah status Report_Config menjadi nonaktif, THE Report_Generator SHALL tidak lagi menampilkan item menu tersebut kepada user pada sesi berikutnya.

---

### Requirement 5: Halaman Generate Laporan

**User Story:** Sebagai user CFD, saya ingin mengisi filter laporan melalui form yang di-render secara dinamis dan men-trigger generate laporan, sehingga saya dapat mendapatkan laporan Excel sesuai kebutuhan tanpa memahami detail teknis query.

#### Acceptance Criteria

1. WHEN user membuka halaman laporan, THE Report_Generator SHALL menampilkan judul halaman menggunakan judul laporan sesuai bahasa aktif (ID atau EN).
2. THE Report_Generator SHALL me-render form filter secara dinamis berdasarkan array Filter_Config dari Report_Config yang dipilih, diurutkan berdasarkan field urutan tampil.
3. WHEN tipe filter adalah `text`, THE Report_Generator SHALL me-render input text biasa.
4. WHEN tipe filter adalah `date`, THE Report_Generator SHALL me-render date picker.
5. WHEN tipe filter adalah `dropdown` dengan sumber array JSON, THE Report_Generator SHALL me-render `SearchableSelect` dengan opsi dari array JSON tersebut.
6. WHEN tipe filter adalah `dropdown` dengan sumber SQL query, THE Report_Generator SHALL me-render `SearchableSelect` dengan opsi yang dimuat dari endpoint API yang mengeksekusi SQL query sumber tersebut menggunakan read-only connection.
7. THE Report_Generator SHALL menampilkan label filter sesuai bahasa aktif (ID atau EN) dari Filter_Config.
8. WHEN user mengklik tombol generate, THE Report_Generator SHALL memvalidasi bahwa semua filter wajib telah diisi sebelum mengirim request ke backend.
9. WHEN validasi filter berhasil, THE Report_Generator SHALL mengirim request generate ke backend dan menampilkan notifikasi bahwa laporan sedang diproses.
10. THE Report_Generator SHALL menampilkan skeleton loading saat memuat konfigurasi laporan dan error state dengan tombol retry jika pemuatan gagal.

---

### Requirement 6: Proses Generate Laporan Asinkron

**User Story:** Sebagai user CFD, saya ingin proses generate laporan berjalan di background tanpa memblokir UI, sehingga saya dapat melanjutkan pekerjaan lain sambil menunggu laporan selesai.

#### Acceptance Criteria

1. WHEN user men-trigger generate laporan, THE Job_Processor SHALL membuat entri Report_Output di tabel `report_outputs` dengan status `pending` dan mengembalikan response sukses ke frontend tanpa menunggu proses selesai.
2. WHEN Job_Processor memulai pemrosesan Report_Output, THE Job_Processor SHALL memperbarui status entri `report_outputs` menjadi `processing`.
3. WHEN Job_Processor memproses Report_Output, THE Job_Processor SHALL membaca template Excel menggunakan ExcelJS, mengeksekusi query laporan melalui Query_Executor, dan menulis data hasil query ke sheet Excel sesuai Column_Config.
4. WHEN Job_Processor menulis data ke Excel, THE Job_Processor SHALL memulai penulisan data dari baris yang dikonfigurasi di field `start_row` pada Report_Config.
5. WHEN Job_Processor menulis data ke Excel, THE Job_Processor SHALL menerapkan format kolom (tipe data dan format string) sesuai Column_Config untuk setiap sel.
6. WHEN Job_Processor menulis data ke Excel, THE Job_Processor SHALL menulis ringkasan semua filter yang diinput user (format: `NamaFilter: Nilai, NamaFilter: Nilai`) ke cell yang dikonfigurasi di field `cell_info_filter` pada Report_Config.
7. WHEN Job_Processor berhasil menyelesaikan generate, THE Job_Processor SHALL menyimpan file Excel ke folder yang dikonfigurasi di `system_configs`, memperbarui status entri `report_outputs` menjadi `completed`, dan mencatat `output_path`, `output_filename`, dan `file_size` pada entri tersebut.
8. IF Query_Executor mengembalikan error (termasuk timeout), THEN THE Job_Processor SHALL memperbarui status entri `report_outputs` menjadi `failed` dan mencatat pesan error di field `error_message`.
9. IF terjadi error saat penulisan file Excel, THEN THE Job_Processor SHALL memperbarui status entri `report_outputs` menjadi `failed` dan mencatat pesan error di field `error_message`.
10. THE Job_Processor SHALL menyimpan file Excel dengan nama file yang mengandung: nama laporan (slug), timestamp generate, dan ID user yang men-generate, dan menyimpan nama tersebut di field `output_filename` pada entri `report_outputs`.

---

### Requirement 7: Notifikasi Generate Laporan

**User Story:** Sebagai user CFD, saya ingin menerima notifikasi saat laporan sedang diproses dan saat laporan siap diunduh, sehingga saya tahu kapan laporan saya dapat diakses tanpa perlu terus memantau halaman.

#### Acceptance Criteria

1. WHEN Job_Processor membuat Report_Output baru di tabel `report_outputs`, THE Notification_Service SHALL mengirim notifikasi dengan status `unread` kepada user yang men-generate dengan pesan "laporan sedang dibuat" (ID) / "report is being generated" (EN).
2. WHEN Job_Processor berhasil menyelesaikan pemrosesan Report_Output, THE Notification_Service SHALL memperbarui notifikasi yang terkait menjadi status `unread` kembali dengan pesan "laporan siap diunduh" (ID) / "report is ready to download" (EN) beserta tombol/link download.
3. IF Job_Processor gagal memproses Report_Output, THEN THE Notification_Service SHALL memperbarui notifikasi yang terkait dengan pesan error "gagal membuat laporan" (ID) / "report generation failed" (EN).
4. THE Notification_Service SHALL menggunakan teks notifikasi dari file i18n tanpa hardcode string, baik untuk tampilan di popover notifikasi maupun halaman inbox notifikasi.
5. WHEN user mengklik tombol download pada notifikasi "laporan siap diunduh", THE Notification_Service SHALL mengarahkan user ke endpoint download Report_Output yang sesuai.
6. THE Notification_Service SHALL menyertakan judul laporan (sesuai bahasa aktif user) dalam teks notifikasi menggunakan dynamic string replacement.

---

### Requirement 8: Download dan Retensi File Output

**User Story:** Sebagai user CFD, saya ingin dapat mengunduh file laporan yang sudah selesai di-generate, dan sebagai admin saya ingin file laporan dihapus otomatis sesuai kebijakan retensi yang dikonfigurasi, sehingga storage server tidak penuh dengan file yang tidak diperlukan.

#### Acceptance Criteria

1. WHEN user mengakses endpoint download Report_Output, THE Report_Generator SHALL memverifikasi bahwa `user_id` pada entri `report_outputs` yang diminta sama dengan `user_id` dari token autentikasi yang aktif, dan mengembalikan HTTP 403 jika tidak sesuai.
2. WHEN user berhasil mengunduh Report_Output dengan setting retensi "hapus setelah download", THE Job_Processor SHALL menghapus file fisik dari server dan memperbarui status entri `report_outputs` menjadi `downloaded_deleted`.
3. WHEN Cleanup_Cron berjalan di awal hari, THE Cleanup_Cron SHALL mengidentifikasi semua entri `report_outputs` dengan `retention_type = 'days'` yang `completed_at`-nya sudah melewati `retention_days` hari.
4. WHEN Cleanup_Cron mengidentifikasi entri `report_outputs` yang sudah melewati masa retensi, THE Cleanup_Cron SHALL menghapus file fisik dari server dan memperbarui status entri tersebut menjadi `expired`.
5. THE Cleanup_Cron SHALL mencatat log setiap file yang dihapus beserta alasannya (download atau expired) ke audit log sistem.
6. IF file fisik tidak ditemukan saat proses download, THEN THE Report_Generator SHALL mengembalikan error 404 dengan pesan yang informatif kepada user.
7. IF file fisik tidak ditemukan saat Cleanup_Cron mencoba menghapus, THEN THE Cleanup_Cron SHALL tetap memperbarui status entri `report_outputs` menjadi `expired` tanpa menghentikan proses cleanup keseluruhan.

---

### Requirement 9: Konfigurasi Folder Penyimpanan

**User Story:** Sebagai admin sistem, saya ingin path folder penyimpanan file template dan file output laporan dapat dikonfigurasi melalui `system_configs`, sehingga lokasi penyimpanan dapat disesuaikan tanpa perlu mengubah kode.

#### Acceptance Criteria

1. THE Job_Processor SHALL membaca path folder penyimpanan file template Excel dari entri `system_configs` dengan key `report_template_path`.
2. THE Job_Processor SHALL membaca path folder penyimpanan file output laporan dari entri `system_configs` dengan key `report_output_path`.
3. IF entri `report_template_path` atau `report_output_path` tidak ditemukan di `system_configs`, THEN THE Job_Processor SHALL menggunakan nilai default yang terdefinisi di kode dan mencatat warning ke log.
4. THE Report_Config_Manager SHALL membaca nilai `report_template_path` dari `system_configs` untuk menampilkan informasi lokasi penyimpanan template kepada admin saat upload file.

---

### Requirement 10: RBAC dan Permission

**User Story:** Sebagai admin sistem, saya ingin akses ke konfigurasi laporan dan generate laporan dikontrol melalui sistem permission yang sudah ada di CFD, sehingga hanya pengguna yang berwenang yang dapat mengelola konfigurasi atau mengakses laporan tertentu.

#### Acceptance Criteria

1. THE Report_Config_Manager SHALL hanya dapat diakses oleh user yang memiliki permission `public.report_configs.read`.
2. THE Report_Config_Manager SHALL hanya menampilkan tombol tambah dan ubah kepada user yang memiliki permission `public.report_configs.write`.
3. THE Report_Config_Manager SHALL hanya menampilkan tombol hapus kepada user yang memiliki permission `public.report_configs.delete`.
4. THE Report_Generator SHALL hanya menampilkan item menu laporan kepada user yang role-nya terdaftar dalam field `allowed_roles` pada Report_Config yang bersangkutan.
5. WHEN backend menerima request generate laporan, THE Report_Generator SHALL memverifikasi bahwa role user terdaftar dalam `allowed_roles` Report_Config yang diminta sebelum membuat entri `report_outputs`.
6. IF user mencoba mengakses atau men-generate laporan yang tidak termasuk dalam `allowed_roles`-nya, THEN THE Report_Generator SHALL mengembalikan HTTP 403 dengan pesan error yang sesuai.
7. THE Report_Config_Manager SHALL menggunakan middleware RBAC berbasis permission (bukan role_name langsung) untuk semua endpoint API konfigurasi laporan.

---

### Requirement 11: Audit dan Integritas Data

**User Story:** Sebagai admin sistem, saya ingin semua perubahan pada konfigurasi laporan dan setiap aktivitas generate laporan tercatat dengan baik, sehingga saya dapat melakukan audit trail jika diperlukan.

#### Acceptance Criteria

1. THE Report_Config_Manager SHALL menyimpan field audit (`created_by`, `created_at`, `updated_by`, `updated_at`) pada setiap operasi create dan update Report_Config, menggunakan username atau user ID dari session yang aktif.
2. THE Job_Processor SHALL menyimpan field audit pada setiap entri `report_outputs`, mencakup: `user_id` yang men-generate, `report_config_id`, `filter_values` (JSONB), `created_at`, `started_at`, `completed_at`, dan `status`.
3. THE Report_Config_Manager SHALL mencatat setiap operasi create, update, dan delete Report_Config ke tabel `audit_logs` yang sudah ada di sistem CFD.
4. THE Cleanup_Cron SHALL mencatat setiap file yang dihapus ke tabel `audit_logs` dengan informasi: nama file, alasan penghapusan, dan timestamp.
5. THE Report_Config_Manager SHALL memvalidasi semua input menggunakan Zod schema di backend sebelum menyimpan ke database, dan mengembalikan pesan error yang spesifik untuk setiap field yang tidak valid.

---

### Requirement 12: Parser dan Serialisasi Konfigurasi Filter dan Kolom

**User Story:** Sebagai sistem, saya ingin konfigurasi filter dan kolom yang disimpan sebagai JSON di database dapat di-parse dan di-serialize dengan benar, sehingga tidak ada data konfigurasi yang hilang atau corrupt saat disimpan dan dibaca kembali.

#### Acceptance Criteria

1. WHEN Report_Config_Manager menyimpan array Filter_Config ke database, THE Report_Config_Manager SHALL menyimpannya sebagai JSONB dan dapat membacanya kembali menjadi array objek Filter_Config yang identik (round-trip property).
2. WHEN Report_Config_Manager menyimpan array Column_Config ke database, THE Report_Config_Manager SHALL menyimpannya sebagai JSONB dan dapat membacanya kembali menjadi array objek Column_Config yang identik (round-trip property).
3. THE Report_Config_Manager SHALL memvalidasi bahwa setiap item Filter_Config yang di-parse dari JSONB memiliki field wajib: `paramName` (string, alphanumeric dan underscore), `labelId` (string non-empty), `labelEn` (string non-empty), `type` (salah satu dari `text`, `date`, `dropdown`), dan `order` (integer positif).
4. THE Report_Config_Manager SHALL memvalidasi bahwa setiap item Column_Config yang di-parse dari JSONB memiliki field wajib: `fieldName` (string non-empty), `order` (integer positif), `dataType` (salah satu dari `string`, `number`, `date`, `currency`).
5. FOR ALL valid Report_Config objects, menyimpan ke database kemudian membaca kembali SHALL menghasilkan objek yang ekuivalen dengan objek asli (round-trip property).
6. IF data JSONB Filter_Config atau Column_Config tidak dapat di-parse menjadi struktur yang valid, THEN THE Report_Config_Manager SHALL mengembalikan error 422 dengan detail field yang tidak valid.
