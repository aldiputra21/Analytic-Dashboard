# Requirements Document

## Introduction

Fitur **Export & Upload Module** menambahkan kemampuan ekspor data ke file Excel/CSV dan impor data via file template Excel pada Corporate Finance Dashboard (CFD). Fitur ini mencakup 11 modul: 7 modul finansial (Neraca, Laba Rugi, Proyeksi Laba Rugi, Arus Kas Weekly, Realisasi, Proyeksi Arus Kas, Pinjaman Bank) dan 4 modul master data (Perusahaan, Departemen, Cost Center, Proyek).

Ekspor menggunakan permission `*.read` yang sudah ada. Upload menggunakan permission baru `*.upload`. Modul finansial wajib melalui approval workflow sebelum data masuk ke tabel utama. Modul master data mengikuti pola approval yang sudah ada (opsional berdasarkan konfigurasi workflow).

---

## Glossary

- **Export_Service**: Layanan backend yang menghasilkan file Excel/CSV dari data yang difilter.
- **Upload_Service**: Layanan backend yang memproses file template Excel yang diunggah user.
- **Staging_Table**: Tabel sementara (`upload_staging_rows`) yang menyimpan baris data hasil parsing sebelum divalidasi dan dimasukkan ke tabel utama.
- **Upload_Session**: Record di tabel `upload_sessions` yang merepresentasikan satu sesi upload, menyimpan status, nama file, jumlah record, dan metadata.
- **Template_Config**: Konfigurasi template upload per-modul yang disimpan di tabel `system_configs` dengan key `upload_template_{entity_type}`, berisi nama file template, nomor baris mulai data (`start_record`), dan urutan kolom (`column_order`).
- **Template_Base_Path**: Konfigurasi global di tabel `system_configs` dengan key `upload_template_base_path` yang menyimpan path direktori tempat semua file template disimpan. Full path template = `base_path + filename`.
- **Column_Order**: Array string yang mendefinisikan urutan kolom dalam file template Excel dan urutan parsing saat upload, disimpan sebagai field `column_order` di dalam Template_Config.
- **Approval_Engine**: Sistem approval dinamis yang sudah ada di `src/services/approval/approvalEngine.ts`.
- **Upload_Approval_Workflow**: Konfigurasi approval workflow tersendiri dengan action `upload` untuk setiap modul yang dicakup, terpisah dari workflow `create`/`edit`/`delete`.
- **Upload_Approval_Form**: Komponen React `XxxUploadApprovalForm.tsx` yang menampilkan detail upload session (nama file, link download, tabel rows dengan search & paging) di dalam `ApprovalDetailModal`.
- **Audit_Log**: Tabel `audit_logs` yang mencatat setiap aksi upload dengan action `upload`, menyimpan summary dan detail per-baris sebagai JSON di kolom `metadata`.
- **Filter_Context**: Kumpulan parameter filter yang sedang aktif di UI saat tombol export diklik.
- **Grouped_Format**: Format Excel untuk data one-to-many di mana header ditulis sekali dan detail ditulis di baris-baris berikutnya dengan kolom identifier.
- **Flat_Format**: Format Excel untuk template upload one-to-many di mana setiap baris berisi kolom header dan kolom detail, dikelompokkan via kolom identifier.
- **RBAC**: Role-Based Access Control — sistem kontrol akses berbasis permission yang sudah ada.
- **i18n**: Internasionalisasi — semua string UI wajib menggunakan file translasi, tidak boleh hardcode.
- **Upload_Reviewer**: User yang memiliki permission `*.upload` ATAU memiliki role yang terdaftar sebagai `maker_role` atau `required_role` di `approval_workflows` / `approval_workflow_steps` untuk modul upload yang bersangkutan.
- **Upload_History_View**: Komponen UI yang menampilkan daftar Upload_Session beserta detail baris data untuk suatu modul, dapat diakses oleh user dengan permission `*.read`. Tampilan detail baris menggunakan komponen yang sama dengan Upload_Approval_Form (nama file + tombol download + tabel rows dengan search & paging server-side).
- **Upload_History_Endpoint**: Endpoint backend yang menyediakan daftar Upload_Session yang difilter berdasarkan `entityType` modul, dapat diakses oleh user dengan permission `*.read`.
- **Backend_History_Download_Endpoint**: Endpoint backend untuk mengunduh file upload di konteks riwayat, dapat diakses oleh user dengan permission `*.read` (berbeda dari Backend_Download_Endpoint yang memerlukan permission `*.upload`).

---

## Requirements

### Requirement 1: Tombol Export di Toolbar Modul

