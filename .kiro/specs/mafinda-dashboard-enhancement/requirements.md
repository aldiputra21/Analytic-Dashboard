# Dokumen Persyaratan: MAFINDA Dashboard Enhancement

## Pendahuluan

Fitur ini menambahkan kemampuan dashboard keuangan yang lebih komprehensif pada aplikasi MAFINDA. Saat ini aplikasi sudah memiliki modul CRM dan Financial Ratio Monitoring. Peningkatan ini mencakup delapan area utama: visualisasi target vs realisasi revenue per departemen, card revenue & biaya operasional dengan filter departemen, cash flow per departemen & proyek, komposisi aset, komposisi ekuitas & liabilitas, data keuangan historis, manajemen proyek & target, serta input data laporan keuangan (Neraca, Laba Rugi, Arus Kas).

## Glosarium

- **Dashboard**: Halaman utama yang menampilkan ringkasan metrik keuangan perusahaan
- **Departemen**: Unit organisasi dalam perusahaan (contoh: ONM, WS, Engineering)
- **Proyek**: Pekerjaan atau kontrak spesifik yang berada di bawah suatu departemen
- **Target**: Nilai keuangan yang direncanakan untuk periode tertentu (revenue, biaya, dll.)
- **Realisasi**: Nilai keuangan aktual yang tercatat untuk periode tertentu
- **Cash Flow**: Arus kas masuk (Cash In) dan keluar (Cash Out) perusahaan
- **Neraca**: Laporan posisi keuangan yang mencatat aset, liabilitas, dan ekuitas
- **Laba_Rugi**: Laporan yang mencatat pendapatan dan beban dalam suatu periode
- **Arus_Kas**: Laporan yang mencatat pergerakan kas dari aktivitas operasi, investasi, dan pendanaan
- **Aset_Lancar**: Aset yang dapat dikonversi menjadi kas dalam waktu kurang dari satu tahun
- **Aset_Tetap**: Aset jangka panjang yang digunakan dalam operasi bisnis
- **Ekuitas**: Hak pemilik atas aset perusahaan setelah dikurangi liabilitas
- **Liabilitas**: Kewajiban keuangan perusahaan kepada pihak ketiga
- **System**: Aplikasi MAFINDA Dashboard Enhancement
- **Dashboard_Module**: Komponen frontend yang menampilkan visualisasi data keuangan
- **Data_Entry_Module**: Komponen frontend untuk input data laporan keuangan
- **Management_Module**: Komponen frontend untuk manajemen departemen, proyek, dan target
- **API**: Backend Express.js yang menyediakan endpoint data keuangan
- **Database**: SQLite (finance.db) yang menyimpan semua data keuangan

---

## Persyaratan

### Persyaratan 1: Target vs Realisasi Revenue per Departemen

**User Story:** Sebagai eksekutif perusahaan, saya ingin melihat perbandingan target dan realisasi revenue setiap departemen pada dashboard, sehingga saya dapat memantau pencapaian kinerja keuangan secara real-time.

#### Kriteria Penerimaan

1. WHEN pengguna membuka halaman dashboard, THE Dashboard_Module SHALL menampilkan grafik batang yang membandingkan target revenue dan realisasi revenue untuk setiap departemen pada periode yang dipilih
2. WHEN pengguna memilih periode (bulan/kuartal/tahun), THE Dashboard_Module SHALL memperbarui grafik target vs realisasi sesuai periode yang dipilih
3. THE Dashboard_Module SHALL menampilkan persentase pencapaian (achievement rate) untuk setiap departemen dengan rumus: (realisasi / target) × 100%
4. WHEN realisasi revenue suatu departemen berada di bawah 80% dari target, THE Dashboard_Module SHALL menampilkan indikator visual peringatan (warna merah/oranye) pada departemen tersebut
5. WHEN realisasi revenue suatu departemen mencapai atau melebihi 100% dari target, THE Dashboard_Module SHALL menampilkan indikator visual pencapaian (warna hijau) pada departemen tersebut
6. THE API SHALL menyediakan endpoint GET /api/dashboard/dept-revenue-target yang mengembalikan data target dan realisasi revenue per departemen untuk periode yang diminta

---

### Persyaratan 2: Card Revenue & Operational Cost dengan Filter Departemen

**User Story:** Sebagai manajer keuangan, saya ingin melihat card ringkasan revenue dan biaya operasional yang dapat difilter per departemen, sehingga saya dapat menganalisis kinerja keuangan setiap unit bisnis secara terpisah.

#### Kriteria Penerimaan

