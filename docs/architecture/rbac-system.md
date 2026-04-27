# RBAC System — Corporate Finance Dashboard (CFD)

This document explains the Role-Based Access Control (RBAC) system implemented in CFD, which uses a **Matrix Access Control** model (Role + Scope).

## 1. Core Concepts

### 1.1 Role
A role is a template containing a set of permissions. Roles are defined in the `roles` table.
- **`roles.scope`**: Defines the *intended* level of the role (System, Corporate, or Department). Used for UI filtering and validation.

### 1.2 Permission
Granular actions (e.g., `cfd.users.write`, `cfd.reports.read`) defined in the `permissions` table and mapped to roles via `role_permissions`.

### 1.3 Scope (Context)
Defined in the `user_corporate_accesses` (UCA) table. It determines the boundary where a role is active for a specific user.
- **`system`**: Access to all data across all corporations.
- **`corporate`**: Access limited to a specific `corporate_id`.
- **`department`**: Access limited to a specific `department_id` within a corporation.

---

## 2. Tiered Administration Model

To ensure data isolation and delegate management, the following admin tiers are used:

| Admin Level | Recommended Role | Scope | Managed Entities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `system_admin` | `system` | All corporations, system parameters, Global Admins. |
| **Global Admin** | `global_admin` | `system` | Global Executives, Corporate Admins (IT Teams). |
| **Corporate Admin** | `corporate_admin` | `corporate` | Users, Departments, Projects within their own corporation. |

> [!NOTE]
> Even though `system_admin` and `global_admin` both have a `system` scope, they are distinguished by their **Permissions**. A `global_admin` cannot modify system parameters (e.g., bank lists, currency rates) unless explicitly granted.

---

## 3. Recommended Roles Mapping

| Role Name | Scope | Description |
| :--- | :--- | :--- |
| `system_admin` | `system` | Vendor/Developer. |
| `global_admin` | `system` | Holding IT Team. |
| `corporate_admin` | `corporate` | Subsidiary IT Team. |
| `global_executive` | `system` | Holding BOD/Owner (Read-only global). |
| `corporate_executive` | `corporate` | Subsidiary BOD (Read-only local). |
| `finance_leader` | `corporate` | Finance Leader (Approver). |
| `finance_manager` | `corporate` | Finance Manager (Checker). |
| `finance_staff` | `corporate` | Finance Staff (Maker). |
| `dept_leader` | `department` | Dept Leader (Approver CRM/Target). |
| `dept_manager` | `department` | Dept Manager (Checker CRM/Target). |
| `dept_staff` | `department` | Dept Staff (Maker CRM/Target). |

---

## 4. Database Implementation

### 4.1 Schema Definition
The mapping is stored in `user_corporate_accesses`:
```typescript
export const userCorporateAccesses = pgTable('user_corporate_accesses', {
  userId: uuid('user_id'),
  roleId: uuid('role_id'),
  scope: varchar({ length: 20 }), // 'system', 'corporate', 'department'
  corporateId: uuid('corporate_id'),
  departmentId: uuid('department_id'),
});
```

### 4.2 Data Isolation Logic
Every API request must resolve the user's active context.
1. If scope is `system`, query returns data for all corporations.
2. If scope is `corporate`, query must include `WHERE corporate_id = :context_id`.
3. If scope is `department`, query must include `WHERE department_id = :context_id`.
