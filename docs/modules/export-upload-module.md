# Export & Upload Module

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** 2026-05-07

---

## Overview

Export & Upload Module menambahkan kemampuan ekspor data massal ke Excel/CSV dan impor data via template Excel pada Corporate Finance Dashboard (CFD). Modul ini mencakup 11 entitas: 7 modul finansial dan 4 modul master data.

### Fitur Utama

1. **Export Data** - Ekspor data terfilter ke Excel atau CSV
2. **Upload Data** - Impor data massal via template Excel
3. **Approval Integration** - Workflow persetujuan untuk modul finansial
4. **Upload History** - Riwayat upload dengan detail per-baris
5. **Audit Trail** - Log lengkap untuk semua aktivitas upload

### Modul yang Didukung

**Modul Finansial (7):**
- Balance Sheet (`balance_sheet`)
- Income Statement (`income_statement`)
- Income Statement Projection (`income_statement_projection`)
- Weekly Cash Flow (`weekly_cash_flow`)
- Realization (`realization`)
- Cash Flow Projection (`cash_flow_projection`)
- Bank Loan (`bank_loan`)

**Modul Master Data (4):**
- Corporate (`corporate`)
- Department (`department`)
- Cost Center (`cost_center`)
- Project (`project`)

---

## Architecture

### Component Structure

```
src/
├── components/financial/
│   ├── shared/
│   │   ├── ExportButton.tsx          # Tombol export di toolbar
│   │   ├── UploadButton.tsx          # Tombol upload di toolbar
│   │   └── UploadModal.tsx           # Modal upload dengan 3 step
│   ├── upload/
│   │   └── UploadHistoryView.tsx     # Tampilan riwayat upload
│   └── approval/
│       └── UploadApprovalForms/      # 11 form approval upload
│           ├── BalanceSheetUploadApprovalForm.tsx
│           ├── IncomeStatementUploadApprovalForm.tsx
│           └── ... (9 more)
├── services/financial/
│   ├── exportService.ts              # Service untuk generate export
│   └── uploadService.ts              # Service untuk parsing & validasi
├── routes/financial/
│   └── upload.ts                     # API endpoints upload
└── i18n/
    └── exportUpload.ts               # Translasi ID/EN
```

### Database Schema

**Tabel Baru:**

```typescript
// Tabel untuk menyimpan metadata upload session
upload_sessions {
  id: UUID (PK)
  userId: UUID (FK → users)
  module: VARCHAR(50)
  entityType: VARCHAR(50)
  fileName: VARCHAR(255)
  filePath: VARCHAR(500)          // Path file untuk download
  fileSize: BIGINT
  totalRows: INTEGER
  validRows: INTEGER
  invalidRows: INTEGER
  status: VARCHAR(20)             // pending_review, confirmed, approved, failed, cancelled
  approvalId: UUID (FK → approvals)
  createdBy, createdAt, updatedBy, updatedAt
}

// Tabel staging untuk menyimpan baris data sebelum validasi
upload_staging_rows {
  id: UUID (PK)
  sessionId: UUID (FK → upload_sessions, CASCADE DELETE)
  rowNumber: INTEGER
  rowData: JSONB                  // Data baris sebagai JSON
  isValid: BOOLEAN
  errorMessages: JSONB            // Array pesan error validasi
  createdAt: TIMESTAMP
}
```

**Konfigurasi di system_configs:**

```json
// Global base path untuk semua template
{
  "key": "upload_template_base_path",
  "value": { "path": "uploads/templates" }
}

// Per-module template config
{
  "key": "upload_template_balance_sheet",
  "value": {
    "fileName": "balance_sheet_template.xlsx",
    "startRecord": 4,
    "columnOrder": ["period", "corporate_id", "account_code", ...]
  }
}
```

---

## API Endpoints

### Export Endpoints

#### GET /api/frs/export/:entityType

Ekspor data terfilter ke Excel atau CSV.

**Permission:** `{module}.{entity}.read`

