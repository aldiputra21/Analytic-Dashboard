import { beforeEach, describe, it, expect, vi } from 'vitest';

const accessDbState = vi.hoisted(() => ({
  rows: [] as any[],
}));

import { hasPermission, checkSubsidiaryAccess } from '../../../middleware/frsRbac';

// Mock the DB connection — checkSubsidiaryAccess uses the singleton db internally
vi.mock('../../../db/connection', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => accessDbState.rows,
        }),
      }),
    }),
  },
}));

beforeEach(() => {
  accessDbState.rows = [];
});

describe('hasPermission', () => {
  it('owner has full access to all resources', () => {
    expect(hasPermission('owner', 'subsidiaries', 'read')).toBe(true);
    expect(hasPermission('owner', 'subsidiaries', 'write')).toBe(true);
    expect(hasPermission('owner', 'subsidiaries', 'delete')).toBe(true);
    expect(hasPermission('owner', 'users', 'manage_users')).toBe(true);
    expect(hasPermission('owner', 'thresholds', 'configure')).toBe(true);
  });

  it('bod has read-only access, no user management', () => {
    expect(hasPermission('bod', 'subsidiaries', 'read')).toBe(true);
    expect(hasPermission('bod', 'financial_data', 'read')).toBe(true);
    expect(hasPermission('bod', 'users', 'manage_users')).toBe(false);
    expect(hasPermission('bod', 'thresholds', 'configure')).toBe(false);
    expect(hasPermission('bod', 'subsidiaries', 'delete')).toBe(false);
  });

  it('subsidiary_manager has limited access', () => {
    expect(hasPermission('subsidiary_manager', 'financial_data', 'read')).toBe(true);
    expect(hasPermission('subsidiary_manager', 'financial_data', 'write')).toBe(true);
    expect(hasPermission('subsidiary_manager', 'users', 'manage_users')).toBe(false);
    expect(hasPermission('subsidiary_manager', 'subsidiaries', 'delete')).toBe(false);
  });
});

describe('checkSubsidiaryAccess', () => {
  it('returns false when user has no access', async () => {
    accessDbState.rows = [];

    await expect(checkSubsidiaryAccess('user-1', 'corp-1')).resolves.toBe(false);
  });

  it('returns true when access is granted', async () => {
    accessDbState.rows = [{ id: 'access-1' }];

    await expect(checkSubsidiaryAccess('user-1', 'corp-1')).resolves.toBe(true);
  });
});
