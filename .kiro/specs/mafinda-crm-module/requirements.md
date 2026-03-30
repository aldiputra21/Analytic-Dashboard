# Dokumen Persyaratan: Modul CRM MAFINDA

## Pendahuluan

Modul CRM (Customer Relationship Management) MAFINDA adalah ekstensi dari sistem MAFINDA (Management Finance Dashboard) yang sudah ada. Modul ini dirancang untuk mengelola siklus bisnis secara menyeluruh, mulai dari penangkapan prospek (lead) hingga penandatanganan kontrak, dengan integrasi penuh ke modul proyek MAFINDA yang sudah berjalan.

Modul CRM mencakup sepuluh sub-modul utama: Lead & Customer Management, Pipeline Management, Qualification & Feasibility Analysis, Tender & Proposal Management, Cost & Resource Planning, Decision Management (Win/Loss), Contract Management, Reporting & Analytics Dashboard, Approval Workflow, dan Reimburse Management.

Antarmuka utama CRM diimplementasikan sebagai halaman tunggal (`CRMPage.tsx`) dengan tujuh tab: Dashboard, Opportunities, Customers, Proposals, Contracts, Approvals, dan Reimburse.

## Glosarium

- **CRM_System**: Sistem manajemen hubungan pelanggan yang merupakan bagian dari MAFINDA
- **Lead**: Prospek bisnis yang belum dikualifikasi
- **Opportunity**: Peluang bisnis yang sudah dikualifikasi dan sedang dalam pipeline
- **Pipeline**: Alur tahapan penjualan dari Lead hingga Contract
- **Tender**: Proses pengadaan formal dari klien yang diikuti perusahaan
- **Proposal**: Dokumen penawaran resmi yang dikirimkan kepada klien
- **Contract**: Perjanjian resmi antara perusahaan dan klien setelah deal Won
- **Sales_Manager**: Role baru dengan akses penuh ke semua fitur CRM dan kemampuan menetapkan target
- **Sales_Executive**: Role baru dengan akses input lead, update pipeline, dan pembuatan proposal
- **BD_Manager**: Role Business Development dengan akses approval qualification dan feasibility
- **MAFINDA_Project**: Modul proyek yang sudah ada di sistem MAFINDA
- **Win_Rate**: Persentase opportunity yang berhasil menjadi kontrak
- **Stage**: Tahapan dalam pipeline (Lead, Qualification, Tender, Proposal, Negotiation, Contract)
- **PIC**: Person In Charge, kontak utama di sisi klien
- **Decision_Maker**: Individu di sisi klien yang memiliki otoritas pengambilan keputusan
- **Feasibility_Score**: Nilai kelayakan opportunity berdasarkan kriteria teknis dan bisnis
- **Cost_Estimation**: Estimasi biaya proyek yang dibuat selama proses CRM
- **Approval_Workflow**: Alur persetujuan bertingkat untuk proposal, kontrak, anggaran, dan reimburse
- **Approval_Item**: Satu permintaan persetujuan dalam Approval_Workflow, dapat bertipe proposal, contract, budget, atau reimburse
- **Reimburse_Request**: Permintaan penggantian biaya operasional yang diajukan oleh karyawan dan terhubung ke proyek/opportunity CRM
- **Finance_Manager**: Role yang bertanggung jawab menyetujui Reimburse_Request
- **Receipt**: Bukti pembayaran yang dilampirkan pada Reimburse_Request

## Persyaratan

### Persyaratan 1: Manajemen Lead dan Pelanggan

**User Story:** Sebagai Sales_Executive, saya ingin mengelola data prospek dan pelanggan secara terpusat, sehingga saya dapat melacak semua interaksi dan informasi kontak dengan efisien.

#### Kriteria Penerimaan

