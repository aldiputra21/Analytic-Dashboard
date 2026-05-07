# Requirements Document

## Pendahuluan

Fitur **Dynamic Upload Template Dropdown** mengubah template Excel upload pada Corporate Finance Dashboard (CFD) dari menggunakan nilai statis (*hardcoded*) menjadi dropdown dinamis yang datanya di-load dari database saat template di-download. Setiap kolom dropdown di-filter berdasarkan hak akses user (RBAC), sehingga user hanya melihat data yang relevan dengan scope aksesnya. Fitur ini mencakup 11 modul: 7 modul finansial dan 4 modul master data.

Selain pembaruan template, fitur ini juga menyesuaikan validasi upload di backend agar nilai yang diterima konsisten dengan opsi dropdown yang valid, serta menambahkan logika auto-fill untuk user dengan akses tunggal (single corporate/department).

---

## Glosarium

- **Template_Generator**: Komponen backend (service) yang bertanggung jawab membuat file Excel template dengan dropdown dinamis saat endpoint download template dipanggil.
- **Upload_Validator**: Komponen backend (service) yang memvalidasi setiap baris data yang di-upload terhadap daftar nilai valid yang diambil dari database.
- **Access_Context**: Objek yang berisi daftar `corporateIds`, `departmentIds`, dan flag `hasFullCorporateAccess` yang di-inject dari JWT token user melalui middleware `injectAccessContext`.
- **Dropdown_Data_Resolver**: Fungsi/service yang mengambil data referensi (corporates, projects, departments, banks, dll.) dari database berdasarkan Access_Context user untuk digunakan sebagai opsi dropdown di template Excel.
- **ExcelJS**: Library Node.js yang sudah digunakan di `frsExportService.ts` untuk generate file Excel.
- **Named_Range**: Fitur Excel untuk mendefinisikan rentang sel dengan nama tertentu, digunakan sebagai sumber data validasi dropdown di template.
- **Auto_Fill**: Mekanisme di backend saat proses simpan upload — jika user hanya memiliki akses ke satu entitas (satu perusahaan atau satu departemen), nilai tersebut otomatis diisi tanpa perlu input manual dari user.
- **Static_Dropdown**: Kolom dropdown yang nilainya tetap (tidak bergantung database), seperti Week (W1–W5), Kategori (cash in/cash out), Jenis Kredit (KMK/KMI), Jenis Bunga (flat/efektif), dan Bulan Awal Tahun Fiskal (Jan–Des).
- **Dynamic_Dropdown**: Kolom dropdown yang nilainya di-load dari database saat template di-download, difilter berdasarkan Access_Context user.
- **Upload_Session**: Record di tabel `upload_sessions` yang merepresentasikan satu sesi upload file Excel.
- **Staging_Row**: Record di tabel `upload_staging_rows` yang merepresentasikan satu baris data dari file Excel yang di-upload, sebelum divalidasi dan dimasukkan ke tabel utama.

---

## Requirements

### Requirement 1: Backend — Endpoint Template Download dengan Dropdown Dinamis

**User Story:** Sebagai user CFD, saya ingin men-download template Excel yang sudah berisi dropdown dinamis sesuai hak akses saya, sehingga saya tidak perlu mengetik nilai secara manual dan terhindar dari kesalahan input.

#### Acceptance Criteria

1. WHEN user memanggil endpoint download template untuk suatu `entity_type` dan user memiliki permission `{module}.{entity}.upload` yang valid, THE Template_Generator SHALL mengambil data referensi dari database menggunakan Access_Context user yang di-inject oleh middleware `injectAccessContext`.

2. WHEN Template_Generator mengambil data referensi untuk kolom Perusahaan, THE Dropdown_Data_Resolver SHALL query tabel `corporates` dengan filter `is_active = true` dan filter `id IN (corporateIds)` jika `hasFullCorporateAccess = false`; jika `hasFullCorporateAccess = true`, semua perusahaan aktif dikembalikan tanpa filter id.

3. WHEN Template_Generator mengambil data referensi untuk kolom Proyek, THE Dropdown_Data_Resolver SHALL query tabel `projects` dengan filter `is_active = true` dan filter `corporate_id IN (corporateIds)` berdasarkan Access_Context user.

