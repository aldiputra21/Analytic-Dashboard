# Design Document — Export & Upload Module

## 1. Overview & Architecture

### 1.1 Feature Summary

The Export & Upload Module adds bulk data export and import capabilities to the Corporate Finance Dashboard (CFD). It covers 11 modules:

**Financial Modules (7):**
- Balance Sheet (balance_sheet)
- Income Statement (income_statement)
- Income Statement Projection (income_statement_projection)
- Weekly Cash Flow (weekly_cash_flow)
- Realization (realization)
- Cash Flow Projection (cash_flow_projection)
- Bank Loan (bank_loan)

**Master Data Modules (4):**
- Corporate (corporate)
- Department (department)
- Cost Center (cost_center)
- Project (project)

### 1.2 Key Capabilities

1. **Export**: Generate Excel/CSV files from filtered data with permission *.read
2. **Upload**: Bulk import via Excel template with permission *.upload
3. **Approval Integration**: Financial modules require approval workflow before data insertion
4. **Upload History**: View past upload sessions with detail rows per module
5. **Audit Trail**: Complete audit log for all upload activities

## 2. Database Schema

### 2.1 New Tables

#### `upload_sessions` Table

```typescript
// Drizzle ORM Schema
export const uploadSessions = pgTable('upload_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  module: varchar('module', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }), // Path to uploaded file for download (enhancement)
  fileSize: bigint('file_size').notNull(),
  totalRows: integer('total_rows').notNull(),
  validRows: integer('valid_rows').notNull(),
  invalidRows: integer('invalid_rows').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending_review'), // pending_review, confirmed, approved, failed, cancelled
  approvalId: uuid('approval_id').references(() => approvals.id),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(() => new Date()),
});
```

**Note on filePath column:**
- Design enhancement: Stores path to uploaded file for download functionality
- Pattern: `{upload_template_base_path}/uploads/{sessionId}/{fileName}`
- Used by GET /api/frs/upload/file/{sessionId} endpoint
- File deleted when session status becomes 'approved' or 'cancelled'

#### `upload_staging_rows` Table

```typescript
export const uploadStagingRows = pgTable('upload_staging_rows', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => uploadSessions.id, { onDelete: 'cascade' }),
  rowNumber: integer('row_number').notNull(),
  rowData: jsonb('row_data').notNull(), // Parsed row data as JSON object
  isValid: boolean('is_valid').notNull().default(false),
  errorMessages: jsonb('error_messages'), // Array of validation error messages
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Indexes (recommended):**
- `sessionId` for fast lookup by session
- `sessionId + rowNumber` for ordered retrieval

### 2.2 Schema Modifications

**system_configs table additions:**
- upload_template_base_path: Global directory for templates
- upload_template_{entity_type}: Per-module template config with fileName, startRecord, columnOrder

## 3. API Design

### 3.1 Export Endpoints

**GET /api/frs/export/{entity_type}**
- Purpose: Export filtered data to Excel or CSV
- Permission: {module}.{entity}.read
- Query params: format (xlsx|csv), lang (id|en), filters (JSON)
- Response: File stream with Content-Disposition header

### 3.2 Upload Endpoints

**POST /api/frs/upload/{entity_type}**
- Purpose: Parse and validate uploaded Excel file
- Permission: {module}.{entity}.upload
- Request: multipart/form-data with file
- Response: sessionId, validRows, invalidRows, preview

**POST /api/frs/upload/sessions/{sessionId}/confirm**
- Purpose: Confirm upload and trigger approval or direct insertion
- Permission: {module}.{entity}.upload
- Response: sessionId, approvalId (if workflow active), status

**POST /api/frs/upload/sessions/{sessionId}/cancel**
- Purpose: Cancel upload session and delete staging data
- Permission: {module}.{entity}.upload
- Response: success message

**GET /api/frs/upload/sessions/{sessionId}/rows**
- Purpose: Fetch staging rows with server-side search and paging
- Permission: {module}.{entity}.read or {module}.{entity}.upload
- Query params: page, pageSize, search
- Response: records array with pagination info

**GET /api/frs/upload/template/{entity_type}**
- Purpose: Download template Excel file
- Permission: {module}.{entity}.upload
- Response: File stream

**GET /api/frs/upload/file/{sessionId}**
- Purpose: Download uploaded file (for review or history)
- Permission: 
  - `{module}.{entity}.upload` (for review modal - uploader/maker/approver access)
  - `{module}.{entity}.read` (for history view - read-only access per Requirement 18)
- Query params: context (review|history) - determines permission check
- Response: File stream

**Permission Logic:**
- IF context=history: Check `{module}.{entity}.read`
- ELSE: Check `{module}.{entity}.upload` OR role in approval workflows

### 3.3 History Endpoints

**GET /api/frs/upload/history/{entity_type}**
- Purpose: Fetch upload session history for a module
- Permission: {module}.{entity}.read
- Query params: page, pageSize, sortBy, sortOrder
- Response: records array with pagination info

## 4. Frontend Component Architecture

### 4.1 Component Structure

```
src/components/financial/
├── shared/
│   ├── ExportButton.tsx
│   ├── UploadButton.tsx
│   └── UploadModal.tsx
├── export/
│   └── ExportService.ts
├── upload/
│   ├── UploadService.ts
│   ├── UploadReviewForm.tsx
│   └── UploadHistoryView.tsx
└── approval/
    ├── UploadApprovalForms/
    │   ├── BalanceSheetUploadApprovalForm.tsx
    │   ├── IncomeStatementUploadApprovalForm.tsx
    │   ├── IncomeStatementProjectionUploadApprovalForm.tsx
    │   ├── WeeklyCashFlowUploadApprovalForm.tsx
    │   ├── RealizationUploadApprovalForm.tsx
    │   ├── CashFlowProjectionUploadApprovalForm.tsx
    │   ├── BankLoanUploadApprovalForm.tsx
    │   ├── CorporateUploadApprovalForm.tsx
    │   ├── DepartmentUploadApprovalForm.tsx
    │   ├── CostCenterUploadApprovalForm.tsx
    │   ├── ProjectUploadApprovalForm.tsx
    │   └── index.ts
    └── formRegistry.ts
