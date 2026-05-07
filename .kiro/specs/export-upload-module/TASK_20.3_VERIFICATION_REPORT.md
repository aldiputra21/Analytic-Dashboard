# Task 20.3 Verification Report: Template Column Consistency

**Task:** Verify template column consistency with export  
**Requirements:** 15.1, 15.2  
**Date:** 2026-05-01  
**Status:** ❌ FAILED - Critical Issues Found

---

## Executive Summary

Verification of template column consistency across all 11 modules has **FAILED**. All 11 template files have column header mismatches with the `columnOrder` defined in `system_configs`.

**Critical Finding:** Template files use Indonesian display names (e.g., "ID Perusahaan", "Nama", "Kode") while `system_configs.columnOrder` expects English field names (e.g., "corporate_id", "name", "code").

---

## Verification Results

### Overall Statistics
- **Total Modules:** 11
- **Passed:** 0
- **Failed:** 11
- **Pass Rate:** 0%

### Failed Modules (All 11)

#### 1. Balance Sheet (balance_sheet)
**Issues Found:** 9 column mismatches

| Position | Template Header (ID) | Expected Field Name | Status |
|----------|---------------------|---------------------|--------|
| 1 | ID Perusahaan | corporate_id | ❌ Mismatch |
| 4 | Piutang Usaha | accounts_receivable | ❌ Mismatch |
| 5 | Pekerjaan Dalam Proses | work_in_progress | ❌ Mismatch |
| 13 | Pinjaman Bank Jangka Pendek | bank_loan_current | ❌ Mismatch |
| 14 | Kewajiban Lancar Lainnya | other_current_liabilities | ❌ Mismatch |
| 15 | Pinjaman Bank Jangka Panjang | bank_loan_long_term | ❌ Mismatch |
| 16 | Kewajiban Jangka Panjang Lainnya | other_long_term_liabilities | ❌ Mismatch |
| 17 | Pinjaman Pemegang Saham | shareholder_loan | ❌ Mismatch |
| 19 | Laba Setelah Pajak | earnings_after_tax | ❌ Mismatch |

#### 2. Income Statement (income_statement)
**Issues Found:** 6 column mismatches

| Position | Template Header (ID) | Expected Field Name | Status |
|----------|---------------------|---------------------|--------|
| 1 | ID Perusahaan | corporate_id | ❌ Mismatch |
| 4 | Harga Pokok Penjualan | cogs | ❌ Mismatch |
| 6 | Biaya Bunga | interest_expense | ❌ Mismatch |
| 7 | Biaya Pajak | tax_expense | ❌ Mismatch |
| 8 | Pendapatan Lain | other_income | ❌ Mismatch |
| 9 | Biaya Lain | other_expense | ❌ Mismatch |

#### 3. Income Statement Projection (income_statement_projection)
**Issues Found:** 8 column mismatches (ALL columns)

| Position | Template Header (ID) | Expected Field Name | Status |
|----------|---------------------|---------------------|--------|
| 1 | Referensi Header | header_ref | ❌ Mismatch |
| 2 | ID Departemen | department_id | ❌ Mismatch |
| 3 | Tahun Fiskal | fiscal_year | ❌ Mismatch |
| 4 | Bulan | month | ❌ Mismatch |
| 5 | Kode Akun | account_code | ❌ Mismatch |
| 6 | Nama Akun | account_name | ❌ Mismatch |
| 7 | Jumlah | amount | ❌ Mismatch |
| 8 | Catatan | notes | ❌ Mismatch |

#### 4. Weekly Cash Flow (weekly_cash_flow)
**Issues Found:** 12 column mismatches (ALL columns)

| Position | Template Header (ID) | Expected Field Name | Status |
|----------|---------------------|---------------------|--------|
| 1 | ID Perusahaan | corporate_id | ❌ Mismatch |
| 2 | Tipe Entitas | entity_type | ❌ Mismatch |
| 3 | ID Entitas | entity_id | ❌ Mismatch |
| 4 | Periode | period | ❌ Mismatch |
| 5 | Minggu | week | ❌ Mismatch |
| 6 | Kas Masuk Operasional | operating_cash_in | ❌ Mismatch |
| 7 | Kas Keluar Operasional | operating_cash_out | ❌ Mismatch |
| 8 | Kas Masuk Investasi | investing_cash_in | ❌ Mismatch |
| 9 | Kas Keluar Investasi | investing_cash_out | ❌ Mismatch |
| 10 | Kas Masuk Pendanaan | financing_cash_in | ❌ Mismatch |
| 11 | Kas Keluar Pendanaan | financing_cash_out | ❌ Mismatch |
| 12 | Catatan | notes | ❌ Mismatch |

#### 5. Realization (realization)
**Issues Found:** 8 column mismatches (ALL columns)

