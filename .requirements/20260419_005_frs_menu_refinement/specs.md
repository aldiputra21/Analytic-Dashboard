# Specs - FRS Menu Refinement

## Background
The Financial Ratio System (FRS) and Financial Management (MAFINDA) modules currently have overlapping data entry functionalities. The project decided to consolidate data entry into the "Input Keuangan" (MAFINDA) menu, which handles Balance Sheets, Income Statements, and Cash Flow Statements more comprehensively. Additionally, permission keys for Benchmarking and Trend Analysis need to be more granular.

## Goals
1. Update sidebar menu permissions for Benchmarking and Trend Analysis.
2. Remove the legacy FRS Data Entry and Bulk Import functionality (menu, components, and routes).
3. Update backend routes to align with the new permission structure.
4. Ensure the database seeding scripts reflect these changes.

## Acceptance Criteria
### 1. Permission Updates
- "Benchmarking" menu permission changed from `cfd.financial_data.read` to `cfd.benchmarking.read`.
- "Trend Analysis" menu permission changed from `cfd.financial_data.read` to `cfd.trends.read`.
- Corresponding backend routes for benchmarking and trends updated to require these new permissions.

### 2. Removal of Data Entry
- "Data Entry" menu item removed from the sidebar.
- `src/components/financial/data-entry/` components deleted.
- Routes and lazy imports for `data-entry` and `bulk-import` removed from `FRSApp.tsx`.
- Permission key `cfd.financial_data.write` removed from seed scripts if no longer used.

### 3. Database Integrity
- `scripts/seed-public.ts` updated to include `cfd.benchmarking.read` and `cfd.trends.read`.
- User roles (owner, bod, subsidiary_manager) updated in the seed script to include the new permissions.