```

### 4.2 Export Button Component

**Location:** src/components/financial/shared/ExportButton.tsx

**Props:**
- entityType: string
- filters: Record<string, any>
- disabled: boolean (optional)

**Behavior:**
- Icon-only button (Download icon)
- Shows loading spinner during export
- Triggers file download on success
- Shows toast error on failure
- Respects *.read permission

### 4.3 Upload Button Component

**Location:** src/components/financial/shared/UploadButton.tsx

**Props:**
- entityType: string
- onUploadComplete: () => void
- disabled: boolean (optional)

**Behavior:**
- Icon-only button (Upload icon)
- Opens UploadModal on click
- Respects *.upload permission

### 4.4 Upload Modal Component

**Location:** src/components/financial/shared/UploadModal.tsx

**States:**
1. **Step 1 - File Selection**: Download template button, drag-and-drop area, file input, file validation (extension, size)
2. **Step 2 - Review**: File name + download button (via backend endpoint), summary (valid/invalid rows), server-side paginated rows table with search, error details per row, **Confirm button** (enabled only if all rows valid), **Cancel button** (deletes session and staging rows in transaction, then closes modal)
3. **Step 3 - Approval**: Redirects to ApprovalDetailModal (if workflow active)

**Cancel Behavior (per Requirement 6):**
- WHEN "Cancel" clicked AND session exists: Delete upload_sessions + upload_staging_rows in transaction
- WHEN modal closed before parsing complete: No deletion, just close modal

### 4.5 Upload History View Component

**Location:** src/components/financial/upload/UploadHistoryView.tsx

**Features:**
- Server-side paginated table of upload sessions
- Columns: Date, File Name, Total Rows, Valid/Invalid, Status, User
- Click row to view detail (identical to review form)
- Download file button with permission check
- Sorting and filtering

## 5. Export Service Implementation

**Location:** src/services/financial/exportService.ts

**Key Functions:**
- generateExport(options): Promise<Buffer>
  - Creates workbook with title, filter summary, headers, data
  - Formats currency and date columns
  - Handles grouped format for one-to-many relationships
  - Returns Excel or CSV buffer

**Excel File Structure (per Requirement 2):**
- **Row 1**: Module title in user's active language (e.g., "Neraca" or "Balance Sheet")
- **Row 2**: Filter summary in format "{label}: {value}, {label}: {value}" or "Semua Data"/"All Data" if no filters
- **Row 3**: Column headers (translated based on user's language)
- **Row 4+**: Data records

**Column Formatting:**
- Currency: #,##0.00 format (Excel number format for calculations)
- Date: DD/MM/YYYY format
- Text: Default

**File Naming:**
- Pattern: `{module_name}_{export_date}.xlsx`
- Example: `neraca_2026-05-01.xlsx`

**One-to-Many Handling (Grouped Format):**
- Header row written once
- Detail rows follow with identifier column
- Example: group_id column shows which header each detail belongs to
- Used for: Income Statement Projection, Cash Flow Projection

## 6. Upload Service Implementation

**Location:** src/services/financial/uploadService.ts

**Key Functions:**
- parseAndValidateUpload(options): Promise<{sessionId, validRows, invalidRows, preview}>
  - Reads Excel file using ExcelJS
  - Extracts rows starting from startRecord
  - Maps columns according to columnOrder
  - Validates each row with Zod schema
  - Creates upload_sessions and upload_staging_rows records
  - Returns summary

**Zod Schema Reuse:**
- Each module's upload validation uses the same Zod schema as form input
- Ensures consistency between manual input and bulk upload

**File Storage:**
- Path: {upload_template_base_path}/uploads/{sessionId}/{fileName}
- Retention: Deleted after upload session completes or is cancelled
- Access: Via /api/frs/upload/file/{sessionId} endpoint

## 7. Approval Integration

### 7.1 Upload Approval Workflows

**Seed Data (11 workflows, one per module):**

```typescript
// For each of 11 modules:
const [workflow] = await db.insert(approvalWorkflows).values({
  module: 'cfd',
  entityType: '{entity_type}_upload', // e.g., 'balance_sheet_upload'
  action: 'upload',
  name: 'Persetujuan Upload {Module Name}',
  nameEn: '{Module Name} Upload Approval',
  callbackHandler: 'handle{ModuleName}Upload',
  viewComponent: '{ModuleName}UploadApprovalForm',
  makerRole: financeStaffRoleId,
  subjectFields: [
    { field: 'fileName', label: 'File Name', type: 'string' },
    { field: 'totalRows', label: 'Total Rows', type: 'number' },
  ],
  isActive: entityType !== 'corporate_upload', // All active except corporate
  createdBy: SYSTEM_ACTOR_ID,
}).onConflictDoUpdate({
  target: [approvalWorkflows.module, approvalWorkflows.entityType, approvalWorkflows.action],
  set: { /* update fields */ }
}).returning();

