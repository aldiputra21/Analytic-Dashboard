import { beforeEach, describe, it, expect, vi } from 'vitest';
import { checkSubsidiaryAccess } from '../../../middleware/rbac';

const accessDbState = vi.hoisted(() => ({
  rows: [] as any[],
}));

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
