# Requirements Document

## Introduction

Fitur ini mengintegrasikan sistem approval dinamis yang sudah ada ke 10 modul CFD yang belum terintegrasi: Laba Rugi (Income Statement), Proyeksi Laba Rugi (Income Statement Projection), Arus Kas Mingguan (Weekly Cash Flow), Realisasi (Realization), Proyeksi Arus Kas (Cash Flow Projection), Pinjaman Bank (Bank Loan), Perusahaan (Corporate), Departemen (Department), Cost Center, dan Proyek (Project).

Setiap modul akan mengikuti pola integrasi yang sudah terbukti dari modul Neraca (Balance Sheet): callback handler di `approvalCallbacks.ts`, shared form di `src/components/financial/shared/forms/`, pendaftaran di `formRegistry.tsx` dan `workflowCatalog.ts`, serta seed data di `scripts/seed-public.ts`.

Dua modul mendapat perubahan UI tambahan: Proyeksi Laba Rugi dan Proyeksi Arus Kas akan memindahkan ringkasan total dari footer modal ke sticky status bar (mengikuti pola yang sudah ada di Neraca), agar ringkasan selalu terlihat saat user men-scroll form.

Tidak ada perubahan logic bisnis, kalkulasi, atau UI lainnya di luar yang disebutkan di atas.

## Glossary

- **Approval_Engine**: Service `src/services/approval/approvalEngine.ts` yang mengelola lifecycle approval (draft → pending → approved/rejected).
- **Callback_Registry**: Registry di `src/services/approval/callbackRegistry.ts` tempat handler DB didaftarkan per action.
- **Approval_Callbacks**: File `src/services/approval/approvalCallbacks.ts` tempat semua callback handler diimplementasikan.
- **Shared_Form**: Komponen React di `src/components/financial/shared/forms/` yang dipakai baik di manager CRUD maupun di `ApprovalDetailModal`.
- **Form_Registry**: File `src/components/financial/approval/formRegistry.tsx` yang memetakan key `view_component` (dari DB) ke komponen React.
- **Workflow_Catalog**: File `src/components/financial/approval/workflowCatalog.ts` yang mendaftarkan modul ke dropdown `ApprovalConfigManager`.
- **useApproval_Hook**: Hook `src/hooks/financial/useApproval.ts` yang mengecek apakah user punya workflow aktif untuk suatu modul/action.
- **Sticky_Status_Bar**: Bar ringkasan kalkulasi yang menempel di bawah header modal, selalu terlihat saat user men-scroll form (pola yang sudah ada di `BalanceSheetForm.tsx`).
- **Maker_Role**: Role yang berhak membuat dan mengedit draft approval (disimpan di `approval_workflows.maker_role` sebagai UUID).
- **Required_Role**: Role yang berhak menyetujui atau menolak step approval (disimpan di `approval_workflow_steps.required_role` sebagai UUID).
- **Subject_Fields**: Array field dari payload yang digunakan untuk menghasilkan judul ringkas approval (disimpan di `approval_workflows.subject_fields` sebagai JSONB).
- **Finance_Staff**: Role `finance_staff` (scope `corporate`) — Maker untuk semua modul finansial.
- **Finance_Manager**: Role `finance_manager` (scope `corporate`) — Approver step 1 untuk modul finansial.
- **Finance_Leader**: Role `finance_leader` (scope `corporate`) — Approver step 2 (final) untuk modul finansial.
- **Corporate_Admin**: Role `corporate_admin` (scope `corporate`) — Maker untuk modul master data (Perusahaan, Departemen, Cost Center, Proyek).
- **System_Admin**: Role `system_admin` (scope `system`) — Maker untuk modul master data sistem (Perusahaan).
- **SYSTEM_ACTOR_ID**: UUID `00000000-0000-0000-0000-000000000000` yang digunakan sebagai `createdBy` pada data seed.

## Requirements

### Requirement 1: Integrasi Approval — Laba Rugi (Income Statement)

