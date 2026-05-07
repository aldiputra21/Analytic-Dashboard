# Panduan Integrasi Export & Upload Module

**Target Audience:** Developer  
**Difficulty:** Intermediate  
**Estimated Time:** 2-3 hours per modul

---

## Overview

Panduan ini menjelaskan langkah-langkah untuk mengintegrasikan fitur Export & Upload ke modul baru di Corporate Finance Dashboard (CFD).

### Prerequisites

- Modul sudah memiliki CRUD functionality
- Modul sudah terintegrasi dengan RBAC
- Modul sudah memiliki Zod validation schema
- Modul sudah memiliki i18n translations

---

## Step-by-Step Integration

### Step 1: Database - Tambahkan Permission

Tambahkan permission baru untuk upload di tabel `permissions`.

**SQL:**
```sql
INSERT INTO permissions (
  key, 
  name, 
  name_en, 
  module, 
  created_by
)
VALUES (
  'cfd.new_module.upload',
  'Upload Data Modul Baru',
  'Upload New Module Data',
  'cfd',
  'system'
);
```

**Atau via Drizzle seed script:**
```typescript
// scripts/seed-permissions.ts
await db.insert(permissions).values({
  key: 'cfd.new_module.upload',
  name: 'Upload Data Modul Baru',
  nameEn: 'Upload New Module Data',
  module: 'cfd',
  createdBy: SYSTEM_ACTOR_ID,
});
```

**Assign ke Role:**
```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Finance Staff'
  AND p.key = 'cfd.new_module.upload';
```

---

### Step 2: System Configs - Template Configuration

Tambahkan konfigurasi template di `system_configs`.

**2.1 Base Path (jika belum ada):**
```sql
INSERT INTO system_configs (key, value, created_by)
VALUES (
  'upload_template_base_path',
  '{"path": "uploads/templates"}',
  'system'
)
ON CONFLICT (key) DO NOTHING;
```

**2.2 Per-Module Config:**
```sql
INSERT INTO system_configs (key, value, created_by)
VALUES (
  'upload_template_new_module',
  '{
    "fileName": "new_module_template.xlsx",
    "startRecord": 4,
    "columnOrder": [
      "field1",
      "field2",
      "field3",
      "field4"
    ]
  }',
  'system'
);
```

**IMPORTANT:** `columnOrder` harus sesuai dengan:
1. Urutan kolom di template Excel
2. Field names di Zod schema
3. Column names di database table

---

### Step 3: Template File - Buat Excel Template

Buat file Excel template di `uploads/templates/new_module_template.xlsx`.

**Structure:**

| Row | Content | Format |
|-----|---------|--------|
| 1 | Instruksi pengisian | Bold, background color |
| 2 | (kosong) | - |
| 3 | Header kolom | Bold, sesuai `columnOrder` |
| 4+ | Sample data | Normal, atau grayed out |

**Example:**

```
Row 1: INSTRUKSI: Isi data mulai dari baris 4. Jangan ubah urutan atau nama kolom.

Row 3: Field 1 | Field 2 | Field 3 | Field 4

Row 4: Value 1 | Value 2 | Value 3 | Value 4
Row 5: Value 1 | Value 2 | Value 3 | Value 4
```

**Tips:**
- Gunakan Data Validation untuk dropdown fields
- Gunakan Number Format untuk currency/date fields
- Tambahkan comment untuk field yang kompleks
- Freeze header row (Row 3)

---

### Step 4: Approval Workflow - Seed Data

Tambahkan approval workflow untuk upload.

**4.1 Create Workflow:**
```typescript
// scripts/seed-approval-workflows.ts
const [workflow] = await db.insert(approvalWorkflows).values({
  module: 'cfd',
  entityType: 'new_module_upload',  // Pattern: {entity_type}_upload
  action: 'upload',
  name: 'Persetujuan Upload Modul Baru',
  nameEn: 'New Module Upload Approval',
  callbackHandler: 'handleNewModuleUpload',
  viewComponent: 'NewModuleUploadApprovalForm',
  makerRole: financeStaffRoleId,
  subjectFields: [
    { field: 'fileName', label: 'File Name', type: 'string' },
    { field: 'totalRows', label: 'Total Rows', type: 'number' },
  ],
  isActive: true,  // Set false untuk direct insert
  createdBy: SYSTEM_ACTOR_ID,
}).onConflictDoUpdate({
  target: [
    approvalWorkflows.module,
    approvalWorkflows.entityType,
    approvalWorkflows.action,
  ],
  set: {
    name: 'Persetujuan Upload Modul Baru',
    nameEn: 'New Module Upload Approval',
    callbackHandler: 'handleNewModuleUpload',
    viewComponent: 'NewModuleUploadApprovalForm',
    updatedBy: SYSTEM_ACTOR_ID,
    updatedAt: new Date(),
  },
}).returning();
```

