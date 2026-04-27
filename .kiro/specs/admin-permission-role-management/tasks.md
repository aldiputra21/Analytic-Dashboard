# Implementation Plan: Admin Permission & Role Management

## Overview

Implement the full Admin Permission and Role Management feature: database schema extensions, backend services and API routes, reusable UI components, admin management pages, public auth pages, user menu, and user profile page. All tasks follow the CorporateManager.tsx template, Tailwind CSS 4 premium styling, and i18n conventions from AGENTS.md.

## Tasks

- [x] 1. Database Schema Extensions & Migration
  - [x] 1.1 Add `email_verified`, `last_login_ip`, and `last_login_user_agent` fields to the `users` table via Drizzle migration
    - Add `emailVerified: boolean('email_verified').notNull().default(false)` to the users schema in `src/db/schema/`
    - Add `lastLoginIp: varchar('last_login_ip', { length: 45 })` and `lastLoginUserAgent: text('last_login_user_agent')`
    - Generate and apply the Drizzle migration file
    - _Requirements: 27.1, 27.2, 27.3_

  - [x] 1.2 Create `user_login_activities` table via Drizzle migration
    - Define the table with fields: `id` (uuid PK), `user_id` (FK → users, cascade delete), `login_at`, `ip_address` (inet), `user_agent` (text), `success` (boolean)
    - Add composite index on `(user_id, login_at)` for efficient querying
    - Generate and apply the Drizzle migration file
    - _Requirements: 27.4, 27.5_

  - [x] 1.3 Seed new permissions into the `permissions` table
    - Add seed entries for: `cfd.permissions.read`, `cfd.permissions.write`, `cfd.roles.read`, `cfd.roles.write`, `cfd.users.read`, `cfd.users.write`, `cfd.users.reset_password`
    - Update `scripts/seed-public.ts` (or the relevant seed file) to include these entries with `created_by = 'system'`
    - _Requirements: 1.1–1.10, 20.1–20.8_

- [x] 2. Backend Utility: Password Strength Service
  - [x] 2.1 Create `src/services/financial/passwordStrength.ts`
    - Implement `calculatePasswordStrength(password: string): PasswordStrengthResult` with score 0–100 based on length, uppercase, lowercase, numbers, and special characters
    - Implement `isPasswordAcceptable(result): boolean` — rejects "weak" (score ≤ 25)
    - Export `PasswordStrengthLevel` and `PasswordStrengthResult` types
    - _Requirements: 22.1–22.7, 22.11_

- [x] 3. Backend Service: Email Service
  - [x] 3.1 Extend `src/services/financial/emailService.ts` with activation and password reset functions
    - Add `sendActivationEmail(user: { email, fullName }, token: string, lang: 'id' | 'en'): Promise<void>`
    - Add `sendPasswordResetEmail(user: { email, fullName }, token: string, lang: 'id' | 'en'): Promise<void>`
    - Configure Nodemailer via env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
    - Implement retry logic (max 3 retries) for transient failures
    - _Requirements: 26.1–26.12_

  - [x] 3.2 Create HTML email templates
    - Create `src/templates/email/activation-id.html` — Indonesian activation email with company logo, greeting, activation link button, 7-day expiry notice
    - Create `src/templates/email/activation-en.html` — English equivalent
    - Create `src/templates/email/password-reset-id.html` — Indonesian reset email with reset link button, 24-hour expiry, security warning
    - Create `src/templates/email/password-reset-en.html` — English equivalent
    - _Requirements: 8.7–8.10, 11.5–11.8, 26.5–26.7_

- [x] 4. Backend Service: Permission Service
  - [x] 4.1 Create `src/services/financial/permissionService.ts`
    - Implement `listPermissions(filters)` — filter by module, isActive, search with pagination
    - Implement `getPermissionById(id)` — returns single permission or throws 404
    - Implement `createPermission(data, actorId)` — validates unique key format `module.resource.action`, creates audit log
    - Implement `updatePermission(id, data, actorId)` — updates description/metadata/isActive, records updated_by/updated_at, creates audit log
    - Implement `togglePermissionStatus(id, actorId)` — flips is_active, creates audit log
    - _Requirements: 1.1–1.10_

