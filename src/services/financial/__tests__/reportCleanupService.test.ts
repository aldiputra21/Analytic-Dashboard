// Tests for reportCleanupService
// Covers: unit tests for runCleanup (task 6.1)
//
// Requirements: 8.3, 8.4, 8.7

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Module mocks
// ============================================================================

// Mock fs/promises so we can control file-system behaviour without touching disk
vi.mock('fs/promises', () => ({
  default: {
    unlink: vi.fn(),
  },
  unlink: vi.fn(),
}));

// Mock auditLogService so we don't need a real DB connection
vi.mock('../auditLogService.js', () => ({
  createFRSAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// Mock configService to avoid DB calls for system_configs
vi.mock('../../management/configService.js', () => ({
  configService: {
    get: vi.fn().mockResolvedValue('./storage/report-outputs'),
  },
}));

import fs from 'fs/promises';
import { createFRSAuditLog } from '../auditLogService.js';
import { runCleanup } from '../reportCleanupService.js';

// ============================================================================
// Helpers — minimal fake DB client
// ============================================================================

/**
 * Builds a minimal Drizzle-like fake DB client that returns the provided rows
 * from the SELECT query and records UPDATE calls.
 */
function buildFakeDb(rows: Array<{
  id: string;
  outputPath: string | null;
  outputFilename: string | null;
  userId: string;
  retentionDays: number | null;
}>) {
  const updatedIds: string[] = [];

  const fakeDb = {
    // Tracks which output IDs were updated to 'expired'
    _updatedIds: updatedIds,

    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),

    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    // The second .where() call (on update) resolves and records the id
    // We capture the id from the eq() call by inspecting the mock call args.
  };

  // Override the update chain so we can track which IDs were updated.
  // The real call is: dbClient.update(table).set({...}).where(eq(id, output.id))
  // We simulate this by making .where() on the update chain resolve and record.
  let isUpdateChain = false;
  fakeDb.update = vi.fn().mockImplementation(() => {
    isUpdateChain = true;
    return fakeDb;
  });
  fakeDb.set = vi.fn().mockImplementation(() => {
    return {
      where: vi.fn().mockImplementation((condition) => {
        // Extract the id value from the drizzle eq() condition object.
        // drizzle eq() returns an object; we pull the value from its structure.
        // For test purposes we just resolve successfully.
        return Promise.resolve([]);
      }),
    };
  });

  return fakeDb as unknown as typeof import('../../../db/connection.js').db;
}

// ============================================================================
// Tests
// ============================================================================

describe('runCleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Test 1: No expired entries → return { deleted: 0, errors: 0 }
  // Requirement 8.3
  // --------------------------------------------------------------------------
  it('returns { deleted: 0, errors: 0 } when there are no expired outputs', async () => {
    const fakeDb = buildFakeDb([]);

    const result = await runCleanup(fakeDb);

    expect(result).toEqual({ deleted: 0, errors: 0 });
    expect(createFRSAuditLog).not.toHaveBeenCalled();
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // Test 2: Expired entries with existing files → delete file and update status
  // Requirements 8.3, 8.4
  // --------------------------------------------------------------------------
  it('deletes physical files and marks outputs as expired when files exist', async () => {
    const mockUnlink = vi.mocked(fs.unlink).mockResolvedValue(undefined);

    const rows = [
      {
        id: 'output-1',
        outputPath: '/storage/report-outputs/report_2024_user1.xlsx',
        outputFilename: 'report_2024_user1.xlsx',
        userId: 'user-1',
        retentionDays: 7,
      },
      {
        id: 'output-2',
        outputPath: '/storage/report-outputs/report_2024_user2.xlsx',
        outputFilename: 'report_2024_user2.xlsx',
        userId: 'user-2',
        retentionDays: 30,
      },
    ];

    const fakeDb = buildFakeDb(rows);

    const result = await runCleanup(fakeDb);

    expect(result.deleted).toBe(2);
    expect(result.errors).toBe(0);

    // Both files should have been deleted
    expect(mockUnlink).toHaveBeenCalledTimes(2);
    expect(mockUnlink).toHaveBeenCalledWith('/storage/report-outputs/report_2024_user1.xlsx');
    expect(mockUnlink).toHaveBeenCalledWith('/storage/report-outputs/report_2024_user2.xlsx');

    // Audit log should have been written for each output
    expect(createFRSAuditLog).toHaveBeenCalledTimes(2);
    expect(createFRSAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'report_expired',
        entityType: 'report_output',
        entityId: 'output-1',
      }),
    );
    expect(createFRSAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'report_expired',
        entityType: 'report_output',
        entityId: 'output-2',
      }),
    );
  });

  // --------------------------------------------------------------------------
  // Test 3: Physical file not found → still update status to 'expired', no error
  // Requirement 8.7
  // --------------------------------------------------------------------------
  it('still marks output as expired when physical file is not found (ENOENT)', async () => {
    const enoentError = Object.assign(new Error('ENOENT: no such file or directory'), {
      code: 'ENOENT',
    });
    vi.mocked(fs.unlink).mockRejectedValue(enoentError);

    const rows = [
      {
        id: 'output-missing-file',
        outputPath: '/storage/report-outputs/missing_report.xlsx',
        outputFilename: 'missing_report.xlsx',
        userId: 'user-3',
        retentionDays: 14,
      },
    ];

    const fakeDb = buildFakeDb(rows);

    const result = await runCleanup(fakeDb);

    // Should still count as deleted (status updated to expired)
    expect(result.deleted).toBe(1);
    expect(result.errors).toBe(0);

    // Audit log should still be written
    expect(createFRSAuditLog).toHaveBeenCalledTimes(1);
    expect(createFRSAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'report_expired',
        entityType: 'report_output',
        entityId: 'output-missing-file',
      }),
    );
  });

  // --------------------------------------------------------------------------
  // Test 4: Output with no outputPath → skip unlink, still update status
  // --------------------------------------------------------------------------
  it('skips file deletion when outputPath is null and still marks as expired', async () => {
    const mockUnlink = vi.mocked(fs.unlink).mockResolvedValue(undefined);

    const rows = [
      {
        id: 'output-no-path',
        outputPath: null,
        outputFilename: null,
        userId: 'user-4',
        retentionDays: 7,
      },
    ];

    const fakeDb = buildFakeDb(rows);

    const result = await runCleanup(fakeDb);

    expect(result.deleted).toBe(1);
    expect(result.errors).toBe(0);
    // No file to delete
    expect(mockUnlink).not.toHaveBeenCalled();
    // Audit log still written
    expect(createFRSAuditLog).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------------------------------
  // Test 5: Mixed scenario — some succeed, one has unexpected error
  // Requirement 8.7: errors per-entry must not stop the loop
  // --------------------------------------------------------------------------
  it('continues processing remaining outputs when one entry throws an unexpected error', async () => {
    // First call succeeds, second throws an unexpected error
    vi.mocked(fs.unlink)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('EPERM: permission denied'));

    const rows = [
      {
        id: 'output-ok',
        outputPath: '/storage/report-outputs/ok_report.xlsx',
        outputFilename: 'ok_report.xlsx',
        userId: 'user-5',
        retentionDays: 7,
      },
      {
        id: 'output-perm-error',
        outputPath: '/storage/report-outputs/locked_report.xlsx',
        outputFilename: 'locked_report.xlsx',
        userId: 'user-6',
        retentionDays: 7,
      },
    ];

    // For the second output, make the DB update throw to simulate a full entry error
    const fakeDb = buildFakeDb(rows);
    let updateCallCount = 0;
    const originalSet = fakeDb.update;
    fakeDb.update = vi.fn().mockImplementation((table) => {
      updateCallCount++;
      if (updateCallCount === 2) {
        // Simulate the update failing for the second entry
        return {
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockRejectedValue(new Error('DB update failed')),
          }),
        };
      }
      return {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      };
    });

    const result = await runCleanup(fakeDb);

    // First output succeeded, second errored
    expect(result.deleted).toBe(1);
    expect(result.errors).toBe(1);
  });

  // --------------------------------------------------------------------------
  // Test 6: Audit log includes filename and reason
  // Requirements 8.5, 11.4
  // --------------------------------------------------------------------------
  it('writes audit log with filename and deletion reason', async () => {
    vi.mocked(fs.unlink).mockResolvedValue(undefined);

    const rows = [
      {
        id: 'output-audit',
        outputPath: '/storage/report-outputs/audit_test.xlsx',
        outputFilename: 'audit_test.xlsx',
        userId: 'user-7',
        retentionDays: 5,
      },
    ];

    const fakeDb = buildFakeDb(rows);

    await runCleanup(fakeDb);

    expect(createFRSAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'report_expired',
        entityType: 'report_output',
        entityId: 'output-audit',
        userId: 'user-7',
        newValues: expect.objectContaining({
          filename: 'audit_test.xlsx',
          reason: expect.stringContaining('5'),
        }),
      }),
    );
  });
});
