// User Types
// Requirements: 9.1 - 9.10

export type UserRole = 
  | 'system_admin' 
  | 'global_admin' 
  | 'global_executive' 
  | 'corporate_admin' 
  | 'corporate_executive' 
  | 'finance_leader' 
  | 'finance_manager' 
  | 'finance_staff' 
  | 'dept_leader' 
  | 'dept_manager' 
  | 'dept_staff'
  | 'owner' | 'bod' | 'subsidiary_manager';

export interface FRSUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions?: string[];
  authzVersion?: number;
  fullName: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  corporateId?: string;  // User's primary corporate/subsidiary ID
  subsidiaryIds?: string[];  // All accessible corporate/subsidiary IDs
  hasFullCorporateAccess?: boolean; // Whether user has access to all corporates (null in DB)
  roleName?: string;
  roleDescription?: string;
  avatarUrl?: string;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  subsidiaryIds?: string[];
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  role?: UserRole;
  fullName?: string;
  subsidiaryIds?: string[];
}

export interface UserSubsidiaryAccess {
  id: string;
  userId: string;
  subsidiaryId: string;
  grantedAt: Date;
  grantedBy: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'backup' | 'restore' | 'toggle_status' | 'set_permissions' | 'password_reset_request' | 'password_reset_complete' | 'resend_activation_email' | 'force_reset_password' | 'account_activated' | 'profile_updated' | 'password_changed' | 'avatar_uploaded';
  entityType: string;
  entityId?: string;
  subsidiaryId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  justification?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CreateAuditLogInput {
  userId?: string;
  action: AuditLogEntry['action'];
  entityType: string;
  entityId?: string;
  subsidiaryId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  justification?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  roleName?: string;
  roleDescription?: string;
  authzVersion?: number;
  iat?: number;
  exp?: number;
}

export interface ForgotPasswordInput {
  identifier: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  isActive: boolean;
  passwordChangedAt?: Date;
  lastLogin?: Date;
  lastLoginIp?: string;
  lastLoginUserAgent?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface LoginActivity {
  id: string;
  userId: string;
  loginAt: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

export interface UserCorporateAccess {
  id: string;
  userId: string;
  roleId: string;
  scope: 'system' | 'corporate' | 'department';
  corporateId?: string;
  departmentId?: string;
  roleName?: string;
  corporateName?: string;
  departmentName?: string;
}