- [x] 5. Backend Service: Role Service
  - [x] 5.1 Create `src/services/financial/roleService.ts`
    - Implement `listRoles(filters)` — filter by scope, isActive, search with pagination
    - Implement `getRoleById(id)` — returns role with assigned permissions or throws 404
    - Implement `createRole(data, actorId)` — validates unique name and scope enum, creates audit log
    - Implement `updateRole(id, data, actorId)` — updates name/description/isActive, records updated_by/updated_at, creates audit log
    - Implement `toggleRoleStatus(id, actorId)` — flips is_active, creates audit log
    - Implement `getRolePermissions(roleId)` — returns list of permissions for a role
    - Implement `setRolePermissions(roleId, permissionIds, actorId)` — transactional replace: compute delta, add new, remove removed, increment authz_version for affected users, create audit log
    - _Requirements: 2.1–2.11, 3.1–3.10, 24.1–24.2_

- [x] 6. Backend API Routes: Permissions
  - [x] 6.1 Create `src/routes/financial/permissions.ts`
    - `GET /api/permissions` — list with filters (module, isActive, search, page, pageSize), requires `cfd.permissions.read`
    - `GET /api/permissions/:id` — single permission, requires `cfd.permissions.read`
    - `POST /api/permissions` — create, requires `cfd.permissions.write`; Zod validation; audit log
    - `PUT /api/permissions/:id` — update, requires `cfd.permissions.write`; Zod validation; audit log
    - `PATCH /api/permissions/:id/status` — toggle status, requires `cfd.permissions.write`; audit log
    - Register route in `src/routes/financial/index.ts`
    - _Requirements: 1.1–1.10, 20.1–20.2, 23.1–23.7_

- [x] 7. Backend API Routes: Roles
  - [x] 7.1 Create `src/routes/financial/roles.ts`
    - `GET /api/roles` — list with filters (scope, isActive, search, page, pageSize), requires `cfd.roles.read`
    - `GET /api/roles/:id` — single role with permissions, requires `cfd.roles.read`
    - `POST /api/roles` — create, requires `cfd.roles.write`; Zod validation; audit log
    - `PUT /api/roles/:id` — update, requires `cfd.roles.write`; Zod validation; audit log
    - `PATCH /api/roles/:id/status` — toggle status, requires `cfd.roles.write`; audit log
    - `GET /api/roles/:id/permissions` — list role permissions, requires `cfd.roles.read`
    - `PUT /api/roles/:id/permissions` — replace permissions (transactional), requires `cfd.roles.write`; increments authz_version; audit log
    - Register route in `src/routes/financial/index.ts`
    - _Requirements: 2.1–2.11, 3.1–3.10, 20.3–20.5, 23.1–23.7, 24.1–24.2_

- [x] 8. Backend API Routes: Users Refactor
  - [x] 8.1 Refactor `src/routes/financial/users.ts` to align with new schema
    - `GET /api/users` — add `emailVerified` filter; return `email_verified` field in response
    - `POST /api/users` — remove password field; generate activation token, hash and store it, set `is_active=false`, `email_verified=false`, call `sendActivationEmail`; audit log
    - `PUT /api/users/:id` — update username/email/fullName only; audit log
    - `PATCH /api/users/:id/status` — toggle is_active; audit log
    - `POST /api/users/:id/resend-activation` — regenerate token, invalidate previous, resend email; requires `cfd.users.write`; audit log
    - `POST /api/users/:id/force-reset-password` — generate reset token, send reset email; requires `cfd.users.reset_password`; audit log
    - `GET /api/users/:id/corporate-access` — return user's corporate access entries; requires `cfd.users.read`
    - `PUT /api/users/:id/corporate-access` — transactional replace of corporate access entries; validate scope constraints; requires `cfd.users.write`; audit log
    - _Requirements: 7.1–7.23, 8.1–8.15, 11.1–11.12, 20.6–20.8, 24.3–24.4_