**Query Parameters:**
- `format`: `xlsx` | `csv` (default: `xlsx`)
- `lang`: `id` | `en` (default: user's active language)
- `filters`: JSON string dengan filter aktif

**Response:** File stream dengan header `Content-Disposition`

**Example:**
```typescript
GET /api/frs/export/balance_sheet?format=xlsx&lang=id&filters={"period":"2026-01"}
```

---

### Upload Endpoints

#### POST /api/frs/upload/:entityType

Parse dan validasi file Excel yang diupload.

**Permission:** `{module}.{entity}.upload`

**Request:** `multipart/form-data` dengan field `file`

**Response:**
```json
{
  "sessionId": "uuid",
  "totalRows": 10,
  "validRows": 8,
  "invalidRows": 2,
  "preview": [...]
}
```

---

#### POST /api/frs/upload/sessions/:sessionId/confirm

Konfirmasi upload dan trigger approval atau insert langsung.

**Permission:** `{module}.{entity}.upload`

**Response:**
```json
{
  "sessionId": "uuid",
  "approvalId": "uuid",  // jika workflow aktif
  "status": "confirmed"
}
```

---

#### POST /api/frs/upload/sessions/:sessionId/cancel

Batalkan upload session dan hapus staging data.

**Permission:** `{module}.{entity}.upload`

**Response:**
```json
{
  "success": true,
  "message": "Upload session cancelled"
}
```

---

#### GET /api/frs/upload/sessions/:sessionId/rows

Ambil baris staging dengan server-side search dan paging.

**Permission:** `{module}.{entity}.read` OR `{module}.{entity}.upload`

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 10)
- `search`: string (optional)

**Response:**
```json
{
  "records": [...],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalRecords": 100,
    "totalPages": 10
  }
}
```

---

#### GET /api/frs/upload/template/:entityType

Download template Excel untuk modul tertentu.

**Permission:** `{module}.{entity}.upload`

**Response:** File stream dengan header `Content-Disposition`

---

#### GET /api/frs/upload/file/:sessionId

Download file yang diupload (untuk review atau history).

**Permission:** 
- `{module}.{entity}.upload` (untuk review - uploader/maker/approver)
- `{module}.{entity}.read` (untuk history - read-only access)

**Query Parameters:**
- `context`: `review` | `history` (menentukan permission check)

**Response:** File stream dengan header `Content-Disposition`

---

#### GET /api/frs/upload/history/:entityType

Ambil riwayat upload session untuk modul tertentu.

**Permission:** `{module}.{entity}.read`

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 10)
- `sortBy`: string (default: `createdAt`)
- `sortOrder`: `asc` | `desc` (default: `desc`)

**Response:**
```json
{
  "records": [
    {
      "id": "uuid",
      "fileName": "balance_sheet_2026-05-01.xlsx",
      "totalRows": 10,
      "validRows": 10,
      "invalidRows": 0,
      "status": "approved",
      "uploadedBy": "John Doe",
      "uploadedAt": "2026-05-01T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

## Frontend Components

### ExportButton

Tombol export yang ditempatkan di toolbar modul.

**Props:**
```typescript
interface ExportButtonProps {
  entityType: string;           // e.g., 'balance_sheet'
  filters: Record<string, any>; // Filter aktif dari UI
  disabled?: boolean;
}
```

**Usage:**
```tsx
<ExportButton 
  entityType="balance_sheet"
  filters={activeFilters}
/>
```

**Behavior:**
- Icon-only button (Download icon dari Lucide)
- Cek permission `{module}.{entity}.read`
- Show loading spinner saat export
- Trigger file download on success
- Show toast error on failure

---

### UploadButton

Tombol upload yang ditempatkan di toolbar modul.

**Props:**
```typescript
interface UploadButtonProps {
  entityType: string;              // e.g., 'balance_sheet'
  onUploadComplete: () => void;    // Callback untuk refresh data
  disabled?: boolean;
}
```

**Usage:**
```tsx
<UploadButton 
  entityType="balance_sheet"
  onUploadComplete={refetchData}