**User Story:** Sebagai pengguna yang memiliki permission `*.read`, saya ingin mengekspor data yang sedang ditampilkan ke file Excel atau CSV, sehingga saya dapat menganalisis data di luar aplikasi.

#### Acceptance Criteria

1. THE Export_Button SHALL ditempatkan di sebelah kanan tombol Clear Filter pada toolbar setiap modul yang dicakup, menggunakan icon saja (tanpa teks label).
2. WHEN user memiliki permission `{module}.{entity}.read`, THE Export_Button SHALL ditampilkan dan dapat diklik.
3. WHEN user tidak memiliki permission `{module}.{entity}.read`, THE Export_Button SHALL disembunyikan.
4. WHEN Export_Button diklik, THE Export_Service SHALL mengambil semua record yang sesuai dengan Filter_Context yang sedang aktif tanpa batasan pagination.
5. WHEN Export_Button diklik, THE Export_Service SHALL menghasilkan file dengan judul modul, ringkasan Filter_Context yang aktif, baris header kolom, dan semua record hasil query.
6. THE Export_Service SHALL menyertakan semua kolom yang tersedia di tabel modul dalam file output.
7. WHERE format yang dipilih adalah Excel, THE Export_Service SHALL menghasilkan file berekstensi `.xlsx`.
8. WHERE format yang dipilih adalah CSV, THE Export_Service SHALL menghasilkan file berekstensi `.csv` dengan encoding UTF-8 BOM.
9. WHEN export sedang diproses, THE Export_Button SHALL menampilkan indikator loading dan dinonaktifkan untuk mencegah klik ganda.
10. IF Export_Service gagal menghasilkan file, THEN THE Export_Button SHALL menampilkan pesan error via toast notification menggunakan string dari file i18n.

---

### Requirement 2: Format Output Export

**User Story:** Sebagai pengguna, saya ingin file export memiliki format yang terstruktur dan mudah dibaca, sehingga saya dapat langsung menggunakannya tanpa perlu reformatting manual.

#### Acceptance Criteria

1. THE Export_Service SHALL menulis judul modul (sesuai bahasa aktif user) pada baris pertama file Excel.
2. THE Export_Service SHALL menulis ringkasan filter aktif pada baris kedua file Excel, dengan format `{label_filter}: {nilai_filter}` dipisahkan koma.
3. WHEN tidak ada filter aktif, THE Export_Service SHALL menulis teks "Semua Data" (ID) atau "All Data" (EN) pada baris ringkasan filter.
4. THE Export_Service SHALL menulis baris header kolom pada baris ketiga file Excel.
5. THE Export_Service SHALL menulis data record mulai dari baris keempat file Excel.
6. WHERE modul memiliki relasi one-to-many (Proyeksi Laba Rugi, Proyeksi Arus Kas), THE Export_Service SHALL menggunakan Grouped_Format: header ditulis sekali, diikuti baris-baris detail dengan kolom identifier yang menunjukkan grup.
7. THE Export_Service SHALL memformat kolom bertipe currency menggunakan format angka Excel `#,##0.00` agar dapat diolah sebagai angka.
8. THE Export_Service SHALL memformat kolom bertipe tanggal menggunakan format `DD/MM/YYYY`.
9. THE Export_Service SHALL menggunakan nama file dengan pola `{nama_modul}_{tanggal_export}.xlsx` (contoh: `neraca_2026-05-01.xlsx`).

---

### Requirement 3: Tombol Upload di Toolbar Modul

**User Story:** Sebagai pengguna yang memiliki permission `*.upload`, saya ingin mengunggah data dalam jumlah besar via file template Excel, sehingga saya dapat melakukan input massal tanpa mengisi form satu per satu.

#### Acceptance Criteria

1. THE Upload_Button SHALL ditempatkan di sebelah kiri tombol Tambah (Add) pada toolbar setiap modul yang dicakup, menggunakan icon saja (tanpa teks label).
2. WHEN user memiliki permission `{module}.{entity}.upload`, THE Upload_Button SHALL ditampilkan dan dapat diklik.
3. WHEN user tidak memiliki permission `{module}.{entity}.upload`, THE Upload_Button SHALL disembunyikan.
4. WHEN Upload_Button diklik, THE Upload_Modal SHALL ditampilkan dengan form upload yang berisi: tombol "Download Template", area drag-and-drop file, dan tombol Submit.
5. THE Upload_Modal SHALL menampilkan informasi format file yang diterima (`.xlsx`) dan ukuran maksimum file.
6. WHEN user mengklik tombol "Download Template", THE Upload_Service SHALL mengirimkan file template Excel yang sesuai dengan modul aktif.
7. THE Upload_Modal SHALL mendukung pemilihan file via klik maupun drag-and-drop.
8. WHEN file dipilih, THE Upload_Modal SHALL menampilkan nama file dan ukuran file yang dipilih.
9. IF file yang dipilih bukan berekstensi `.xlsx`, THEN THE Upload_Modal SHALL menampilkan pesan error validasi dan menolak file tersebut.
10. IF ukuran file melebihi batas maksimum yang dikonfigurasi, THEN THE Upload_Modal SHALL menampilkan pesan error validasi dan menolak file tersebut.

