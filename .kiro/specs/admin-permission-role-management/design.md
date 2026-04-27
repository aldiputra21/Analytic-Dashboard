# Design Document — Admin Permission & Role Management

## Overview

This document describes the technical design for the Admin Permission and Role Management feature, covering database schema extensions, API architecture, UI component design, authentication flows, and email service integration.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React 19)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │Permission│ │  Role    │ │  User    │ │ Profile/Menu  │  │
│  │ Manager  │ │ Manager  │ │ Manager  │ │   Component   │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘  │
│       │            │            │               │           │
│  ┌────▼────────────▼────────────▼───────────────▼────────┐  │
│  │              apiFetch (services/financial/apiFetch)    │  │
│  └────────────────────────┬───────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP/JWT
┌───────────────────────────▼─────────────────────────────────┐
│                     Backend (Express 4)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │/api/     │ │/api/     │ │/api/     │ │ /api/auth/    │  │
│  │permissions│ │roles     │ │users     │ │ profile       │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘  │
│       │            │            │               │           │
│  ┌────▼────────────▼────────────▼───────────────▼────────┐  │
│  │              requirePermission middleware (RBAC)        │  │
│  └────────────────────────┬───────────────────────────────┘  │
│  ┌─────────────────────────▼──────────────────────────────┐  │
│  │              Drizzle ORM + PostgreSQL (Neon)            │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Email Service (Nodemailer/SMTP)             │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 1. Database Schema Extensions

### 1.1 Alter `users` Table

```typescript
// New fields to add via Drizzle migration
emailVerified: boolean('email_verified').notNull().default(false),
lastLoginIp: varchar('last_login_ip', { length: 45 }),
lastLoginUserAgent: text('last_login_user_agent'),
```

### 1.2 New Table: `user_login_activities`

```typescript
export const userLoginActivities = pgTable('user_login_activities', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  loginAt: timestamp('login_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  success: boolean().notNull().default(true),
}, (table) => [
  index('idx_user_login_activities_user_login').on(table.userId, table.loginAt),
]);
```

### 1.3 New Permissions to Seed

The following permissions must be added to the `permissions` table:

| key | module | description |
|-----|--------|-------------|
| `cfd.permissions.read` | cfd | Read permissions |
| `cfd.permissions.write` | cfd | Manage permissions |
| `cfd.roles.read` | cfd | Read roles |
| `cfd.roles.write` | cfd | Manage roles |
| `cfd.users.read` | cfd | Read users |
| `cfd.users.write` | cfd | Manage users |
| `cfd.users.reset_password` | cfd | Force reset user password |

## 2. New File Structure

```
src/
├── routes/financial/
│   ├── permissions.ts          # NEW: Permission CRUD API
│   ├── roles.ts                # NEW: Role CRUD + permission mapping API
│   └── users.ts                # REFACTOR: align with new schema
├── routes/auth/
│   ├── activation.ts           # NEW: Account activation endpoints
│   └── passwordReset.ts        # NEW: Password reset endpoints
├── routes/profile/
│   └── index.ts                # NEW: User profile endpoints
├── services/financial/
│   ├── permissionService.ts    # NEW
│   ├── roleService.ts          # NEW
│   ├── userService.ts          # REFACTOR
│   ├── emailService.ts         # NEW
│   └── passwordStrength.ts     # NEW: shared utility
├── components/financial/admin/
│   ├── PermissionManager.tsx   # NEW
│   ├── RoleManager.tsx         # NEW (replaces old, integrates permission mapping)
│   ├── UserManager.tsx         # REFACTOR
│   ├── ThresholdConfig.tsx     # REFACTOR (finalize)
│   └── AuditLog.tsx            # REFACTOR (finalize)
├── components/financial/
│   ├── UserMenu.tsx            # NEW: header avatar dropdown
│   └── UserProfile.tsx         # NEW: profile page
├── components/ui/
│   ├── PasswordStrengthIndicator.tsx  # NEW: reusable
│   └── AvatarUpload.tsx               # NEW: reusable
├── hooks/financial/
│   ├── usePermissions.ts       # NEW
│   ├── useRoles.ts             # NEW
│   ├── useRolePermissions.ts   # NEW
│   ├── usePasswordStrength.ts  # NEW
│   ├── useUserProfile.ts       # NEW
│   └── useUserActivity.ts      # NEW
├── i18n/
│   ├── permission.ts           # NEW
│   ├── role.ts                 # NEW
│   ├── user-manager.ts         # NEW
│   ├── user-profile.ts         # NEW
│   ├── user-menu.ts            # NEW
│   ├── activation.ts           # NEW
│   └── password-reset.ts       # NEW
└── pages/ (or routes in FRSApp.tsx)
    ├── ActivateAccountPage.tsx # NEW: public page
    └── ResetPasswordPage.tsx   # NEW: public page
```