**User Story:** Sebagai Finance Staff, saya ingin setiap input, perubahan, dan penghapusan data Laba Rugi melalui proses persetujuan, sehingga akurasi data finansial terjaga dan ada jejak audit yang jelas.

#### Acceptance Criteria

1. WHEN Finance_Staff menyimpan data Laba Rugi baru, THE Approval_Engine SHALL membuat draft approval dengan `module='cfd'`, `entityType='income_statement'`, `action='create'`.
2. WHEN Finance_Staff mengubah data Laba Rugi yang sudah ada, THE Approval_Engine SHALL membuat draft approval dengan `action='edit'` dan menyimpan snapshot data lama di `original_data`.
3. WHEN Finance_Staff menghapus data Laba Rugi, THE Approval_Engine SHALL membuat draft approval dengan `action='delete'` sebelum data dihapus dari database.
4. WHEN approval Laba Rugi disetujui pada step terakhir, THE Approval_Callbacks SHALL mengeksekusi handler yang sesuai (`handleIncomeStatementCreate`, `handleIncomeStatementEdit`, atau `handleIncomeStatementDelete`) dalam satu transaksi database.
5. IF Finance_Staff tidak memiliki `maker_role` yang sesuai atau workflow tidak aktif (`is_active=false`), THEN THE useApproval_Hook SHALL mengembalikan `hasWorkflow=false` dan data disimpan langsung ke database tanpa melalui approval.
6. THE Shared_Form `IncomeStatementForm.tsx` SHALL mendukung prop `readOnly: boolean` dan merender seluruh field dari `payload` tanpa melakukan fetch data sendiri.
7. THE Form_Registry SHALL mendaftarkan `IncomeStatementApprovalForm` dengan key yang sama dengan nilai `view_component` di tabel `approval_workflows`.
8. THE Workflow_Catalog SHALL memiliki entry untuk `income_statement` dengan `module='cfd'`, `entityType='income_statement'`, dan semua callback key yang sesuai.

---

### Requirement 2: Integrasi Approval — Proyeksi Laba Rugi (Income Statement Projection)

**User Story:** Sebagai Finance Staff, saya ingin setiap input, perubahan, dan penghapusan data Proyeksi Laba Rugi melalui proses persetujuan, sehingga proyeksi finansial yang diajukan telah divalidasi oleh pihak yang berwenang.

#### Acceptance Criteria

1. WHEN Finance_Staff menyimpan data Proyeksi Laba Rugi baru, THE Approval_Engine SHALL membuat draft approval dengan `module='cfd'`, `entityType='income_statement_projection'`, `action='create'`.
2. WHEN Finance_Staff mengubah data Proyeksi Laba Rugi, THE Approval_Engine SHALL membuat draft approval dengan `action='edit'` dan menyimpan snapshot data lama di `original_data`.
3. WHEN Finance_Staff menghapus data Proyeksi Laba Rugi, THE Approval_Engine SHALL membuat draft approval dengan `action='delete'`.
4. WHEN approval Proyeksi Laba Rugi disetujui pada step terakhir, THE Approval_Callbacks SHALL mengeksekusi handler yang sesuai dalam satu transaksi database.
5. IF workflow tidak aktif atau user tidak memiliki `maker_role`, THEN THE useApproval_Hook SHALL mengembalikan `hasWorkflow=false` dan data disimpan langsung ke database.
6. THE Shared_Form `IncomeStatementProjectionForm.tsx` SHALL menampilkan ringkasan Total Pendapatan dan Total Biaya sebagai Sticky_Status_Bar di bawah header form, bukan di footer modal.
7. THE Sticky_Status_Bar SHALL selalu terlihat saat user men-scroll konten form, mengikuti pola yang sama dengan `BalanceSheetForm.tsx`.
8. THE Shared_Form `IncomeStatementProjectionForm.tsx` SHALL mendukung prop `readOnly: boolean` dan merender seluruh field dari `payload` tanpa melakukan fetch data sendiri.
9. THE Form_Registry SHALL mendaftarkan `IncomeStatementProjectionApprovalForm` dengan key yang sama dengan nilai `view_component` di tabel `approval_workflows`.

