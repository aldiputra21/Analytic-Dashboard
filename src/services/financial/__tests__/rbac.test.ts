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
    const mockReq = {
      accessContext: {
        scope: 'corporate',
        corporateIds: ['other-corp'],
        departmentIds: []
      }
    } as any;

    expect(checkSubsidiaryAccess(mockReq, 'corp-1')).toBe(false);
  });

  it('returns true when access is granted via corporateIds', async () => {
    const mockReq = {
      accessContext: {
        scope: 'corporate',
        corporateIds: ['corp-1'],
        departmentIds: []
      }
    } as any;

    expect(checkSubsidiaryAccess(mockReq, 'corp-1')).toBe(true);
  });

  it('returns true when user has system scope', async () => {
    const mockReq = {
      accessContext: {
        scope: 'system',
        corporateIds: [],
        departmentIds: []
      }
    } as any;

    expect(checkSubsidiaryAccess(mockReq, 'corp-1')).toBe(true);
  });
});