1. THE Dashboard_Module SHALL menampilkan card Revenue yang menunjukkan total revenue dengan nilai nominal dan persentase perubahan terhadap periode sebelumnya
2. THE Dashboard_Module SHALL menampilkan card Operational Cost yang menunjukkan total biaya operasional dengan nilai nominal dan persentase perubahan terhadap periode sebelumnya
3. WHEN pengguna memilih filter departemen, THE Dashboard_Module SHALL memperbarui nilai pada card Revenue dan Operational Cost untuk menampilkan data departemen yang dipilih
4. WHERE filter departemen tidak dipilih (All), THE Dashboard_Module SHALL menampilkan data agregat seluruh departemen
5. THE API SHALL menyediakan endpoint GET /api/dashboard/revenue-cost-summary yang menerima parameter departmentId (opsional) dan period, lalu mengembalikan total revenue dan operational cost
6. WHEN data untuk departemen yang dipilih tidak tersedia, THE Dashboard_Module SHALL menampilkan nilai nol dengan pesan informatif

---

### Persyaratan 3: Cash Flow per Departemen & Proyek

**User Story:** Sebagai direktur keuangan, saya ingin melihat arus kas masuk dan keluar yang dapat difilter per departemen dan proyek, sehingga saya dapat memantau likuiditas di setiap unit bisnis dan proyek.

#### Kriteria Penerimaan

1. THE Dashboard_Module SHALL menampilkan grafik area Cash Flow yang memperlihatkan Cash In dan Cash Out dalam tren waktu
2. WHEN pengguna memilih filter departemen, THE Dashboard_Module SHALL memperbarui grafik Cash Flow untuk menampilkan data arus kas departemen yang dipilih
3. WHEN pengguna memilih filter proyek (setelah memilih departemen), THE Dashboard_Module SHALL memperbarui grafik Cash Flow untuk menampilkan data arus kas proyek yang dipilih
4. THE Dashboard_Module SHALL menampilkan nilai net cash flow (Cash In dikurangi Cash Out) untuk periode yang dipilih
5. THE API SHALL menyediakan endpoint GET /api/dashboard/cash-flow yang menerima parameter departmentId (opsional), projectId (opsional), dan period, lalu mengembalikan data Cash In dan Cash Out per periode
6. IF departmentId diberikan tanpa projectId, THEN THE API SHALL mengembalikan agregat cash flow seluruh proyek dalam departemen tersebut

---

### Persyaratan 4: Komposisi Aset Keuangan

**User Story:** Sebagai eksekutif perusahaan, saya ingin melihat komposisi aset keuangan perusahaan (Aset Lancar dan Aset Tetap), sehingga saya dapat memahami struktur aset dan membuat keputusan investasi yang tepat.

#### Kriteria Penerimaan

1. THE Dashboard_Module SHALL menampilkan grafik pie/donut yang memperlihatkan proporsi Aset Lancar dan Aset Tetap terhadap total aset
2. THE Dashboard_Module SHALL menampilkan nilai nominal masing-masing komponen aset (Aset Lancar, Aset Tetap, dan komponen lainnya jika ada)
3. WHEN pengguna memilih periode, THE Dashboard_Module SHALL memperbarui grafik komposisi aset sesuai data neraca periode tersebut
4. THE Dashboard_Module SHALL menampilkan persentase masing-masing komponen aset terhadap total aset
5. THE API SHALL menyediakan endpoint GET /api/dashboard/asset-composition yang mengembalikan breakdown komponen aset untuk periode yang diminta

---

### Persyaratan 5: Komposisi Ekuitas & Liabilitas

**User Story:** Sebagai eksekutif perusahaan, saya ingin melihat komposisi ekuitas dan liabilitas perusahaan, sehingga saya dapat memahami struktur permodalan dan tingkat leverage perusahaan.

#### Kriteria Penerimaan

1. THE Dashboard_Module SHALL menampilkan grafik pie/donut yang memperlihatkan proporsi ekuitas dan liabilitas terhadap total pasiva
2. THE Dashboard_Module SHALL menampilkan breakdown komponen ekuitas (modal disetor, laba ditahan, dll.) dan liabilitas (liabilitas jangka pendek, liabilitas jangka panjang)
3. WHEN pengguna memilih periode, THE Dashboard_Module SHALL memperbarui grafik komposisi ekuitas & liabilitas sesuai data neraca periode tersebut
4. THE Dashboard_Module SHALL menampilkan nilai nominal dan persentase masing-masing komponen
5. THE API SHALL menyediakan endpoint GET /api/dashboard/equity-liability-composition yang mengembalikan breakdown komponen ekuitas dan liabilitas untuk periode yang diminta

---

### Persyaratan 6: Data Keuangan Historis

**User Story:** Sebagai analis keuangan, saya ingin melihat data keuangan historis perusahaan dalam bentuk grafik tren, sehingga saya dapat menganalisis pola dan tren kinerja keuangan dari waktu ke waktu.

#### Kriteria Penerimaan

