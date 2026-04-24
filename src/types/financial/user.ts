// User Types
// Requirements: 9.1 - 9.10

export type UserRole = 'owner' | 'bod' | 'subsidiary_manager';

export interface FRSUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions?: string[];
  authzVersion?: number;
  fullName: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  corporateId?: string;  // User's primary corporate/subsidiary ID
  subsidiaryIds?: string[];  // All accessible corporate/subsidiary IDs
  hasFullCorporateAccess?: boolean; // Whether user has access to all corporates (null in DB)
  roleName?: string;
  roleDescription?: string;
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
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'backup' | 'restore';
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
  action: AuditLogEntry['action'] | 'password_reset_request' | 'password_reset_complete';
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