1. THE CRM_System SHALL menyimpan profil pelanggan yang mencakup nama perusahaan, alamat, industri, NPWP, dan informasi kontak utama
2. THE CRM_System SHALL menyimpan profil kontak individu (PIC dan Decision_Maker) yang terhubung ke profil perusahaan, mencakup nama, jabatan, nomor telepon, dan email
3. WHEN seorang Sales_Executive membuat lead baru, THE CRM_System SHALL menetapkan status awal "New" dan mencatat tanggal pembuatan serta identitas pembuat
4. WHEN data lead diisi, THE CRM_System SHALL memvalidasi bahwa nama perusahaan dan minimal satu kontak PIC wajib diisi sebelum menyimpan
5. IF nama perusahaan atau kontak PIC tidak diisi, THEN THE CRM_System SHALL menampilkan pesan kesalahan yang menjelaskan field mana yang wajib diisi
6. THE CRM_System SHALL mencatat riwayat interaksi (kunjungan, telepon, email, meeting) yang terhubung ke setiap lead atau pelanggan
7. WHEN sebuah interaksi dicatat, THE CRM_System SHALL menyimpan tanggal, jenis interaksi, ringkasan, dan identitas Sales_Executive yang mencatat
8. THE CRM_System SHALL mendukung pencatatan informasi tender awal yang mencakup nama tender, estimasi nilai, dan tanggal perkiraan pengumuman
9. WHEN Sales_Manager atau Sales_Executive melakukan pencarian pelanggan, THE CRM_System SHALL mengembalikan hasil pencarian berdasarkan nama perusahaan, industri, atau nama kontak dalam waktu kurang dari 2 detik
10. THE CRM_System SHALL mencegah duplikasi data pelanggan dengan memvalidasi keunikan kombinasi nama perusahaan dan NPWP

### Persyaratan 2: Manajemen Pipeline

**User Story:** Sebagai Sales_Manager, saya ingin memantau seluruh pipeline penjualan tim saya, sehingga saya dapat mengambil keputusan strategis berdasarkan status peluang bisnis yang akurat.

#### Kriteria Penerimaan

1. THE CRM_System SHALL mendukung enam tahapan pipeline secara berurutan: Lead → Qualification → Tender → Proposal → Negotiation → Contract
2. WHEN sebuah opportunity berpindah ke tahap berikutnya, THE CRM_System SHALL memvalidasi bahwa semua kriteria wajib tahap saat ini telah terpenuhi sebelum mengizinkan transisi
3. IF kriteria wajib tahap belum terpenuhi, THEN THE CRM_System SHALL menampilkan daftar item yang belum lengkap dan mencegah perpindahan tahap
4. THE CRM_System SHALL menyimpan nilai estimasi opportunity dalam mata uang Rupiah (IDR) untuk setiap opportunity
5. WHEN nilai estimasi opportunity diperbarui, THE CRM_System SHALL mencatat riwayat perubahan nilai beserta tanggal dan identitas pengubah
6. THE CRM_System SHALL menghitung dan menampilkan total nilai pipeline per tahap secara real-time
7. WHEN Sales_Manager mengakses tampilan pipeline, THE CRM_System SHALL menampilkan semua opportunity dalam format Kanban yang dikelompokkan berdasarkan tahap
8. THE CRM_System SHALL menghasilkan proyeksi pendapatan (sales forecast) berdasarkan nilai opportunity dan probabilitas konversi per tahap
9. WHILE sebuah opportunity berada dalam pipeline, THE CRM_System SHALL menampilkan indikator visual jika opportunity tidak ada aktivitas selama lebih dari 14 hari
10. THE CRM_System SHALL membatasi akses Sales_Executive hanya pada opportunity yang ditugaskan kepadanya, kecuali Sales_Manager yang dapat melihat semua opportunity

### Persyaratan 3: Analisis Kualifikasi dan Kelayakan

**User Story:** Sebagai BD_Manager, saya ingin melakukan analisis kelayakan opportunity secara terstruktur, sehingga saya dapat memberikan rekomendasi yang objektif sebelum perusahaan berinvestasi lebih lanjut.

#### Kriteria Penerimaan

1. THE CRM_System SHALL menyediakan formulir analisis kualifikasi yang mencakup dimensi teknis (kemampuan teknis, ketersediaan sumber daya) dan dimensi bisnis (nilai kontrak, margin estimasi, risiko)
2. THE CRM_System SHALL menghitung Feasibility_Score berdasarkan bobot kriteria yang telah dikonfigurasi, dengan skala 0-100
3. WHEN BD_Manager menyelesaikan analisis kualifikasi, THE CRM_System SHALL menghasilkan Feasibility_Score dan rekomendasi (Proceed / Hold / Reject)
4. IF Feasibility_Score di bawah 40, THEN THE CRM_System SHALL secara otomatis merekomendasikan "Reject" dan meminta konfirmasi BD_Manager sebelum melanjutkan
5. THE CRM_System SHALL menyimpan rencana sumber daya awal yang mencakup estimasi jumlah tenaga kerja, durasi proyek, dan kebutuhan peralatan utama
6. WHEN analisis kualifikasi disetujui oleh BD_Manager, THE CRM_System SHALL memungkinkan opportunity berpindah ke tahap Tender
7. THE CRM_System SHALL menyimpan riwayat semua versi analisis kualifikasi untuk setiap opportunity
8. WHERE fitur perbandingan opportunity diaktifkan, THE CRM_System SHALL menampilkan perbandingan Feasibility_Score antar opportunity dalam periode yang sama