---

### Requirement 3: Integrasi Approval — Arus Kas Mingguan (Weekly Cash Flow)

**User Story:** Sebagai Finance Staff, saya ingin setiap input, perubahan, dan penghapusan data Arus Kas Mingguan melalui proses persetujuan, sehingga data arus kas yang dilaporkan telah diverifikasi.

#### Acceptance Criteria

1. WHEN Finance_Staff menyimpan data Arus Kas Mingguan baru, THE Approval_Engine SHALL membuat draft approval dengan `module='cfd'`, `entityType='weekly_cash_flow'`, `action='create'`.
2. WHEN Finance_Staff mengubah data Arus Kas Mingguan, THE Approval_Engine SHALL membuat draft approval dengan `action='edit'` dan menyimpan snapshot data lama di `original_data`.
3. WHEN Finance_Staff menghapus data Arus Kas Mingguan, THE Approval_Engine SHALL membuat draft approval dengan `action='delete'`.
4. WHEN approval Arus Kas Mingguan disetujui pada step terakhir, THE Approval_Callbacks SHALL mengeksekusi handler yang sesuai (`handleWeeklyCashFlowCreate`, `handleWeeklyCashFlowEdit`, atau `handleWeeklyCashFlowDelete`) dalam satu transaksi database.
5. IF workflow tidak aktif atau user tidak memiliki `maker_role`, THEN THE useApproval_Hook SHALL mengembalikan `hasWorkflow=false` dan data disimpan langsung ke database.
6. THE Shared_Form `WeeklyCashFlowForm.tsx` SHALL mendukung prop `readOnly: boolean` dan merender seluruh field dari `payload` tanpa melakukan fetch data sendiri.
7. THE Form_Registry SHALL mendaftarkan `WeeklyCashFlowApprovalForm` dengan key yang sama dengan nilai `view_component` di tabel `approval_workflows`.
8. THE Workflow_Catalog SHALL memiliki entry untuk `weekly_cash_flow` dengan semua callback key yang sesuai.

---

### Requirement 4: Integrasi Approval — Realisasi (Realization)

**User Story:** Sebagai Finance Staff, saya ingin setiap input, perubahan, dan penghapusan data Realisasi melalui proses persetujuan, sehingga data realisasi kas yang diinput telah divalidasi sebelum tersimpan.

#### Acceptance Criteria

1. WHEN Finance_Staff menyimpan data Realisasi baru, THE Approval_Engine SHALL membuat draft approval dengan `module='cfd'`, `entityType='realization'`, `action='create'`.
2. WHEN Finance_Staff mengubah data Realisasi, THE Approval_Engine SHALL membuat draft approval dengan `action='edit'` dan menyimpan snapshot data lama di `original_data`.
3. WHEN Finance_Staff menghapus data Realisasi, THE Approval_Engine SHALL membuat draft approval dengan `action='delete'`.
4. WHEN approval Realisasi disetujui pada step terakhir, THE Approval_Callbacks SHALL mengeksekusi handler yang sesuai (`handleRealizationCreate`, `handleRealizationEdit`, atau `handleRealizationDelete`) dalam satu transaksi database.
5. IF workflow tidak aktif atau user tidak memiliki `maker_role`, THEN THE useApproval_Hook SHALL mengembalikan `hasWorkflow=false` dan data disimpan langsung ke database.
6. THE Shared_Form `RealizationForm.tsx` SHALL mendukung prop `readOnly: boolean` dan merender seluruh field dari `payload` tanpa melakukan fetch data sendiri.
7. THE Form_Registry SHALL mendaftarkan `RealizationApprovalForm` dengan key yang sama dengan nilai `view_component` di tabel `approval_workflows`.
8. THE Workflow_Catalog SHALL memiliki entry untuk `realization` dengan semua callback key yang sesuai.

