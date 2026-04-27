import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'crypto';
import {
  listPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  togglePermissionStatus,
  invalidatePermissionCache,
} from '../permissionService';
import { db } from '../../../db/connection';
import { permissions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

// Mock the audit log service
vi.mock('../auditLogService', () => ({
  createFRSAuditLog: vi.fn().mockResolvedValue(undefined),
}));

describe('permissionService', () => {
  const testActorId = randomUUID();
  const testContext = { ip: '127.0.0.1', userAgent: 'test-agent' };
  let createdPermissionId: string;

  beforeAll(async () => {
    // Clean up any test permissions before running tests
    await db.delete(permissions).where(eq(permissions.key, 'test.resource.read'));
    await db.delete(permissions).where(eq(permissions.key, 'test.resource.write'));
    await db.delete(permissions).where(eq(permissions.key, 'test.resource.delete'));
  });

  afterAll(async () => {
    // Clean up test permissions after tests
    await db.delete(permissions).where(eq(permissions.key, 'test.resource.read'));
    await db.delete(permissions).where(eq(permissions.key, 'test.resource.write'));
    await db.delete(permissions).where(eq(permissions.key, 'test.resource.delete'));
    invalidatePermissionCache();
  });

  describe('createPermission', () => {
    it('should create a new permission with valid key format', async () => {
      const input = {
        key: 'test.resource.read',
        module: 'test',
        description: 'Test read permission',
        metadata: { category: 'read' },
      };

      const permission = await createPermission(input, testActorId, testContext);

      expect(permission).toBeDefined();
      expect(permission.key).toBe('test.resource.read');
      expect(permission.module).toBe('test');
      expect(permission.description).toBe('Test read permission');
      expect(permission.isActive).toBe(true);
      expect(permission.createdBy).toBe(testActorId);

      createdPermissionId = permission.id;
    });

    it('should reject duplicate key', async () => {
      const input = {
        key: 'test.resource.read',
        module: 'test',
        description: 'Duplicate permission',
      };

      await expect(createPermission(input, testActorId, testContext)).rejects.toThrow(
        "Permission key 'test.resource.read' already exists"
      );
    });

    it('should reject invalid key format', async () => {
      const input = {
        key: 'invalid-key',
        module: 'test',
        description: 'Invalid format',
      };

      await expect(createPermission(input, testActorId, testContext)).rejects.toThrow(
        'Permission key must follow format: module.resource.action'
      );
    });
  });

  describe('getPermissionById', () => {
    it('should retrieve a permission by ID', async () => {
      const permission = await getPermissionById(createdPermissionId);

      expect(permission).toBeDefined();
      expect(permission.id).toBe(createdPermissionId);
      expect(permission.key).toBe('test.resource.read');
    });

    it('should throw 404 for non-existent permission', async () => {
      const nonExistentId = randomUUID();
      await expect(getPermissionById(nonExistentId)).rejects.toThrow(
        `Permission not found: ${nonExistentId}`
      );
    });
  });

  describe('listPermissions', () => {
    beforeAll(async () => {
      // Create additional test permissions
      await createPermission(
        { key: 'test.resource.write', module: 'test', description: 'Write permission' },
        testActorId,
        testContext
      );
      await createPermission(
        { key: 'test.resource.delete', module: 'test', description: 'Delete permission' },
        testActorId,
        testContext
      );
    });

    it('should list all permissions with pagination', async () => {
      const result = await listPermissions({ page: 1, pageSize: 10 });

      expect(result.records).toBeDefined();
      expect(result.totalCount).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(result.records)).toBe(true);
    });

    it('should filter permissions by module', async () => {
      const result = await listPermissions({ module: 'test', pageSize: 100 });

      expect(result.records.length).toBeGreaterThanOrEqual(3);
      expect(result.records.every((p) => p.module === 'test')).toBe(true);
    });

    it('should filter permissions by active status', async () => {
      const result = await listPermissions({ isActive: true, pageSize: 100 });

      expect(result.records.every((p) => p.isActive === true)).toBe(true);
    });

    it('should search permissions by key', async () => {
      const result = await listPermissions({ search: 'resource.read', pageSize: 100 });

      expect(result.records.length).toBeGreaterThan(0);
      expect(result.records.some((p) => p.key.includes('resource.read'))).toBe(true);
    });

    it('should search permissions by module', async () => {
      const result = await listPermissions({ search: 'test', pageSize: 100 });

      expect(result.records.length).toBeGreaterThan(0);
    });
  });

  describe('updatePermission', () => {
    it('should update permission description and metadata', async () => {
      const updated = await updatePermission(
        createdPermissionId,
        {
          description: 'Updated description',
          metadata: { category: 'updated' },
        },
        testActorId,
        testContext
      );

      expect(updated.description).toBe('Updated description');
      expect(updated.metadata?.category).toBe('updated');
      expect(updated.updatedBy).toBe(testActorId);
      expect(updated.updatedAt).toBeDefined();
    });

    it('should update permission active status', async () => {
      const updated = await updatePermission(
        createdPermissionId,
        { isActive: false },
        testActorId,
        testContext
      );

      expect(updated.isActive).toBe(false);
    });

    it('should throw 404 for non-existent permission', async () => {
      const nonExistentId = randomUUID();
      await expect(
        updatePermission(nonExistentId, { description: 'test' }, testActorId, testContext)
      ).rejects.toThrow(`Permission not found: ${nonExistentId}`);
    });
  });

  describe('togglePermissionStatus', () => {
    it('should toggle permission active status', async () => {
      const before = await getPermissionById(createdPermissionId);
      const toggled = await togglePermissionStatus(createdPermissionId, testActorId, testContext);

      expect(toggled.isActive).toBe(!before.isActive);
      expect(toggled.updatedBy).toBe(testActorId);
    });

    it('should throw 404 for non-existent permission', async () => {
      const nonExistentId = randomUUID();
      await expect(
        togglePermissionStatus(nonExistentId, testActorId, testContext)
      ).rejects.toThrow(`Permission not found: ${nonExistentId}`);
    });
  });
});