---

### Requirement 4: Konfigurasi Template Upload

**User Story:** Sebagai administrator sistem, saya ingin mengkonfigurasi template upload melalui tabel `system_configs` — baik secara global maupun per modul — sehingga path direktori, nama file template, urutan kolom, dan baris mulai data dapat diubah tanpa perlu deploy ulang.

#### Acceptance Criteria

1. THE Template_Base_Path SHALL disimpan di tabel `system_configs` sebagai satu konfigurasi global dengan key `upload_template_base_path`, menyimpan path direktori (string) tempat semua file template untuk semua modul disimpan.
2. THE Template_Config SHALL disimpan di tabel `system_configs` dengan key mengikuti pola `upload_template_{entity_type}` (contoh: `upload_template_balance_sheet`), satu record per modul.
3. THE Template_Config SHALL menyimpan nilai berupa JSON object dengan field: `fileName` (string, nama file saja tanpa path direktori), `startRecord` (integer, nomor baris Excel tempat data mulai ditulis), dan `columnOrder` (array of string, mendefinisikan urutan kolom dalam template Excel dan saat parsing).
4. THE Upload_Service SHALL menggabungkan Template_Base_Path dengan `fileName` dari Template_Config untuk mendapatkan full path file template saat memproses setiap request.
5. THE Upload_Service SHALL membaca Template_Config dari `system_configs` saat memproses setiap request upload.
6. IF Template_Base_Path tidak ditemukan di `system_configs`, THEN THE Upload_Service SHALL mengembalikan error `TEMPLATE_BASE_PATH_NOT_CONFIGURED` dengan HTTP status 500.
7. IF Template_Config tidak ditemukan di `system_configs` untuk modul yang diminta, THEN THE Upload_Service SHALL mengembalikan error `TEMPLATE_CONFIG_NOT_FOUND` dengan HTTP status 500.
8. THE Upload_Service SHALL mem-parsing kolom file Excel sesuai urutan yang didefinisikan di `columnOrder` dalam Template_Config, sehingga perubahan urutan kolom cukup dilakukan di konfigurasi tanpa mengubah kode.
9. THE Upload_Service SHALL menyediakan file template Excel untuk setiap modul yang dicakup, disimpan di direktori yang dikonfigurasi di Template_Base_Path.
10. THE Template_Excel SHALL berisi baris header kolom yang sesuai dengan urutan `columnOrder` yang dikonfigurasi di Template_Config.
11. WHERE modul memiliki relasi one-to-many (Proyeksi Laba Rugi, Proyeksi Arus Kas), THE Template_Excel SHALL menggunakan Flat_Format dengan kolom identifier (contoh: `group_id` atau `header_ref`) untuk mengelompokkan baris detail ke header.
12. THE Template_Excel SHALL menyertakan baris contoh data (sample row) yang dikomentari atau diberi warna berbeda untuk memandu user.

---

### Requirement 5: Parsing dan Validasi File Upload

**User Story:** Sebagai pengguna, saya ingin sistem memvalidasi file yang saya unggah sebelum data diproses, sehingga saya mendapatkan feedback yang jelas jika ada kesalahan format atau data.

#### Acceptance Criteria

1. WHEN file `.xlsx` diunggah, THE Upload_Service SHALL membaca data mulai dari baris `startRecord` yang dikonfigurasi di Template_Config.
2. THE Upload_Service SHALL mem-parsing setiap baris menjadi objek data sesuai mapping kolom yang didefinisikan per modul.
3. THE Upload_Service SHALL memvalidasi setiap baris menggunakan Zod schema yang sama dengan schema validasi form input modul tersebut.
4. THE Upload_Service SHALL menyimpan semua baris hasil parsing ke Staging_Table (`upload_staging_rows`) beserta status validasi per baris (`valid` atau `invalid`) dan pesan error jika ada.
5. THE Upload_Service SHALL membuat satu record Upload_Session di tabel `upload_sessions` dengan status `pending_review`, menyimpan nama file, jumlah total baris, jumlah baris valid, dan jumlah baris invalid.
6. WHEN parsing selesai, THE Upload_Service SHALL mengembalikan response berisi Upload_Session ID, jumlah baris valid, jumlah baris invalid, dan preview baris pertama yang invalid (maksimal 5 baris).
7. IF semua baris tidak valid, THEN THE Upload_Service SHALL mengembalikan error dengan detail validasi dan tidak membuat Upload_Session.
8. IF file tidak dapat dibaca atau format tidak sesuai template, THEN THE Upload_Service SHALL mengembalikan error `INVALID_FILE_FORMAT` dengan HTTP status 400.