**4.2 Create Workflow Steps:**
```typescript
// IMPORTANT: Avoid FK constraint conflicts
const existingSteps = await db.select({ id: approvalWorkflowSteps.id })
  .from(approvalWorkflowSteps)
  .where(eq(approvalWorkflowSteps.workflowId, workflow.id));

if (existingSteps.length === 0) {
  await db.insert(approvalWorkflowSteps).values([
    {
      workflowId: workflow.id,
      stepOrder: 1,
      stepType: 'approval',
      requiredRole: financeManagerRoleId,  // Use UUID, not role name
      createdBy: SYSTEM_ACTOR_ID,
    },
    {
      workflowId: workflow.id,
      stepOrder: 2,
      stepType: 'approval',
      requiredRole: financeLeaderRoleId,
      createdBy: SYSTEM_ACTOR_ID,
    },
  ]);
}
```

**4.3 Update Workflow Catalog:**
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

---

### Step 5: Backend - Callback Handler

Buat callback handler untuk memproses bulk insert setelah approval.

**Location:** `src/services/approval/approvalCallbacks.ts`

**Template:**
```typescript
export async function handleNewModuleUpload(
  payload: any,
  requestedBy: string,
  db: any
): Promise<void> {
  const { sessionId } = payload;

  try {
    // 1. Fetch upload session
    const session = await db.query.uploadSessions.findFirst({
      where: eq(uploadSessions.id, sessionId),
    });

    if (!session) {
      throw new Error('Upload session not found');
    }

    // 2. Fetch staging rows (only valid rows)
    const stagingRows = await db.query.uploadStagingRows.findMany({
      where: and(
        eq(uploadStagingRows.sessionId, sessionId),
        eq(uploadStagingRows.isValid, true)
      ),
    });

    if (stagingRows.length === 0) {
      throw new Error('No valid rows to insert');
    }

    // 3. Transform staging data to insert format
    const insertData = stagingRows.map(row => ({
      ...row.rowData,
      createdBy: requestedBy,
      createdAt: new Date(),
    }));

    // 4. Bulk insert to main table
    await db.insert(newModuleTable).values(insertData);

    // 5. Update session status
    await db.update(uploadSessions)
      .set({ 
        status: 'approved',
        updatedBy: requestedBy,
        updatedAt: new Date(),
      })
      .where(eq(uploadSessions.id, sessionId));

    // 6. Delete staging rows (cleanup)
    await db.delete(uploadStagingRows)
      .where(eq(uploadStagingRows.sessionId, sessionId));

    // 7. Delete uploaded file
    if (session.filePath && fs.existsSync(session.filePath)) {
      fs.unlinkSync(session.filePath);
    }

    // 8. Create audit log
    await db.insert(auditLogs).values({
      userId: requestedBy,
      action: 'upload',
      entityType: 'new_module',
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
      createdBy: requestedBy,
      createdAt: new Date(),
    });

  } catch (error) {
    console.error('Error in handleNewModuleUpload:', error);
    
    // Update session status to failed
    await db.update(uploadSessions)
      .set({ 
        status: 'failed',
        updatedBy: requestedBy,
        updatedAt: new Date(),
      })
      .where(eq(uploadSessions.id, sessionId));

    // Create audit log for failure
    await db.insert(auditLogs).values({
      userId: requestedBy,
      action: 'upload',
      entityType: 'new_module',
      entityId: sessionId,
      metadata: {
        status: 'failed',
        errorMessage: error.message,
      },
      createdBy: requestedBy,
      createdAt: new Date(),
    });

    throw error;
  }
}
```

