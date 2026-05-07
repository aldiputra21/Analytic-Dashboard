# Export & Upload Module - Manual Test Checklist

**Task 27: Final Checkpoint - End-to-end Testing**

This document provides a comprehensive manual testing checklist for the Export & Upload Module covering all 11 modules (7 financial + 4 master data).

---

## Pre-Test Setup

- [x] **TypeScript Errors**: Run `npx tsc --noEmit` - **PASSED** ✅
- [ ] **Dev Server Running**: Ensure `npm run dev` is running
- [ ] **Test User**: Login with user having appropriate permissions
- [ ] **Test Data**: Ensure database has sample data for all modules

---

## Test Suite 1: Export Functionality (Requirements 1, 2)

### 1.1 Export Button Visibility

Test for each of the 11 modules:

**Financial Modules:**
- [ ] Balance Sheet (`balance_sheet`)
- [ ] Income Statement (`income_statement`)
- [ ] Income Statement Projection (`income_statement_projection`)
- [ ] Weekly Cash Flow (`weekly_cash_flow`)
- [ ] Realization (`realization`)
- [ ] Cash Flow Projection (`cash_flow_projection`)
- [ ] Bank Loan (`bank_loan`)

**Master Data Modules:**
- [ ] Corporate (`corporate`)
- [ ] Department (`department`)
- [ ] Cost Center (`cost_center`)
- [ ] Project (`project`)

**Test Steps:**
1. Navigate to each module's management page
2. Verify Export button (download icon) is visible in toolbar
3. Verify button is positioned to the right of "Clear Filter" button
4. Verify button is enabled when user has `*.read` permission

**Expected Result:** Export button visible and accessible for all 11 modules

---

### 1.2 Export File Generation - Excel Format

**Test for 3 sample modules** (Balance Sheet, Corporate, Weekly Cash Flow):

- [ ] **Balance Sheet - Excel Export**
  - Click Export button
  - Select "Excel" format
  - Verify file downloads with name pattern: `neraca_YYYY-MM-DD.xlsx`
  - Open file and verify structure:
    - Row 1: Module title ("Neraca" in ID or "Balance Sheet" in EN)
    - Row 2: Filter summary or "Semua Data"/"All Data"
    - Row 3: Column headers (bold, translated)
    - Row 4+: Data records
  - Verify currency columns use format `#,##0.00`
  - Verify date columns use format `DD/MM/YYYY`

- [ ] **Corporate - Excel Export**
  - Repeat above steps
  - Verify file name: `perusahaan_YYYY-MM-DD.xlsx`
  - Verify all corporate fields are present

- [ ] **Weekly Cash Flow - Excel Export**
  - Repeat above steps
  - Verify file name: `arus_kas_weekly_YYYY-MM-DD.xlsx`
  - Verify weekly breakdown structure

**Expected Result:** All exports generate valid Excel files with correct structure

---

### 1.3 Export File Generation - CSV Format

**Test for 1 sample module** (Balance Sheet):

- [ ] **Balance Sheet - CSV Export**
  - Click Export button
  - Select "CSV" format
  - Verify file downloads with name pattern: `neraca_YYYY-MM-DD.csv`
  - Open file and verify:
    - UTF-8 BOM encoding (opens correctly in Excel)
    - Comma-separated values
    - Same structure as Excel (title, filter, headers, data)

**Expected Result:** CSV export generates valid file with UTF-8 BOM encoding

---

### 1.4 Export with Filters

**Test for 2 sample modules** (Balance Sheet, Income Statement):

- [ ] **Balance Sheet with Period Filter**
  - Apply filter: Period = "2026-01"
  - Click Export button
  - Verify Row 2 shows: "Periode: 2026-01" (or "Period: 2026-01")
  - Verify only filtered data is exported

- [ ] **Income Statement with Corporate Filter**
  - Apply filter: Corporate = "PT Titian Servis Indonesia"
  - Click Export button
  - Verify Row 2 shows corporate name in filter summary
  - Verify only filtered data is exported

**Expected Result:** Exports respect active filters and show filter summary

---

### 1.5 Export i18n Support