4. WHEN Template_Generator mengambil data referensi untuk kolom Departemen, THE Dropdown_Data_Resolver SHALL query tabel `departments` dengan filter `is_active = true` dan filter `corporate_id IN (corporateIds)` berdasarkan Access_Context user.

5. WHEN Template_Generator mengambil data referensi untuk kolom Bank, THE Dropdown_Data_Resolver SHALL query tabel `banks` dengan filter `is_active = true` tanpa filter Access_Context (bank bersifat global).

6. WHEN Template_Generator mengambil data referensi untuk kolom Sektor Industri, THE Dropdown_Data_Resolver SHALL query tabel `corporate_sectors` dengan filter `is_active = true` tanpa filter Access_Context.

7. WHEN Template_Generator mengambil data referensi untuk kolom Mata Uang, THE Dropdown_Data_Resolver SHALL query tabel `currencies` dengan filter `is_active = true` tanpa filter Access_Context.

8. WHEN Template_Generator mengambil data referensi untuk kolom Kategori Cost Center, THE Dropdown_Data_Resolver SHALL query tabel `cost_center_categories` dengan filter `is_active = true` tanpa filter Access_Context.

9. WHEN Template_Generator membuat file Excel, THE Template_Generator SHALL menyisipkan data referensi sebagai Named_Range di sheet tersembunyi bernama `_data` dengan konvensi penamaan `_ref_{table_name}` (contoh: `_ref_corporates`, `_ref_projects`) dan menggunakan Named_Range tersebut sebagai sumber validasi dropdown pada kolom yang sesuai.

10. IF data referensi untuk suatu kolom kosong (tidak ada data aktif yang dapat diakses user) karena hasil query kosong, THEN THE Template_Generator SHALL tetap menghasilkan file Excel yang valid dengan kolom tersebut tanpa dropdown validation, dan menyertakan komentar sel pada header kolom tersebut yang menjelaskan bahwa tidak ada data tersedia dalam bahasa yang sesuai dengan konteks request user.

11. IF `entity_type` yang diterima tidak dikenali oleh Template_Generator, THEN THE Template_Generator SHALL mengembalikan response error HTTP 400 dengan pesan yang menyebutkan `entity_type` yang tidak valid.