/>
```

**Behavior:**
- Icon-only button (Upload icon dari Lucide)
- Cek permission `{module}.{entity}.upload`
- Buka UploadModal on click

---

### UploadModal

Modal upload dengan 3 step: File Selection, Review, Approval.

**Props:**
```typescript
interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  onUploadComplete: () => void;
}
```

**Step 1 - File Selection:**
- Download template button
- Drag-and-drop area
- File validation (extension, size)
- Show selected file info

**Step 2 - Review:**
- File name dengan download button
- Summary: total/valid/invalid rows
- Server-side paginated table dengan search
- Error details per row
- Confirm button (enabled jika semua valid)
- Cancel button (hapus session + staging rows)

**Step 3 - Approval:**
- Redirect ke ApprovalDetailModal (jika workflow aktif)
- Close modal setelah konfirmasi berhasil

---

### UploadHistoryView

Tampilan riwayat upload untuk modul tertentu.

**Props:**
```typescript
interface UploadHistoryViewProps {
  entityType: string;
}
```

**Features:**
- Server-side paginated table
- Columns: Date, File Name, Total Rows, Valid/Invalid, Status, User
- Click row untuk view detail
- Download file button dengan permission check
- Sorting dan filtering

---

## Approval Integration

### Workflow Configuration

Setiap modul memiliki workflow approval tersendiri dengan action `upload`:

```typescript
// Seed data untuk approval workflows
{
  module: 'cfd',
  entityType: 'balance_sheet_upload',  // Pattern: {entity_type}_upload
  action: 'upload',
  name: 'Persetujuan Upload Neraca',
  nameEn: 'Balance Sheet Upload Approval',
  callbackHandler: 'handleBalanceSheetUpload',
  viewComponent: 'BalanceSheetUploadApprovalForm',
  makerRole: financeStaffRoleId,
  isActive: true,  // Semua aktif kecuali corporate_upload
}
```

**Status Workflow:**
- **Financial Modules (7):** Semua aktif - wajib approval
- **Master Data (4):** 
  - `corporate_upload`: **Inactive** - direct insert
  - `department_upload`, `cost_center_upload`, `project_upload`: **Active** - wajib approval

---

### Callback Handlers

Callback handler untuk memproses bulk insert setelah approval.

**Location:** `src/services/approval/approvalCallbacks.ts`

**Pattern:**
```typescript
export async function handleBalanceSheetUpload(
  payload: any,
  requestedBy: string,
  db: any
): Promise<void> {
  const { sessionId } = payload;

  // 1. Fetch staging rows
  const stagingRows = await db.query.uploadStagingRows.findMany({
    where: eq(uploadStagingRows.sessionId, sessionId),
  });

  // 2. Bulk insert ke tabel utama
  const insertData = stagingRows
    .filter(row => row.isValid)
    .map(row => ({
      ...row.rowData,
      createdBy: requestedBy,
    }));

  await db.insert(balanceSheets).values(insertData);

  // 3. Update session status
  await db.update(uploadSessions)
    .set({ status: 'approved' })
    .where(eq(uploadSessions.id, sessionId));

  // 4. Delete staging rows
  await db.delete(uploadStagingRows)
    .where(eq(uploadStagingRows.sessionId, sessionId));

  // 5. Delete uploaded file
  const session = await db.query.uploadSessions.findFirst({
    where: eq(uploadSessions.id, sessionId),
  });
  if (session?.filePath) {
    fs.unlinkSync(session.filePath);
  }

  // 6. Create audit log
  await db.insert(auditLogs).values({
    userId: requestedBy,
    action: 'upload',
    entityType: 'balance_sheet',
    entityId: sessionId,
    metadata: {
      fileName: session.fileName,
      totalRows: session.totalRows,
      validRows: session.validRows,
      invalidRows: session.invalidRows,
      status: 'completed',
      rows: stagingRows.map(row => ({
        rowNumber: row.rowNumber,
        status: 'inserted',
        data: row.rowData,
      })),
    },
  });
}
```

**IMPORTANT:** Handler harus didaftarkan di `approvalCallbacks.ts` dan diimport di `server.ts`.

---

### Upload Approval Forms

Setiap modul memiliki komponen approval form tersendiri.

**Location:** `src/components/financial/approval/UploadApprovalForms/`

**Pattern:**
```tsx
interface BalanceSheetUploadApprovalFormProps {
  payload: any;
  readOnly: boolean;
  language: 'id' | 'en';
}

export function BalanceSheetUploadApprovalForm({
  payload,
  readOnly,
  language,
}: BalanceSheetUploadApprovalFormProps) {
  const { sessionId } = payload;

  // Fetch staging rows dengan server-side paging & search
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRows(sessionId, page, search);
  }, [sessionId, page, search]);

  return (
    <div>
      {/* File name dengan download button */}
      <div>
        <span>{payload.fileName}</span>
        <button onClick={() => downloadFile(sessionId)}>
          Download
        </button>
      </div>

      {/* Summary */}
      <div>
        <p>Total Rows: {payload.totalRows}</p>
        <p>Valid Rows: {payload.validRows}</p>
        <p>Invalid Rows: {payload.invalidRows}</p>
      </div>

      {/* Table dengan search & paging */}
      <DataTable
        data={rows}
        columns={columns}
        onSearch={setSearch}
        onPageChange={setPage}
      />
    </div>
  );
}
```

**Registration:**
```typescript
// src/components/financial/approval/formRegistry.tsx
import { BalanceSheetUploadApprovalForm } from './UploadApprovalForms/BalanceSheetUploadApprovalForm';