---

### Requirement 5: Integrasi Approval — Proyeksi Arus Kas (Cash Flow Projection)

**User Story:** Sebagai Finance Staff, saya ingin setiap input, perubahan, dan penghapusan data Proyeksi Arus Kas melalui proses persetujuan, sehingga proyeksi arus kas yang diajukan telah disetujui oleh pihak yang berwenang.

#### Acceptance Criteria

1. WHEN Finance_Staff menyimpan data Proyeksi Arus Kas baru, THE Approval_Engine SHALL membuat draft approval dengan `module='cfd'`, `entityType='cash_flow_projection'`, `action='create'`.
2. WHEN Finance_Staff mengubah data Proyeksi Arus Kas, THE Approval_Engine SHALL membuat draft approval dengan `action='edit'` dan menyimpan snapshot data lama di `original_data`.
3. WHEN Finance_Staff menghapus data Proyeksi Arus Kas, THE Approval_Engine SHALL membuat draft approval dengan `action='delete'`.
4. WHEN approval Proyeksi Arus Kas disetujui pada step terakhir, THE Approval_Callbacks SHALL mengeksekusi handler yang sesuai (`handleCashFlowProjectionCreate`, `handleCashFlowProjectionEdit`, atau `handleCashFlowProjectionDelete`) dalam satu transaksi database.
5. IF workflow tidak aktif atau user tidak memiliki `maker_role`, THEN THE useApproval_Hook SHALL mengembalikan `hasWorkflow=false` dan data disimpan langsung ke database.
6. THE Shared_Form `CashFlowProjectionForm.tsx` SHALL menampilkan ringkasan Total Cash In dan Total Cash Out sebagai Sticky_Status_Bar di bawah header form, bukan di footer modal.
7. THE Sticky_Status_Bar SHALL selalu terlihat saat user men-scroll konten form, mengikuti pola yang sama dengan `BalanceSheetForm.tsx`.
8. THE Shared_Form `CashFlowProjectionForm.tsx` SHALL mendukung prop `readOnly: boolean` dan merender seluruh field dari `payload` tanpa melakukan fetch data sendiri.
9. THE Form_Registry SHALL mendaftarkan `CashFlowProjectionApprovalForm` dengan key yang sama dengan nilai `view_component` di tabel `approval_workflows`.

---

### Requirement 6: Integrasi Approval — Pinjaman Bank (Bank Loan)

**User Story:** Sebagai Finance Staff, saya ingin setiap input, perubahan, dan penghapusan data Pinjaman Bank melalui proses persetujuan, sehingga data pinjaman yang dicatat telah diverifikasi oleh Finance Manager dan Finance Leader.

#### Acceptance Criteria

1. WHEN Finance_Staff menyimpan data Pinjaman Bank baru, THE Approval_Engine SHALL membuat draft approval dengan `module='cfd'`, `entityType='bank_loan'`, `action='create'`.
2. WHEN Finance_Staff mengubah data Pinjaman Bank, THE Approval_Engine SHALL membuat draft approval dengan `action='edit'` dan menyimpan snapshot data lama di `original_data`.
3. WHEN Finance_Staff menghapus data Pinjaman Bank, THE Approval_Engine SHALL membuat draft approval dengan `action='delete'`.
4. WHEN approval Pinjaman Bank disetujui pada step terakhir, THE Approval_Callbacks SHALL mengeksekusi handler yang sesuai (`handleBankLoanCreate`, `handleBankLoanEdit`, atau `handleBankLoanDelete`) dalam satu transaksi database.
5. IF workflow tidak aktif atau user tidak memiliki `maker_role`, THEN THE useApproval_Hook SHALL mengembalikan `hasWorkflow=false` dan data disimpan langsung ke database.
6. THE Shared_Form `BankLoanForm.tsx` SHALL mendukung prop `readOnly: boolean` dan merender seluruh field dari `payload` tanpa melakukan fetch data sendiri.
7. THE Form_Registry SHALL mendaftarkan `BankLoanApprovalForm` dengan key yang sama dengan nilai `view_component` di tabel `approval_workflows`.
8. THE Workflow_Catalog SHALL memiliki entry untuk `bank_loan` dengan semua callback key yang sesuai.