## 3. API Endpoints

### 3.1 Permission API — `src/routes/financial/permissions.ts`

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/permissions` | `cfd.permissions.read` | List permissions (filter: module, isActive, search, page, pageSize) |
| GET | `/api/permissions/:id` | `cfd.permissions.read` | Get single permission |
| POST | `/api/permissions` | `cfd.permissions.write` | Create permission |
| PUT | `/api/permissions/:id` | `cfd.permissions.write` | Update permission |
| PATCH | `/api/permissions/:id/status` | `cfd.permissions.write` | Toggle active status |

**POST/PUT Request Body:**
```typescript
{
  key: string;       // format: "module.resource.action"
  module: string;
  description?: string;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}
```

### 3.2 Role API — `src/routes/financial/roles.ts`

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/roles` | `cfd.roles.read` | List roles (filter: scope, isActive, search, page, pageSize) |
| GET | `/api/roles/:id` | `cfd.roles.read` | Get role with assigned permissions |
| POST | `/api/roles` | `cfd.roles.write` | Create role |
| PUT | `/api/roles/:id` | `cfd.roles.write` | Update role |
| PATCH | `/api/roles/:id/status` | `cfd.roles.write` | Toggle active status |
| GET | `/api/roles/:id/permissions` | `cfd.roles.read` | List permissions for a role |
| PUT | `/api/roles/:id/permissions` | `cfd.roles.write` | Replace all permissions for a role (transactional) |

**PUT `/api/roles/:id/permissions` Body:**
```typescript
{ permissionIds: string[] }
// Backend computes delta: adds new, removes removed, increments authz_version
```

### 3.3 User API — `src/routes/financial/users.ts` (Refactored)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/users` | `cfd.users.read` | List users (filter: isActive, emailVerified, search, page, pageSize) |
| GET | `/api/users/:id` | `cfd.users.read` | Get user details |
| POST | `/api/users` | `cfd.users.write` | Create user (no password, sends activation email) |
| PUT | `/api/users/:id` | `cfd.users.write` | Update user (username, email, fullName) |
| PATCH | `/api/users/:id/status` | `cfd.users.write` | Toggle active status |
| POST | `/api/users/:id/resend-activation` | `cfd.users.write` | Resend activation email |
| POST | `/api/users/:id/force-reset-password` | `cfd.users.reset_password` | Send password reset email |
| GET | `/api/users/:id/corporate-access` | `cfd.users.read` | Get user's corporate access |
| PUT | `/api/users/:id/corporate-access` | `cfd.users.write` | Replace user's corporate access (transactional) |

### 3.4 Auth Endpoints — `src/routes/financial/auth.ts` (Extended)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/validate-activation-token` | Public | Validate activation token, return user info |
| POST | `/api/auth/activate-account` | Public | Complete account activation |
| POST | `/api/auth/validate-reset-token` | Public | Validate reset token |
| POST | `/api/auth/reset-password` | Public | Complete password reset |

**POST `/api/auth/activate-account` Body:**
```typescript
{ token: string; newPassword: string; }
```

**POST `/api/auth/reset-password` Body:**
```typescript
{ token: string; newPassword: string; }
```

### 3.5 Profile API — `src/routes/profile/index.ts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/profile` | JWT | Get current user profile |
| PUT | `/api/profile` | JWT | Update profile (fullName, email) |
| POST | `/api/profile/avatar` | JWT | Upload avatar (multipart/form-data) |
| POST | `/api/profile/change-password` | JWT | Change password (requires current password) |
| GET | `/api/profile/activity` | JWT | Get last 10 login activities |
| GET | `/api/profile/corporate-access` | JWT | Get user's corporate access |

## 4. Password Strength Algorithm

### `src/services/financial/passwordStrength.ts`

```typescript
export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  score: number;          // 0-100
  level: PasswordStrengthLevel;
  checks: {
    minLength: boolean;   // >= 8 chars
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  let score = 0;
  if (checks.minLength) score += 20;
  if (password.length >= 12) score += 10;
  if (checks.hasUppercase) score += 20;
  if (checks.hasLowercase) score += 20;
  if (checks.hasNumber) score += 20;
  if (checks.hasSpecial) score += 10;

  const level: PasswordStrengthLevel =
    score <= 25 ? 'weak' :
    score <= 50 ? 'fair' :
    score <= 75 ? 'good' : 'strong';

  return { score, level, checks };
}

// Minimum accepted: 'fair' (score > 25)
export function isPasswordAcceptable(result: PasswordStrengthResult): boolean {
  return result.score > 25;
}
```

