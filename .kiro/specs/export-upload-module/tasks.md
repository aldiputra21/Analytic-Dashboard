# Implementation Plan: Export & Upload Module

## Overview

This implementation plan covers the complete Export & Upload Module for 11 modules in the Corporate Finance Dashboard. The feature adds bulk data export (Excel/CSV) and import (Excel template) capabilities with approval workflow integration for financial modules.

**Key Implementation Principles:**
- TypeScript with zero errors policy
- Drizzle ORM for all database operations
- Zod schema reuse for upload validation
- i18n for all UI strings (no hardcoding)
- Approval workflow integration following `docs/guides/integrating-approval.md`
- Server-side search and paging for all data tables

**Modules Covered (11 total):**
- Financial (7): balance_sheet, income_statement, income_statement_projection, weekly_cash_flow, realization, cash_flow_projection, bank_loan
- Master Data (4): corporate, department, cost_center, project

---

## Tasks

- [x] 1. Database Schema — Create upload tables and add filePath column
  - Create migration file for `upload_sessions` and `upload_staging_rows` tables
  - Add `filePath` column to `upload_sessions` for file storage
  - Add indexes on `sessionId` and `sessionId + rowNumber` for `upload_staging_rows`
  - Add cascade delete constraint on `upload_staging_rows.sessionId`
  - _Requirements: 11.1, 11.2_

- [x] 2. System Configs — Seed template configurations
  - [x] 2.1 Add global `upload_template_base_path` config to seed script
    - Insert config with key `upload_template_base_path` and path value
    - _Requirements: 4.1_
  
  - [x] 2.2 Add per-module template configs for all 11 modules
    - Create configs with keys `upload_template_{entity_type}` for each module
    - Include `fileName`, `startRecord`, and `columnOrder` in JSON value
    - Use consistent column order matching existing form schemas
    - _Requirements: 4.2, 4.3, 14.4_

- [x] 3. Permissions — Add upload permissions for all 11 modules
  - Insert 11 new permissions with pattern `{module}.{entity}.upload`
  - Follow existing permission naming conventions
  - _Requirements: 10.1, 10.2_

- [x] 4. Checkpoint - Verify database and config setup
  - Run migration and seed scripts
  - Verify all tables, configs, and permissions created successfully
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Backend Services — Export Service
  - [x] 5.1 Create ExportService with generateExport function
    - Implement Excel generation using ExcelJS library
    - Support CSV generation with UTF-8 BOM encoding
    - Add module title row (row 1) using user's active language
    - Add filter summary row (row 2) with active filters or "All Data"
    - Add column headers row (row 3) with translated labels
    - Add data rows starting from row 4
    - _Requirements: 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 5.2 Implement column formatting for currency and dates
    - Apply Excel number format `#,##0.00` for currency columns
    - Apply date format `DD/MM/YYYY` for date columns
    - _Requirements: 2.7, 2.8_
  
  - [x] 5.3 Implement grouped format for one-to-many modules
    - Handle Income Statement Projection with grouped format
    - Handle Cash Flow Projection with grouped format
    - Write header once, followed by detail rows with identifier column
    - _Requirements: 2.6_
  
  - [x] 5.4 Implement file naming with pattern `{module_name}_{date}.xlsx`
    - Use module name in user's active language
    - Use current date in YYYY-MM-DD format
    - _Requirements: 2.9_

- [x] 6. Backend Services — Upload Service
  - [x] 6.1 Create UploadService with parseAndValidateUpload function
    - Read Excel file using ExcelJS
    - Fetch template config from system_configs
    - Parse rows starting from `startRecord`
    - Map columns according to `columnOrder`
    - _Requirements: 4.4, 4.5, 5.1, 5.2_
  
  - [x] 6.2 Implement Zod validation for each module
    - Reuse existing form Zod schemas for validation
    - Validate each row and collect error messages
    - Mark rows as valid/invalid with specific error messages
    - _Requirements: 5.3, 15.3_
  
  - [x] 6.3 Implement file storage for uploaded files
    - Save uploaded file to `{base_path}/uploads/{sessionId}/{fileName}`
    - Store file path in `upload_sessions.filePath`
    - _Requirements: Design Section 6.2_
  
  - [x] 6.4 Create upload session and staging rows in transaction
    - Insert `upload_sessions` record with status `pending_review`
    - Insert all `upload_staging_rows` with validation results
    - Return session ID, valid/invalid counts, and preview
    - _Requirements: 5.4, 5.5, 5.6, 11.3_
  
  - [x] 6.5 Implement error handling for invalid files
    - Return error if all rows invalid (no session created)
    - Return error if file format invalid
    - Return error if template config not found
    - _Requirements: 4.6, 4.7, 5.7, 5.8_

