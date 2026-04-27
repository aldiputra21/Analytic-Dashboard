import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../../../db/connection';
import { roles, permissions, rolePermissions, users, userCorporateAccesses, auditLogs } from '../../../db/schema';
import {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  toggleRoleStatus,
  getRolePermissions,
  setRolePermissions,
  type Role,
  type RoleWithPermissions,
} from '../roleService';
import { eq } from 'drizzle-orm';

describe('roleService', () => {
  let testActorId: string;
  let testPermissionId1: string;
  let testPermissionId2: string;
  let testPermissionId3: string;

  beforeAll(async () => {
    // Create test actor user
    const [actor] = await db
      .insert(users)
      .values({
        email: `test-actor-${Date.now()}@test.com`,
        passwordHash: 'hash',
        fullName: 'Test Actor',
        createdBy: 'system',
      })
      .returning();

    testActorId = actor.id;

    // Create test permissions
    const [perm1] = await db
      .insert(permissions)
      .values({
        key: 'test.resource.read',
        module: 'test',
        description: 'Test read permission',
        isActive: true,
        createdBy: testActorId,
      })
      .returning();

    const [perm2] = await db
      .insert(permissions)
      .values({
        key: 'test.resource.write',
        module: 'test',
        description: 'Test write permission',
        isActive: true,
        createdBy: testActorId,
      })
      .returning();

    const [perm3] = await db
      .insert(permissions)
      .values({
        key: 'test.resource.delete',
        module: 'test',
        description: 'Test delete permission',
        isActive: true,
        createdBy: testActorId,
      })
      .returning();

    testPermissionId1 = perm1.id;
    testPermissionId2 = perm2.id;
    testPermissionId3 = perm3.id;
  });

  afterAll(async () => {
    // Cleanup in correct order to avoid foreign key violations
    await db.delete(rolePermissions).where(eq(rolePermissions.grantedBy, testActorId));
    await db.delete(userCorporateAccesses).where(eq(userCorporateAccesses.grantedBy, testActorId));
    await db.delete(roles).where(eq(roles.createdBy, testActorId));
    // Delete audit logs before deleting the actor user
    await db.delete(auditLogs).where(eq(auditLogs.userId, testActorId));
    await db.delete(permissions).where(eq(permissions.createdBy, testActorId));
    await db.delete(users).where(eq(users.id, testActorId));
  });

  describe('createRole', () => {
    it('should create a role with valid input', async () => {
      const input = {
        name: `test-role-${Date.now()}`,
        scope: 'system' as const,
        description: 'Test role',
      };

      const role = await createRole(input, testActorId);

      expect(role).toBeDefined();
      expect(role.name).toBe(input.name);
      expect(role.scope).toBe('system');
      expect(role.description).toBe('Test role');
      expect(role.isActive).toBe(true);
      expect(role.createdBy).toBe(testActorId);
    });

    it('should reject duplicate role names', async () => {
      const name = `unique-role-${Date.now()}`;
      await createRole({ name, scope: 'system' }, testActorId);

      await expect(
        createRole({ name, scope: 'corporate' }, testActorId),
      ).rejects.toThrow(/already exists/);
    });

    it('should reject invalid scope', async () => {
      await expect(
        createRole(
          { name: `role-${Date.now()}`, scope: 'invalid' as any },
          testActorId,
        ),
      ).rejects.toThrow(/Invalid scope/);
    });

    it('should support all valid scopes', async () => {
      const scopes: Array<'system' | 'corporate' | 'department'> = [
        'system',
        'corporate',
        'department',
      ];

      for (const scope of scopes) {
        const role = await createRole(
          { name: `role-${scope}-${Date.now()}`, scope },
          testActorId,
        );
        expect(role.scope).toBe(scope);
      }
    });
  });

  describe('getRoleById', () => {
    it('should return role with permissions', async () => {
      const role = await createRole(
        { name: `role-${Date.now()}`, scope: 'system' },
        testActorId,
      );

      // Add permissions
      await db.insert(rolePermissions).values([
        { roleId: role.id, permissionId: testPermissionId1, grantedBy: testActorId },
        { roleId: role.id, permissionId: testPermissionId2, grantedBy: testActorId },
      ]);

      const retrieved = await getRoleById(role.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(role.name);
      expect(retrieved?.permissions).toContain(testPermissionId1);
      expect(retrieved?.permissions).toContain(testPermissionId2);
      expect(retrieved?.permissions.length).toBe(2);
    });

    it('should return null for non-existent role', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const result = await getRoleById(fakeUuid);
      expect(result).toBeNull();
    });
  });

  describe('listRoles', () => {
    it('should list all roles with pagination', async () => {
      const role1 = await createRole(
        { name: `list-role-1-${Date.now()}`, scope: 'system' },
        testActorId,
      );
      const role2 = await createRole(
        { name: `list-role-2-${Date.now()}`, scope: 'corporate' },
        testActorId,
      );

      const result = await listRoles({ page: 1, pageSize: 100 });

      expect(result.data.length).toBeGreaterThanOrEqual(2);
      expect(result.totalCount).toBeGreaterThanOrEqual(2);
    });

    it('should filter by scope', async () => {
      await createRole(
        { name: `scope-system-${Date.now()}`, scope: 'system' },
        testActorId,
      );

      const result = await listRoles({ scope: 'system' });

      expect(result.data.every((r) => r.scope === 'system')).toBe(true);
    });

    it('should filter by isActive', async () => {
      const role = await createRole(
        { name: `active-role-${Date.now()}`, scope: 'system' },
        testActorId,
      );

      const activeResult = await listRoles({ isActive: true, pageSize: 1000 });
      expect(activeResult.data.some((r) => r.id === role.id)).toBe(true);

      await toggleRoleStatus(role.id, testActorId);

      const inactiveResult = await listRoles({ isActive: false, pageSize: 1000 });
      expect(inactiveResult.data.some((r) => r.id === role.id)).toBe(true);
    });

    it('should search by name', async () => {
      const uniqueName = `search-role-${Date.now()}`;
      await createRole({ name: uniqueName, scope: 'system' }, testActorId);

      const result = await listRoles({ search: uniqueName });

      expect(result.data.some((r) => r.name === uniqueName)).toBe(true);
    });
  });

  describe('updateRole', () => {
    it('should update role fields', async () => {
      const role = await createRole(
        { name: `update-role-${Date.now()}`, scope: 'system' },
        testActorId,
      );

      const updated = await updateRole(
        role.id,
        {
          name: `updated-${Date.now()}`,
          description: 'Updated description',
          isActive: false,
        },
        testActorId,
      );

      expect(updated.name).not.toBe(role.name);
      expect(updated.description).toBe('Updated description');
      expect(updated.isActive).toBe(false);
      expect(updated.updatedBy).toBe(testActorId);
      expect(updated.updatedAt).toBeDefined();
    });

    it('should reject duplicate name on update', async () => {
      const role1 = await createRole(
        { name: `role1-${Date.now()}`, scope: 'system' },
        testActorId,
      );
      const role2 = await createRole(
        { name: `role2-${Date.now()}`, scope: 'system' },
        testActorId,
      );

      await expect(
        updateRole(role2.id, { name: role1.name }, testActorId),
      ).rejects.toThrow(/already exists/);
    });

    it('should throw for non-existent role', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      await expect(
        updateRole(fakeUuid, { name: 'new-name' }, testActorId),
      ).rejects.toThrow(/not found/);
    });
  });

  describe('toggleRoleStatus', () => {
    it('should toggle role active status', async () => {
      const role = await createRole(
        { name: `toggle-role-${Date.now()}`, scope: 'system' },
        testActorId,
      );

      expect(role.isActive).toBe(true);

      const toggled1 = await toggleRoleStatus(role.id, testActorId);
      expect(toggled1.isActive).toBe(false);

      const toggled2 = await toggleRoleStatus(role.id, testActorId);
      expect(toggled2.isActive).toBe(true);
    });

    it('should throw for non-existent role', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      await expect(
        toggleRoleStatus(fakeUuid, testActorId),
      ).rejects.toThrow(/not found/);
    });
  });

  describe('getRolePermissions', () => {
    it('should return assigned permission IDs', async () => {
      const role = await createRole(
        { name: `perm-role-${Date.now()}`, scope: 'system' },
        testActorId,
      );

      await db.insert(rolePermissions).values([
        { roleId: role.id, permissionId: testPermissionId1, grantedBy: testActorId },
        { roleId: role.id, permissionId: testPermissionId2, grantedBy: testActorId },
      ]);

      const perms = await getRolePermissions(role.id);

      expect(perms).toContain(testPermissionId1);
      expect(perms).toContain(testPermissionId2);
      expect(perms.length).toBe(2);
    });

    it('should return empty array for role with no permissions', async () => {
      const role = await createRole(
        { name: `no-perm-role-${Date.now()}`, scope: 'system' },
        testActorId,
      );

      const perms = await getRolePermissions(role.id);

      expect(perms).toEqual([]);
    });
  });

  describe('setRolePermissions', () => {
    it('should add new permissions', async () => {
      const role = await createRole(
        { name: `add-perm-role-${Date.now()}`, scope: 'system' },
        testActorId,
      );

      await setRolePermissions(
        role.id,
        [testPermissionId1, testPermissionId2],
        testActorId,
      );

      const perms = await getRolePermissions(role.id);
      expect(perms).toContain(testPermissionId1);
      expect(perms).toContain(testPermissionId2);
    });

    it('should remove permissions', async () => {
      const role = await createRole(
        { name: `remove-perm-role-${Date.now()}`, scope: 'system' },
        testActorId,
      );

      // Add initial permissions
      await db.insert(rolePermissions).values([
        { roleId: role.id, permissionId: testPermissionId1, grantedBy: testActorId },
        { roleId: role.id, permissionId: testPermissionId2, grantedBy: testActorId },
        { roleId: role.id, permissionId: testPermissionId3, grantedBy: testActorId },
      ]);

      // Remove one permission
      await setRolePermissions(
        role.id,
        [testPermissionId1, testPermissionId3],
        testActorId,
      );

      const perms = await getRolePermissions(role.id);
      expect(perms).toContain(testPermissionId1);
      expect(perms).not.toContain(testPermissionId2);
      expect(perms).toContain(testPermissionId3);
    });

    it('should handle no-op permission changes', async () => {
      const role = await createRole(
        { name: `noop-perm-role-${Date.now()}`, scope: 'system' },
        testActorId,
      );

      await db.insert(rolePermissions).values([
        { roleId: role.id, permissionId: testPermissionId1, grantedBy: testActorId },
      ]);

      // Set same permissions again
      await setRolePermissions(role.id, [testPermissionId1], testActorId);

      const perms = await getRolePermissions(role.id);
      expect(perms).toEqual([testPermissionId1]);
    });

    it('should reject invalid permission IDs', async () => {
      const role = await createRole(
        { name: `invalid-perm-role-${Date.now()}`, scope: 'system' },
        testActorId,
      );

      await expect(
        setRolePermissions(role.id, ['invalid-permission-id'], testActorId),
      ).rejects.toThrow(/not found/);
    });

    it('should throw for non-existent role', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      await expect(
        setRolePermissions(fakeUuid, [testPermissionId1], testActorId),
      ).rejects.toThrow(/not found/);
    });

    it('should increment authz_version for users with the role', async () => {
      const role = await createRole(
        { name: `authz-role-${Date.now()}`, scope: 'system' },
        testActorId,
      );

      // Create a test user
      const [testUser] = await db
        .insert(users)
        .values({
          email: `test-user-${Date.now()}@test.com`,
          passwordHash: 'hash',
          fullName: 'Test User',
          createdBy: testActorId,
        })
        .returning();

      // Assign role to user
      await db.insert(userCorporateAccesses).values({
        userId: testUser.id,
        roleId: role.id,
        scope: 'system',
        grantedBy: testActorId,
      });

      const [userBefore] = await db
        .select({ authzVersion: users.authzVersion })
        .from(users)
        .where(eq(users.id, testUser.id));

      // Update role permissions
      await setRolePermissions(
        role.id,
        [testPermissionId1, testPermissionId2],
        testActorId,
      );

      const [userAfter] = await db
        .select({ authzVersion: users.authzVersion })
        .from(users)
        .where(eq(users.id, testUser.id));

      expect(userAfter.authzVersion).toBe(userBefore.authzVersion + 1);

      // Cleanup
      await db.delete(userCorporateAccesses).where(eq(userCorporateAccesses.userId, testUser.id));
      await db.delete(users).where(eq(users.id, testUser.id));
    });
  });
});