## 5. Token Generation Flow

Both activation and password reset use the same `password_reset_token_hash` / `password_reset_expires_at` fields.

```typescript
// Token generation (backend)
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

async function generateToken(): Promise<{ raw: string; hash: string }> {
  const raw = crypto.randomBytes(32).toString('hex'); // 64-char hex string
  const hash = await bcrypt.hash(raw, 10);
  return { raw, hash };
}

// Token validation (backend)
async function validateToken(rawToken: string, user: User): Promise<boolean> {
  if (!user.passwordResetTokenHash || !user.passwordResetExpiresAt) return false;
  if (new Date() > user.passwordResetExpiresAt) return false;
  return bcrypt.compare(rawToken, user.passwordResetTokenHash);
}
```

**Activation link:** `{BASE_URL}/activate-account?token={raw}`
**Reset link:** `{BASE_URL}/reset-password?token={raw}`

## 6. Email Service Design

### `src/services/financial/emailService.ts`

```typescript
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Uses Nodemailer with SMTP (configurable via env vars)
// ENV: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

async function sendEmail(options: EmailOptions): Promise<void>
async function sendActivationEmail(user: { email, fullName }, token: string, lang: 'id' | 'en'): Promise<void>
async function sendPasswordResetEmail(user: { email, fullName }, token: string, lang: 'id' | 'en'): Promise<void>
```

**Email Templates** (HTML, inline CSS, responsive):
- `src/templates/email/activation-id.html`
- `src/templates/email/activation-en.html`
- `src/templates/email/password-reset-id.html`
- `src/templates/email/password-reset-en.html`

## 7. UI Component Designs

### 7.1 PermissionManager

Follows `CorporateManager.tsx` template exactly:
- **Table columns:** Key, Module, Description, Status, Actions
- **Filters:** Search (key/module), Status dropdown (all/active/inactive)
- **Actions per row:** Edit (requires `cfd.permissions.write`), Toggle status
- **Modal:** Create/Edit form with fields: key (format hint), module, description, isActive

### 7.2 RoleManager (with integrated permission mapping)

- **Table columns:** Name, Scope badge, Description, Permissions count, Status, Actions
- **Filters:** Search (name), Scope dropdown, Status dropdown
- **Actions per row:** Edit, Manage Permissions, Toggle status
- **Modal 1 (Create/Edit):** name, scope (select: system/corporate/department), description, isActive
- **Modal 2 (Manage Permissions):** Grouped by module, checkboxes per permission, Select All/Deselect All per group, Save button

### 7.3 UserManager (refactored)

- **Table columns:** Avatar+Name, Email, Email Verified badge, Status, Actions
- **Filters:** Search (username/email), Status dropdown, Email Verified dropdown
- **Actions per row:** Edit, Manage Access, Resend Activation (if unverified), Force Reset Password (if verified), Toggle status
- **Modal 1 (Create):** username, email, fullName — NO password field
- **Modal 2 (Edit):** username, email, fullName
- **Modal 3 (Corporate Access):** List of access entries with role, scope, corporate, department selectors; Add/Remove entries

### 7.4 UserMenu (Header)

```
┌─────────────────────────────────┐
│  [Avatar]  Full Name            │
│            Primary Role         │
│  ─────────────────────────────  │
│  👤 Profile                     │
│  🚪 Logout                      │
└─────────────────────────────────┘
```

- Trigger: Avatar circle (initials fallback) in top-right header
- Displays: user avatar, full name, primary role name only
- Corporate and department info is shown only in the User Profile page
- Closes on outside click or Escape
- Removes user info from sidebar footer

### 7.5 UserProfile Page

Layout: Single-column, card-based sections

```
┌─────────────────────────────────────────────────────┐
│  [Avatar Upload]  Full Name  |  Email                │
│                   Username   |  [Save Profile]        │
├─────────────────────────────────────────────────────┤
│  Change Password                                     │
│  Current Password: [________]                        │
│  New Password:     [________] [Strength Indicator]   │
│  Confirm:          [________]                        │
│                              [Change Password]        │
├─────────────────────────────────────────────────────┤
│  Account Security                                    │
│  Last Login: 26 Apr 2026, 10:30 | IP: 192.168.1.1   │
│  Password Changed: 20 Apr 2026                       │
│  Email Verified: ✅                                  │
├─────────────────────────────────────────────────────┤
│  Recent Activity (last 10 logins)                    │
│  Date/Time | IP Address | Device/Browser | Status    │
├─────────────────────────────────────────────────────┤
│  Corporate Access (read-only)                        │
│  Role | Scope | Corporate | Department               │
└─────────────────────────────────────────────────────┘
```

