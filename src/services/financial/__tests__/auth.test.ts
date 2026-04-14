import { beforeEach, describe, it, expect, vi } from 'vitest';

const authDbState = vi.hoisted(() => ({
  selectQueue: [] as any[][],
  updates: [] as any[],
  sentEmails: [] as any[],
}));

vi.mock('../emailService', () => ({
  sendPasswordResetEmail: vi.fn(async (payload: any) => {
    authDbState.sentEmails.push(payload);
  }),
}));

import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
  issueToken,
  verifyToken,
  invalidateToken,
  authenticateUser,
  requestPasswordReset,
  resetPasswordWithToken,
} from '../authService';

vi.mock('../../../db/connection', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => authDbState.selectQueue.shift() ?? [],
        }),
      }),
    }),
    update: () => ({
      set: (payload: any) => {
        authDbState.updates.push(payload);
        return {
          where: async () => undefined,
        };
      },
    }),
  },
}));

beforeEach(() => {
  authDbState.selectQueue = [];
  authDbState.updates = [];
  authDbState.sentEmails = [];
});

describe('validatePasswordStrength', () => {
  it('accepts a valid strong password', () => {
    expect(validatePasswordStrength('Admin@123456').valid).toBe(true);
  });

  it('rejects password shorter than 12 chars', () => {
    const result = validatePasswordStrength('Short@1');
    expect(result.valid).toBe(false);
  });

  it('rejects password without uppercase', () => {
    expect(validatePasswordStrength('admin@123456').valid).toBe(false);
  });

  it('rejects password without lowercase', () => {
    expect(validatePasswordStrength('ADMIN@123456').valid).toBe(false);
  });

  it('rejects password without number', () => {
    expect(validatePasswordStrength('Admin@abcdef').valid).toBe(false);
  });

  it('rejects password without special char', () => {
    expect(validatePasswordStrength('Admin1234567').valid).toBe(false);
  });
});

describe('JWT token lifecycle', () => {
  it('issues and verifies a valid token', () => {
    const payload = { userId: 'u1', username: 'owner', role: 'owner' as const };
    const token = issueToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('u1');
    expect(decoded?.role).toBe('owner');
  });

  it('returns null for an invalid token', () => {
    expect(verifyToken('invalid.token.here')).toBeNull();
  });

  it('returns null for a blacklisted token', () => {
    const token = issueToken({ userId: 'u2', username: 'test', role: 'bod' as const });
    invalidateToken(token);
    expect(verifyToken(token)).toBeNull();
  });
});

describe('authenticateUser', () => {
  it('returns user and token for valid credentials', async () => {
    authDbState.selectQueue.push([{
      id: 'u1',
      email: 'owner@example.com',
      passwordHash: await hashPassword('StrongPass123!'),
      fullName: 'Owner User',
      isActive: true,
      lastLogin: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: null,
      createdBy: 'seed',
    }]);

    const result = await authenticateUser('owner@example.com', 'StrongPass123!');

    expect(result).not.toBeNull();
    expect(result?.user.email).toBe('owner@example.com');
    expect(result?.token).toBeTruthy();
    expect(authDbState.updates).toHaveLength(1);
    expect(authDbState.updates[0].lastLogin).toBeInstanceOf(Date);
  });

  it('returns null for wrong password', async () => {
    authDbState.selectQueue.push([{
      id: 'u1',
      email: 'owner@example.com',
      passwordHash: await hashPassword('StrongPass123!'),
      fullName: 'Owner User',
      isActive: true,
      lastLogin: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: null,
      createdBy: 'seed',
    }]);

    const result = await authenticateUser('owner@example.com', 'WrongPass123!');

    expect(result).toBeNull();
    expect(authDbState.updates).toHaveLength(0);
  });

  it('returns null for non-existent user', async () => {
    const result = await authenticateUser('missing@example.com', 'StrongPass123!');

    expect(result).toBeNull();
    expect(authDbState.updates).toHaveLength(0);
  });
});

describe('requestPasswordReset', () => {
  it('returns null and sends no email for unknown account', async () => {
    const result = await requestPasswordReset('missing@example.com', 'http://localhost:5000');

    expect(result).toBeNull();
    expect(authDbState.updates).toHaveLength(0);
    expect(authDbState.sentEmails).toHaveLength(0);
  });

  it('stores reset token metadata and sends email for existing account', async () => {
    authDbState.selectQueue.push([{
      id: 'u-reset',
      email: 'owner@example.com',
      passwordHash: await hashPassword('StrongPass123!'),
      fullName: 'Owner User',
      isActive: true,
      lastLogin: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: null,
      createdBy: 'seed',
    }]);

    const result = await requestPasswordReset('OWNER@EXAMPLE.COM', 'http://localhost:5000');

    expect(result).toBe('u-reset');
    expect(authDbState.updates).toHaveLength(1);
    expect(authDbState.updates[0].passwordResetTokenHash).toBeTypeOf('string');
    expect(authDbState.updates[0].passwordResetExpiresAt).toBeInstanceOf(Date);
    expect(authDbState.sentEmails).toHaveLength(1);
    expect(authDbState.sentEmails[0].to).toBe('owner@example.com');
    expect(authDbState.sentEmails[0].resetLink).toContain('auth=reset');
    expect(authDbState.sentEmails[0].resetLink).toContain('token=');
  });
});

describe('resetPasswordWithToken', () => {
  it('rejects weak passwords before hitting the database', async () => {
    const result = await resetPasswordWithToken('token-1', 'short');

    expect(result).toEqual({ success: false, reason: 'weak_password' });
    expect(authDbState.updates).toHaveLength(0);
  });

  it('rejects an invalid or expired token', async () => {
    authDbState.selectQueue.push([]);

    const result = await resetPasswordWithToken('missing-token', 'StrongPass123!');

    expect(result).toEqual({ success: false, reason: 'invalid_token' });
    expect(authDbState.updates).toHaveLength(0);
  });

  it('updates password and clears reset fields for a valid token', async () => {
    authDbState.selectQueue.push([{
      id: 'u-reset',
      email: 'owner@example.com',
      passwordHash: await hashPassword('OldStrongPass123!'),
      passwordResetTokenHash: 'placeholder',
      passwordResetExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
      fullName: 'Owner User',
      isActive: true,
      lastLogin: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: null,
      createdBy: 'seed',
    }]);

    const resetRequest = await requestPasswordReset('owner@example.com', 'http://localhost:5000');
    const resetLink = authDbState.sentEmails[0].resetLink as string;
    const token = new URL(resetLink).searchParams.get('token') || '';

    expect(resetRequest).toBe('u-reset');

    authDbState.selectQueue.push([{
      id: 'u-reset',
      email: 'owner@example.com',
      passwordHash: await hashPassword('OldStrongPass123!'),
      passwordResetTokenHash: authDbState.updates[0].passwordResetTokenHash,
      passwordResetExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
      fullName: 'Owner User',
      isActive: true,
      lastLogin: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: null,
      createdBy: 'seed',
    }]);

    const result = await resetPasswordWithToken(token, 'NewStrongPass123!');

    expect(result).toEqual({ success: true, userId: 'u-reset' });
    expect(authDbState.updates).toHaveLength(2);
    expect(authDbState.updates[1].passwordChangedAt).toBeInstanceOf(Date);
    expect(authDbState.updates[1].passwordResetTokenHash).toBeNull();
    expect(authDbState.updates[1].passwordResetExpiresAt).toBeNull();
    expect(await verifyPassword('NewStrongPass123!', authDbState.updates[1].passwordHash)).toBe(true);
  });
});