---

### Requirement 6: Review dan Konfirmasi Upload

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan hasil parsing beserta detail baris data sebelum mengkonfirmasi upload, sehingga saya dapat memverifikasi data, melakukan pencarian, dan memutuskan apakah akan melanjutkan atau membatalkan.

#### Acceptance Criteria

1. WHEN Upload_Service mengembalikan hasil parsing, THE Upload_Modal SHALL menampilkan halaman review dengan: nama file yang diupload (dengan tombol download), jumlah baris valid, jumlah baris invalid, dan daftar error per baris (jika ada).
2. THE Upload_Modal SHALL menampilkan tombol download di samping nama file, yang saat diklik memanggil endpoint backend untuk mengunduh file upload tersebut (bukan direct link atau `window.open()`).
3. THE Backend_Download_Endpoint SHALL memverifikasi bahwa user memiliki permission `{module}.{entity}.upload` ATAU memiliki role yang terdaftar sebagai `maker_role` di `approval_workflows` atau `required_role` di `approval_workflow_steps` untuk modul upload yang bersangkutan, sebelum mengirimkan file.
4. IF user tidak memenuhi syarat akses download file upload, THEN THE Backend_Download_Endpoint SHALL mengembalikan HTTP 403.
5. THE Upload_Modal SHALL menampilkan tabel baris data hasil parsing dengan fitur search dan paging yang diproses di sisi server (server-side).
6. THE Backend_Upload_Rows_Endpoint SHALL menyediakan endpoint khusus untuk mengambil baris data staging dengan parameter `sessionId`, `page`, `pageSize`, dan `search` (pencarian teks pada konten baris).
7. WHEN jumlah baris invalid lebih dari 0, THE Upload_Modal SHALL menampilkan detail error per baris dengan nomor baris dan pesan error yang spesifik.
8. WHEN semua baris valid, THE Upload_Modal SHALL menampilkan tombol "Konfirmasi Upload" yang aktif.
9. WHEN ada baris invalid, THE Upload_Modal SHALL menampilkan tombol "Konfirmasi Upload" yang dinonaktifkan dan pesan bahwa semua baris harus valid sebelum dapat dikonfirmasi.
10. WHEN Upload_Service mengembalikan hasil parsing dan Upload_Session berhasil dibuat, THE Upload_Modal SHALL menampilkan tombol "Batalkan".
11. WHEN tombol "Batalkan" diklik, THE Upload_Service SHALL menghapus record Upload_Session dan semua `upload_staging_rows` yang terkait dalam satu transaksi, kemudian menutup modal.
12. WHEN modal ditutup sebelum file berhasil di-parse (belum ada Upload_Session), THE Upload_Modal SHALL menutup tanpa melakukan operasi hapus apapun.

---

### Requirement 7: Proses Upload — Modul Finansial (Dengan Approval)

**User Story:** Sebagai finance staff, saya ingin data yang saya upload melalui file template diproses melalui workflow approval yang sama dengan input manual, sehingga kontrol data tetap terjaga.

#### Acceptance Criteria

1. WHEN user mengkonfirmasi upload pada modul finansial dan user memiliki `makerRole` yang sesuai, THE Upload_Service SHALL membuat satu record approval draft di tabel `approvals` dengan action `upload` dan payload berisi referensi ke Upload_Session ID.
2. THE Upload_Service SHALL menggunakan Approval_Engine (`createDraft`) untuk membuat draft approval, dengan `entityType` mengikuti pola `{entity_type}_upload` (contoh: `balance_sheet_upload`) dan action `upload`.
3. THE Upload_Approval_Workflow SHALL dikonfigurasi sebagai workflow tersendiri dengan action `upload` untuk setiap modul finansial yang dicakup, terpisah dari workflow `create`, `edit`, dan `delete`.
4. WHEN approval disetujui (final step), THE Approval_Engine SHALL memanggil callback handler yang membaca baris dari Staging_Table dan melakukan bulk insert ke tabel utama modul dalam satu transaksi.
5. THE callback handler SHALL menggunakan `requestedBy` (UUID maker) sebagai `createdBy` untuk setiap baris yang diinsert.
6. WHEN callback berhasil, THE Upload_Service SHALL mengupdate status Upload_Session menjadi `approved` dan mencatat Audit_Log dengan action `upload`, menyimpan summary (nama file, jumlah record, status) dan detail per-baris sebagai JSON di kolom `metadata`.
7. IF callback gagal, THEN THE Approval_Engine SHALL melakukan rollback transaksi dan status approval tetap `pending`, tidak ada data yang masuk ke tabel utama.
8. WHEN user tidak memiliki `makerRole` yang sesuai (bypass approval), THE Upload_Service SHALL langsung melakukan bulk insert ke tabel utama dan mencatat Audit_Log.