### Persyaratan 4: Manajemen Tender dan Proposal

**User Story:** Sebagai Sales_Executive, saya ingin mengelola dokumen tender dan proposal secara terpusat dengan version control, sehingga saya dapat memastikan dokumen yang dikirimkan selalu merupakan versi terbaru yang telah disetujui.

#### Kriteria Penerimaan

1. THE CRM_System SHALL menyediakan template proposal yang dapat dikustomisasi berdasarkan jenis proyek atau industri
2. WHEN Sales_Executive membuat proposal baru, THE CRM_System SHALL secara otomatis menetapkan nomor versi awal "v1.0" dan mencatat tanggal pembuatan
3. WHEN dokumen proposal diperbarui, THE CRM_System SHALL menaikkan nomor versi secara otomatis dan menyimpan versi sebelumnya dalam riwayat
4. THE CRM_System SHALL mendukung unggah dokumen pendukung dalam format PDF, DOCX, dan XLSX dengan ukuran maksimal 25 MB per file
5. IF ukuran file melebihi 25 MB, THEN THE CRM_System SHALL menolak unggahan dan menampilkan pesan kesalahan yang menyebutkan batas ukuran
6. THE CRM_System SHALL mencatat tanggal deadline pengiriman proposal dan mengirimkan notifikasi pengingat 7 hari dan 3 hari sebelum deadline
7. WHEN deadline pengiriman proposal terlewati tanpa konfirmasi pengiriman, THE CRM_System SHALL menandai opportunity dengan status "Overdue" dan mengirimkan notifikasi ke Sales_Manager
8. THE CRM_System SHALL melacak status pengiriman proposal: Draft, In Review, Approved, Submitted, Revision Required
9. WHEN proposal berstatus "Submitted", THE CRM_System SHALL mencatat tanggal dan metode pengiriman serta identitas pengirim
10. THE CRM_System SHALL mendukung pencatatan hasil evaluasi tender dari klien beserta catatan umpan balik

### Persyaratan 5: Perencanaan Biaya dan Sumber Daya

**User Story:** Sebagai Sales_Manager, saya ingin memiliki estimasi biaya proyek yang terstruktur dalam CRM, sehingga saya dapat memastikan proposal yang dikirimkan memiliki margin yang sesuai dengan target perusahaan.

#### Kriteria Penerimaan

1. THE CRM_System SHALL menyediakan formulir Cost_Estimation yang mencakup komponen biaya: material, tenaga kerja, peralatan, subkontraktor, dan overhead
2. THE CRM_System SHALL menghitung total estimasi biaya dan margin keuntungan secara otomatis berdasarkan nilai opportunity dan total biaya yang diinput
3. WHEN Cost_Estimation dibuat untuk sebuah opportunity, THE CRM_System SHALL menyimpan versi estimasi beserta tanggal dan identitas pembuat
4. THE CRM_System SHALL mendukung rencana sumber daya manusia yang mencakup posisi, jumlah orang, dan durasi penugasan
5. WHEN deal berstatus "Won" dan kontrak ditandatangani, THE CRM_System SHALL mengekspor data Cost_Estimation sebagai baseline anggaran ke MAFINDA_Project yang baru dibuat
6. THE CRM_System SHALL memvalidasi bahwa margin keuntungan tidak kurang dari batas minimum yang dikonfigurasi oleh Sales_Manager sebelum proposal dapat disetujui
7. IF margin keuntungan di bawah batas minimum, THEN THE CRM_System SHALL menampilkan peringatan dan meminta persetujuan Sales_Manager untuk melanjutkan
8. THE CRM_System SHALL menyimpan riwayat semua versi Cost_Estimation untuk setiap opportunity

### Persyaratan 6: Manajemen Keputusan Win/Loss

**User Story:** Sebagai Sales_Manager, saya ingin mencatat dan menganalisis hasil setiap opportunity secara sistematis, sehingga saya dapat mengidentifikasi pola kegagalan dan meningkatkan win rate tim.