export const formRegistry = {
  BalanceSheetUploadApprovalForm: createApprovalFormAdapter(
    BalanceSheetUploadApprovalForm
  ),
  // ... 10 more forms
};
```

---

## Permissions

### Upload Permissions

11 permission baru dengan pattern `{module}.{entity}.upload`:

```
cfd.balance_sheets.upload
cfd.income_statements.upload
public.targets.upload
cfd.weekly_cash_flows.upload
cfd.realizations.upload
cfd.cash_flow_projections.upload
cfd.bank_loans.upload
cfd.corporates.upload
public.departments.upload
cfd.cost_centers.upload
public.projects.upload
```

### Permission Checks

**Frontend:**
```typescript
const { hasPermission } = useAuth();
const canUpload = hasPermission(`cfd.balance_sheets.upload`);

{canUpload && <UploadButton entityType="balance_sheet" />}
```

**Backend:**
```typescript
// Middleware check
router.post('/upload/:entityType', 
  requirePermission((req) => `cfd.${req.params.entityType}.upload`),
  uploadHandler
);
```

---

## Template Configuration

### System Configs

**Global Base Path:**
```sql
INSERT INTO system_configs (key, value, created_by)
VALUES (
  'upload_template_base_path',
  '{"path": "uploads/templates"}',
  'system'
);
```

**Per-Module Config:**
```sql
INSERT INTO system_configs (key, value, created_by)
VALUES (
  'upload_template_balance_sheet',
  '{
    "fileName": "balance_sheet_template.xlsx",
    "startRecord": 4,
    "columnOrder": ["period", "corporate_id", "account_code", "account_name", "amount"]
  }',
  'system'
);
```

### Template File Structure

**Row 1:** Instruksi pengisian (formatted berbeda)  
**Row 2:** Kosong  
**Row 3:** Header kolom (sesuai `columnOrder`)  
**Row 4+:** Sample data (commented atau grayed out)

**Example:**
```
Row 1: INSTRUKSI: Isi data mulai dari baris 4. Jangan ubah header kolom.
Row 2: (kosong)
Row 3: Period | Corporate ID | Account Code | Account Name | Amount
Row 4: 2026-01 | uuid-123 | 1000 | Kas | 1000000
```

---

## Export Format

### Excel File Structure

**Row 1:** Judul modul (sesuai bahasa user)  
**Row 2:** Ringkasan filter atau "Semua Data"  
**Row 3:** Header kolom (translated)  
**Row 4+:** Data records

**Example:**
```
Row 1: Neraca
Row 2: Periode: 2026-01, Perusahaan: PT Titian Servis Indonesia
Row 3: Periode | Kode Akun | Nama Akun | Jumlah
Row 4: 2026-01 | 1000 | Kas | 1,000,000.00
```

### Column Formatting

- **Currency:** Format `#,##0.00` (Excel number format)
- **Date:** Format `DD/MM/YYYY`
- **Text:** Default

### File Naming

Pattern: `{module_name}_{export_date}.xlsx`

Example: `neraca_2026-05-01.xlsx`

---

## Audit Logs

### Audit Log Structure

Setiap upload mencatat satu entry di `audit_logs`:

```json
{
  "userId": "uuid",
  "action": "upload",
  "entityType": "balance_sheet",
  "entityId": "session-uuid",
  "createdAt": "2026-05-01T10:00:00Z",
  "metadata": {
    "fileName": "balance_sheet_2026-05-01.xlsx",
    "totalRows": 10,
    "validRows": 10,
    "invalidRows": 0,
    "status": "completed",
    "rows": [
      {
        "rowNumber": 4,
        "status": "inserted",
        "data": {
          "period": "2026-01",
          "amount": 1000000
        }
      }
    ]
  }
}
```

### Audit Log Detail View

Audit log dengan action `upload` menampilkan link "View Detail" yang membuka modal dengan:
- File name + download button
- Summary (total/valid/invalid rows)
- Table baris data dengan search & paging

---

## i18n Support

### Translation File

**Location:** `src/i18n/exportUpload.ts`