---

### Requirement 8: Proses Upload — Modul Master Data (Approval Opsional)

**User Story:** Sebagai administrator, saya ingin mengupload data master (Perusahaan, Departemen, Cost Center, Proyek) via file template, dengan atau tanpa approval tergantung konfigurasi workflow yang aktif.

#### Acceptance Criteria

1. WHEN user mengkonfirmasi upload pada modul master data dan workflow approval aktif untuk modul tersebut dengan action `upload`, THE Upload_Service SHALL mengikuti alur yang sama dengan Requirement 7 (membuat approval draft dengan action `upload`).
2. THE Upload_Approval_Workflow untuk modul master data SHALL dikonfigurasi sebagai workflow tersendiri dengan action `upload`, terpisah dari workflow `create`, `edit`, dan `delete`.
3. WHEN workflow approval tidak aktif untuk modul master data, THE Upload_Service SHALL langsung melakukan bulk insert ke tabel utama tanpa melalui approval.
4. THE Upload_Service SHALL menggunakan hook `useApproval` di frontend untuk menentukan apakah workflow aktif, konsisten dengan pola yang digunakan pada input manual.
5. WHEN bulk insert langsung (tanpa approval) berhasil, THE Upload_Service SHALL mencatat Audit_Log dengan action `upload` dan status `completed`.

---

### Requirement 9: Audit Log Upload

**User Story:** Sebagai administrator, saya ingin setiap aksi upload tercatat di audit log dengan detail yang cukup untuk keperluan audit, serta dapat melihat kembali detail baris data yang diupload, sehingga saya dapat melacak siapa yang mengupload apa dan kapan.

#### Acceptance Criteria

1. THE Audit_Log SHALL mencatat satu baris per sesi upload dengan field: `userId`, `action` = `upload`, `entityType` (nama modul), `entityId` (Upload_Session ID), `createdAt`.
2. THE Audit_Log SHALL dicatat setelah proses upload tersimpan ke tabel modul — baik saat bulk insert langsung berhasil maupun saat callback approval dieksekusi dan berhasil.
3. THE Audit_Log SHALL menyimpan summary di kolom `metadata` berupa JSON object dengan field: `fileName`, `totalRows`, `validRows`, `invalidRows`, `status` (`completed` atau `failed`).
4. THE Audit_Log SHALL menyimpan detail per-baris di kolom `metadata.rows` berupa array JSON, di mana setiap elemen berisi nomor baris, status, dan data yang diproses.
5. WHEN upload berhasil (semua baris diinsert), THE Audit_Log SHALL mencatat `status` = `completed` di metadata.
6. IF upload gagal (callback rollback atau error), THEN THE Audit_Log SHALL mencatat `status` = `failed` dan menyimpan pesan error di metadata.
7. THE Audit_Log_View SHALL menampilkan link "View Detail" pada setiap baris audit log dengan action `upload`.
8. WHEN link "View Detail" diklik, THE Audit_Log_View SHALL membuka tampilan detail yang menampilkan: nama file upload (dengan tombol download via backend endpoint), dan tabel baris data dengan fitur search dan paging server-side — menggunakan tampilan yang sama dengan form review upload.

---

### Requirement 10: Permission Upload Baru

**User Story:** Sebagai administrator sistem, saya ingin mengontrol akses fitur upload secara granular per modul menggunakan permission baru `*.upload`, sehingga tidak semua user yang bisa membaca data otomatis bisa mengupload.

#### Acceptance Criteria

1. THE RBAC SHALL mendefinisikan permission baru dengan pola `{module}.{entity}.upload` untuk setiap modul yang dicakup (contoh: `cfd.balance_sheets.upload`, `cfd.corporates.upload`).
2. THE Permission SHALL disimpan di tabel `permissions` dengan format key yang konsisten dengan permission yang sudah ada.
3. WHEN permission `{module}.{entity}.upload` diberikan ke sebuah role, THE Upload_Button SHALL ditampilkan untuk user dengan role tersebut.
4. WHEN permission `{module}.{entity}.upload` tidak diberikan ke sebuah role, THE Upload_Button SHALL disembunyikan dan endpoint upload SHALL mengembalikan HTTP 403.
5. THE Backend_Upload_Endpoint SHALL memverifikasi permission `{module}.{entity}.upload` menggunakan middleware RBAC yang sudah ada sebelum memproses request.