| Position | Template Header (ID) | Expected Field Name | Status |
|----------|---------------------|---------------------|--------|
| 1 | Tipe Entitas | entity_type | ❌ Mismatch |
| 2 | ID Departemen | department_id | ❌ Mismatch |
| 3 | ID Proyek | project_id | ❌ Mismatch |
| 4 | Tanggal Transaksi | transaction_date | ❌ Mismatch |
| 5 | Kategori | category | ❌ Mismatch |
| 6 | ID Cost Center | cost_center_id | ❌ Mismatch |
| 7 | Jumlah | amount | ❌ Mismatch |
| 8 | Catatan | notes | ❌ Mismatch |

#### 6. Cash Flow Projection (cash_flow_projection)
**Issues Found:** 10 column mismatches (ALL columns)

| Position | Template Header (ID) | Expected Field Name | Status |
|----------|---------------------|---------------------|--------|
| 1 | Referensi Header | header_ref | ❌ Mismatch |
| 2 | ID Perusahaan | corporate_id | ❌ Mismatch |
| 3 | Tahun Fiskal | fiscal_year | ❌ Mismatch |
| 4 | Saldo Awal | initial_balance | ❌ Mismatch |
| 5 | Bulan | month | ❌ Mismatch |
| 6 | Grup | group | ❌ Mismatch |
| 7 | Tipe | type | ❌ Mismatch |
| 8 | Kategori | category | ❌ Mismatch |
| 9 | Jumlah | amount | ❌ Mismatch |
| 10 | Catatan | notes | ❌ Mismatch |

#### 7. Bank Loan (bank_loan)
**Issues Found:** 8 column mismatches

| Position | Template Header (ID) | Expected Field Name | Status |
|----------|---------------------|---------------------|--------|
| 1 | ID Perusahaan | corporate_id | ❌ Mismatch |
| 2 | ID Bank | bank_id | ❌ Mismatch |
| 3 | Tipe Kredit | credit_type | ❌ Mismatch |
| 4 | Jumlah | amount | ❌ Mismatch |
| 5 | Tanggal Mulai | start_date | ❌ Mismatch |
| 6 | Tenor (Bulan) | tenor | ❌ Mismatch |
| 7 | Tipe Bunga | interest_type | ❌ Mismatch |
| 8 | Suku Bunga | interest_rate | ❌ Mismatch |

#### 8. Corporate (corporate)
**Issues Found:** 6 column mismatches (ALL columns)

| Position | Template Header (ID) | Expected Field Name | Status |
|----------|---------------------|---------------------|--------|
| 1 | Nama | name | ❌ Mismatch |
| 2 | Kode | code | ❌ Mismatch |
| 3 | Industri | industry | ❌ Mismatch |
| 4 | Mata Uang | currency | ❌ Mismatch |
| 5 | Bulan Awal Tahun Fiskal | fiscal_year_start_month | ❌ Mismatch |
| 6 | Tarif Pajak (%) | tax_rate | ❌ Mismatch |

#### 9. Department (department)
**Issues Found:** 4 column mismatches

| Position | Template Header (ID) | Expected Field Name | Status |
|----------|---------------------|---------------------|--------|
| 2 | Nama | name | ❌ Mismatch |
| 3 | Kode | code | ❌ Mismatch |
| 4 | Deskripsi | description | ❌ Mismatch |
| 5 | Kepala Departemen | head_name | ❌ Mismatch |

#### 10. Cost Center (cost_center)
**Issues Found:** 4 column mismatches

| Position | Template Header (ID) | Expected Field Name | Status |
|----------|---------------------|---------------------|--------|
| 2 | Nama | name | ❌ Mismatch |
| 3 | Kode | code | ❌ Mismatch |
| 4 | Kategori | category | ❌ Mismatch |
| 5 | Deskripsi | description | ❌ Mismatch |

#### 11. Project (project)
**Issues Found:** 5 column mismatches

| Position | Template Header (ID) | Expected Field Name | Status |
|----------|---------------------|---------------------|--------|
| 2 | Nama | name | ❌ Mismatch |
| 3 | Kode | code | ❌ Mismatch |
| 4 | Deskripsi | description | ❌ Mismatch |
| 5 | Tanggal Mulai | start_date | ❌ Mismatch |
| 6 | Tanggal Selesai | end_date | ❌ Mismatch |

---

## Root Cause Analysis

### Primary Issue: Language Mismatch
The templates were created with **Indonesian display names** (user-friendly labels) in Row 3, while the upload service expects **English field names** (database column names) as defined in `system_configs.columnOrder`.

### Why This Matters
1. **Upload Parsing Failure:** The upload service maps columns by position using `columnOrder`. When it reads Row 3, it expects field names like `corporate_id`, but finds `ID Perusahaan` instead.

2. **Round-Trip Data Integrity Broken:** Users cannot export data and re-import it using templates without manual column header adjustments (violates Requirement 15.1).

3. **Inconsistent User Experience:** Templates show Indonesian labels, but the system internally expects English field names.