**Structure:**
```typescript
export const exportUploadI18n = {
  id: {
    export: {
      button: 'Ekspor',
      title: 'Ekspor Data',
      format: 'Format',
      xlsx: 'Excel',
      csv: 'CSV',
      success: 'Data berhasil diekspor',
      error: 'Gagal mengekspor data',
    },
    upload: {
      button: 'Unggah',
      title: 'Unggah Data',
      downloadTemplate: 'Unduh Template',
      selectFile: 'Pilih file atau drag-and-drop',
      fileInfo: 'Format: .xlsx | Ukuran maksimal: 10MB',
      validRows: 'Baris Valid',
      invalidRows: 'Baris Tidak Valid',
      confirmUpload: 'Konfirmasi Unggah',
      cancel: 'Batalkan',
      success: 'Data berhasil diunggah',
      error: 'Gagal mengunggah data',
    },
    history: {
      title: 'Riwayat Unggah',
      fileName: 'Nama File',
      totalRows: 'Total Baris',
      status: 'Status',
      uploadedBy: 'Diunggah oleh',
      uploadedAt: 'Tanggal Unggah',
    },
  },
  en: {
    // English translations
  },
};
```

### Usage

```typescript
const { language } = useAuth();
const t = exportUploadI18n[language];
const common = commonsI18n[language];

<button>{t.upload.button}</button>
<button>{common.save}</button>
```

---

## Integration Guide

### Menambahkan Export & Upload ke Modul Baru

**Step 1: Tambahkan Permission**
```sql
INSERT INTO permissions (key, name, name_en, module, created_by)
VALUES (
  'cfd.new_module.upload',
  'Upload Data Modul Baru',
  'Upload New Module Data',
  'cfd',
  'system'
);
```

**Step 2: Tambahkan Template Config**
```sql
INSERT INTO system_configs (key, value, created_by)
VALUES (
  'upload_template_new_module',
  '{
    "fileName": "new_module_template.xlsx",
    "startRecord": 4,
    "columnOrder": ["field1", "field2", "field3"]
  }',
  'system'
);
```

**Step 3: Buat Template File**
- Buat file Excel di `uploads/templates/new_module_template.xlsx`
- Row 1: Instruksi
- Row 2: Kosong
- Row 3: Header kolom
- Row 4+: Sample data

**Step 4: Tambahkan Approval Workflow**
```sql
INSERT INTO approval_workflows (
  module, entity_type, action, name, name_en,
  callback_handler, view_component, maker_role, is_active
)
VALUES (
  'cfd', 'new_module_upload', 'upload',
  'Persetujuan Upload Modul Baru',
  'New Module Upload Approval',
  'handleNewModuleUpload',
  'NewModuleUploadApprovalForm',
  'finance-staff-uuid',
  true
);
```

**Step 5: Buat Callback Handler**
```typescript
// src/services/approval/approvalCallbacks.ts
export async function handleNewModuleUpload(
  payload: any,
  requestedBy: string,
  db: any
): Promise<void> {
  // Implement bulk insert logic
}
```

**Step 6: Buat Approval Form**
```tsx
// src/components/financial/approval/UploadApprovalForms/NewModuleUploadApprovalForm.tsx
export function NewModuleUploadApprovalForm({ payload, readOnly, language }) {
  // Implement form UI
}
```

**Step 7: Register Form**
```typescript
// src/components/financial/approval/formRegistry.tsx
import { NewModuleUploadApprovalForm } from './UploadApprovalForms/NewModuleUploadApprovalForm';

export const formRegistry = {
  // ... existing forms
  NewModuleUploadApprovalForm: createApprovalFormAdapter(
    NewModuleUploadApprovalForm
  ),
};
```

**Step 8: Update workflowCatalog**
```typescript
// src/components/financial/approval/workflowCatalog.ts
export const WORKFLOW_CATALOG: WorkflowCatalogEntry[] = [
  // ... existing entries
  {
    labelId: 'Upload Modul Baru',
    labelEn: 'New Module Upload',
    module: 'cfd',
    entityType: 'new_module_upload',
    viewComponent: 'NewModuleUploadApprovalForm',
    callbacks: {
      upload: 'handleNewModuleUpload',
    },
  },
];
```

**Step 9: Tambahkan Button ke UI**
```tsx
// Di halaman modul baru
<div className="toolbar">
  <ExportButton 
    entityType="new_module"
    filters={activeFilters}
  />
  <UploadButton 
    entityType="new_module"
    onUploadComplete={refetchData}
  />
</div>
```

---

## Testing

### Manual Testing Checklist

Lihat: `.kiro/specs/export-upload-module/MANUAL_TEST_CHECKLIST.md`

**Test Suites:**
1. Export Functionality (Requirements 1, 2)
2. Upload Functionality (Requirements 3-6)
3. Approval Integration (Requirements 7, 8, 16, 17)
4. Upload History (Requirement 18)
5. Audit Logs (Requirement 9)
6. i18n Compliance (Requirement 13)
7. Integration & Edge Cases
8. Performance & Optimization

