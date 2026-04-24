# Tasks — Corporate Management Finalization

## 1. Database & Permissions
- [ ] Add `cfd.cost_centers` table to schema and run migration
- [ ] Add new permissions to `permissions` table and seed
- [ ] Remove `public.subsidiaries.configure` permission

## 2. i18n
- [ ] Create `corporate.ts`
- [ ] Create `cost-center.ts`
- [ ] Create `department.ts`
- [ ] Create `project.ts`
- [ ] Create `target.ts`

## 3. Backend Implementation
- [ ] Implement `costCenterService.ts`
- [ ] Implement `cost-centers.ts` route
- [ ] Update `departmentService.ts` (handle code/corporateId)
- [ ] Update `projectService.ts` (handle code/departmentId/manual source)
- [ ] Update `targetService.ts` (handle batch monthly upsert)

## 4. Frontend Infrastructure
- [ ] Create `SearchableSelect.tsx` component
- [ ] Update `useManagement.ts` hook for Cost Centers and updated fields

## 5. UI Components (Corporate Management)
- [ ] Update `DashboardLayout.tsx` (Menu grouping and breakdown)
- [ ] Refactor `SubsidiaryManager` -> `CorporateManager.tsx`
- [ ] Implement `CostCenterManager.tsx`
- [ ] Refactor `DepartmentManager.tsx`
- [ ] Refactor `ProjectManager.tsx`
- [ ] Refactor `TargetManager.tsx` (New input flow and editable table)

## 6. Verification
- [ ] Verify multi-language support on all pages
- [ ] Verify permission enforcement (read/write/delete)
- [ ] Verify CRUD operations for all management modules
- [ ] Verify Datatable UI alignment (icons, pagination)