**Test for 1 sample module** (Balance Sheet):

- [ ] **Indonesian Language**
  - Set language to Indonesian
  - Export Balance Sheet
  - Verify Row 1: "Neraca"
  - Verify column headers in Indonesian

- [ ] **English Language**
  - Set language to English
  - Export Balance Sheet
  - Verify Row 1: "Balance Sheet"
  - Verify column headers in English

**Expected Result:** Export files use correct language for titles and headers

---

## Test Suite 2: Upload Functionality (Requirements 3-6)

### 2.1 Upload Button Visibility

Test for each of the 11 modules:

**Financial Modules:**
- [ ] Balance Sheet
- [ ] Income Statement
- [ ] Income Statement Projection
- [ ] Weekly Cash Flow
- [ ] Realization
- [ ] Cash Flow Projection
- [ ] Bank Loan

**Master Data Modules:**
- [ ] Corporate
- [ ] Department
- [ ] Cost Center
- [ ] Project

**Test Steps:**
1. Navigate to each module's management page
2. Verify Upload button (upload icon) is visible in toolbar
3. Verify button is positioned to the left of "Add" button
4. Verify button is enabled when user has `*.upload` permission

**Expected Result:** Upload button visible and accessible for all 11 modules

---

### 2.2 Template Download

**Test for 3 sample modules** (Balance Sheet, Corporate, Project):

- [ ] **Balance Sheet Template**
  - Click Upload button
  - Click "Download Template" button
  - Verify file downloads: `balance_sheet_template.xlsx`
  - Open file and verify structure:
    - Row 1: Instructions (formatted differently)
    - Row 2: Empty
    - Row 3: Column headers matching `columnOrder` config
    - Row 4+: Sample data (commented or grayed out)

- [ ] **Corporate Template**
  - Repeat above steps
  - Verify file name: `corporate_template.xlsx`
  - Verify all required corporate fields are present

- [ ] **Project Template**
  - Repeat above steps
  - Verify file name: `project_template.xlsx`
  - Verify project-specific fields

**Expected Result:** Templates download successfully with correct structure

---

### 2.3 File Upload - Valid File

**Test for 2 sample modules** (Balance Sheet, Corporate):

- [ ] **Balance Sheet - Valid Upload**
  - Download template
  - Fill in 5 valid rows of data
  - Click Upload button
  - Drag-and-drop or select the filled template
  - Verify file name and size display
  - Verify parsing starts (loading indicator)
  - Wait for parsing to complete
  - Verify review screen shows:
    - File name with download button
    - Total rows: 5
    - Valid rows: 5
    - Invalid rows: 0
    - Table with all 5 rows
    - "Confirm Upload" button is enabled

- [ ] **Corporate - Valid Upload**
  - Repeat above steps with corporate template
  - Verify same review screen structure

**Expected Result:** Valid files parse successfully and show review screen

---

### 2.4 File Upload - Invalid Data

**Test for 1 sample module** (Balance Sheet):

- [ ] **Balance Sheet - Invalid Data**
  - Download template
  - Fill in 5 rows with 2 invalid rows (e.g., missing required fields)
  - Upload the file
  - Verify review screen shows:
    - Total rows: 5
    - Valid rows: 3
    - Invalid rows: 2
    - Error details for each invalid row
    - "Confirm Upload" button is disabled
    - Message: "All rows must be valid before upload"

**Expected Result:** Invalid rows are detected and upload is blocked

---

### 2.5 File Upload - Invalid File Type

**Test for 1 sample module** (Balance Sheet):

- [ ] **Non-Excel File**
  - Try to upload a .txt or .pdf file
  - Verify error message: "Invalid file type. Only .xlsx files are accepted"
  - Verify file is rejected

**Expected Result:** Non-Excel files are rejected with clear error message

---

### 2.6 Upload Session Management

**Test for 1 sample module** (Balance Sheet):

- [ ] **Server-Side Pagination**
  - Upload a file with 50+ rows
  - In review screen, verify pagination controls
  - Navigate to page 2
  - Verify rows load from server

- [ ] **Server-Side Search**
  - In review screen, enter search term in search box
  - Verify filtered results load from server
  - Verify pagination updates