- [x] 9. Backend API Routes: Auth Activation & Password Reset
  - [x] 9.1 Create `src/routes/auth/activation.ts`
    - `POST /api/auth/validate-activation-token` — public; validate token, return `{ valid, username, email }` without sensitive data
    - `POST /api/auth/activate-account` — public; validate token expiry + bcrypt compare; validate password strength; hash password; set `is_active=true`, `email_verified=true`; clear token fields; set `password_changed_at`; audit log; rate limit 5/hour/IP
    - Register route in server entry point
    - _Requirements: 10.1–10.19_

  - [x] 9.2 Create `src/routes/auth/passwordReset.ts`
    - `POST /api/auth/validate-reset-token` — public; validate token, return validity status only
    - `POST /api/auth/reset-password` — public; validate token expiry + bcrypt compare; validate password strength; hash password; clear token fields; update `password_changed_at`; increment `authz_version`; audit log; rate limit 5/hour/IP
    - Register route in server entry point
    - _Requirements: 13.1–13.18_

- [x] 10. Backend API Routes: User Profile
  - [x] 10.1 Create `src/routes/profile/index.ts`
    - `GET /api/profile` — JWT required; return current user profile (no password fields)
    - `PUT /api/profile` — JWT required; update fullName and email; Zod validation; audit log
    - `POST /api/profile/avatar` — JWT required; multipart/form-data; validate file type (jpg/jpeg/png/webp) and size (max 2MB); store file; update `avatar_url`; audit log
    - `POST /api/profile/change-password` — JWT required; validate current_password; validate new password strength; hash and update; increment `authz_version`; update `password_changed_at`; audit log
    - `GET /api/profile/activity` — JWT required; return last 10 login activities from `user_login_activities`
    - `GET /api/profile/corporate-access` — JWT required; return user's corporate access with role/scope/corporate/department
    - Register route in server entry point
    - _Requirements: 16.1–16.16_

- [x] 11. Checkpoint — Backend complete
  - Ensure all new routes are registered and the server starts without errors (`npx tsc --noEmit`)
  - Verify `GET /api/permissions`, `GET /api/roles`, `GET /api/users` return data with correct filters
  - Ask the user if questions arise before proceeding to frontend work

- [x] 12. i18n Files for New Components
  - [x] 12.1 Create `src/i18n/permission.ts`
    - Export `permissionI18n` with `id` and `en` keys covering: title, subtitle, table column headers, modal titles, form field labels, validation messages, toast messages
    - _Requirements: 19.1_

  - [x] 12.2 Create `src/i18n/role.ts`
    - Export `roleI18n` with `id` and `en` keys covering: title, subtitle, table column headers, scope labels, modal titles, permission mapping modal labels, form field labels, validation messages, toast messages
    - _Requirements: 19.2_

  - [x] 12.3 Create `src/i18n/user-manager.ts`
    - Export `userManagerI18n` with `id` and `en` keys covering: title, subtitle, table column headers, email verified badge labels, modal titles, form field labels, action button labels (resend activation, force reset), corporate access modal labels, validation messages, toast messages
    - _Requirements: 19.3_

  - [x] 12.4 Create `src/i18n/user-profile.ts`
    - Export `userProfileI18n` with `id` and `en` keys covering: page title, section titles (profile info, change password, account security, recent activity, corporate access), form field labels, password strength labels (weak/fair/good/strong), validation messages, toast messages
    - _Requirements: 19.4, 19.14_

  - [x] 12.5 Create `src/i18n/user-menu.ts`
    - Export `userMenuI18n` with `id` and `en` keys covering: profile link label, logout label
    - _Requirements: 19.5_

  - [x] 12.6 Create `src/i18n/activation.ts`
    - Export `activationI18n` with `id` and `en` keys covering: page title, form field labels, validation messages, success/error messages, redirect countdown text
    - _Requirements: 19.6_

  - [x] 12.7 Create `src/i18n/password-reset.ts`
    - Export `passwordResetI18n` with `id` and `en` keys covering: page title, form field labels, validation messages, success/error messages, redirect countdown text
    - _Requirements: 19.7_

  - [x] 12.8 Extend `src/i18n/commons.ts` with password strength labels
    - Add `passwordStrength: { weak, fair, good, strong }` in both `id` and `en` sections
    - Verify all new components use `commonsI18n` for standard buttons (save, cancel, retry, edit, delete)
    - _Requirements: 19.10, 19.14_