- [x] 7. API Endpoints — Export
  - [x] 7.1 Create GET /api/frs/export/{entity_type} endpoint
    - Verify `{module}.{entity}.read` permission
    - Accept query params: format (xlsx|csv), lang (id|en), filters (JSON)
    - Call ExportService.generateExport with filters
    - Return file stream with Content-Disposition header
    - _Requirements: 1.2, 1.4, Design Section 3.1_
  
  - [ ]* 7.2 Write unit tests for export endpoint
    - Test permission checks
    - Test filter application
    - Test file generation for all 11 modules
    - _Requirements: 1.2, 1.10_

- [x] 8. API Endpoints — Upload
  - [x] 8.1 Create POST /api/frs/upload/{entity_type} endpoint
    - Verify `{module}.{entity}.upload` permission
    - Accept multipart/form-data with file
    - Validate file extension (.xlsx) and size
    - Call UploadService.parseAndValidateUpload
    - Return session ID and validation summary
    - _Requirements: 3.2, 3.9, 3.10, 10.5_
  
  - [x] 8.2 Create POST /api/frs/upload/sessions/{sessionId}/confirm endpoint
    - Verify `{module}.{entity}.upload` permission
    - Check if workflow active using approval engine
    - If workflow active: create approval draft with action `upload`
    - If workflow inactive: perform bulk insert directly
    - Update session status and create audit log
    - _Requirements: 7.1, 7.2, 7.8, 8.3, 8.5_
  
  - [x] 8.3 Create POST /api/frs/upload/sessions/{sessionId}/cancel endpoint
    - Verify `{module}.{entity}.upload` permission
    - Delete session and staging rows in transaction
    - Delete uploaded file from storage
    - _Requirements: 6.11_
  
  - [x] 8.4 Create GET /api/frs/upload/sessions/{sessionId}/rows endpoint
    - Verify `{module}.{entity}.read` OR `{module}.{entity}.upload` permission
    - Accept query params: page, pageSize, search
    - Implement server-side search on rowData JSON
    - Return paginated rows with total count
    - _Requirements: 6.5, 6.6, 18.7_
  
  - [x] 8.5 Create GET /api/frs/upload/template/{entity_type} endpoint
    - Verify `{module}.{entity}.upload` permission
    - Fetch template config from system_configs
    - Read template file from configured path
    - Return file stream with Content-Disposition header
    - Return 404 if template file not found
    - _Requirements: 12.2, 12.3, 12.5, 12.6, 12.7_
  
  - [x] 8.6 Create GET /api/frs/upload/file/{sessionId} endpoint
    - Accept query param: context (review|history)
    - If context=history: verify `{module}.{entity}.read` permission
    - Else: verify `{module}.{entity}.upload` OR role in approval workflows
    - Fetch session and read file from filePath
    - Return file stream with Content-Disposition header
    - _Requirements: 6.2, 6.3, 6.4, 17.3, 17.4, 18.6_
  
  - [x] 8.7 Create GET /api/frs/upload/history/{entity_type} endpoint
    - Verify `{module}.{entity}.read` permission
    - Accept query params: page, pageSize, sortBy, sortOrder
    - Filter sessions by entityType
    - Return paginated sessions with user info
    - _Requirements: 18.2, 18.3, 18.5, 18.8_
  
  - [ ]* 8.8 Write unit tests for upload endpoints
    - Test permission checks for all endpoints
    - Test file validation and parsing
    - Test session creation and cancellation
    - Test approval workflow integration
    - _Requirements: 5.3, 6.11, 7.1, 8.3_