- [ ] **File Download from Review**
  - In review screen, click download button next to file name
  - Verify file downloads via backend endpoint (not direct link)
  - Verify downloaded file matches uploaded file

- [ ] **Cancel Upload**
  - In review screen, click "Cancel" button
  - Verify confirmation dialog
  - Confirm cancellation
  - Verify modal closes
  - Verify upload session and staging rows are deleted from database

**Expected Result:** All session management features work correctly

---

## Test Suite 3: Approval Integration (Requirements 7, 8, 16, 17)

### 3.1 Financial Modules - Approval Workflow

**Test for 2 sample financial modules** (Balance Sheet, Income Statement):

- [ ] **Balance Sheet - Upload with Approval**
  - Login as Finance Staff (maker role)
  - Upload valid Balance Sheet file
  - Click "Confirm Upload"
  - Verify approval draft is created
  - Verify redirect to approval detail modal
  - Verify approval form shows:
    - File name with download button
    - Total rows summary
    - Table with uploaded rows (paginated, searchable)
  - Verify status: "Pending Approval"

- [ ] **Balance Sheet - Approval Process**
  - Login as Finance Manager (approver role)
  - Navigate to Approvals page
  - Find the Balance Sheet upload approval
  - Click to view details
  - Verify approval form displays correctly
  - Click download button - verify file downloads
  - Search in rows table - verify search works
  - Approve the upload
  - Verify data is inserted into balance_sheets table
  - Verify upload_sessions.status = 'approved'
  - Verify staging rows are deleted

- [ ] **Income Statement - Upload with Approval**
  - Repeat above steps for Income Statement
  - Verify same approval workflow

**Expected Result:** Financial module uploads go through approval workflow

---

### 3.2 Master Data Modules - Optional Approval

**Test for 2 master data modules** (Corporate, Department):

- [ ] **Corporate - Upload (Approval Inactive)**
  - Verify approval workflow for `corporate_upload` is inactive
  - Upload valid Corporate file
  - Click "Confirm Upload"
  - Verify data is inserted directly (no approval)
  - Verify upload_sessions.status = 'completed'
  - Verify audit log is created

- [ ] **Department - Upload (Approval Active)**
  - Verify approval workflow for `department_upload` is active
  - Upload valid Department file
  - Click "Confirm Upload"
  - Verify approval draft is created
  - Complete approval process
  - Verify data is inserted after approval

**Expected Result:** Master data follows configured approval settings

---

### 3.3 Approval Workflow Configuration

**Verify workflow configuration:**

- [ ] **Check Approval Workflows**
  - Navigate to Approval Configuration page
  - Verify 11 upload workflows exist:
    - `balance_sheet_upload`
    - `income_statement_upload`
    - `income_statement_projection_upload`
    - `weekly_cash_flow_upload`
    - `realization_upload`
    - `cash_flow_projection_upload`
    - `bank_loan_upload`
    - `corporate_upload` (inactive)
    - `department_upload`
    - `cost_center_upload`
    - `project_upload`
  - Verify each has action = 'upload'
  - Verify all are active except `corporate_upload`

**Expected Result:** All upload workflows are properly configured

---

## Test Suite 4: Upload History (Requirement 18)

### 4.1 Upload History View

**Test for 3 sample modules** (Balance Sheet, Corporate, Project):

- [ ] **Balance Sheet - Upload History**
  - Navigate to Balance Sheet management page
  - Click "Upload History" button (or tab)
  - Verify history table shows:
    - Date column
    - File Name column
    - Total Rows column
    - Valid/Invalid Rows columns
    - Status column
    - Uploaded By column
  - Verify pagination works
  - Verify sorting works (click column headers)

- [ ] **Corporate - Upload History**
  - Repeat above steps for Corporate module
  - Verify same history structure

- [ ] **Project - Upload History**
  - Repeat above steps for Project module
  - Verify same history structure

**Expected Result:** Upload history displays correctly for all modules

---

### 4.2 Upload History Detail View

**Test for 1 sample module** (Balance Sheet):