#### Kriteria Penerimaan

1. THE CRM_System SHALL mendukung empat status akhir opportunity: Won, Lost, On Hold, dan Cancelled
2. WHEN status opportunity diubah menjadi "Lost" atau "Cancelled", THE CRM_System SHALL mewajibkan pengisian alasan dan kategori penyebab sebelum menyimpan perubahan
3. THE CRM_System SHALL menyediakan kategori penyebab kekalahan yang dapat dikonfigurasi, minimal mencakup: Harga, Teknis, Kompetitor, Waktu, dan Lainnya
4. THE CRM_System SHALL mendukung pencatatan informasi kompetitor yang ikut dalam tender yang sama, mencakup nama kompetitor dan estimasi harga penawaran mereka
5. WHEN Sales_Manager mengakses laporan Win/Loss, THE CRM_System SHALL menampilkan analisis berdasarkan periode waktu, kategori penyebab, dan Sales_Executive
6. THE CRM_System SHALL menghitung Win_Rate per Sales_Executive dan per tim dalam periode yang dapat dipilih
7. WHEN status opportunity diubah menjadi "Won", THE CRM_System SHALL memicu proses pembuatan kontrak dan notifikasi ke BD_Manager
8. THE CRM_System SHALL menyimpan hasil monitoring pengumuman tender (menang/kalah) beserta nilai kontrak pemenang jika tersedia

### Persyaratan 7: Manajemen Kontrak

**User Story:** Sebagai BD_Manager, saya ingin mengelola seluruh siklus kontrak dari drafting hingga penandatanganan, sehingga saya dapat memastikan setiap kontrak memenuhi standar legal dan bisnis perusahaan.

#### Kriteria Penerimaan

1. THE CRM_System SHALL menyediakan template kontrak yang dapat dikustomisasi berdasarkan jenis proyek
2. WHEN kontrak baru dibuat dari opportunity "Won", THE CRM_System SHALL secara otomatis mengisi data kontrak dari data opportunity yang terkait (nama klien, nilai, lingkup pekerjaan)
3. THE CRM_System SHALL mendukung alur persetujuan kontrak internal yang melibatkan BD_Manager dan Sales_Manager sebelum dikirim ke klien
4. WHEN semua pihak internal telah menyetujui kontrak, THE CRM_System SHALL mengubah status kontrak menjadi "Pending Client Signature" dan mencatat tanggal persetujuan internal
5. THE CRM_System SHALL melacak status kontrak melalui tahapan: Draft, Internal Review, Approved, Pending Client Signature, Signed, Active, Completed, Terminated
6. WHEN kontrak berstatus "Signed", THE CRM_System SHALL secara otomatis membuat entri MAFINDA_Project baru dengan data dari kontrak dan Cost_Estimation terkait
7. IF pembuatan MAFINDA_Project gagal, THEN THE CRM_System SHALL mencatat kegagalan, mengirimkan notifikasi ke Sales_Manager, dan mempertahankan status kontrak "Signed" untuk percobaan ulang manual
8. THE CRM_System SHALL menyimpan dokumen kontrak yang telah ditandatangani dalam format PDF dengan version control
9. THE CRM_System SHALL mengirimkan notifikasi 30 hari sebelum tanggal berakhirnya kontrak kepada Sales_Manager dan BD_Manager yang bertanggung jawab
10. WHERE fitur perpanjangan kontrak diaktifkan, THE CRM_System SHALL mendukung pembuatan addendum kontrak yang terhubung ke kontrak induk

### Persyaratan 8: Dashboard Pelaporan dan Analitik

**User Story:** Sebagai Sales_Manager, saya ingin memiliki dashboard analitik yang komprehensif, sehingga saya dapat memantau performa tim dan membuat keputusan berbasis data secara real-time.

#### Kriteria Penerimaan