---

### Requirement 7: Integrasi Approval — Perusahaan (Corporate)

**User Story:** Sebagai Corporate Admin, saya ingin setiap penambahan dan perubahan data Perusahaan melalui proses persetujuan, sehingga perubahan data master perusahaan dikendalikan dan dapat diaudit.

#### Acceptance Criteria

1. WHEN Corporate_Admin menyimpan data Perusahaan baru, THE Approval_Engine SHALL membuat draft approval dengan `module='cfd'`, `entityType='corporate'`, `action='create'`.
2. WHEN Corporate_Admin mengubah data Perusahaan, THE Approval_Engine SHALL membuat draft approval dengan `action='edit'` dan menyimpan snapshot data lama di `original_data`.
3. WHEN Corporate_Admin menghapus data Perusahaan, THE Approval_Engine SHALL membuat draft approval dengan `action='delete'`.
4. WHEN approval Perusahaan disetujui pada step terakhir, THE Approval_Callbacks SHALL mengeksekusi handler yang sesuai (`handleCorporateCreate`, `handleCorporateEdit`, atau `handleCorporateDelete`) dalam satu transaksi database.
5. IF workflow tidak aktif atau user tidak memiliki `maker_role`, THEN THE useApproval_Hook SHALL mengembalikan `hasWorkflow=false` dan data disimpan langsung ke database.
6. THE Shared_Form `CorporateApprovalForm.tsx` SHALL mendukung prop `readOnly: boolean` dan merender seluruh field dari `payload` tanpa melakukan fetch data sendiri.
7. THE Form_Registry SHALL mendaftarkan `CorporateApprovalForm` dengan key yang sama dengan nilai `view_component` di tabel `approval_workflows`.
8. THE Workflow_Catalog SHALL memiliki entry untuk `corporate` dengan semua callback key yang sesuai.

---

### Requirement 8: Integrasi Approval — Departemen (Department)

**User Story:** Sebagai Corporate Admin, saya ingin setiap penambahan dan perubahan data Departemen melalui proses persetujuan, sehingga struktur organisasi yang dicatat telah divalidasi.

#### Acceptance Criteria

1. WHEN Corporate_Admin menyimpan data Departemen baru, THE Approval_Engine SHALL membuat draft approval dengan `module='cfd'`, `entityType='department'`, `action='create'`.
2. WHEN Corporate_Admin mengubah data Departemen, THE Approval_Engine SHALL membuat draft approval dengan `action='edit'` dan menyimpan snapshot data lama di `original_data`.
3. WHEN Corporate_Admin menghapus data Departemen, THE Approval_Engine SHALL membuat draft approval dengan `action='delete'`.
4. WHEN approval Departemen disetujui pada step terakhir, THE Approval_Callbacks SHALL mengeksekusi handler yang sesuai (`handleDepartmentCreate`, `handleDepartmentEdit`, atau `handleDepartmentDelete`) dalam satu transaksi database.
5. IF workflow tidak aktif atau user tidak memiliki `maker_role`, THEN THE useApproval_Hook SHALL mengembalikan `hasWorkflow=false` dan data disimpan langsung ke database.
6. THE Shared_Form `DepartmentApprovalForm.tsx` SHALL mendukung prop `readOnly: boolean` dan merender seluruh field dari `payload` tanpa melakukan fetch data sendiri.
7. THE Form_Registry SHALL mendaftarkan `DepartmentApprovalForm` dengan key yang sama dengan nilai `view_component` di tabel `approval_workflows`.
8. THE Workflow_Catalog SHALL memiliki entry untuk `department` dengan semua callback key yang sesuai.

---

### Requirement 9: Integrasi Approval — Cost Center