### Design Decision Conflict
There's a fundamental design conflict:
- **Templates (Row 3):** Should use user-friendly display names for better UX
- **Upload Service:** Expects database field names for parsing
- **Export Service:** Uses display names (translated based on language)

---

## Impact Assessment

### Severity: **CRITICAL** 🔴

### Affected Requirements
- ❌ **Requirement 15.1:** Template column names do NOT match export column names
- ❌ **Requirement 15.2:** Column order does NOT match columnOrder in configs
- ❌ **Requirement 4.8:** Upload service cannot parse templates correctly
- ❌ **Requirement 5.2:** Column mapping will fail during upload

### User Impact
1. **Upload Failure:** Users uploading files will get validation errors or incorrect data mapping
2. **Round-Trip Broken:** Exported data cannot be re-imported without manual editing
3. **Confusion:** Mismatch between template headers and expected field names

---

## Recommended Solutions

### Option 1: Update Templates to Use Field Names (Quick Fix)
**Action:** Replace Indonesian display names in Row 3 with English field names matching `columnOrder`

**Pros:**
- Quick fix (update 11 Excel files)
- Aligns with current upload service implementation
- Ensures round-trip data integrity

**Cons:**
- Poor UX (users see `corporate_id` instead of "ID Perusahaan")
- Not user-friendly for Indonesian users
- Violates i18n best practices

**Effort:** Low (1-2 hours)

### Option 2: Update Upload Service to Support Display Names (Recommended)
**Action:** Modify upload service to:
1. Read Row 3 headers as display names
2. Map display names to field names using a translation dictionary
3. Support both Indonesian and English headers

**Pros:**
- Better UX (users see friendly labels)
- Supports i18n properly
- Aligns with export service behavior
- Future-proof for additional languages

**Cons:**
- Requires code changes in upload service
- Need to maintain display name → field name mappings
- More complex parsing logic

**Effort:** Medium (4-6 hours)

### Option 3: Hybrid Approach - Add Field Names in Row 4 (Alternative)
**Action:** 
1. Keep Row 3 with Indonesian display names (user-friendly)
2. Add Row 4 with English field names (for parsing)
3. Update upload service to read from Row 4 instead of Row 3

**Pros:**
- Templates remain user-friendly
- Upload service gets correct field names
- No complex mapping logic needed

**Cons:**
- Templates have two header rows (may confuse users)
- Increases template complexity
- Row 4 becomes "hidden metadata"

**Effort:** Low-Medium (2-3 hours)

---

## Recommendation

**Implement Option 2: Update Upload Service to Support Display Names**

### Rationale
1. **Best UX:** Users see friendly, translated labels
2. **Consistent with Export:** Export already uses display names
3. **i18n Compliant:** Supports multiple languages properly
4. **Future-Proof:** Easy to add more languages
5. **Professional:** Aligns with enterprise software standards

### Implementation Steps
1. Create display name → field name mapping dictionary for all 11 modules
2. Update `uploadService.parseAndValidateUpload()` to:
   - Read Row 3 headers
   - Map each header to field name using dictionary
   - Fall back to field name if no mapping found (backward compatible)
3. Update templates to use consistent Indonesian display names
4. Add unit tests for header mapping logic
5. Update documentation

---

## Verification Script

A verification script has been created at:
```
scripts/verify-template-consistency.ts
```

**Usage:**
```bash
npx tsx scripts/verify-template-consistency.ts
```

**Features:**
- Reads all 11 template files
- Compares Row 3 headers with `system_configs.columnOrder`
- Generates detailed mismatch report
- Exit code 1 if any mismatches found (CI/CD friendly)

---

## Next Steps

### Immediate Actions Required
1. **Decision:** Choose solution approach (Option 1, 2, or 3)
2. **Implementation:** Execute chosen solution
3. **Re-verification:** Run verification script to confirm fixes
4. **Testing:** Test upload flow with all 11 modules
5. **Documentation:** Update design.md and requirements.md with final approach

### Blocked Tasks
The following tasks are **BLOCKED** until this issue is resolved:
- Task 21: Integration — Add Export and Upload buttons to all 11 modules
- Task 22: Checkpoint - Verify approval integration
- Task 23-26: Property-Based Tests (require working upload)
- Task 27: Final Checkpoint - End-to-end testing

---

## Conclusion

Template column consistency verification has **FAILED** across all 11 modules due to a fundamental mismatch between user-friendly display names in templates and database field names expected by the upload service.

**Critical Decision Required:** The team must choose between:
1. Quick fix with poor UX (Option 1)
2. Proper i18n solution with better UX (Option 2) ✅ **RECOMMENDED**
3. Hybrid approach with dual headers (Option 3)

**Recommendation:** Implement Option 2 for a professional, user-friendly, and future-proof solution that aligns with enterprise software standards and i18n best practices.

---

**Report Generated:** 2026-05-01  
**Verification Script:** `scripts/verify-template-consistency.ts`  
**Status:** ❌ FAILED - Awaiting Decision & Implementation