- [x] 13. Reusable UI Components
  - [x] 13.1 Create `src/components/ui/PasswordStrengthIndicator.tsx`
    - Props: `password: string`, `language: 'id' | 'en'`
    - Render a 4-segment progress bar colored by strength level (red=weak, yellow=fair, blue=good, green=strong)
    - Render strength level label using `commonsI18n.passwordStrength`
    - Render checklist of requirements (minLength, uppercase, lowercase, number, special) with ✅/❌ icons
    - Import `calculatePasswordStrength` from `passwordStrength.ts` (shared with backend via a shared utility or duplicated for frontend)
    - _Requirements: 22.8–22.9, 25.10_

  - [x] 13.2 Create `src/components/ui/AvatarUpload.tsx`
    - Props: `currentAvatarUrl: string | null`, `onUpload: (file: File) => Promise<void>`, `language: 'id' | 'en'`
    - Display current avatar or initials fallback
    - File input accepting jpg/jpeg/png/webp, max 2MB; show validation error if exceeded
    - Display image preview after selection
    - _Requirements: 15.3–15.5, 25.11_

- [x] 14. Frontend Hooks
  - [x] 14.1 Create `src/hooks/financial/usePermissions.ts`
    - Accepts optional filters: `{ module?, isActive?, search?, page?, pageSize? }`
    - Returns `{ data: Permission[], totalCount: number, isLoading: boolean, error: string | null, refetch: () => void }`
    - Uses `apiFetch` from `src/services/financial/apiFetch.ts`
    - _Requirements: 25.1_

  - [x] 14.2 Create `src/hooks/financial/useRoles.ts`
    - Accepts optional filters: `{ scope?, isActive?, search?, page?, pageSize? }`
    - Returns `{ data: Role[], totalCount: number, isLoading: boolean, error: string | null, refetch: () => void }`
    - _Requirements: 25.2_

  - [x] 14.3 Create `src/hooks/financial/useRolePermissions.ts`
    - Accepts `roleId: string | null`
    - Returns `{ assigned: string[], isLoading: boolean, error: string | null, save: (permissionIds: string[]) => Promise<void> }`
    - `save` calls `PUT /api/roles/:id/permissions`
    - _Requirements: 25.3_

  - [x] 14.4 Create `src/hooks/financial/usePasswordStrength.ts`
    - Accepts `password: string`
    - Returns `PasswordStrengthResult` (re-exports the frontend-side calculation)
    - _Requirements: 25.4_

  - [x] 14.5 Create `src/hooks/financial/useUserProfile.ts`
    - Returns `{ profile: UserProfile | null, isLoading: boolean, update: (data) => Promise<void>, changePassword: (data) => Promise<void>, uploadAvatar: (file: File) => Promise<void> }`
    - Calls `GET /api/profile`, `PUT /api/profile`, `POST /api/profile/avatar`, `POST /api/profile/change-password`
    - _Requirements: 25.5_

  - [x] 14.6 Create `src/hooks/financial/useUserActivity.ts`
    - Returns `{ activities: LoginActivity[], isLoading: boolean, error: string | null }`
    - Calls `GET /api/profile/activity`
    - _Requirements: 25.6_

- [x] 15. Admin UI: Permission Manager
  - [x] 15.1 Create `src/components/financial/admin/PermissionManager.tsx`
    - Follow `CorporateManager.tsx` template exactly
    - Table columns: Key, Module, Description, Status badge, Actions (Edit, Toggle status)
    - Filters: search input (key/module), status dropdown (all/active/inactive)
    - Pagination with configurable page size
    - Loading skeletons while fetching; error state with retry button using `commonsI18n.errorLoadTable`
    - Create/Edit modal with fields: key (with format hint `module.resource.action`), module, description, isActive toggle
    - Zod validation before submission; toast notifications for success/error
    - Hide create/edit/toggle buttons when user lacks `cfd.permissions.write`
    - Use `usePermissions` hook; use `permissionI18n` and `commonsI18n`
    - _Requirements: 4.1–4.13, 20.12, 20.19_