1. THE CRM_System SHALL menampilkan visualisasi pipeline dalam format Kanban (per tahap) dan Funnel (konversi antar tahap) yang dapat diperbarui secara real-time
2. THE CRM_System SHALL menampilkan metrik utama pada dashboard: total nilai pipeline, jumlah opportunity aktif, Win_Rate periode berjalan, dan revenue forecast
3. WHEN Sales_Manager mengakses dashboard, THE CRM_System SHALL menampilkan data yang diperbarui dalam waktu kurang dari 3 detik
4. THE CRM_System SHALL mendukung filter dashboard berdasarkan periode waktu (mingguan, bulanan, kuartalan, tahunan), Sales_Executive, dan tahap pipeline
5. THE CRM_System SHALL menampilkan KPI individu Sales_Executive yang mencakup jumlah lead baru, opportunity aktif, dan Win_Rate dalam periode yang dipilih
6. THE CRM_System SHALL menghasilkan laporan revenue forecast berdasarkan nilai opportunity yang tertimbang dengan probabilitas konversi per tahap
7. WHEN Sales_Manager menetapkan target penjualan untuk Sales_Executive, THE CRM_System SHALL menampilkan perbandingan antara target dan pencapaian aktual secara visual
8. THE CRM_System SHALL mendukung ekspor laporan dalam format PDF dan Excel (XLSX)
9. IF ekspor laporan gagal, THEN THE CRM_System SHALL menampilkan pesan kesalahan yang deskriptif dan menyarankan langkah perbaikan
10. THE CRM_System SHALL menampilkan analisis Win/Loss dalam bentuk grafik yang menunjukkan tren per periode dan distribusi kategori penyebab

### Persyaratan 9: Manajemen Role dan Akses CRM

**User Story:** Sebagai Owner atau BOD, saya ingin memastikan setiap pengguna CRM hanya dapat mengakses fitur dan data yang sesuai dengan perannya, sehingga keamanan dan integritas data bisnis terjaga.

#### Kriteria Penerimaan

1. THE CRM_System SHALL mendukung tiga role CRM baru: Sales_Manager, Sales_Executive, dan BD_Manager, yang dapat dikombinasikan dengan role MAFINDA yang sudah ada
2. THE CRM_System SHALL memberikan Sales_Manager akses penuh ke semua fitur CRM termasuk konfigurasi target, laporan tim, dan persetujuan proposal
3. THE CRM_System SHALL membatasi Sales_Executive hanya dapat membuat dan mengedit lead, opportunity, dan proposal yang ditugaskan kepadanya
4. THE CRM_System SHALL memberikan BD_Manager akses untuk menyetujui analisis kualifikasi, feasibility, dan kontrak
5. WHEN pengguna dengan role Owner atau BOD mengakses CRM, THE CRM_System SHALL memberikan akses baca ke semua data CRM tanpa kemampuan edit
6. THE CRM_System SHALL mencatat semua aksi perubahan data (create, update, delete) beserta identitas pengguna dan timestamp dalam audit log
7. IF pengguna mencoba mengakses fitur di luar izin rolenya, THEN THE CRM_System SHALL menolak akses dan menampilkan pesan yang menjelaskan izin yang diperlukan
8. THE CRM_System SHALL memungkinkan satu pengguna memiliki role CRM dan role MAFINDA secara bersamaan tanpa konflik

### Persyaratan 10: Integrasi dengan MAFINDA_Project

**User Story:** Sebagai Finance_Analyst atau Owner, saya ingin data dari CRM secara otomatis tersinkronisasi dengan modul proyek MAFINDA, sehingga tidak ada duplikasi input data antara tim sales dan tim keuangan.

#### Kriteria Penerimaan

1. WHEN kontrak CRM berstatus "Signed", THE CRM_System SHALL secara otomatis membuat MAFINDA_Project baru dengan data: nama proyek, klien, nilai kontrak, tanggal mulai, dan tanggal selesai estimasi
2. THE CRM_System SHALL menggunakan data Cost_Estimation dari CRM sebagai baseline anggaran awal di MAFINDA_Project yang baru dibuat
3. WHEN MAFINDA_Project berhasil dibuat dari CRM, THE CRM_System SHALL menyimpan referensi ID proyek MAFINDA di data kontrak CRM untuk keperluan navigasi
4. THE CRM_System SHALL menampilkan tautan langsung ke MAFINDA_Project yang terkait dari halaman detail kontrak CRM
5. IF MAFINDA_Project yang terkait dihapus atau dinonaktifkan, THEN THE CRM_System SHALL memperbarui status referensi di kontrak CRM dan menampilkan notifikasi kepada Sales_Manager
6. THE CRM_System SHALL memastikan bahwa data yang dikirim ke MAFINDA_Project memenuhi format dan validasi yang diperlukan oleh sistem MAFINDA sebelum melakukan integrasi

### Persyaratan 11: Approval Workflow