1. THE Dashboard_Module SHALL menampilkan grafik tren historis untuk metrik keuangan utama (Revenue, Net Profit, Total Aset, Total Liabilitas) dalam rentang waktu yang dapat dipilih
2. WHEN pengguna memilih rentang waktu (3 bulan, 6 bulan, 1 tahun, 2 tahun), THE Dashboard_Module SHALL memperbarui grafik historis sesuai rentang yang dipilih
3. THE Dashboard_Module SHALL menampilkan minimal 3 metrik keuangan secara bersamaan dalam satu grafik dengan warna berbeda
4. WHEN data historis untuk rentang waktu yang dipilih tidak tersedia, THE Dashboard_Module SHALL menampilkan pesan informatif dan menampilkan data yang tersedia
5. THE API SHALL menyediakan endpoint GET /api/dashboard/historical-data yang menerima parameter months dan mengembalikan data keuangan historis per periode

---

### Persyaratan 7: Manajemen Proyek & Target

**User Story:** Sebagai manajer operasional, saya ingin dapat mengelola data departemen, proyek, dan target keuangan melalui menu khusus, sehingga saya dapat mengatur struktur organisasi dan menetapkan target kinerja keuangan.

#### Kriteria Penerimaan

1. THE Management_Module SHALL menyediakan form untuk menambah, mengedit, dan menghapus data departemen dengan field: nama departemen dan deskripsi
2. THE Management_Module SHALL menyediakan form untuk menambah, mengedit, dan menghapus data proyek dengan field: nama proyek, departemen induk, deskripsi, tanggal mulai, dan tanggal selesai
3. THE Management_Module SHALL menyediakan form untuk menetapkan target keuangan per departemen dengan field: departemen, periode (bulan/tahun), target revenue, dan target biaya operasional
4. THE Management_Module SHALL menyediakan form untuk menetapkan target keuangan per proyek dengan field: proyek, periode, target revenue, dan target biaya
5. WHEN pengguna menghapus departemen yang masih memiliki proyek aktif, THE Management_Module SHALL menampilkan konfirmasi peringatan sebelum menghapus
6. THE API SHALL menyediakan endpoint CRUD untuk departemen: POST/GET/PUT/DELETE /api/departments
7. THE API SHALL menyediakan endpoint CRUD untuk proyek: POST/GET/PUT/DELETE /api/projects
8. THE API SHALL menyediakan endpoint CRUD untuk target: POST/GET/PUT/DELETE /api/targets
9. IF nama departemen yang diinput sudah ada dalam database, THEN THE API SHALL mengembalikan error dengan kode 409 (Conflict)
10. IF nama proyek yang diinput sudah ada dalam departemen yang sama, THEN THE API SHALL mengembalikan error dengan kode 409 (Conflict)

---

### Persyaratan 8: Input Data Laporan Keuangan

**User Story:** Sebagai staf keuangan, saya ingin dapat menginput data Neraca, Laba Rugi, dan Arus Kas melalui form yang terstruktur, sehingga data keuangan perusahaan selalu terkini dan akurat.

#### Kriteria Penerimaan

1. THE Data_Entry_Module SHALL menyediakan form input Neraca (Balance Sheet) dengan field: periode, total aset lancar, total aset tetap, aset lainnya, total liabilitas jangka pendek, total liabilitas jangka panjang, modal disetor, laba ditahan
2. THE Data_Entry_Module SHALL menyediakan form input Laba Rugi (Income Statement) dengan field: periode, total pendapatan (revenue), harga pokok penjualan (HPP), beban operasional, beban bunga, pajak, laba bersih
3. THE Data_Entry_Module SHALL menyediakan form input Arus Kas (Cash Flow Statement) dengan field: periode, departemen (opsional), proyek (opsional), cash in dari operasi, cash out dari operasi, cash in dari investasi, cash out dari investasi, cash in dari pendanaan, cash out dari pendanaan
4. WHEN pengguna menginput data untuk periode yang sudah ada, THE Data_Entry_Module SHALL menampilkan konfirmasi apakah akan menimpa data yang ada atau membuat versi baru
5. WHEN semua field wajib terisi dan valid, THE Data_Entry_Module SHALL mengaktifkan tombol simpan
6. IF nilai yang diinput bukan angka valid atau bernilai negatif untuk field yang tidak boleh negatif, THEN THE Data_Entry_Module SHALL menampilkan pesan validasi yang spesifik
7. THE API SHALL menyediakan endpoint POST /api/financial-statements/balance-sheet untuk menyimpan data neraca
8. THE API SHALL menyediakan endpoint POST /api/financial-statements/income-statement untuk menyimpan data laba rugi
9. THE API SHALL menyediakan endpoint POST /api/financial-statements/cash-flow untuk menyimpan data arus kas
10. WHEN data berhasil disimpan, THE API SHALL mengembalikan respons dengan kode 201 dan data yang tersimpan
11. THE Data_Entry_Module SHALL menampilkan riwayat input data keuangan yang dapat difilter berdasarkan jenis laporan dan periode
