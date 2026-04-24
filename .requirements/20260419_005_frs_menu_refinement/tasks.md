# Tasks - FRS Menu Refinement

- [x] Task 1: Update Sidebar Menu Permissions and Remove Data Entry Menu
  - [x] Update `NAV_ITEMS` and `FRSPage` type in `src/components/financial/dashboard/DashboardLayout.tsx`
- [x] Task 2: Remove Data Entry and Bulk Import Routes from FRSApp
  - [x] Remove lazy imports and route cases in `src/components/financial/FRSApp.tsx`
- [x] Task 3: Update Backend Routes Permissions
  - [x] Update permissions in `src/routes/financial/ratios.ts`
  - [x] Remove bulk import route and clean up `src/routes/financial/financialData.ts`
- [x] Task 4: Clean up Files and Folders
  - [x] Delete files in `src/components/financial/data-entry/`
- [x] Task 5: Update Seed Scripts
  - [x] Add new permissions and update role mappings in `scripts/seed-public.ts`
- [x] Task 6: Verification
  - [x] Verify no TypeScript errors (`npx tsc --noEmit`)
  - [x] Verify UI reflects changes
- [x] Task 7: Remove `cfd.financial_data` Permission Prefix
  - [x] Replace `cfd.financial_data.read` with `cfd.ratios.read` or `cfd.statements.read` in backend routes
  - [x] Remove all `cfd.financial_data.*` keys from `scripts/seed-public.ts`
  - [x] Update `tasks.md` status