**User Story:** Sebagai Sales_Manager atau BD_Manager, saya ingin mengelola semua permintaan persetujuan (proposal, kontrak, anggaran, reimburse) dalam satu antarmuka terpusat, sehingga saya dapat memproses approval dengan cepat dan memiliki visibilitas penuh atas status setiap permintaan.

#### Kriteria Penerimaan

1. THE CRM_System SHALL mendukung empat tipe Approval_Item: proposal, contract, budget, dan reimburse
2. THE CRM_System SHALL menyimpan setiap Approval_Item dengan field: tipe, judul, deskripsi, jumlah (IDR), pemohon, tanggal permintaan, approver yang ditugaskan, prioritas (high/medium/low), status, dan daftar dokumen pendukung
3. WHEN sebuah Approval_Item dibuat, THE CRM_System SHALL menetapkan status awal "pending" dan mencatat identitas pemohon serta timestamp pembuatan
4. WHEN approver menyetujui sebuah Approval_Item, THE CRM_System SHALL mengubah status menjadi "approved", mencatat identitas approver dan timestamp persetujuan
5. WHEN approver menolak sebuah Approval_Item, THE CRM_System SHALL mengubah status menjadi "rejected", mencatat identitas approver, timestamp penolakan, dan alasan penolakan
6. IF pengguna mencoba menyetujui atau menolak Approval_Item yang bukan milik rolenya, THEN THE CRM_System SHALL menolak aksi dan menampilkan pesan izin yang diperlukan
7. THE CRM_System SHALL menampilkan ringkasan statistik: total, pending, approved, dan rejected
8. THE CRM_System SHALL mendukung filter Approval_Item berdasarkan status (all, pending, approved, rejected)
9. WHEN Approval_Item bertipe "proposal" disetujui, THE CRM_System SHALL memperbarui status proposal terkait menjadi "Approved"
10. WHEN Approval_Item bertipe "contract" disetujui, THE CRM_System SHALL memperbarui status kontrak terkait ke tahap berikutnya dalam alur persetujuan kontrak
11. THE CRM_System SHALL mencatat semua aksi approval dan rejection ke crm_audit_log

### Persyaratan 12: Reimburse Management

**User Story:** Sebagai karyawan (Sales_Executive atau BD_Manager), saya ingin mengajukan dan melacak permintaan penggantian biaya operasional yang terhubung ke proyek atau opportunity CRM, sehingga proses reimbursement menjadi transparan dan terdokumentasi dengan baik.

#### Kriteria Penerimaan

1. THE CRM_System SHALL mendukung lima kategori Reimburse_Request: travel, accommodation, meals, transportation, dan other
2. THE CRM_System SHALL menyimpan setiap Reimburse_Request dengan field: nomor unik (format RMB-YYYY-NNNN), kategori, deskripsi, jumlah (IDR), pemohon, tanggal pengajuan, proyek/opportunity terkait, jumlah receipt, approver, dan status
3. WHEN sebuah Reimburse_Request dibuat, THE CRM_System SHALL menetapkan status awal "pending", menghasilkan nomor unik secara otomatis, dan mencatat identitas pemohon serta timestamp
4. THE CRM_System SHALL mendukung empat status Reimburse_Request: pending, approved, paid, dan rejected
5. WHEN Finance_Manager menyetujui Reimburse_Request, THE CRM_System SHALL mengubah status menjadi "approved" dan mencatat tanggal persetujuan
6. WHEN pembayaran dikonfirmasi, THE CRM_System SHALL mengubah status menjadi "paid" dan mencatat tanggal pembayaran
7. WHEN Finance_Manager menolak Reimburse_Request, THE CRM_System SHALL mengubah status menjadi "rejected" dan mewajibkan pengisian alasan penolakan
8. THE CRM_System SHALL mendukung unggah Receipt sebagai bukti pembayaran dalam format PDF atau gambar (JPG, PNG) dengan ukuran maksimal 10 MB per file
9. IF ukuran file Receipt melebihi 10 MB atau format tidak didukung, THEN THE CRM_System SHALL menolak unggahan dan menampilkan pesan kesalahan yang menyebutkan batas yang diizinkan
10. THE CRM_System SHALL menampilkan ringkasan statistik: total permintaan, pending, approved, paid, total jumlah, dan jumlah pending
11. THE CRM_System SHALL mendukung filter Reimburse_Request berdasarkan status (all, pending, approved, paid, rejected)
12. WHEN nomor Reimburse_Request dibuat, THE CRM_System SHALL memastikan nomor tersebut unik dan tidak dapat digunakan ulang