**User Story:** Sebagai Finance Staff, saya ingin setiap penambahan dan perubahan data Cost Center melalui proses persetujuan, sehingga struktur biaya yang dicatat telah divalidasi oleh pihak yang berwenang.

#### Acceptance Criteria

1. WHEN Finance_Staff menyimpan data Cost Center baru, THE Approval_Engine SHALL membuat draft approval dengan `module='cfd'`, `entityType='cost_center'`, `action='create'`.
2. WHEN Finance_Staff mengubah data Cost Center, THE Approval_Engine SHALL membuat draft approval dengan `action='edit'` dan menyimpan snapshot data lama di `original_data`.
3. WHEN Finance_Staff menghapus data Cost Center, THE Approval_Engine SHALL membuat draft approval dengan `action='delete'`.
4. WHEN approval Cost Center disetujui pada step terakhir, THE Approval_Callbacks SHALL mengeksekusi handler yang sesuai (`handleCostCenterCreate`, `handleCostCenterEdit`, atau `handleCostCenterDelete`) dalam satu transaksi database.
5. IF workflow tidak aktif atau user tidak memiliki `maker_role`, THEN THE useApproval_Hook SHALL mengembalikan `hasWorkflow=false` dan data disimpan langsung ke database.
6. THE Shared_Form `CostCenterApprovalForm.tsx` SHALL mendukung prop `readOnly: boolean` dan merender seluruh field dari `payload` tanpa melakukan fetch data sendiri.
7. THE Form_Registry SHALL mendaftarkan `CostCenterApprovalForm` dengan key yang sama dengan nilai `view_component` di tabel `approval_workflows`.
8. THE Workflow_Catalog SHALL memiliki entry untuk `cost_center` dengan semua callback key yang sesuai.

---

### Requirement 10: Integrasi Approval — Proyek (Project)

**User Story:** Sebagai Corporate Admin, saya ingin setiap penambahan dan perubahan data Proyek melalui proses persetujuan, sehingga proyek yang terdaftar telah disetujui oleh pihak yang berwenang.

#### Acceptance Criteria

1. WHEN Corporate_Admin menyimpan data Proyek baru, THE Approval_Engine SHALL membuat draft approval dengan `module='cfd'`, `entityType='project'`, `action='create'`.
2. WHEN Corporate_Admin mengubah data Proyek, THE Approval_Engine SHALL membuat draft approval dengan `action='edit'` dan menyimpan snapshot data lama di `original_data`.
3. WHEN Corporate_Admin menghapus data Proyek, THE Approval_Engine SHALL membuat draft approval dengan `action='delete'`.
4. WHEN approval Proyek disetujui pada step terakhir, THE Approval_Callbacks SHALL mengeksekusi handler yang sesuai (`handleProjectCreate`, `handleProjectEdit`, atau `handleProjectDelete`) dalam satu transaksi database.
5. IF workflow tidak aktif atau user tidak memiliki `maker_role`, THEN THE useApproval_Hook SHALL mengembalikan `hasWorkflow=false` dan data disimpan langsung ke database.
6. THE Shared_Form `ProjectApprovalForm.tsx` SHALL mendukung prop `readOnly: boolean` dan merender seluruh field dari `payload` tanpa melakukan fetch data sendiri.
7. THE Form_Registry SHALL mendaftarkan `ProjectApprovalForm` dengan key yang sama dengan nilai `view_component` di tabel `approval_workflows`.
8. THE Workflow_Catalog SHALL memiliki entry untuk `project` dengan semua callback key yang sesuai.

---

### Requirement 11: Seed Data Approval Workflows

**User Story:** Sebagai Developer, saya ingin seed data `approval_workflows` dan `approval_workflow_steps` tersedia untuk semua 10 modul baru, sehingga sistem approval dapat langsung digunakan setelah deployment tanpa konfigurasi manual.

#### Acceptance Criteria