- [ ] **View Upload Detail**
  - In upload history, click on a completed upload row
  - Verify detail modal opens showing:
    - File name with download button
    - Total/Valid/Invalid rows summary
    - Table with uploaded rows (paginated, searchable)
  - Click download button - verify file downloads
  - Search in rows table - verify search works
  - Verify pagination works

**Expected Result:** Upload history detail view works correctly

---

### 4.3 Upload History Permissions

**Test permission checks:**

- [ ] **Read Permission Required**
  - Login as user with `*.read` permission (but not `*.upload`)
  - Navigate to module
  - Verify Upload History is accessible
  - Verify can view history and details
  - Verify can download files from history

**Expected Result:** Users with read permission can access upload history

---

## Test Suite 5: Audit Logs (Requirement 9)

### 5.1 Audit Log Creation

**Test for 2 sample modules** (Balance Sheet, Corporate):

- [ ] **Balance Sheet - Audit Log**
  - Complete a successful upload (with or without approval)
  - Navigate to Audit Logs page
  - Filter by action = 'upload'
  - Find the Balance Sheet upload log
  - Verify log entry shows:
    - User who uploaded
    - Action: 'upload'
    - Entity Type: 'balance_sheet'
    - Entity ID: Upload Session ID
    - Created At: Timestamp
    - "View Detail" link

- [ ] **Corporate - Audit Log**
  - Repeat above steps for Corporate upload
  - Verify same audit log structure

**Expected Result:** Audit logs are created for all successful uploads

---

### 5.2 Audit Log Detail View

**Test for 1 sample module** (Balance Sheet):

- [ ] **View Audit Log Detail**
  - In audit logs, click "View Detail" on an upload log
  - Verify detail modal opens showing:
    - File name with download button
    - Summary: fileName, totalRows, validRows, invalidRows, status
    - Table with uploaded rows (paginated, searchable)
  - Click download button - verify file downloads
  - Search in rows table - verify search works
  - Verify pagination works

**Expected Result:** Audit log detail view displays complete upload information

---

### 5.3 Audit Log Metadata Structure

**Verify metadata structure:**

- [ ] **Check Metadata JSON**
  - Query audit_logs table directly (or via API)
  - Find an upload log entry
  - Verify metadata JSON contains:
    ```json
    {
      "fileName": "...",
      "totalRows": 10,
      "validRows": 10,
      "invalidRows": 0,
      "status": "completed",
      "rows": [
        {
          "rowNumber": 4,
          "status": "inserted",
          "data": { ... }
        },
        ...
      ]
    }
    ```

**Expected Result:** Audit log metadata has correct structure per Requirement 9

---

## Test Suite 6: i18n Compliance (Requirement 13)

### 6.1 UI Strings - No Hardcoding

**Manual code review:**

- [ ] **Check Export/Upload Components**
  - Review `ExportButton.tsx` - verify no hardcoded strings
  - Review `UploadButton.tsx` - verify no hardcoded strings
  - Review `UploadModal.tsx` - verify no hardcoded strings
  - Review `UploadHistoryView.tsx` - verify no hardcoded strings
  - Verify all strings use `exportUploadI18n` or `commonsI18n`

**Expected Result:** No hardcoded UI strings in export/upload components

---

### 6.2 i18n File Completeness

**Verify i18n file:**

- [ ] **Check exportUpload.ts**
  - Verify file exists: `src/i18n/exportUpload.ts`
  - Verify has both `id` and `en` sections
  - Verify covers all UI strings:
    - Export button, title, formats, messages
    - Upload button, title, template, file selection, validation
    - History view labels
    - Error messages

**Expected Result:** i18n file is complete with all required strings

---

### 6.3 Language Switching

**Test language switching:**

- [ ] **Switch to Indonesian**
  - Set language to Indonesian
  - Navigate to any module with export/upload
  - Verify all UI text is in Indonesian:
    - Button labels
    - Modal titles
    - Form labels
    - Error messages
    - Toast notifications

- [ ] **Switch to English**
  - Set language to English
  - Verify all UI text is in English

**Expected Result:** All UI text switches correctly between languages

---

## Test Suite 7: Integration & Edge Cases