**IMPORTANT:** Handler harus diimport di `server.ts`:
```typescript
// server.ts
import './services/approval/approvalCallbacks';  // Register all callbacks
```

---

### Step 6: Frontend - Upload Approval Form

Buat komponen approval form untuk menampilkan detail upload di ApprovalDetailModal.

**Location:** `src/components/financial/approval/UploadApprovalForms/NewModuleUploadApprovalForm.tsx`

**Template:**
```tsx
import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { DataTable } from '../../shared/DataTable';
import { exportUploadI18n } from '../../../i18n/exportUpload';
import { commonsI18n } from '../../../i18n/commons';

interface NewModuleUploadApprovalFormProps {
  payload: any;
  readOnly: boolean;
  language: 'id' | 'en';
}

export function NewModuleUploadApprovalForm({
  payload,
  readOnly,
  language,
}: NewModuleUploadApprovalFormProps) {
  const t = exportUploadI18n[language];
  const common = commonsI18n[language];
  
  const { sessionId, fileName, totalRows, validRows, invalidRows } = payload;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);

  // Fetch staging rows dengan server-side paging & search
  useEffect(() => {
    fetchRows();
  }, [sessionId, page, search]);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/frs/upload/sessions/${sessionId}/rows?` +
        `page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch rows');
      
      const data = await response.json();
      setRows(data.records);
      setTotalRecords(data.pagination.totalRecords);
    } catch (error) {
      console.error('Error fetching rows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async () => {
    try {
      const response = await fetch(
        `/api/frs/upload/file/${sessionId}?context=review`
      );
      
      if (!response.ok) throw new Error('Failed to download file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const columns = [
    {
      key: 'rowNumber',
      label: 'Row',
      width: '80px',
    },
    {
      key: 'field1',
      label: 'Field 1',
      render: (row: any) => row.rowData.field1,
    },
    {
      key: 'field2',
      label: 'Field 2',
      render: (row: any) => row.rowData.field2,
    },
    {
      key: 'field3',
      label: 'Field 3',
      render: (row: any) => row.rowData.field3,
    },
    {
      key: 'isValid',
      label: 'Status',
      render: (row: any) => (
        <span className={row.isValid ? 'text-green-600' : 'text-red-600'}>
          {row.isValid ? 'Valid' : 'Invalid'}
        </span>
      ),
    },
    {
      key: 'errorMessages',
      label: 'Errors',
      render: (row: any) => (
        row.errorMessages && row.errorMessages.length > 0 ? (
          <ul className="text-sm text-red-600">
            {row.errorMessages.map((msg: string, idx: number) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        ) : null
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* File Info */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600">{t.upload.fileName}</p>
          <p className="font-semibold">{fileName}</p>
        </div>
        <button
          onClick={handleDownloadFile}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          {common.download}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">{t.upload.totalRows}</p>
          <p className="text-2xl font-bold text-blue-600">{totalRows}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">{t.upload.validRows}</p>
          <p className="text-2xl font-bold text-green-600">{validRows}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-gray-600">{t.upload.invalidRows}</p>
          <p className="text-2xl font-bold text-red-600">{invalidRows}</p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={rows}
        columns={columns}
        loading={loading}
        pagination={{
          page,
          pageSize,
          totalRecords,
          onPageChange: setPage,
        }}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: common.search,
        }}
      />
    </div>
  );
}
```

**Register Form:**
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

---

### Step 7: Frontend - Add Buttons to UI

Tambahkan ExportButton dan UploadButton ke toolbar modul.

**Location:** `src/components/financial/NewModuleManager.tsx`

**Example:**
```tsx
import { ExportButton } from './shared/ExportButton';
import { UploadButton } from './shared/UploadButton';

export function NewModuleManager() {
  const [activeFilters, setActiveFilters] = useState({});
  
  const refetchData = () => {
    // Refresh data after upload
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {/* Existing buttons */}
        <button onClick={handleFilter}>Filter</button>
        <button onClick={handleClearFilter}>Clear Filter</button>
        
        {/* Export Button - to the right of Clear Filter */}
        <ExportButton 
          entityType="new_module"
          filters={activeFilters}
        />
        
        {/* Upload Button - to the left of Add */}
        <UploadButton 
          entityType="new_module"
          onUploadComplete={refetchData}
        />
        
        <button onClick={handleAdd}>Add</button>
      </div>

      {/* Data Table */}
      <DataTable data={data} columns={columns} />
    </div>
  );
}
```