12. WHEN file Excel template berhasil dibuat, THE Template_Generator SHALL mengembalikan file sebagai response binary dengan header `Content-Disposition: attachment; filename="{entity_type}_template.xlsx"` dan `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

---

### Requirement 2: Backend — Validasi Upload Berdasarkan Nilai Dropdown Valid

**User Story:** Sebagai sistem CFD, saya ingin memastikan bahwa data yang di-upload melalui template hanya berisi nilai yang valid sesuai database dan hak akses user, sehingga integritas data terjaga.

#### Acceptance Criteria

1. WHEN Upload_Validator memproses baris data dari file Excel yang di-upload, THE Upload_Validator SHALL memvalidasi nilai kolom Perusahaan terhadap daftar `corporateIds` dengan `status = 'active'` yang terdaftar dalam `user_corporate_accesses` untuk user yang sedang melakukan upload; jika nilai tidak ditemukan, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

2. IF kolom Proyek pada baris data tidak kosong (`null` atau string kosong), THEN THE Upload_Validator SHALL memvalidasi nilai kolom Proyek terhadap daftar `projectIds` dengan `status = 'active'` dan `corporate_id IN (corporateIds)` dari Access_Context user; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

3. IF kolom Departemen pada baris data tidak kosong, THEN THE Upload_Validator SHALL memvalidasi nilai kolom Departemen terhadap daftar `departmentIds` dengan `status = 'active'` dan `corporate_id IN (corporateIds)` dari Access_Context user; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

4. IF kolom Bank pada baris data tidak kosong, THEN THE Upload_Validator SHALL memvalidasi nilai kolom Bank terhadap daftar `bankIds` dengan `status = 'active'` di tabel `banks` (tanpa filter Access_Context); jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

5. IF kolom Sektor Industri pada baris data tidak kosong, THEN THE Upload_Validator SHALL memvalidasi nilai kolom Sektor Industri terhadap daftar nilai dengan `status = 'active'` di tabel `corporate_sectors`; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

6. IF kolom Mata Uang pada baris data tidak kosong, THEN THE Upload_Validator SHALL memvalidasi nilai kolom Mata Uang terhadap daftar kode mata uang dengan `status = 'active'` di tabel `currencies`; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

7. IF kolom Kategori Cost Center pada baris data tidak kosong, THEN THE Upload_Validator SHALL memvalidasi nilai kolom Kategori Cost Center terhadap daftar nilai dengan `status = 'active'` di tabel `cost_center_categories`; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

8. IF nilai pada kolom yang divalidasi tidak ditemukan dalam daftar nilai valid, THEN THE Upload_Validator SHALL menandai baris tersebut sebagai tidak valid (`is_valid = false`) dan menyertakan pesan error yang menyebutkan nama kolom dan nilai yang ditolak.

9. IF Upload_Validator memvalidasi kolom Static_Dropdown, THEN THE Upload_Validator SHALL memvalidasi nilai terhadap daftar nilai statis berikut: Week `[W1, W2, W3, W4, W5]`; Kategori Realisasi `[cash in, cash out]`; Jenis Kredit `[KMK, KMI]`; Jenis Bunga `[flat, efektif]`; Bulan Awal Tahun Fiskal `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]`.

10. THE Upload_Validator SHALL mengambil semua daftar nilai valid (corporates, projects, departments, banks, sectors, currencies, cost_center_categories) sekali di awal proses validasi sesi upload berdasarkan Access_Context user, dan menggunakan daftar tersebut untuk memvalidasi seluruh baris tanpa query tambahan per-baris.

11. IF Access_Context user tidak memiliki `corporateIds` yang dapat diakses (daftar kosong) dan modul memerlukan validasi Perusahaan, THEN THE Upload_Validator SHALL menolak seluruh file upload dengan response error HTTP 403 dan pesan yang menjelaskan bahwa user tidak memiliki akses ke perusahaan manapun.

---

### Requirement 3: Backend — Auto-Fill untuk User dengan Akses Tunggal

**User Story:** Sebagai user CFD yang hanya memiliki akses ke satu perusahaan atau satu departemen, saya ingin sistem otomatis mengisi nilai tersebut saat menyimpan data upload, sehingga saya tidak perlu mengisi kolom tersebut secara manual di template.

#### Acceptance Criteria

1. WHEN Upload_Validator memproses baris data dan Access_Context user memiliki tepat satu `corporateId` (`corporateIds.length === 1`) dan kolom Perusahaan bernilai `null`, string kosong `""`, atau tidak ada dalam baris tersebut, THE Upload_Validator SHALL otomatis mengisi nilai `corporateId` dari Access_Context tersebut sebelum validasi dilanjutkan.

2. WHEN Upload_Validator memproses baris data dan Access_Context user memiliki tepat satu `departmentId` (`departmentIds.length === 1`) dan kolom Departemen bernilai `null`, string kosong `""`, atau tidak ada dalam baris tersebut, THE Upload_Validator SHALL otomatis mengisi nilai `departmentId` dari Access_Context tersebut sebelum validasi dilanjutkan; nilai `departmentId` yang diisi harus merupakan departemen yang berada di bawah `corporateId` yang berlaku untuk baris tersebut.

3. IF Access_Context user memiliki `hasFullCorporateAccess = true` dan kolom Perusahaan pada baris data kosong atau tidak ada, THEN THE Upload_Validator SHALL menandai baris tersebut sebagai `is_valid = false` dengan pesan error yang menyatakan bahwa kolom Perusahaan wajib diisi secara eksplisit.

4. IF auto-fill dilakukan pada suatu baris, THEN THE Upload_Validator SHALL mencatat informasi auto-fill dalam metadata Staging_Row dengan struktur `_autoFilled: { corporateId?: string, departmentId?: string }` agar dapat ditelusuri saat audit.

---

### Requirement 4: Modul Neraca (Balance Sheet) — Dropdown Perusahaan Dinamis

**User Story:** Sebagai user yang mengupload data Neraca, saya ingin kolom Perusahaan di template Excel berisi dropdown yang hanya menampilkan perusahaan aktif yang dapat saya akses, sehingga saya tidak bisa salah memilih perusahaan.

#### Acceptance Criteria

1. WHEN user men-download template Neraca (`entity_type = balance_sheet`), THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Perusahaan di semua baris data (baris 4 ke bawah) yang berisi daftar nama perusahaan aktif sesuai Access_Context user.

2. WHEN Template_Generator membuat template Neraca, THE Template_Generator SHALL menyimpan pasangan `name → id` perusahaan di Named_Range `_ref_corporates` pada sheet `_data` sehingga saat user memilih nama perusahaan, sistem dapat memetakan ke `corporate_id` yang benar saat upload.

3. WHEN Upload_Validator memproses file Neraca yang di-upload, THE Upload_Validator SHALL memvalidasi nilai kolom Perusahaan pada setiap baris data (baris 4 ke bawah) terhadap daftar `corporateIds` aktif yang dapat diakses user; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

---

### Requirement 5: Modul Laba Rugi (Income Statement) — Dropdown Perusahaan Dinamis

**User Story:** Sebagai user yang mengupload data Laba Rugi, saya ingin kolom Perusahaan di template Excel berisi dropdown dinamis sesuai hak akses saya.

#### Acceptance Criteria

1. WHEN user men-download template Laba Rugi (`entity_type = income_statement`), THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Perusahaan di semua baris data (baris 4 ke bawah) yang berisi daftar nama perusahaan aktif sesuai Access_Context user.

2. WHEN Template_Generator membuat template Laba Rugi, THE Template_Generator SHALL menyimpan pasangan `name → id` perusahaan di Named_Range `_ref_corporates` pada sheet `_data` untuk keperluan mapping saat upload.

3. WHEN Upload_Validator memproses file Laba Rugi yang di-upload, THE Upload_Validator SHALL memvalidasi nilai kolom Perusahaan pada setiap baris data terhadap daftar `corporateIds` aktif yang dapat diakses user; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

---

### Requirement 6: Modul Proyeksi Laba Rugi (Income Statement Projection) — Dropdown Perusahaan & Proyek Dinamis

**User Story:** Sebagai user yang mengupload data Proyeksi Laba Rugi, saya ingin kolom Perusahaan dan Proyek di template Excel berisi dropdown dinamis sesuai hak akses saya.

#### Acceptance Criteria

1. WHEN user men-download template Proyeksi Laba Rugi (`entity_type = income_statement_projection`), THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Perusahaan di semua baris data (baris 4 ke bawah) yang berisi daftar nama perusahaan aktif sesuai Access_Context user.

2. WHEN user men-download template Proyeksi Laba Rugi, THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Proyek di semua baris data (baris 4 ke bawah) yang berisi daftar nama proyek aktif dengan `corporate_id IN (corporateIds)` dari Access_Context user.

3. WHEN Upload_Validator memproses file Proyeksi Laba Rugi yang di-upload, THE Upload_Validator SHALL memvalidasi nilai kolom Perusahaan terhadap daftar `corporateIds` aktif yang dapat diakses user, dan memvalidasi nilai kolom Proyek terhadap daftar `projectIds` aktif dengan `corporate_id IN (corporateIds)`; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

---

### Requirement 7: Modul Arus Kas (Weekly Cash Flow) — Dropdown Perusahaan, Proyek, dan Week

**User Story:** Sebagai user yang mengupload data Arus Kas Mingguan, saya ingin kolom Perusahaan dan Proyek berisi dropdown dinamis, serta kolom Week berisi dropdown statis (W1–W5).

#### Acceptance Criteria

1. WHEN user men-download template Arus Kas (`entity_type = weekly_cash_flow`), THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Perusahaan di semua baris data (baris 4 ke bawah) yang berisi daftar nama perusahaan aktif sesuai Access_Context user.

2. WHEN user men-download template Arus Kas, THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Proyek di semua baris data (baris 4 ke bawah) yang berisi daftar nama proyek aktif dengan `corporate_id IN (corporateIds)` dari Access_Context user.

3. WHEN user men-download template Arus Kas, THE Template_Generator SHALL menyisipkan Static_Dropdown pada kolom Week di semua baris data (baris 4 ke bawah) dengan nilai tetap: `W1`, `W2`, `W3`, `W4`, `W5`.

4. WHEN Upload_Validator memproses file Arus Kas yang di-upload, THE Upload_Validator SHALL memvalidasi nilai kolom Perusahaan terhadap daftar `corporateIds` aktif yang dapat diakses user, memvalidasi nilai kolom Proyek terhadap daftar `projectIds` aktif dengan `corporate_id IN (corporateIds)`, dan memvalidasi kolom Week terhadap nilai statis `[W1, W2, W3, W4, W5]`; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

---

### Requirement 8: Modul Realisasi (Realization) — Dropdown Perusahaan, Departemen, Proyek, dan Kategori

**User Story:** Sebagai user yang mengupload data Realisasi, saya ingin kolom Perusahaan, Departemen, dan Proyek berisi dropdown dinamis, serta kolom Kategori berisi dropdown statis (cash in/cash out).

#### Acceptance Criteria

1. WHEN user men-download template Realisasi (`entity_type = realization`), THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Perusahaan di semua baris data (baris 4 ke bawah) yang berisi daftar nama perusahaan aktif sesuai Access_Context user.

2. WHEN user men-download template Realisasi, THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Departemen di semua baris data (baris 4 ke bawah) yang berisi daftar nama departemen aktif dengan `corporate_id IN (corporateIds)` dari Access_Context user.

3. WHEN user men-download template Realisasi, THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Proyek di semua baris data (baris 4 ke bawah) yang berisi daftar nama proyek aktif dengan `corporate_id IN (corporateIds)` dari Access_Context user.

4. WHEN user men-download template Realisasi, THE Template_Generator SHALL menyisipkan Static_Dropdown pada kolom Kategori di semua baris data (baris 4 ke bawah) dengan nilai tetap: `cash in`, `cash out`.

5. WHEN Upload_Validator memproses file Realisasi yang di-upload, THE Upload_Validator SHALL memvalidasi nilai kolom Perusahaan terhadap daftar `corporateIds` aktif yang dapat diakses user, memvalidasi kolom Departemen terhadap daftar `departmentIds` aktif dengan `corporate_id IN (corporateIds)`, memvalidasi kolom Proyek terhadap daftar `projectIds` aktif dengan `corporate_id IN (corporateIds)`, dan memvalidasi kolom Kategori terhadap nilai statis `[cash in, cash out]`; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

---

### Requirement 9: Modul Proyeksi Arus Kas (Cash Flow Projection) — Dropdown Perusahaan & Penyesuaian Header Template

**User Story:** Sebagai user yang mengupload data Proyeksi Arus Kas, saya ingin kolom Perusahaan berisi dropdown dinamis, dan template memiliki struktur header 2 baris yang menampilkan nama bulan (Jan–Des) dengan sub-kolom Cash In dan Cash Out untuk setiap bulan.

#### Acceptance Criteria

1. WHEN user men-download template Proyeksi Arus Kas (`entity_type = cash_flow_projection`), THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Perusahaan di semua baris data (baris 5 ke bawah) yang berisi daftar nama perusahaan aktif sesuai Access_Context user, dan menyimpan pasangan `name → id` perusahaan di Named_Range `_ref_corporates` pada sheet `_data`.

2. WHEN Template_Generator membuat template Proyeksi Arus Kas, THE Template_Generator SHALL menggunakan struktur header 2 baris: baris 3 berisi nama bulan (Januari s/d Desember) dengan merge cell mencakup 2 kolom per bulan, dan baris 4 berisi label "Cash In" dan "Cash Out" untuk setiap bulan.

3. WHEN Template_Generator membuat template Proyeksi Arus Kas, THE Template_Generator SHALL menyertakan kolom header utama di baris 3 dan 4: Perusahaan, Tahun Fiskal, Saldo Awal, dan Catatan/Keterangan, sebelum kolom-kolom bulanan; kolom Tahun Fiskal harus berformat 4 digit integer (2000–2099).

4. WHEN Template_Generator membuat header 2 baris untuk kolom bulanan, THE Template_Generator SHALL melakukan merge cell pada baris 3 untuk setiap nama bulan yang mencakup tepat 2 kolom (Cash In dan Cash Out) di baris 4.

5. WHEN Template_Generator membuat template Proyeksi Arus Kas, THE Template_Generator SHALL mengatur konfigurasi `startRecord = 5` di `system_configs` untuk `entity_type = cash_flow_projection` karena header 2 baris menggeser data ke baris 5.

6. WHEN Upload_Validator memproses file Proyeksi Arus Kas yang di-upload, THE Upload_Validator SHALL memvalidasi nilai kolom Perusahaan pada setiap baris data (baris 5 ke bawah) terhadap daftar `corporateIds` aktif yang dapat diakses user; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

---

### Requirement 10: Modul Pinjaman Bank (Bank Loan) — Dropdown Bank, Perusahaan, Jenis Kredit, dan Jenis Bunga

**User Story:** Sebagai user yang mengupload data Pinjaman Bank, saya ingin kolom Bank dan Perusahaan berisi dropdown dinamis, serta kolom Jenis Kredit dan Jenis Bunga berisi dropdown statis.

#### Acceptance Criteria

1. WHEN user men-download template Pinjaman Bank (`entity_type = bank_loan`), THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Bank di semua baris data (baris 4 ke bawah) yang berisi daftar nama bank aktif (`status = 'active'`) dari tabel `banks` tanpa filter Access_Context.

2. WHEN user men-download template Pinjaman Bank, THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Perusahaan di semua baris data (baris 4 ke bawah) yang berisi daftar nama perusahaan aktif sesuai Access_Context user.

3. WHEN user men-download template Pinjaman Bank, THE Template_Generator SHALL menyisipkan Static_Dropdown pada kolom Jenis Kredit di semua baris data (baris 4 ke bawah) dengan nilai tetap: `KMK`, `KMI`.

4. WHEN user men-download template Pinjaman Bank, THE Template_Generator SHALL menyisipkan Static_Dropdown pada kolom Jenis Bunga di semua baris data (baris 4 ke bawah) dengan nilai tetap: `flat`, `efektif`.

5. WHEN Upload_Validator memproses file Pinjaman Bank yang di-upload, THE Upload_Validator SHALL memvalidasi nilai kolom Bank terhadap daftar `bankIds` aktif di tabel `banks`, memvalidasi kolom Perusahaan terhadap daftar `corporateIds` aktif yang dapat diakses user, memvalidasi kolom Jenis Kredit terhadap nilai statis `[KMK, KMI]`, dan memvalidasi kolom Jenis Bunga terhadap nilai statis `[flat, efektif]`; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

---

### Requirement 11: Modul Perusahaan (Corporate) — Dropdown Sektor Industri, Mata Uang, dan Bulan Awal Tahun Fiskal

**User Story:** Sebagai user yang mengupload data master Perusahaan, saya ingin kolom Sektor Industri dan Mata Uang berisi dropdown dinamis dari database, serta kolom Bulan Awal Tahun Fiskal berisi dropdown statis (Jan–Des).

#### Acceptance Criteria

1. WHEN user men-download template Perusahaan (`entity_type = corporate`), THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Sektor Industri di semua baris data (baris 4 ke bawah) yang berisi daftar nama sektor aktif (`status = 'active'`) dari tabel `corporate_sectors`.

2. WHEN user men-download template Perusahaan, THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Mata Uang di semua baris data (baris 4 ke bawah) yang berisi daftar kode mata uang aktif (`status = 'active'`) dari tabel `currencies`.

3. WHEN user men-download template Perusahaan, THE Template_Generator SHALL menyisipkan Static_Dropdown pada kolom Bulan Awal Tahun Fiskal di semua baris data (baris 4 ke bawah) dengan nilai `1` hingga `12`, dengan label bilingual sesuai bahasa user (contoh: "1 - Januari / January" hingga "12 - Desember / December").

4. WHEN Upload_Validator memproses file Perusahaan yang di-upload, THE Upload_Validator SHALL memvalidasi nilai kolom Sektor Industri terhadap daftar nilai aktif di tabel `corporate_sectors`, memvalidasi kolom Mata Uang terhadap daftar kode mata uang aktif di tabel `currencies`, dan memvalidasi kolom Bulan Awal Tahun Fiskal terhadap nilai statis `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]`; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

---

### Requirement 12: Modul Departemen (Department) — Dropdown Perusahaan Dinamis

**User Story:** Sebagai user yang mengupload data master Departemen, saya ingin kolom Perusahaan di template berisi dropdown dinamis sesuai hak akses saya.

#### Acceptance Criteria

1. WHEN user men-download template Departemen (`entity_type = department`), THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Perusahaan di semua baris data (baris 4 ke bawah) yang berisi daftar nama perusahaan aktif sesuai Access_Context user.

2. WHEN Upload_Validator memproses file Departemen yang di-upload, THE Upload_Validator SHALL memvalidasi nilai kolom Perusahaan pada setiap baris data terhadap daftar `corporateIds` aktif yang dapat diakses user; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

---

### Requirement 13: Modul Cost Center — Dropdown Perusahaan dan Kategori Dinamis

**User Story:** Sebagai user yang mengupload data master Cost Center, saya ingin kolom Perusahaan dan Kategori di template berisi dropdown dinamis dari database.

#### Acceptance Criteria

1. WHEN user men-download template Cost Center (`entity_type = cost_center`), THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Perusahaan di semua baris data (baris 4 ke bawah) yang berisi daftar nama perusahaan aktif sesuai Access_Context user.

2. WHEN user men-download template Cost Center, THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Kategori di semua baris data (baris 4 ke bawah) yang berisi daftar nama kategori aktif (`status = 'active'`) dari tabel `cost_center_categories`.

3. WHEN Upload_Validator memproses file Cost Center yang di-upload, THE Upload_Validator SHALL memvalidasi nilai kolom Perusahaan terhadap daftar `corporateIds` aktif yang dapat diakses user, dan memvalidasi kolom Kategori terhadap daftar nilai aktif di tabel `cost_center_categories`; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

---

### Requirement 14: Modul Proyek (Project) — Dropdown Departemen Dinamis

**User Story:** Sebagai user yang mengupload data master Proyek, saya ingin kolom Departemen di template berisi dropdown dinamis yang hanya menampilkan departemen aktif sesuai hak akses saya.

#### Acceptance Criteria

1. WHEN user men-download template Proyek (`entity_type = project`), THE Template_Generator SHALL menyisipkan dropdown dinamis pada kolom Departemen di semua baris data (baris 4 ke bawah) yang berisi daftar nama departemen aktif dengan `corporate_id IN (corporateIds)` dari Access_Context user.

2. WHEN Upload_Validator memproses file Proyek yang di-upload, THE Upload_Validator SHALL memvalidasi nilai kolom Departemen pada setiap baris data terhadap daftar `departmentIds` aktif dengan `corporate_id IN (corporateIds)` dari Access_Context user; jika nilai tidak valid, baris ditandai `is_valid = false` dengan pesan error menyebutkan nama kolom dan nilai yang ditolak.

---

### Requirement 15: Keamanan dan Isolasi Data Antar User

**User Story:** Sebagai administrator CFD, saya ingin memastikan bahwa template yang di-download oleh satu user tidak mengekspos data perusahaan atau entitas yang tidak dapat diakses oleh user tersebut.

#### Acceptance Criteria

1. THE Template_Generator SHALL selalu menggunakan Access_Context yang di-extract dari JWT token user yang sedang login (bukan dari parameter query string atau request body) untuk menentukan data yang dimasukkan ke dropdown.

2. WHEN dua user dengan Access_Context berbeda men-download template yang sama pada waktu yang sama, THE Template_Generator SHALL menghasilkan file Excel dengan isi dropdown yang berbeda sesuai hak akses masing-masing user, tanpa ada data yang bocor antar user.

3. IF user mencoba mengisi nilai di luar dropdown yang tersedia pada kolom yang divalidasi (misalnya dengan mengedit file Excel secara manual sebelum di-upload), THEN THE Upload_Validator SHALL menolak baris tersebut sebagai tidak valid (`is_valid = false`) dan menampilkan pesan error yang menyebutkan nama kolom dan nilai yang ditolak.

4. THE Template_Generator SHALL tidak menyertakan UUID internal secara langsung di sel yang terlihat user; UUID hanya boleh disimpan di Named_Range tersembunyi pada sheet `_data` untuk keperluan mapping internal saat upload.

---

### Requirement 16: Performa dan Efisiensi Generate Template

**User Story:** Sebagai user CFD, saya ingin template dapat di-download dalam waktu yang wajar meskipun data referensi cukup banyak, sehingga pengalaman penggunaan tetap nyaman.

#### Acceptance Criteria

1. WHEN Template_Generator mengambil data referensi dari database untuk suatu `entity_type`, THE Dropdown_Data_Resolver SHALL mengeksekusi semua query referensi yang diperlukan secara paralel (tidak berurutan) untuk meminimalkan waktu tunggu total.

2. WHEN jumlah total entri referensi untuk semua kolom dropdown dalam satu template tidak melebihi 500 entri per tabel, THE Template_Generator SHALL menyelesaikan proses generate dan mengembalikan file template dalam waktu tidak lebih dari 5 detik dihitung dari saat request diterima.

3. WHEN jumlah entri dropdown untuk satu kolom melebihi 500 item, THE Template_Generator SHALL tetap menghasilkan file yang valid dengan semua entri tersebut; batas waktu 5 detik tidak berlaku untuk kondisi ini.

### Requirement 17: Kompatibilitas dengan Sistem Upload yang Sudah Ada

**User Story:** Sebagai developer CFD, saya ingin fitur dropdown dinamis ini terintegrasi dengan mulus ke dalam sistem upload yang sudah ada tanpa mengubah alur kerja upload, approval, dan audit log yang sudah berjalan.

#### Acceptance Criteria

1. THE Template_Generator SHALL menggunakan endpoint download template yang sudah ada, hanya mengubah implementasi internal dari membaca file statis menjadi generate dinamis; tidak ada perubahan pada URL endpoint atau contract API yang sudah ada.

2. WHEN file Excel yang di-upload tidak memiliki dropdown validation (template lama), THE Upload_Validator SHALL tetap memvalidasi nilai berdasarkan daftar nilai valid dari database, sehingga file dari template lama tetap dapat diproses.

3. THE Template_Generator SHALL menggunakan library ExcelJS yang sudah ada di proyek untuk generate template; tidak boleh menambahkan library baru untuk keperluan generate template.

4. WHEN Upload_Validator selesai memvalidasi file, THE sistem SHALL tetap menggunakan alur staging → review → confirm → approval yang sudah ada tanpa perubahan pada alur tersebut.

5. WHEN Template_Generator membuat label kolom di template Excel, THE Template_Generator SHALL mengambil teks label dari file i18n yang sesuai di `src/i18n/` berdasarkan bahasa user, bukan menggunakan string hardcoded.

### Requirement 18: Penanganan Error dan Feedback User

**User Story:** Sebagai user CFD, saya ingin mendapatkan pesan error yang jelas dan informatif ketika upload gagal karena nilai tidak valid, sehingga saya tahu persis apa yang perlu diperbaiki.

#### Acceptance Criteria

1. WHEN Upload_Validator menemukan nilai tidak valid pada kolom dropdown di suatu baris, THE Upload_Validator SHALL menghasilkan pesan error yang menyebutkan: nomor baris Excel, nama kolom, dan nilai yang diberikan oleh user.

2. IF semua data referensi untuk kolom yang memerlukan Dynamic_Dropdown pada suatu modul kosong (tidak ada data aktif yang dapat diakses user), THEN THE Template_Generator SHALL mengembalikan response error HTTP 422 dengan pesan yang menjelaskan bahwa tidak ada data referensi yang tersedia untuk user tersebut pada modul yang diminta.

3. WHEN Upload_Validator memproses file dan menemukan baris dengan nilai dropdown tidak valid, THE Upload_Validator SHALL menandai baris tersebut sebagai `is_valid = false` dan melanjutkan validasi baris-baris berikutnya hingga seluruh file selesai diproses; proses validasi tidak berhenti pada baris pertama yang error.

4. WHEN Upload_Validator menghasilkan pesan error untuk baris yang tidak valid, THE Upload_Validator SHALL mengambil teks pesan error dari file i18n di `src/i18n/` berdasarkan bahasa user; tidak boleh ada string pesan error yang hardcoded di dalam kode validasi.