- [x] 9. Checkpoint - Verify backend services and API endpoints
  - Test export endpoint with sample data
  - Test upload endpoint with valid and invalid files
  - Test session confirmation with and without approval
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Frontend i18n — Create exportUpload.ts translation file
  - Create `src/i18n/exportUpload.ts` with ID and EN translations
  - Add keys for export (button, title, format, success, error)
  - Add keys for upload (button, title, downloadTemplate, selectFile, fileInfo, validRows, invalidRows, confirmUpload, cancel, success, error)
  - Add keys for history (title, fileName, totalRows, status, uploadedBy, uploadedAt)
  - Reuse `commonsI18n` for common strings (save, cancel, loading, etc.)
  - _Requirements: 13.1, 13.2, 13.6_

- [x] 11. Frontend Components — ExportButton
  - [x] 11.1 Create ExportButton component
    - Accept props: entityType, filters, disabled
    - Show icon-only button (Download icon from Lucide)
    - Check `{module}.{entity}.read` permission to show/hide
    - Show loading spinner during export
    - Call export API endpoint on click
    - Trigger file download on success
    - Show toast error on failure using i18n strings
    - _Requirements: 1.1, 1.2, 1.3, 1.9, 1.10_
  
  - [ ]* 11.2 Write unit tests for ExportButton
    - Test permission-based visibility
    - Test loading state
    - Test error handling
    - _Requirements: 1.2, 1.3, 1.9_

- [x] 12. Frontend Components — UploadButton
  - [x] 12.1 Create UploadButton component
    - Accept props: entityType, onUploadComplete, disabled
    - Show icon-only button (Upload icon from Lucide)
    - Check `{module}.{entity}.upload` permission to show/hide
    - Open UploadModal on click
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 12.2 Write unit tests for UploadButton
    - Test permission-based visibility
    - Test modal opening
    - _Requirements: 3.2, 3.3_

- [x] 13. Frontend Components — UploadModal
  - [x] 13.1 Create UploadModal component with Step 1 (File Selection)
    - Show "Download Template" button calling backend endpoint
    - Show drag-and-drop area with file input
    - Show file format info (.xlsx, max size)
    - Validate file extension and size on selection
    - Show selected file name and size
    - Show error toast for invalid files
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 12.1, 12.2_
  
  - [x] 13.2 Implement Step 2 (Review) in UploadModal
    - Show file name with download button (via backend endpoint)
    - Show summary: total rows, valid rows, invalid rows
    - Show server-side paginated table of staging rows with search
    - Show error details per row with row number and messages
    - Enable "Confirm Upload" button only if all rows valid
    - Show "Cancel" button that deletes session and closes modal
    - _Requirements: 6.1, 6.2, 6.5, 6.7, 6.8, 6.9, 6.10, 6.11_
  
  - [x] 13.3 Implement Step 3 (Approval) in UploadModal
    - Redirect to ApprovalDetailModal if workflow active
    - Close modal after successful confirmation
    - _Requirements: 7.1_
  
  - [x] 13.4 Implement cancel behavior
    - Delete session and staging rows when Cancel clicked
    - Close modal without deletion if no session created yet
    - _Requirements: 6.11, 6.12_
  
  - [ ]* 13.5 Write unit tests for UploadModal
    - Test file selection and validation
    - Test review step with valid/invalid rows
    - Test cancel behavior
    - _Requirements: 3.9, 3.10, 6.11, 6.12_

- [x] 14. Frontend Components — UploadHistoryView
  - [x] 14.1 Create UploadHistoryView component
    - Show server-side paginated table of upload sessions
    - Show columns: date, file name, total rows, valid/invalid, status, user
    - Support sorting and filtering
    - Check `{module}.{entity}.read` permission for access
    - _Requirements: 18.1, 18.2, 18.3, 18.5_
  
  - [x] 14.2 Implement detail view for upload session
    - Show file name with download button (via backend endpoint)
    - Show server-side paginated table of staging rows with search
    - Reuse same component as Upload_Approval_Form
    - Disable download button if file deleted (cancelled sessions)
    - _Requirements: 18.4, 18.6, 18.9_
  
  - [ ]* 14.3 Write unit tests for UploadHistoryView
    - Test permission checks
    - Test session list rendering
    - Test detail view
    - _Requirements: 18.1, 18.5_