1. THE seed script `scripts/seed-public.ts` SHALL menyertakan definisi `approval_workflows` untuk setiap kombinasi `(module, entityType, action)` dari 10 modul baru (create, edit, delete per modul = 30 workflow entries).
2. WHEN seed script dijalankan, THE seed script SHALL menggunakan `onConflictDoUpdate` pada `(module, entityType, action)` agar seed dapat dijalankan ulang tanpa error duplikasi.
3. WHEN seed script dijalankan dan steps belum ada, THE seed script SHALL menyisipkan `approval_workflow_steps` menggunakan pola `if (existingSteps.length === 0)` untuk menghindari FK violation.
4. THE seed data untuk modul finansial (Laba Rugi, Proyeksi Laba Rugi, Arus Kas Mingguan, Realisasi, Proyeksi Arus Kas, Pinjaman Bank) SHALL menggunakan `makerRole = finance_staff`, step 1 `requiredRole = finance_manager`, step 2 `requiredRole = finance_leader`.
5. THE seed data untuk modul delete pada modul finansial SHALL menggunakan satu step dengan `requiredRole = finance_leader` (mengikuti pola yang sama dengan Balance Sheet delete).
6. THE seed data untuk modul master data (Perusahaan, Departemen, Cost Center, Proyek) SHALL menggunakan `makerRole = corporate_admin`, step 1 `requiredRole = finance_manager`, step 2 `requiredRole = finance_leader`.
7. THE seed data untuk modul delete pada modul master data SHALL menggunakan satu step dengan `requiredRole = finance_leader`.
8. WHEN seed script dijalankan, THE seed script SHALL menggunakan `roleMap.get('role_name')!` untuk mendapatkan UUID role, bukan hardcode UUID.
9. THE seed data SHALL menyertakan `nameEn` (nama workflow dalam Bahasa Inggris) untuk setiap workflow entry.
10. THE seed data SHALL menyertakan `subjectFields` yang relevan per modul untuk menghasilkan judul approval yang informatif.

---

### Requirement 12: Konsistensi Pola Integrasi

**User Story:** Sebagai Developer, saya ingin semua 10 modul mengikuti pola integrasi yang sama dengan modul Neraca, sehingga codebase konsisten dan mudah dipelihara.

#### Acceptance Criteria

1. THE Approval_Callbacks file SHALL mendaftarkan handler untuk semua 30 action (3 action × 10 modul) menggunakan `registerCallback`.
2. WHEN callback create dieksekusi, THE Approval_Callbacks SHALL menggunakan `requestedBy` sebagai nilai `createdBy` pada insert ke tabel modul.
3. WHEN callback edit dieksekusi, THE Approval_Callbacks SHALL menggunakan `requestedBy` sebagai nilai `updatedBy` dan meng-strip field `id`, `createdBy`, `createdAt` dari payload sebelum update.
4. WHEN callback delete dieksekusi, THE Approval_Callbacks SHALL memverifikasi `entityId` tidak null sebelum menjalankan delete.
5. THE Manager component untuk setiap modul SHALL memanggil `approvalHook.recheck()` saat modal dibuka untuk memastikan `hasWorkflow` mencerminkan state terkini.
6. THE Manager component untuk setiap modul SHALL menampilkan `ApprovalDetailModal` setelah draft berhasil dibuat, menggunakan state `activeDraftApprovalId`.
7. THE Manager component untuk setiap modul SHALL memvalidasi form menggunakan Zod schema sebelum memanggil `approvalHook.createDraft()`.
8. THE `docs/guides/integrating-approval.md` SHALL diperbarui dengan menambahkan semua 10 modul baru ke tabel "Modul yang Sudah Terintegrasi".
9. WHILE `approvalHook.isChecking` bernilai `true`, THE Manager component SHALL menonaktifkan tombol Simpan untuk mencegah race condition.
10. THE i18n file untuk setiap modul SHALL menyertakan string yang diperlukan untuk pesan approval (draft created, error) menggunakan `approvalI18n` yang sudah ada, tanpa hardcode string baru.