- [x] 16. Admin UI: Role Manager with Permission Mapping
  - [x] 16.1 Create `src/components/financial/admin/RoleManager.tsx`
    - Follow `CorporateManager.tsx` template
    - Table columns: Name, Scope badge, Description, Permissions count, Status badge, Actions (Edit, Manage Permissions, Toggle status)
    - Filters: search input (name), scope dropdown (all/system/corporate/department), status dropdown
    - Pagination with configurable page size
    - Loading skeletons; error state with retry button
    - Modal 1 (Create/Edit): name, scope select, description, isActive toggle; Zod validation
    - Modal 2 (Manage Permissions): all permissions grouped by module; checkbox per permission; "Select All" / "Deselect All" per module group; Save sends delta via `useRolePermissions.save`
    - Toast notifications for success/error
    - Hide write-action buttons when user lacks `cfd.roles.write`
    - Use `useRoles`, `useRolePermissions`, `usePermissions` hooks; use `roleI18n` and `commonsI18n`
    - _Requirements: 5.1–5.14, 6.1–6.19, 20.13, 20.19_

- [x] 17. Admin UI: User Manager Refactor
  - [x] 17.1 Refactor `src/components/financial/admin/UserManager.tsx`
    - Table columns: Avatar+Name, Email, Email Verified badge, Status badge, Actions
    - Filters: search (username/email), status dropdown, email verified dropdown
    - Actions per row: Edit, Manage Access, Resend Activation (only if `email_verified=false`), Force Reset Password (only if `email_verified=true`), Toggle status
    - Modal 1 (Create): username, email, fullName — NO password field; on submit calls `POST /api/users` which triggers activation email
    - Modal 2 (Edit): username, email, fullName
    - Modal 3 (Corporate Access): list of access entries with role selector, scope selector, corporate selector (SearchableSelect), department selector (SearchableSelect); Add/Remove entries; validate scope constraints (system: no corporate/dept, corporate: corporate only, department: both required)
    - Zod validation; toast notifications; loading skeletons; error state with retry
    - Hide write-action buttons when user lacks respective permissions
    - Use `userManagerI18n` and `commonsI18n`
    - _Requirements: 7.1–7.23, 20.14, 20.19_

- [x] 18. Public Pages: Activate Account & Reset Password
  - [x] 18.1 Create `src/pages/ActivateAccountPage.tsx`
    - Accessible at `/activate-account` route (no auth required)
    - On mount: extract `token` from URL query param; call `POST /api/auth/validate-activation-token`; show loading spinner → valid form OR error state
    - Error state: display message + "Contact Admin" option
    - Valid form: username (read-only), email (read-only), new password field, confirm password field, submit button
    - Embed `PasswordStrengthIndicator` component below new password field
    - Validate: password strength ≥ "fair"; passwords match; show inline errors
    - On submit: call `POST /api/auth/activate-account`; on success show success message + auto-redirect to `/login` after 3 seconds
    - Use `activationI18n`; Tailwind CSS 4 premium styling matching login page; responsive
    - Register route in `FRSApp.tsx` as a public route
    - _Requirements: 9.1–9.16_

  - [x] 18.2 Create `src/pages/ResetPasswordPage.tsx`
    - Accessible at `/reset-password` route (no auth required)
    - On mount: extract `token` from URL query param; call `POST /api/auth/validate-reset-token`; show loading spinner → valid form OR error state
    - Error state: display message + option to request new reset
    - Valid form: new password field, confirm password field, submit button
    - Embed `PasswordStrengthIndicator` component below new password field
    - Validate: password strength ≥ "fair"; passwords match; show inline errors
    - On submit: call `POST /api/auth/reset-password`; on success show success message + auto-redirect to `/login` after 3 seconds
    - Use `passwordResetI18n`; Tailwind CSS 4 premium styling matching login page; responsive
    - Register route in `FRSApp.tsx` as a public route
    - _Requirements: 12.1–12.16_

- [x] 19. User Menu in Header
  - [x] 19.1 Create `src/components/financial/UserMenu.tsx`
    - Trigger: avatar circle (initials fallback) positioned in top-right of the header
    - Dropdown panel displays: user avatar, full name, primary role name only (NO corporate/department info)
    - Menu items: "Profile" (navigates to `/profile`), "Logout" (calls logout handler)
    - Close on outside click or Escape key press
    - Use `userMenuI18n` and `commonsI18n`; Tailwind CSS 4 glassmorphism styling; responsive
    - _Requirements: 14.1–14.11_

  - [x] 19.2 Remove user info from sidebar footer in `src/components/financial/dashboard/DashboardLayout.tsx`
    - Remove the user name, role display, and any user-related elements from the sidebar footer section
    - Keep the footer area minimal or remove it entirely
    - Wire `UserMenu` into the header component
    - _Requirements: 14.7_