- [x] 15. Checkpoint - Verify frontend components
  - Test ExportButton in all 11 modules
  - Test UploadButton and UploadModal flow
  - Test UploadHistoryView with sample data
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Approval Integration — Seed Upload Workflows
  - [x] 16.1 Add 11 upload workflows to seed script
    - Create workflows with entityType pattern `{entity_type}_upload`
    - Set action to `upload` for all workflows
    - Add bilingual names (name and nameEn)
    - Set makerRole to finance_staff UUID
    - Set subjectFields to fileName and totalRows
    - Set isActive=true for all except corporate_upload (isActive=false)
    - Use onConflictDoUpdate to avoid duplicates
    - _Requirements: 16.1, 16.2_
  
  - [x] 16.2 Add workflow steps for upload workflows
    - Use `if (existingSteps.length === 0)` pattern to avoid FK conflicts
    - Add 2 steps: finance_manager (step 1) and finance_leader (step 2)
    - Use UUID for requiredRole, not role name
    - _Requirements: 16.3_
  
  - [x] 16.3 Update workflowCatalog.ts with 11 upload entries
    - Add entries for all 11 modules with action `upload`
    - Set viewComponent to `{ModuleName}UploadApprovalForm`
    - Set callbacks.upload to `handle{ModuleName}Upload`
    - _Requirements: 16.6_

- [x] 17. Approval Integration — Callback Handlers
  - [x] 17.1 Register upload callback handlers for all 11 modules
    - Create `handle{ModuleName}Upload` functions in approvalCallbacks.ts
    - Fetch staging rows for sessionId from payload
    - Perform bulk insert to main table using requestedBy as createdBy
    - Update upload_sessions.status to `approved`
    - Delete staging rows after successful insert
    - Delete uploaded file from storage
    - Create audit log with detailed metadata
    - _Requirements: 7.4, 7.5, 7.6, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 17.2 Implement audit log creation in callbacks
    - Insert audit_logs with action `upload`
    - Store summary in metadata: fileName, totalRows, validRows, invalidRows, status
    - Store detail rows in metadata.rows array
    - Set status to `completed` on success, `failed` on error
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 17.3 Write property test for callback atomicity
    - **Property 4: Approval Atomicity**
    - **Validates: Requirements 7.7**
    - Generate random upload session with valid staging rows
    - Simulate callback failure (throw error)
    - Verify upload_sessions.status remains `pending`
    - Verify NO rows inserted to main table
    - Verify transaction rollback behavior
  
  - [ ]* 17.4 Write unit tests for callback handlers
    - Test bulk insert for all 11 modules
    - Test audit log creation
    - Test staging row cleanup
    - _Requirements: 7.4, 7.5, 7.6, 9.2_

- [x] 18. Approval Integration — Upload Approval Forms
  - [x] 18.1 Create 11 Upload Approval Form components
    - Create `{ModuleName}UploadApprovalForm.tsx` for each module
    - Support readOnly prop
    - Show file name with download button (via backend endpoint)
    - Show server-side paginated table of staging rows with search
    - Fetch rows using Backend_Upload_Rows_Endpoint
    - Do NOT fetch data independently - render from payload prop
    - _Requirements: 17.1, 17.2, 17.3, 17.5, 17.6_
  
  - [x] 18.2 Register forms in formRegistry.tsx
    - Use createApprovalFormAdapter for each form
    - Register with key matching viewComponent in database
    - _Requirements: 17.7_
  
  - [ ]* 18.3 Write unit tests for upload approval forms
    - Test readOnly mode
    - Test file download button
    - Test staging rows table with search and paging
    - _Requirements: 17.2, 17.3, 17.5_

- [x] 19. Audit Log Integration — View Detail for Upload Actions
  - [x] 19.1 Add "View Detail" link for upload actions in AuditLog
    - Show link only for action=`upload`
    - Open modal with file name and download button
    - Show server-side paginated table of rows from metadata
    - Reuse same component as Upload_Approval_Form
    - _Requirements: 9.7, 9.8_
  
  - [ ]* 19.2 Write unit tests for audit log upload detail view
    - Test link visibility for upload actions
    - Test modal rendering
    - _Requirements: 9.7, 9.8_