### Automated Tests

**Verification Tests:**
```bash
npm test src/services/financial/__tests__/export-upload.verification.test.ts
```

**TypeScript Check:**
```bash
npx tsc --noEmit
```

---

## Troubleshooting

### Issue: Template tidak ditemukan

**Error:** `TEMPLATE_FILE_NOT_FOUND`

**Solution:**
1. Cek config `upload_template_base_path` di `system_configs`
2. Cek config `upload_template_{entity_type}` di `system_configs`
3. Pastikan file template ada di path yang dikonfigurasi
4. Cek permission file (readable)

---

### Issue: Upload gagal dengan error validasi

**Error:** `All rows invalid`

**Solution:**
1. Cek format template sesuai dengan `columnOrder` di config
2. Cek Zod schema untuk modul tersebut
3. Cek data type setiap kolom (string, number, date)
4. Cek required fields tidak kosong

---

### Issue: Approval tidak muncul

**Error:** Upload langsung insert tanpa approval

**Solution:**
1. Cek workflow `{entity_type}_upload` di `approval_workflows`
2. Pastikan `is_active = true`
3. Cek user memiliki `maker_role` yang sesuai
4. Cek workflow steps sudah dikonfigurasi

---

### Issue: File download tidak berfungsi

**Error:** 403 Forbidden

**Solution:**
1. Cek permission user (`*.upload` untuk review, `*.read` untuk history)
2. Cek parameter `context` di query string
3. Cek file path di `upload_sessions.filePath`
4. Cek file masih ada (belum dihapus)

---

## Performance Considerations

### Large File Handling

- **Parsing:** Gunakan streaming untuk file >10MB
- **Pagination:** Server-side paging untuk >100 rows
- **Search:** Index pada `rowData` JSONB untuk fast search
- **Memory:** Limit concurrent uploads per user

### Database Optimization

- **Indexes:** 
  - `upload_staging_rows(sessionId)`
  - `upload_staging_rows(sessionId, rowNumber)`
  - `upload_sessions(userId, createdAt)`
- **Cleanup:** Hapus staging rows setelah approval/cancel
- **Archival:** Archive old upload sessions (>90 days)

---

## Security Considerations

### File Upload Security

- **Validation:** Cek extension (.xlsx only)
- **Size Limit:** Max 10MB per file
- **Virus Scan:** Integrate antivirus scanner (optional)
- **Storage:** Store outside web root

### Permission Checks

- **Upload:** Cek `*.upload` permission
- **Download:** Cek `*.upload` OR `*.read` permission
- **Approval:** Cek role di workflow steps

### Data Validation

- **Zod Schema:** Reuse form validation schema
- **SQL Injection:** Use parameterized queries
- **XSS:** Sanitize user input in metadata

---

## Future Enhancements

### Planned Features

1. **Bulk Edit in Review Screen**
   - Edit invalid rows directly di UI
   - Re-validate after edit

2. **Template Customization UI**
   - Admin UI untuk edit template config
   - Preview template sebelum download

3. **Export Scheduling**
   - Schedule export otomatis (daily, weekly)
   - Email export results

4. **Advanced Validation**
   - Cross-field validation rules
   - Business logic validation
   - Duplicate detection

5. **Performance Monitoring**
   - Track upload success/failure rate
   - Monitor parsing time
   - Alert on anomalies

---

## References

### Documentation

- **Requirements:** `.kiro/specs/export-upload-module/requirements.md`
- **Design:** `.kiro/specs/export-upload-module/design.md`
- **Tasks:** `.kiro/specs/export-upload-module/tasks.md`
- **Test Summary:** `.kiro/specs/export-upload-module/TEST_EXECUTION_SUMMARY.md`
- **Manual Test Checklist:** `.kiro/specs/export-upload-module/MANUAL_TEST_CHECKLIST.md`

### Related Modules

- **Approval System:** `docs/modules/approval-system.md`
- **Approval Integration Guide:** `docs/guides/integrating-approval.md`
- **Database Schema:** `docs/database/schema.md`

### External Libraries

- **ExcelJS:** https://github.com/exceljs/exceljs
- **Zod:** https://zod.dev/
- **Drizzle ORM:** https://orm.drizzle.team/

---

**Last Updated:** 2026-05-07  
**Maintained By:** Development Team  
**Status:** ✅ Production Ready