---

### Requirement 11: Tabel Staging dan Upload Session

**User Story:** Sebagai sistem, saya memerlukan tabel staging untuk menyimpan data sementara hasil parsing file upload sebelum divalidasi dan dimasukkan ke tabel utama, sehingga proses validasi dan approval dapat dilakukan secara terpisah dari penyimpanan data final.

#### Acceptance Criteria

1. THE Database SHALL memiliki tabel `upload_sessions` dengan kolom: `id` (UUID PK), `userId` (UUID FK ke `users`), `module` (varchar), `entityType` (varchar), `fileName` (varchar), `fileSize` (bigint), `totalRows` (integer), `validRows` (integer), `invalidRows` (integer), `status` (varchar: `pending_review`, `confirmed`, `approved`, `failed`, `cancelled`), `approvalId` (UUID nullable FK ke `approvals`), `createdBy`, `createdAt`, `updatedBy`, `updatedAt`.
2. THE Database SHALL memiliki tabel `upload_staging_rows` dengan kolom: `id` (UUID PK), `sessionId` (UUID FK ke `upload_sessions`), `rowNumber` (integer), `rowData` (jsonb), `isValid` (boolean), `errorMessages` (jsonb nullable), `createdAt`.
3. THE Upload_Service SHALL menggunakan transaksi saat menyimpan Upload_Session dan semua Staging_Table rows secara bersamaan.
4. WHEN Upload_Session dibatalkan atau approval ditolak, THE Upload_Service SHALL menghapus semua `upload_staging_rows` yang terkait dengan session tersebut.
5. WHEN Upload_Session berhasil diproses (status `approved` atau `completed`), THE Upload_Service SHALL menghapus semua `upload_staging_rows` yang terkait untuk menjaga ukuran tabel staging tetap kecil.

---

### Requirement 12: Download Template dari Upload Modal

**User Story:** Sebagai pengguna, saya ingin mengunduh file template Excel langsung dari modal upload melalui endpoint backend yang tervalidasi, sehingga saya selalu menggunakan template yang benar dan terkini untuk modul yang sedang saya kerjakan.

#### Acceptance Criteria

1. THE Upload_Modal SHALL menampilkan tombol "Download Template" yang terlihat jelas sebelum user memilih file.
2. WHEN tombol "Download Template" diklik, THE Upload_Modal SHALL memanggil endpoint backend untuk mengunduh file template — tidak menggunakan `window.open()`, `href` langsung, atau tab baru.
3. THE Backend_Template_Download_Endpoint SHALL memverifikasi bahwa user memiliki permission `{module}.{entity}.upload` sebelum mengirimkan file template.
4. IF user tidak memiliki permission `{module}.{entity}.upload`, THEN THE Backend_Template_Download_Endpoint SHALL mengembalikan HTTP 403.
5. WHEN permission terverifikasi, THE Backend_Template_Download_Endpoint SHALL membaca `fileName` dari Template_Config, menggabungkan dengan Template_Base_Path, dan mengirimkan file tersebut sebagai response download.
6. THE Backend_Template_Download_Endpoint SHALL mengirimkan file template dengan header `Content-Disposition: attachment; filename="{nama_modul}_template.xlsx"`.
7. IF file template tidak ditemukan di path yang dikonfigurasi, THEN THE Backend_Template_Download_Endpoint SHALL mengembalikan error `TEMPLATE_FILE_NOT_FOUND` dengan HTTP status 404.
8. THE Template_Excel SHALL berisi instruksi pengisian di baris pertama (diformat berbeda dari baris data) dan baris header kolom yang jelas sesuai urutan `columnOrder`.

---

### Requirement 13: i18n dan Konsistensi UI

**User Story:** Sebagai pengguna bilingual (Indonesia/Inggris), saya ingin semua teks pada fitur export dan upload tersedia dalam kedua bahasa, sehingga pengalaman penggunaan konsisten dengan modul lain di CFD.

#### Acceptance Criteria