- [x] 20. Template Files — Create Excel templates for all 11 modules
  - [x] 20.1 Create template files for financial modules (7 files)
    - Create templates for: balance_sheet, income_statement, income_statement_projection, weekly_cash_flow, realization, cash_flow_projection, bank_loan
    - Row 1: Instructions (formatted differently)
    - Row 2: Empty
    - Row 3: Column headers matching columnOrder
    - Row 4+: Sample data (commented or grayed out)
    - Use flat format for one-to-many modules with identifier column
    - _Requirements: 4.9, 4.10, 4.11, 4.12, 12.8, 14.5_
  
  - [x] 20.2 Create template files for master data modules (4 files)
    - Create templates for: corporate, department, cost_center, project
    - Follow same structure as financial templates
    - _Requirements: 4.9, 4.10, 4.12, 12.8, 14.5_
  
  - [x] 20.3 Verify template column consistency with export
    - Ensure template column names match export column names
    - Ensure column order matches columnOrder in configs
    - _Requirements: 15.1, 15.2_

- [x] 21. Integration — Add Export and Upload buttons to all 11 modules
  - [x] 21.1 Add ExportButton to financial module toolbars (7 modules)
    - Place button to the right of Clear Filter button
    - Pass current filters as props
    - _Requirements: 1.1, 14.1_
  
  - [x] 21.2 Add UploadButton to financial module toolbars (7 modules)
    - Place button to the left of Add button
    - Pass onUploadComplete callback to refresh data
    - _Requirements: 3.1, 14.2_
  
  - [x] 21.3 Add ExportButton to master data module toolbars (4 modules)
    - Place button to the right of Clear Filter button
    - Pass current filters as props
    - _Requirements: 1.1, 14.1_
  
  - [x] 21.4 Add UploadButton to master data module toolbars (4 modules)
    - Place button to the left of Add button
    - Pass onUploadComplete callback to refresh data
    - _Requirements: 3.1, 14.2_
  
  - [x] 21.5 Add UploadHistoryView to all 11 modules
    - Add as tab or section in each module
    - Show only for users with `{module}.{entity}.read` permission
    - _Requirements: 18.1_

- [x] 22. Checkpoint - Verify approval integration
  - Test upload workflow for financial modules
  - Test direct insert for master data modules (corporate with isActive=false)
  - Test approval forms in ApprovalDetailModal
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 23. Property-Based Tests — Export Completeness
  - **Property 1: Export Completeness**
  - **Validates: Requirements 1.4, 1.5, 1.6**
  - Generate random dataset with N records and random filters
  - Call export API with filters
  - Parse exported Excel file
  - Count data rows (starting from row 4)
  - Verify row count equals N records matching filters

- [ ]* 24. Property-Based Tests — Upload Validation Consistency
  - **Property 2: Upload Validation Consistency**
  - **Validates: Requirements 5.3, 15.3**
  - Generate random valid row data matching module schema
  - Validate using Zod schema (should pass)
  - Upload via parseAndValidateUpload
  - Verify row marked as valid in staging
  - Confirm via upload endpoint
  - Verify row inserted to main table without validation errors

- [ ]* 25. Property-Based Tests — Round-Trip Data Integrity
  - **Property 3: Round-Trip Data Integrity**
  - **Validates: Requirements 15.1, 15.2**
  - Insert random record to database
  - Export to Excel
  - Parse exported file and adjust to template format
  - Upload via template
  - Fetch imported record from database
  - Compare all field values (original vs imported)
  - Verify identical values for all fields

- [ ]* 26. Property-Based Tests — Audit Trail Completeness
  - **Property 5: Audit Trail Completeness**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
  - Generate random upload session with valid rows
  - Perform upload (with or without approval)
  - Query audit_logs for action=`upload` and entityId=sessionId
  - Verify exactly one audit log entry exists
  - Verify metadata structure: fileName, totalRows, validRows, invalidRows, status, rows array
  - Verify rows array contains all uploaded rows with correct data

- [x] 27. Final Checkpoint - End-to-end testing
  - Test complete export flow for all 11 modules
  - Test complete upload flow with approval for financial modules
  - Test complete upload flow without approval for master data modules
  - Test upload history view for all modules
  - Test audit log detail view for upload actions
  - Verify zero TypeScript errors (`npx tsc --noEmit`)
  - Verify all i18n strings used (no hardcoded strings)
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from design
- Unit tests validate specific examples and edge cases
- All implementation follows patterns from `docs/guides/integrating-approval.md`
- Zero TypeScript errors policy enforced throughout
- i18n mandatory for all UI strings (no hardcoding)
- Server-side search and paging for all data tables
- Approval workflow integration for financial modules (7 modules)
- Direct insert for master data modules with workflow inactive (corporate)