---

### Step 8: Frontend - Add Upload History View

Tambahkan tab atau section untuk upload history.

**Option 1: As Tab**
```tsx
import { UploadHistoryView } from './upload/UploadHistoryView';

export function NewModuleManager() {
  const [activeTab, setActiveTab] = useState('data');

  return (
    <div>
      {/* Tabs */}
      <div className="tabs">
        <button onClick={() => setActiveTab('data')}>Data</button>
        <button onClick={() => setActiveTab('history')}>Upload History</button>
      </div>

      {/* Content */}
      {activeTab === 'data' && (
        <DataTable data={data} columns={columns} />
      )}
      
      {activeTab === 'history' && (
        <UploadHistoryView entityType="new_module" />
      )}
    </div>
  );
}
```

**Option 2: As Separate Page**
```tsx
// src/components/financial/NewModuleUploadHistory.tsx
import { UploadHistoryView } from './upload/UploadHistoryView';

export function NewModuleUploadHistory() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Upload History - New Module</h1>
      <UploadHistoryView entityType="new_module" />
    </div>
  );
}
```

---

### Step 9: Testing

**9.1 Test Export:**
```bash
# Manual test
1. Navigate to module page
2. Apply some filters
3. Click Export button
4. Verify file downloads
5. Open file and verify structure
```

**9.2 Test Upload:**
```bash
# Manual test
1. Click Upload button
2. Download template
3. Fill in valid data (5 rows)
4. Upload file
5. Verify review screen shows correct summary
6. Click Confirm
7. Verify approval draft created (if workflow active)
8. Complete approval
9. Verify data inserted to main table
```

**9.3 Test Upload History:**
```bash
# Manual test
1. Navigate to Upload History
2. Verify list of past uploads
3. Click on an upload
4. Verify detail modal shows file and rows
5. Download file from history
```

**9.4 Test Audit Log:**
```bash
# Manual test
1. Navigate to Audit Logs
2. Filter by action = 'upload'
3. Find the upload log
4. Click "View Detail"
5. Verify detail modal shows file and rows
```

---

## Common Issues & Solutions

### Issue 1: Template tidak ditemukan

**Symptom:** Error `TEMPLATE_FILE_NOT_FOUND` saat download template

**Solution:**
1. Cek config `upload_template_base_path` ada di `system_configs`
2. Cek config `upload_template_new_module` ada di `system_configs`
3. Cek file `new_module_template.xlsx` ada di path yang dikonfigurasi
4. Cek permission file (readable by Node.js process)

---

### Issue 2: Validasi gagal untuk semua baris

**Symptom:** Semua baris ditandai invalid saat upload

**Solution:**
1. Cek `columnOrder` di config sesuai dengan field names di Zod schema
2. Cek data type di template (string, number, date)
3. Cek required fields tidak kosong
4. Cek format date (DD/MM/YYYY atau YYYY-MM-DD)
5. Debug: Log `row.rowData` di `uploadService.ts` untuk melihat parsed data

---

### Issue 3: Approval tidak muncul

**Symptom:** Upload langsung insert tanpa approval

**Solution:**
1. Cek workflow `new_module_upload` ada di `approval_workflows`
2. Cek `is_active = true`
3. Cek user memiliki `maker_role` yang sesuai
4. Cek workflow steps sudah dikonfigurasi
5. Debug: Log `hasWorkflow` di `useApproval` hook

---

### Issue 4: Callback handler tidak terpanggil

**Symptom:** Approval selesai tapi data tidak masuk ke tabel

**Solution:**
1. Cek callback handler sudah didaftarkan di `approvalCallbacks.ts`
2. Cek `approvalCallbacks.ts` diimport di `server.ts`
3. Cek `callbackHandler` di workflow sesuai dengan function name
4. Debug: Tambahkan `console.log` di awal callback handler

---

### Issue 5: File download tidak berfungsi

**Symptom:** 403 Forbidden saat download file

**Solution:**
1. Cek permission user (`*.upload` untuk review, `*.read` untuk history)
2. Cek parameter `context` di query string (`review` atau `history`)
3. Cek file path di `upload_sessions.filePath` valid
4. Cek file masih ada (belum dihapus)