1. THE Export_Upload_Module SHALL menggunakan file i18n baru `src/i18n/exportUpload.ts` untuk semua string yang unik pada fitur ini.
2. THE Export_Upload_Module SHALL menggunakan `commonsI18n` dari `src/i18n/commons.ts` untuk string umum (tombol, status, pesan error standar).
3. THE Export_Service SHALL menggunakan bahasa aktif user (`language` dari `useAuth()`) untuk menentukan judul modul dan label kolom dalam file export.
4. WHEN bahasa aktif adalah `id`, THE Export_Service SHALL menggunakan label kolom dalam Bahasa Indonesia pada file export.
5. WHEN bahasa aktif adalah `en`, THE Export_Service SHALL menggunakan label kolom dalam Bahasa Inggris pada file export.
6. THE Upload_Modal SHALL menampilkan semua teks (label, placeholder, pesan error, tombol) menggunakan string dari file i18n, tanpa hardcode string apapun.

---

### Requirement 14: Cakupan Modul

**User Story:** Sebagai pengguna CFD, saya ingin fitur export dan upload tersedia di semua modul yang relevan, sehingga saya dapat menggunakan fitur ini secara konsisten di seluruh aplikasi.

#### Acceptance Criteria

1. THE Export_Button SHALL tersedia di modul-modul berikut: Neraca (`balance_sheet`), Laba Rugi (`income_statement`), Proyeksi Laba Rugi (`income_statement_projection`), Arus Kas Weekly (`weekly_cash_flow`), Realisasi (`realization`), Proyeksi Arus Kas (`cash_flow_projection`), Pinjaman Bank (`bank_loan`), Perusahaan (`corporate`), Departemen (`department`), Cost Center (`cost_center`), Proyek (`project`).
2. THE Upload_Button SHALL tersedia di modul-modul yang sama dengan Acceptance Criteria 1.
3. THE Upload_Service SHALL menyediakan endpoint terpisah per modul dengan path `/api/frs/upload/{entity_type}` untuk modul finansial dan `/api/frs/upload/{entity_type}` untuk modul master data.
4. THE Template_Config SHALL dikonfigurasi di `system_configs` untuk setiap 11 modul yang dicakup.
5. THE Template_Excel SHALL dibuat untuk setiap 11 modul yang dicakup dan disimpan di path yang dikonfigurasi.

---

### Requirement 15: Validasi Round-Trip Template

**User Story:** Sebagai developer, saya ingin memastikan bahwa data yang diekspor dapat diimpor kembali menggunakan template upload tanpa kehilangan informasi, sehingga konsistensi data terjaga.

#### Acceptance Criteria

1. FOR ALL modul yang mendukung export dan upload, THE Upload_Service SHALL dapat mem-parsing file yang dihasilkan oleh Export_Service (setelah disesuaikan dengan format template) tanpa error parsing.
2. THE Template_Excel SHALL menggunakan nama kolom yang konsisten dengan nama kolom pada file export untuk modul yang sama.
3. FOR ALL baris data valid yang di-upload, THE Upload_Service SHALL menghasilkan record di tabel utama yang setara dengan record yang dihasilkan oleh input manual dengan data yang sama.

---

### Requirement 16: Approval Workflow Upload — Seed Data dan Konfigurasi

**User Story:** Sebagai administrator sistem, saya ingin setiap modul yang dicakup memiliki konfigurasi approval workflow tersendiri untuk action `upload`, sehingga proses persetujuan upload dapat dikontrol secara independen dari workflow create/edit/delete.

#### Acceptance Criteria

1. THE Seed_Script SHALL membuat satu record `approval_workflows` dengan action `upload` untuk setiap 11 modul yang dicakup, menggunakan `entityType` dengan pola `{entity_type}_upload` (contoh: `balance_sheet_upload`).
2. THE Upload_Approval_Workflow untuk semua 11 modul SHALL memiliki status `is_active = true` saat seed data, kecuali modul **Corporate** (`corporate_upload`) yang SHALL memiliki status `is_active = false`.
3. THE Seed_Script SHALL membuat `approval_workflow_steps` untuk setiap Upload_Approval_Workflow menggunakan pola `if (existingSteps.length === 0)` untuk menghindari konflik FK constraint dengan `approval_histories` yang sudah ada.
4. THE Upload_Approval_Workflow SHALL memiliki field `callbackHandler` yang merujuk ke handler terdaftar di `approvalCallbacks.ts` untuk memproses bulk insert dari Staging_Table ke tabel utama.
5. THE Upload_Approval_Workflow SHALL memiliki field `viewComponent` yang merujuk ke key komponen Upload_Approval_Form di `formRegistry.tsx`.
6. THE workflowCatalog.ts SHALL diupdate dengan entry baru untuk setiap 11 modul upload agar muncul di dropdown `ApprovalConfigManager`.
7. WHEN Upload_Approval_Workflow untuk suatu modul memiliki `is_active = false`, THE Upload_Service SHALL langsung melakukan bulk insert ke tabel utama tanpa melalui approval untuk modul tersebut.