- [x] 20. User Profile Page
  - [x] 20.1 Create `src/components/financial/UserProfile.tsx` (or `src/pages/UserProfilePage.tsx`)
    - Accessible at `/profile` route (requires authentication)
    - Section 1 — Profile Info: `AvatarUpload` component, editable full name and email fields, Save button; calls `PUT /api/profile` and `POST /api/profile/avatar`
    - Section 2 — Change Password: current password, new password (with `PasswordStrengthIndicator`), confirm password; calls `POST /api/profile/change-password`
    - Section 3 — Account Security: last login date/time, last login IP, password last changed date, email verification status (read-only display)
    - Section 4 — Recent Activity: table of last 10 login activities (date/time, IP address, device/browser, success status); uses `useUserActivity` hook
    - Section 5 — Corporate Access: read-only table of assigned roles with scope, corporate, department; calls `GET /api/profile/corporate-access`
    - Zod validation for all forms; toast notifications; loading skeletons; responsive layout
    - Use `useUserProfile`, `useUserActivity` hooks; use `userProfileI18n` and `commonsI18n`
    - Register route in `FRSApp.tsx` as an authenticated route
    - _Requirements: 15.1–15.24_

- [x] 21. Finalize ThresholdConfig Component
  - [x] 21.1 Audit and finalize `src/components/financial/admin/ThresholdConfig.tsx`
    - Verify all user-facing strings use `threshold` i18n file and `commonsI18n` (no hardcoded strings)
    - Ensure loading skeletons are shown while fetching data
    - Ensure error state with retry button is shown on fetch failure using `commonsI18n.errorLoadTable`
    - Ensure Zod validation is used before form submission
    - Ensure toast notifications are shown for success and error states
    - Apply Tailwind CSS 4 premium styling (glassmorphism, subtle borders) for consistency
    - Verify `cfd.thresholds.read` / `cfd.thresholds.write` permission checks are in place
    - _Requirements: 17.1–17.9, 20.9–20.10, 20.15_

- [x] 22. Finalize AuditLog Component
  - [x] 22.1 Audit and finalize `src/components/financial/admin/AuditLog.tsx`
    - Verify all user-facing strings use `audit-log` i18n file and `commonsI18n` (no hardcoded strings)
    - Ensure loading skeletons are shown while fetching data
    - Ensure error state with retry button is shown on fetch failure
    - Apply Tailwind CSS 4 premium styling for consistency
    - Verify `cfd.audit_log.read` permission check is in place
    - _Requirements: 18.1–18.8, 20.11, 20.16_

- [x] 23. Wire Admin Menu: Register New Components in Navigation
  - [x] 23.1 Register `PermissionManager`, `RoleManager`, and refactored `UserManager` in the admin menu
    - Add menu entries in `src/i18n/navigation.ts` for Permission Management and Role Management
    - Add routes/lazy imports in `FRSApp.tsx` for the new admin pages
    - Ensure menu items are only visible to users with the corresponding `read` permissions
    - _Requirements: 20.12–20.16, 20.20_

- [x] 24. Final Checkpoint — Full feature integration
  - Ensure `npx tsc --noEmit` passes with zero TypeScript errors
  - Ensure all new routes are registered and accessible
  - Ensure all i18n files are imported and used correctly (no hardcoded strings remain)
  - Ensure all new components follow the CorporateManager.tsx template pattern
  - Ask the user if questions arise before considering the feature complete

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 11 and 24) ensure incremental validation
- The `passwordStrength.ts` utility is shared logic — implement it once and import in both backend validation and the frontend `usePasswordStrength` hook
- Token generation for activation and password reset reuses the same `password_reset_token_hash` / `password_reset_expires_at` fields on the users table
- All write operations must produce exactly one audit log entry (Requirement 21)
- Rate limiting (5 attempts/hour/IP) must be applied to all public auth endpoints (activation and reset)
