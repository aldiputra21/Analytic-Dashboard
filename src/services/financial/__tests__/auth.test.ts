import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
  issueToken,
  verifyToken,
  invalidateToken,
  authenticateUser,
} from '../authService';
import { initFinancialRatioSchema } from '../../../db/initFinancialRatio';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  initFinancialRatioSchema(db);
  return db;
}

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
    const db = createTestDb();
    const result = await authenticateUser(db, 'owner', 'Admin@123456');
    expect(result).not.toBeNull();
    expect(result?.user.username).toBe('owner');
    expect(result?.user.role).toBe('owner');
    expect(result?.token).toBeTruthy();
    db.close();
  });

  it('returns null for wrong password', async () => {
    const db = createTestDb();
    const result = await authenticateUser(db, 'owner', 'wrongpassword');
    expect(result).toBeNull();
    db.close();
  });

  it('returns null for non-existent user', async () => {
    const db = createTestDb();
    const result = await authenticateUser(db, 'nobody', 'Admin@123456');
    expect(result).toBeNull();
    db.close();
  });
});