---

## Best Practices

### 1. Template Design

✅ **DO:**
- Gunakan instruksi yang jelas di Row 1
- Freeze header row untuk kemudahan scroll
- Gunakan Data Validation untuk dropdown
- Tambahkan sample data sebagai contoh
- Gunakan color coding untuk required fields

❌ **DON'T:**
- Jangan gunakan merged cells
- Jangan gunakan formula kompleks
- Jangan gunakan multiple sheets
- Jangan gunakan protected cells

---

### 2. Validation

✅ **DO:**
- Reuse Zod schema dari form validation
- Berikan error message yang spesifik
- Validasi di level row (per-baris)
- Validasi cross-field jika diperlukan

❌ **DON'T:**
- Jangan hardcode validation rules
- Jangan skip validation untuk "trusted" users
- Jangan validasi di frontend saja

---

### 3. Performance

✅ **DO:**
- Gunakan server-side pagination untuk >100 rows
- Gunakan streaming untuk file >10MB
- Cleanup staging rows setelah approval/cancel
- Index pada `sessionId` di staging table

❌ **DON'T:**
- Jangan load semua rows ke memory
- Jangan skip cleanup staging rows
- Jangan allow unlimited file size

---

### 4. Security

✅ **DO:**
- Validasi file extension (.xlsx only)
- Limit file size (max 10MB)
- Store file outside web root
- Check permission sebelum download

❌ **DON'T:**
- Jangan allow arbitrary file types
- Jangan expose file path ke frontend
- Jangan skip permission check

---

## Checklist

Gunakan checklist ini untuk memastikan integrasi lengkap:

- [ ] **Database**
  - [ ] Permission `*.upload` ditambahkan
  - [ ] Permission di-assign ke role yang sesuai
  - [ ] Template config ditambahkan ke `system_configs`
  - [ ] Base path config ada (jika belum)

- [ ] **Template File**
  - [ ] File Excel dibuat dengan struktur yang benar
  - [ ] Header kolom sesuai dengan `columnOrder`
  - [ ] Sample data ditambahkan
  - [ ] File disimpan di path yang dikonfigurasi

- [ ] **Approval Workflow**
  - [ ] Workflow ditambahkan ke `approval_workflows`
  - [ ] Workflow steps dikonfigurasi
  - [ ] Workflow catalog diupdate
  - [ ] `isActive` diset sesuai kebutuhan

- [ ] **Backend**
  - [ ] Callback handler dibuat di `approvalCallbacks.ts`
  - [ ] Handler diimport di `server.ts`
  - [ ] Bulk insert logic implemented
  - [ ] Audit log creation implemented
  - [ ] Error handling implemented

- [ ] **Frontend**
  - [ ] Upload approval form dibuat
  - [ ] Form diregister di `formRegistry.tsx`
  - [ ] ExportButton ditambahkan ke toolbar
  - [ ] UploadButton ditambahkan ke toolbar
  - [ ] Upload history view ditambahkan

- [ ] **Testing**
  - [ ] Export tested dengan dan tanpa filter
  - [ ] Upload tested dengan data valid
  - [ ] Upload tested dengan data invalid
  - [ ] Approval workflow tested
  - [ ] Upload history tested
  - [ ] Audit log tested

- [ ] **Documentation**
  - [ ] Update `docs/modules/export-upload-module.md` jika ada perubahan
  - [ ] Update `AGENTS.md` dengan aturan baru (jika ada)

---

## Support

Jika mengalami kesulitan saat integrasi:

1. **Check Documentation:**
   - `docs/modules/export-upload-module.md`
   - `docs/guides/integrating-approval.md`
   - `.kiro/specs/export-upload-module/`

2. **Check Existing Implementation:**
   - Lihat implementasi di modul Balance Sheet sebagai referensi
   - Lihat callback handler di `approvalCallbacks.ts`
   - Lihat approval form di `UploadApprovalForms/`

3. **Debug:**
   - Enable console.log di callback handler
   - Check browser network tab untuk API errors
   - Check server logs untuk backend errors

---

**Last Updated:** 2026-05-07  
**Maintained By:** Development Team