// IMPORTANT: Avoid FK constraint conflicts (per Requirement 16)
const existingSteps = await db.select({ id: approvalWorkflowSteps.id })
  .from(approvalWorkflowSteps)
  .where(eq(approvalWorkflowSteps.workflowId, workflow.id));

if (existingSteps.length === 0) {
  await db.insert(approvalWorkflowSteps).values([
    { workflowId: workflow.id, stepOrder: 1, stepType: 'approval', requiredRole: financeManagerRoleId },
    { workflowId: workflow.id, stepOrder: 2, stepType: 'approval', requiredRole: financeLeaderRoleId },
  ]);
}
```

**workflowCatalog.ts Update (per Requirement 16):**

Add 11 entries to `src/components/financial/approval/workflowCatalog.ts`:

```typescript
export const WORKFLOW_CATALOG: WorkflowCatalogEntry[] = [
  // ... existing entries ...
  {
    labelId: 'Upload Neraca',
    labelEn: 'Balance Sheet Upload',
    module: 'cfd',
    entityType: 'balance_sheet_upload',
    viewComponent: 'BalanceSheetUploadApprovalForm',
    callbacks: {
      upload: 'handleBalanceSheetUpload',
    },
  },
  // ... 10 more upload entries
];
```

### 7.2 Callback Handlers

**Location:** src/services/approval/approvalCallbacks.ts

**Pattern (for each module):**
- Fetch upload_staging_rows for sessionId
- For each valid row, insert into main table
- Use requestedBy as createdBy
- Update upload_sessions.status = approved
- Delete upload_staging_rows
- Insert audit_logs with detailed metadata

**Audit Log Structure (per Requirement 9):**

Each successful upload creates ONE audit log entry with:
- `userId`: UUID of uploader
- `action`: "upload"
- `entityType`: Module name (e.g., "balance_sheet")
- `entityId`: Upload_Session ID
- `createdAt`: Timestamp
- `metadata`: JSON object with structure:
  ```json
  {
    "fileName": "balance_sheet_2026-05-01.xlsx",
    "totalRows": 47,
    "validRows": 45,
    "invalidRows": 2,
    "status": "completed" | "failed",
    "errorMessage": "..." (if failed),
    "rows": [
      {
        "rowNumber": 4,
        "status": "inserted",
        "data": { "period": "2026-05", "amount": 1000000, ... }
      },
      ...
    ]
  }
  ```

**Audit Log View Integration:**
- Audit Log View displays link "View Detail" for action="upload"
- Clicking link opens modal with:
  - File name + download button (via backend endpoint with permission check)
  - Server-side paginated rows table with search
  - Same component as Upload_Approval_Form

### 7.3 Upload Approval Forms

**Location:** src/components/financial/approval/UploadApprovalForms/{Module}UploadApprovalForm.tsx

**Props:**
- payload: Upload session data
- readOnly: boolean
- language: id | en

**Display:**
- File name + download button
- Summary (total/valid/invalid rows)
- Server-side paginated rows table with search
- Error details per row

**Registration (in formRegistry.tsx):**
- Use createApprovalFormAdapter for each form
- Register with key matching viewComponent in database

## 8. Permissions & RBAC

### 8.1 New Permissions

11 new permissions (one per module):
- cfd.balance_sheets.upload
- cfd.income_statements.upload
- public.targets.upload
- cfd.weekly_cash_flows.upload
- cfd.realizations.upload
- cfd.cash_flow_projections.upload
- cfd.bank_loans.upload
- cfd.corporates.upload
- public.departments.upload
- cfd.cost_centers.upload
- public.projects.upload

### 8.2 Permission Checks

**Frontend:**
- const canUpload = hasPermission(`${module}.${entity}.upload`)
- Show/hide upload button based on permission

**Backend:**
- Middleware check before processing upload requests
- Return 403 if permission denied

## 9. Template Configuration

### 9.1 System Configs Entries

**Global Base Path:**
```json
{
  "key": "upload_template_base_path",
  "value": { "path": "/uploads/templates" }
}
```

**Per-Module Configs (11 entries):**
```json
{
  "key": "upload_template_balance_sheet",
  "value": {
    "fileName": "balance_sheet_template.xlsx",
    "startRecord": 4,
    "columnOrder": ["period", "corporate_id", "account_code", "account_name", "amount", ...]
  }
}
```

### 9.2 Template Files

Each module has a pre-built Excel template stored at:
- {base_path}/{fileName}
- Example: /uploads/templates/balance_sheet_template.xlsx

**Template Structure:**
- Row 1: Instructions (formatted differently)
- Row 2: Empty
- Row 3: Column headers
- Row 4+: Sample data (commented or grayed out)

## 10. i18n Keys

### 10.1 New i18n File

**Location:** src/i18n/exportUpload.ts

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

## 11. Correctness Properties

### 11.1 Testable Properties

**Property 1: Export Completeness**
- For any module with N records matching filters, export file SHALL contain exactly N data rows
- Verification: Count rows in exported file vs. database query result

**Property 2: Upload Validation Consistency**
- For any row that passes Zod validation during upload, the same row SHALL pass validation when inserted
- Verification: Compare validation results before and after insertion

**Property 3: Round-Trip Data Integrity**
- For any record exported to Excel and re-imported via upload, the imported record SHALL be identical to original
- Verification: Compare field values before export and after import

**Property 4: Approval Atomicity**
- If approval callback fails, upload_sessions.status SHALL remain pending and NO rows SHALL be inserted
- Verification: Check transaction rollback behavior on callback error

**Property 5: Audit Trail Completeness**
- For every successful upload, audit_logs SHALL contain exactly one entry with action upload
- Verification: Query audit_logs and verify metadata structure and completeness

---

## 12. Implementation Sequence

1. Database: Create upload_sessions and upload_staging_rows tables
2. Backend Services: Implement export and upload services
3. API Endpoints: Create all export/upload/history endpoints
4. Frontend Components: Build export button, upload modal, history view
5. Approval Integration: Create 11 upload workflows and callback handlers
6. Upload Approval Forms: Create 11 approval form components
7. i18n: Add translation keys
8. Testing: Implement property-based tests for correctness properties
9. Documentation: Update guides and API documentation
