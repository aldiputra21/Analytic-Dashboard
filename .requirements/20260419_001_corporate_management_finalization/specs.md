# Specifications — Corporate Management Finalization

## Background
The Corporate Finance Dashboard (CFD) needs finalization of the management modules to align with the new Corporate Management structure. This includes renaming groups, adding Cost Center management, and improving the CRUD experience for Corporates, Departments, Projects, and Targets.

## Objectives
1. Rename "CFD" menu group to "Corporate Management".
2. Implement "Cost Center" management.
3. Restructure "Manajemen" menu into separate "Departments", "Projects", and "Targets" menus.
4. Rename "Subsidiaries" to "Corporates" and move to "Corporate Management".
5. Implement multi-language support (ID/EN) for all management screens.
6. Improve datatable UI/UX (icons, pagination at bottom, action dialogs).

## Features & Requirements

### 1. Menu Structure
- **Group**: Corporate Management
    - **Corporates** (formerly Subsidiaries)
    - **Cost Centers** [NEW]
    - **Departments** [BREAKDOWN]
    - **Projects** [BREAKDOWN]
    - **Targets** [BREAKDOWN]

### 2. Cost Center Management
- Table: `cfd.cost_centers`
- Fields: `id`, `parent_id`, `category` (inherited from parent if exists), `name`, `code`, `description`, `is_active`, audit fields.
- Permissions: `cfd.cost_centers.read|write|delete`.
- Filter: Global search by Name & Code.

### 3. Department Management
- Permissions: `public.departments.read|write|delete`.
- Inputs: Corporate ID (searchable dropdown), Name, Code, Description.
- Filter: Global search by Corporate Name, Name, Code.

### 4. Project Management
- Permissions: `public.projects.read|write|delete`.
- Inputs: Department ID (searchable dropdown), Name, Code, Description.
- Business Logic: `source_type` always "manual", `source_id` is null on creation.
- Filter: Global search by Department Name, Name, Code.

### 5. Target Management
- Permissions: `public.targets.read|write|delete`.
- New Flow:
    1. Select Type (Department/Project).
    2. Select Entity (Searchable Dropdown).
    3. Input Year.
    4. Input Revenue & Costs in an editable table (Month, Amount).
- Filter: Global search by Department Name, Project Name, Project Description.

### 6. Corporate Management (Subsidiaries)
- Move to Corporate Management group.
- Rename to "Corporates".
- Permissions: `public.subsidiaries.read|write|delete`. Remove `configure`.
- Action: Add "View" (labels only).
- Inputs: Code, Logo (Image file).
- Filter: Global search by Name & Code.

### 7. Global UI/UX Requirements
- Actions represented by icons only.
- Pagination and record info at the bottom of the table.
- Delete confirmation using `shadcn/ui Alert Dialog`.
- Success/Error messages using `shadcn/ui Alert`.
- View/Edit actions in Popup Dialogs.
- Multi-language (ID/EN) support for all labels and messages.