---

### Requirement 17: Upload Approval Form — Komponen dan Tampilan di ApprovalDetailModal

**User Story:** Sebagai approver, saya ingin melihat detail upload yang sedang menunggu persetujuan — termasuk nama file, kemampuan download, dan tabel baris data — langsung di dalam ApprovalDetailModal, sehingga saya dapat membuat keputusan approval berdasarkan data yang lengkap.

#### Acceptance Criteria

1. THE System SHALL menyediakan komponen `XxxUploadApprovalForm.tsx` untuk setiap 11 modul yang dicakup (contoh: `BalanceSheetUploadApprovalForm.tsx`, `CorporateUploadApprovalForm.tsx`), mengikuti pola integrasi yang didefinisikan di `docs/guides/integrating-approval.md`.
2. THE Upload_Approval_Form SHALL mendukung prop `readOnly: boolean` dan hanya merender UI dari `payload` prop tanpa melakukan fetch data secara mandiri.
3. THE Upload_Approval_Form SHALL menampilkan nama file yang diupload beserta tombol download yang memanggil Backend_Download_Endpoint (bukan direct link atau `window.open()`).
4. THE Backend_Download_Endpoint SHALL memverifikasi bahwa user memiliki permission `{module}.{entity}.upload` ATAU memiliki role yang terdaftar sebagai `maker_role` di `approval_workflows` atau `required_role` di `approval_workflow_steps` untuk workflow upload modul yang bersangkutan, sebelum mengirimkan file.
5. THE Upload_Approval_Form SHALL menampilkan tabel baris data staging dengan fitur search dan paging yang diproses di sisi server, menggunakan Backend_Upload_Rows_Endpoint yang sama dengan form review upload.
6. WHEN Upload_Approval_Form ditampilkan di dalam ApprovalDetailModal, THE tampilan SHALL identik dengan tampilan form review upload (nama file + download + tabel rows dengan search & paging).
7. THE Upload_Approval_Form SHALL didaftarkan di `formRegistry.tsx` menggunakan `createApprovalFormAdapter` dengan key yang sama dengan field `viewComponent` di record `approval_workflows` untuk modul upload yang bersangkutan.

---

### Requirement 18: Historikal Sesi Upload per Modul

**User Story:** Sebagai pengguna yang memiliki permission `*.read` pada suatu modul, saya ingin melihat riwayat sesi upload yang pernah dilakukan di modul tersebut beserta detail barisnya, sehingga saya dapat memantau aktivitas upload tanpa harus mengakses Audit Log global.

#### Acceptance Criteria

1. THE Upload_History_View SHALL ditampilkan sebagai section atau tab "Riwayat Upload" pada setiap modul yang dicakup, dan hanya dapat diakses oleh user yang memiliki permission `{module}.{entity}.read`.
2. THE Upload_History_View SHALL menampilkan daftar Upload_Session dengan kolom: tanggal upload, nama file, total baris, baris valid, baris invalid, status, dan nama user yang mengupload.
3. THE Upload_History_View SHALL mendukung paging dan sorting server-side pada daftar Upload_Session.
4. WHEN user mengklik baris Upload_Session di Upload_History_View, THE Upload_History_View SHALL menampilkan view detail yang identik dengan Upload_Approval_Form: nama file (dengan tombol download) dan tabel baris data dengan fitur search dan paging server-side.
5. THE Upload_History_Endpoint SHALL memverifikasi permission `{module}.{entity}.read` sebelum mengembalikan daftar Upload_Session.
6. THE Backend_History_Download_Endpoint SHALL memverifikasi permission `{module}.{entity}.read` sebelum mengirimkan file upload — user dengan permission `*.read` diizinkan mengunduh file upload untuk keperluan review, tanpa memerlukan permission `*.upload`.
7. THE Backend_Upload_Rows_Endpoint SHALL memverifikasi permission `{module}.{entity}.read` ketika diakses dari konteks Upload_History_View untuk mengambil detail baris staging.
8. THE Upload_History_Endpoint SHALL memfilter Upload_Session berdasarkan `entityType` yang sesuai dengan modul yang sedang dibuka, sehingga user hanya melihat riwayat upload untuk modul tersebut.
9. WHILE Upload_Session memiliki status `cancelled`, THE Upload_History_View SHALL tetap menampilkan sesi tersebut dengan label status yang jelas, namun tombol download file SHALL dinonaktifkan jika file sudah dihapus.
10. WHEN Upload_Session memiliki status `pending_review` atau `confirmed`, THE Upload_History_View SHALL menampilkan label status yang menunjukkan bahwa proses masih berjalan.