### 7.1 Round-Trip Data Integrity

**Test for 1 sample module** (Balance Sheet):

- [ ] **Export-Upload Round-Trip**
  - Export Balance Sheet data (5 records)
  - Download template
  - Copy exported data to template (adjust format if needed)
  - Upload the template
  - Complete upload process
  - Verify uploaded data matches original exported data

**Expected Result:** Data maintains integrity through export-upload cycle

---

### 7.2 Large File Handling

**Test for 1 sample module** (Balance Sheet):

- [ ] **Upload Large File (100+ rows)**
  - Create template with 100+ rows
  - Upload the file
  - Verify parsing completes successfully
  - Verify pagination in review screen
  - Verify search works with large dataset
  - Complete upload
  - Verify all rows are inserted

**Expected Result:** System handles large files efficiently

---

### 7.3 Concurrent Uploads

**Test for 1 sample module** (Balance Sheet):

- [ ] **Multiple Simultaneous Uploads**
  - Open 2 browser tabs
  - Start upload in tab 1
  - Start upload in tab 2 (different file)
  - Verify both uploads process independently
  - Verify both create separate sessions
  - Complete both uploads
  - Verify both are recorded in history

**Expected Result:** System handles concurrent uploads correctly

---

### 7.4 Error Handling

**Test various error scenarios:**

- [ ] **Network Error During Upload**
  - Start upload
  - Disconnect network mid-upload
  - Verify error message displays
  - Reconnect network
  - Verify can retry upload

- [ ] **Server Error During Parsing**
  - Upload file that triggers server error (e.g., invalid config)
  - Verify error message displays
  - Verify session is not created

- [ ] **Approval Rejection**
  - Upload file (financial module)
  - Reject approval
  - Verify upload_sessions.status = 'rejected'
  - Verify data is not inserted
  - Verify staging rows are cleaned up

**Expected Result:** All error scenarios are handled gracefully

---

## Test Suite 8: Performance & Optimization

### 8.1 Export Performance

- [ ] **Large Dataset Export**
  - Export module with 1000+ records
  - Verify export completes in reasonable time (< 30 seconds)
  - Verify file size is reasonable
  - Verify file opens correctly in Excel

**Expected Result:** Export performs well with large datasets

---

### 8.2 Upload Performance

- [ ] **Large File Upload**
  - Upload file with 500+ rows
  - Verify parsing completes in reasonable time (< 60 seconds)
  - Verify review screen loads quickly
  - Verify pagination is responsive

**Expected Result:** Upload performs well with large files

---

## Summary Checklist

### Critical Requirements

- [x] **Zero TypeScript Errors** - `npx tsc --noEmit` passes ✅
- [ ] **Export works for all 11 modules**
- [ ] **Upload works for all 11 modules**
- [ ] **Approval integration works for financial modules**
- [ ] **Upload history accessible for all modules**
- [ ] **Audit logs created for all uploads**
- [ ] **No hardcoded strings (i18n compliance)**

### Test Coverage

- [ ] **Export Functionality**: Tested for all 11 modules
- [ ] **Upload Functionality**: Tested for all 11 modules
- [ ] **Approval Workflows**: Verified for 7 financial + 4 master data
- [ ] **Upload History**: Tested for representative modules
- [ ] **Audit Logs**: Verified structure and content
- [ ] **i18n Compliance**: Verified no hardcoded strings
- [ ] **Integration Tests**: Round-trip, large files, concurrent uploads
- [ ] **Error Handling**: Network errors, validation errors, rejections

---

## Notes

- **Test Data**: Ensure database has sufficient test data for all modules
- **Permissions**: Test with users having different permission levels
- **Browser Compatibility**: Test in Chrome, Firefox, Edge
- **Mobile Responsiveness**: Test on mobile devices (optional)

---

## Test Execution Log

**Date:** _____________
**Tester:** _____________
**Environment:** _____________

**Results:**
- Total Tests: _____
- Passed: _____
- Failed: _____
- Skipped: _____

**Issues Found:**
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

**Overall Status:** [ ] PASS [ ] FAIL [ ] PARTIAL

---

**End of Manual Test Checklist**