### 7.6 PasswordStrengthIndicator Component

```tsx
// src/components/ui/PasswordStrengthIndicator.tsx
interface Props {
  password: string;
  language: 'id' | 'en';
}

// Renders:
// - Progress bar (4 segments, colored by level)
// - Level label (Lemah/Weak, Cukup/Fair, Baik/Good, Kuat/Strong)
// - Checklist of requirements (✅/❌ for each check)
```

### 7.7 Activation & Reset Password Pages

Both pages share the same layout (matching login page design):
- Centered card, company logo at top
- Token validation on mount (loading → valid form OR error state)
- Password + Confirm Password fields with PasswordStrengthIndicator
- Submit → success message → auto-redirect to login after 3s

## 8. Reusable Hooks

### `usePasswordStrength`
```typescript
function usePasswordStrength(password: string): PasswordStrengthResult
```

### `usePermissions`
```typescript
function usePermissions(filters?: { module?: string; isActive?: boolean; search?: string; page?: number; pageSize?: number })
  : { data: Permission[]; totalCount: number; isLoading: boolean; error: string | null; refetch: () => void }
```

### `useRoles`
```typescript
function useRoles(filters?: { scope?: string; isActive?: boolean; search?: string; page?: number; pageSize?: number })
  : { data: Role[]; totalCount: number; isLoading: boolean; error: string | null; refetch: () => void }
```

### `useRolePermissions`
```typescript
function useRolePermissions(roleId: string | null)
  : { assigned: string[]; isLoading: boolean; error: string | null; save: (permissionIds: string[]) => Promise<void> }
```

### `useUserProfile`
```typescript
function useUserProfile()
  : { profile: UserProfile | null; isLoading: boolean; update: (data) => Promise<void>; changePassword: (data) => Promise<void>; uploadAvatar: (file: File) => Promise<void> }
```

### `useUserActivity`
```typescript
function useUserActivity()
  : { activities: LoginActivity[]; isLoading: boolean; error: string | null }
```

## 9. i18n Structure

Each new i18n file exports an object with `id` and `en` keys:

```typescript
// src/i18n/permission.ts
export const permissionI18n = {
  id: {
    title: 'Manajemen Permission',
    subtitle: 'Kelola hak akses sistem',
    addNew: 'Tambah Permission',
    // ...
  },
  en: {
    title: 'Permission Management',
    subtitle: 'Manage system access rights',
    addNew: 'Add Permission',
    // ...
  }
};
```

Password strength labels are added to `commonsI18n`:
```typescript
passwordStrength: {
  weak: 'Lemah' | 'Weak',
  fair: 'Cukup' | 'Fair',
  good: 'Baik' | 'Good',
  strong: 'Kuat' | 'Strong',
}
```

## 10. Sidebar Footer Removal

In `src/components/financial/dashboard/DashboardLayout.tsx`:
- Remove the user name and role display from the sidebar footer section
- The footer area can be kept minimal or removed entirely
- User info is now exclusively in the `UserMenu` header component

## 11. Rate Limiting

Auth endpoints use an in-memory rate limiter (or `express-rate-limit`):

```typescript
// Max 5 attempts per hour per IP for:
// POST /api/auth/activate-account
// POST /api/auth/reset-password
// POST /api/auth/validate-activation-token
// POST /api/auth/validate-reset-token
```

## 12. Correctness Properties

The following properties must hold at all times:

1. **Token Uniqueness**: No two active tokens exist for the same user simultaneously — generating a new token always invalidates the previous one.
2. **Token Expiry**: A token past its `password_reset_expires_at` timestamp is always rejected.
3. **Password Never Stored Plain**: All passwords are bcrypt-hashed before persistence; no plain-text password appears in logs, responses, or audit entries.
4. **authz_version Increment**: Any permission change to a role increments `authz_version` for all users holding that role, invalidating their cached JWT claims.
5. **Scope Constraint**: A `user_corporate_accesses` row with `scope='system'` always has `corporate_id=NULL` and `department_id=NULL`; `scope='corporate'` always has `corporate_id≠NULL` and `department_id=NULL`; `scope='department'` always has both non-null.
6. **Activation Before Login**: A user with `email_verified=false` or `is_active=false` cannot successfully authenticate.
7. **Audit Completeness**: Every write operation (create, update, delete, password change, activation, reset) produces exactly one audit log entry.
