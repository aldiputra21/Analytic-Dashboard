# Blueprint - FRS Menu Refinement

## Component Architecture Changes

### 1. Sidebar Configuration
- **File:** `src/components/financial/dashboard/DashboardLayout.tsx`
- **Action:** 
  - Update `NAV_ITEMS` for `benchmarking` and `trends`.
  - Remove `data-entry` from `NAV_ITEMS`.
  - Remove `data-entry` and `bulk-import` from `FRSPage` type definition.

### 2. Main App Routings
- **File:** `src/components/financial/FRSApp.tsx`
- **Action:**
  - Remove lazy imports for `FinancialDataForm` and `BulkImport`.
  - Remove `case 'data-entry'` and `case 'bulk-import'` from `renderPage`.
  - Clean up any unused imports or variables.

## Backend Changes

### 1. Permission System
- **File:** `scripts/seed-public.ts`
- **Action:**
  - Add `cfd.benchmarking.read` and `cfd.trends.read` to `permissionCatalog`.
  - Update `rolePermissionMap` for `owner`, `bod`, and `subsidiary_manager` to include these new keys.
  - Remove `cfd.financial_data.write` if it's no longer needed by other modules.

### 2. API Routes
- **File:** `src/routes/financial/ratios.ts`
  - Update `/benchmark` route to `requirePermission('cfd.benchmarking.read')`.
  - Update `/trends` route to `requirePermission('cfd.trends.read')`.
- **File:** `src/routes/financial/financialData.ts`
  - This file currently handles `v_financial_summary` (read) and bulk import (write). 
  - If we are completely removing FRS-style bulk import, we should decide whether to keep the POST `/bulk` route or remove it. Since the user said "komponen dan page dihapus", and this route is specifically for that page, we will remove the `/bulk` route and the `cfd.financial_data.write` requirement.

## File Deletions
- `src/components/financial/data-entry/BulkImport.tsx`
- `src/components/financial/data-entry/DataVersionHistory.tsx`
- `src/components/financial/data-entry/FinancialDataForm.tsx`
- `src/components/financial/data-entry/.gitkeep` (if empty)
