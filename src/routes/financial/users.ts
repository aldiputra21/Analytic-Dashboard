// User Management Routes
// Requirements: 7.1–7.23, 8.1–8.15, 11.1–11.12, 20.6–20.8, 24.3–24.4

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { eq, and, or, sql, inArray } from 'drizzle-orm';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import { db } from '../../db/connection';
import { users, userCorporateAccesses, roles, corporates, departments } from '../../db/schema/index';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import { sendActivationEmail, sendPasswordResetEmail } from '../../services/financial/emailService';
import { asyncHandler } from '../../utils/asyncHandler';

const BCRYPT_ROUNDS = 10;
const ACTIVATION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  fullName: z.string().min(1).max(100),
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  fullName: z.string().min(1).max(100).optional(),
});

const corporateAccessSchema = z.object({
  roleId: z.string().uuid(),
  scope: z.enum(['system', 'corporate', 'department']),
  corporateId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
});

const listUsersSchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  emailVerified: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.string().default('1'),
  pageSize: z.string().default('10'),
});

// Helper: Generate activation/reset token
async function generateToken(): Promise<{ raw: string; hash: string }> {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = await bcrypt.hash(raw, BCRYPT_ROUNDS);
  return { raw, hash };
}

// Helper: Validate scope constraints
function validateScopeConstraints(scope: string, corporateId?: string, departmentId?: string): boolean {
  if (scope === 'system') {
    return !corporateId && !departmentId;
  }
  if (scope === 'corporate') {
    return !!corporateId && !departmentId;
  }
  if (scope === 'department') {
    return !!corporateId && !!departmentId;
  }
  return false;
}

export function createUsersRouter(): Router {
  const router = Router();

  /**
   * GET /api/users
   * List users with filters (isActive, emailVerified, search)
   * Requirements: 7.1–7.7
   */
  router.get(
    '/',
    requirePermission('cfd.users.read'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const parsed = listUsersSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid query parameters' });
        return;
      }

      const { isActive, emailVerified, search, page, pageSize } = parsed.data;
      const pageNum = Math.max(1, parseInt(page));
      const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize)));
      const offset = (pageNum - 1) * pageSizeNum;

      const conditions = [];
      if (isActive !== undefined) {
        conditions.push(eq(users.isActive, isActive === 'true'));
      }
      if (emailVerified !== undefined) {
        conditions.push(eq(users.emailVerified, emailVerified === 'true'));
      }
      if (search) {
        conditions.push(
          or(
            sql`${users.username} ILIKE ${`%${search}%`}`,
            sql`${users.email} ILIKE ${`%${search}%`}`,
            sql`${users.fullName} ILIKE ${`%${search}%`}`,
          ),
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Access Context Filtering
      const access = req.accessContext!;
      let query = db.select({ 
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        emailVerified: users.emailVerified,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);

      if (access.scope !== 'system') {
        // Filter users who have access to the same corporate/departments
        const subQuery = db.select({ userId: userCorporateAccesses.userId })
          .from(userCorporateAccesses);
        
        if (access.scope === 'corporate') {
          if (access.corporateIds.length === 0) return res.json({ data: [], totalCount: 0, page: pageNum, pageSize: pageSizeNum });
          subQuery.where(inArray(userCorporateAccesses.corporateId, access.corporateIds));
        } else {
          if (access.departmentIds.length === 0) return res.json({ data: [], totalCount: 0, page: pageNum, pageSize: pageSizeNum });
          subQuery.where(inArray(userCorporateAccesses.departmentId, access.departmentIds));
        }
        
        query.where(and(
          whereClause,
          inArray(users.id, subQuery)
        ));
      } else if (whereClause) {
        query.where(whereClause);
      }

      // Get count
      let countQuery = db.select({ count: sql<number>`count(distinct ${users.id})` }).from(users);
      if (access.scope !== 'system') {
        const subQuery = db.select({ userId: userCorporateAccesses.userId })
          .from(userCorporateAccesses);
        if (access.scope === 'corporate') {
          subQuery.where(inArray(userCorporateAccesses.corporateId, access.corporateIds));
        } else {
          subQuery.where(inArray(userCorporateAccesses.departmentId, access.departmentIds));
        }
        countQuery.where(and(whereClause, inArray(users.id, subQuery)));
      } else if (whereClause) {
        countQuery.where(whereClause);
      }

      const [{ count: totalCount }] = await countQuery;

      const rows = await query
        .limit(pageSizeNum)
        .offset(offset);

      res.json({
        data: rows,
        totalCount: Number(totalCount),
        page: pageNum,
        pageSize: pageSizeNum,
      });
    }),
  );

  /**
   * GET /api/users/:id
   * Get user details
   * Requirements: 7.1
   */
  router.get(
    '/:id',
    requirePermission('cfd.users.read'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const [user] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Access Context Filtering
      const access = req.accessContext!;
      if (access.scope !== 'system') {
        const hasAccess = await db.select({ id: userCorporateAccesses.id })
          .from(userCorporateAccesses)
          .where(and(
            eq(userCorporateAccesses.userId, user.id),
            access.scope === 'corporate' 
              ? inArray(userCorporateAccesses.corporateId, access.corporateIds)
              : inArray(userCorporateAccesses.departmentId, access.departmentIds)
          ))
          .limit(1);
          
        if (hasAccess.length === 0) {
          return res.status(403).json({ error: 'Access denied to this user' });
        }
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    }),
  );

  /**
   * POST /api/users
   * Create user without password; generate activation token, send email
   * Requirements: 7.8–7.10, 8.1–8.15
   */
  router.post(
    '/',
    requirePermission('cfd.users.write'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
        return;
      }

      const { username, email, fullName } = parsed.data;

      // Check for duplicates
      const [existingEmail] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingEmail) {
        res.status(422).json({ error: 'Email already exists' });
        return;
      }

      if (username) {
        const [existingUsername] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (existingUsername) {
          res.status(422).json({ error: 'Username already exists' });
          return;
        }
      }

      // Generate activation token
      const { raw: activationToken, hash: tokenHash } = await generateToken();
      const expiresAt = new Date(Date.now() + ACTIVATION_TOKEN_TTL_MS);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          username: username || null,
          email,
          fullName,
          passwordHash: '', // Empty until activation
          isActive: false,
          emailVerified: false,
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
          createdBy: req.user!.userId,
        })
        .returning();

      // Send activation email
      try {
        await sendActivationEmail(
          { email: newUser.email, fullName: newUser.fullName },
          activationToken,
          'id',
        );
      } catch (err) {
        console.error('Failed to send activation email:', err);
        res.status(500).json({ error: 'Failed to send activation email' });
        return;
      }

      // Audit log
      await createFRSAuditLog({
        userId: req.user!.userId,
        action: 'create',
        entityType: 'user',
        entityId: newUser.id,
        newValues: { username, email, fullName },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        emailVerified: newUser.emailVerified,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      });
    }),
  );

  /**
   * PUT /api/users/:id
   * Update user (username, email, fullName only)
   * Requirements: 7.11
   */
  router.put(
    '/:id',
    requirePermission('cfd.users.write'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
        return;
      }

      const [existing] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);

      if (!existing) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Access Context Validation
      const access = req.accessContext!;
      if (access.scope !== 'system') {
        const hasAccess = await db.select({ id: userCorporateAccesses.id })
          .from(userCorporateAccesses)
          .where(and(
            eq(userCorporateAccesses.userId, existing.id),
            access.scope === 'corporate' 
              ? inArray(userCorporateAccesses.corporateId, access.corporateIds)
              : inArray(userCorporateAccesses.departmentId, access.departmentIds)
          ))
          .limit(1);
          
        if (hasAccess.length === 0) {
          return res.status(403).json({ error: 'Access denied to this user' });
        }
      }

      const { username, email, fullName } = parsed.data;

      // Check email uniqueness if changed
      if (email && email !== existing.email) {
        const [dup] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (dup) {
          res.status(422).json({ error: 'Email already exists' });
          return;
        }
      }

      // Check username uniqueness if changed
      if (username && username !== existing.username) {
        const [dup] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (dup) {
          res.status(422).json({ error: 'Username already exists' });
          return;
        }
      }

      const [updated] = await db
        .update(users)
        .set({
          username: username !== undefined ? username : existing.username,
          email: email !== undefined ? email : existing.email,
          fullName: fullName !== undefined ? fullName : existing.fullName,
          updatedBy: req.user!.userId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.params.id))
        .returning();

      // Audit log
      await createFRSAuditLog({
        userId: req.user!.userId,
        action: 'update',
        entityType: 'user',
        entityId: req.params.id,
        oldValues: { username: existing.username, email: existing.email, fullName: existing.fullName },
        newValues: { username, email, fullName },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        id: updated.id,
        username: updated.username,
        email: updated.email,
        fullName: updated.fullName,
        emailVerified: updated.emailVerified,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt,
      });
    }),
  );

  /**
   * PATCH /api/users/:id/status
   * Toggle is_active status
   * Requirements: 7.18
   */
  router.patch(
    '/:id/status',
    requirePermission('cfd.users.write'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        res.status(400).json({ error: 'isActive (boolean) is required' });
        return;
      }

      const [existing] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);

      if (!existing) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Access Context Validation
      const access = req.accessContext!;
      if (access.scope !== 'system') {
        const hasAccess = await db.select({ id: userCorporateAccesses.id })
          .from(userCorporateAccesses)
          .where(and(
            eq(userCorporateAccesses.userId, existing.id),
            access.scope === 'corporate' 
              ? inArray(userCorporateAccesses.corporateId, access.corporateIds)
              : inArray(userCorporateAccesses.departmentId, access.departmentIds)
          ))
          .limit(1);
          
        if (hasAccess.length === 0) {
          return res.status(403).json({ error: 'Access denied to this user' });
        }
      }

      const [updated] = await db
        .update(users)
        .set({
          isActive,
          updatedBy: req.user!.userId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.params.id))
        .returning();

      // Audit log
      await createFRSAuditLog({
        userId: req.user!.userId,
        action: 'update',
        entityType: 'user',
        entityId: req.params.id,
        newValues: { isActive },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        id: updated.id,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt,
      });
    }),
  );

  /**
   * POST /api/users/:id/resend-activation
   * Regenerate activation token and resend email
   * Requirements: 7.12
   */
  router.post(
    '/:id/resend-activation',
    requirePermission('cfd.users.write'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const [user] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Access Context Validation
      const access = req.accessContext!;
      if (access.scope !== 'system') {
        const hasAccess = await db.select({ id: userCorporateAccesses.id })
          .from(userCorporateAccesses)
          .where(and(
            eq(userCorporateAccesses.userId, user.id),
            access.scope === 'corporate' 
              ? inArray(userCorporateAccesses.corporateId, access.corporateIds)
              : inArray(userCorporateAccesses.departmentId, access.departmentIds)
          ))
          .limit(1);
          
        if (hasAccess.length === 0) {
          return res.status(403).json({ error: 'Access denied to this user' });
        }
      }

      // Generate new token
      const { raw: activationToken, hash: tokenHash } = await generateToken();
      const expiresAt = new Date(Date.now() + ACTIVATION_TOKEN_TTL_MS);

      // Update user with new token
      await db
        .update(users)
        .set({
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
          updatedBy: req.user!.userId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.params.id));

      // Send email
      try {
        await sendActivationEmail(
          { email: user.email, fullName: user.fullName },
          activationToken,
          'id',
        );
      } catch (err) {
        console.error('Failed to send activation email:', err);
        res.status(500).json({ error: 'Failed to send activation email' });
        return;
      }

      // Audit log
      await createFRSAuditLog({
        userId: req.user!.userId,
        action: 'resend_activation_email',
        entityType: 'user',
        entityId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Activation email resent' });
    }),
  );

  /**
   * POST /api/users/:id/force-reset-password
   * Generate reset token and send reset email
   * Requirements: 7.13
   */
  router.post(
    '/:id/force-reset-password',
    requirePermission('cfd.users.reset_password'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const [user] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Access Context Validation
      const access = req.accessContext!;
      if (access.scope !== 'system') {
        const hasAccess = await db.select({ id: userCorporateAccesses.id })
          .from(userCorporateAccesses)
          .where(and(
            eq(userCorporateAccesses.userId, user.id),
            access.scope === 'corporate' 
              ? inArray(userCorporateAccesses.corporateId, access.corporateIds)
              : inArray(userCorporateAccesses.departmentId, access.departmentIds)
          ))
          .limit(1);
          
        if (hasAccess.length === 0) {
          return res.status(403).json({ error: 'Access denied to this user' });
        }
      }

      // Generate reset token
      const { raw: resetToken, hash: tokenHash } = await generateToken();
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      // Update user with reset token
      await db
        .update(users)
        .set({
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
          updatedBy: req.user!.userId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.params.id));

      // Send email
      try {
        await sendPasswordResetEmail(
          { email: user.email, fullName: user.fullName },
          resetToken,
          'id',
        );
      } catch (err) {
        console.error('Failed to send password reset email:', err);
        res.status(500).json({ error: 'Failed to send password reset email' });
        return;
      }

      // Audit log
      await createFRSAuditLog({
        userId: req.user!.userId,
        action: 'force_reset_password',
        entityType: 'user',
        entityId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Password reset email sent' });
    }),
  );

  /**
   * GET /api/users/:id/corporate-access
   * Get user's corporate access entries
   * Requirements: 7.15
   */
  router.get(
    '/:id/corporate-access',
    requirePermission('cfd.users.read'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const [user] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Access Context Filtering
      const access = req.accessContext!;
      if (access.scope !== 'system') {
        const hasAccess = await db.select({ id: userCorporateAccesses.id })
          .from(userCorporateAccesses)
          .where(and(
            eq(userCorporateAccesses.userId, user.id),
            access.scope === 'corporate' 
              ? inArray(userCorporateAccesses.corporateId, access.corporateIds)
              : inArray(userCorporateAccesses.departmentId, access.departmentIds)
          ))
          .limit(1);
          
        if (hasAccess.length === 0) {
          return res.status(403).json({ error: 'Access denied to this user' });
        }
      }

      const accesses = await db
        .select({
          id: userCorporateAccesses.id,
          roleId: userCorporateAccesses.roleId,
          scope: userCorporateAccesses.scope,
          corporateId: userCorporateAccesses.corporateId,
          departmentId: userCorporateAccesses.departmentId,
          createdAt: userCorporateAccesses.createdAt,
        })
        .from(userCorporateAccesses)
        .where(eq(userCorporateAccesses.userId, req.params.id));

      res.json(accesses);
    }),
  );

  /**
   * PUT /api/users/:id/corporate-access
   * Replace user's corporate access entries (transactional)
   * Requirements: 7.16–7.17
   */
  router.put(
    '/:id/corporate-access',
    requirePermission('cfd.users.write'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { accesses } = req.body;

      if (!Array.isArray(accesses)) {
        res.status(400).json({ error: 'accesses (array) is required' });
        return;
      }

      // Verify user exists first
      const [user] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Access Context Validation for the USER being modified
      const access = req.accessContext!;
      if (access.scope !== 'system') {
        const hasAccess = await db.select({ id: userCorporateAccesses.id })
          .from(userCorporateAccesses)
          .where(and(
            eq(userCorporateAccesses.userId, user.id),
            access.scope === 'corporate' 
              ? inArray(userCorporateAccesses.corporateId, access.corporateIds)
              : inArray(userCorporateAccesses.departmentId, access.departmentIds)
          ))
          .limit(1);
          
        // If the user currently HAS NO access that matches the admin's scope,
        // and the admin is NOT a system admin, they can't touch this user.
        // Special case: if the user being modified is BRAND NEW and has NO access yet,
        // we might want to allow corporate admins to assign them to their corporate.
        // But how do we know if this user "belongs" to this corporate admin?
        // Usually, the admin who created them is the one who assigns access.
        if (hasAccess.length === 0 && user.createdBy !== req.user!.userId) {
          return res.status(403).json({ error: 'Access denied to this user' });
        }
      }

      // Validate each access entry
      const validationResults = accesses.map((a) => corporateAccessSchema.safeParse(a));
      if (validationResults.some((r) => !r.success)) {
        res.status(400).json({ error: 'Invalid access entry', details: validationResults.filter((r) => !r.success) });
        return;
      }

      // Validate scope constraints and permissions
      for (const entry of accesses) {
        if (!validateScopeConstraints(entry.scope, entry.corporateId, entry.departmentId)) {
          res.status(400).json({
            error: 'Invalid scope constraints',
            details: `scope=${entry.scope} requires proper corporate/department IDs`,
          });
          return;
        }

        // Ensure requester has access to the target corporate/department
        if (access.scope !== 'system') {
          if (entry.scope === 'system') {
            return res.status(403).json({ error: 'Cannot grant system access' });
          }
          if (access.scope === 'corporate') {
            if (!entry.corporateId || !access.corporateIds.includes(entry.corporateId)) {
              return res.status(403).json({ error: `No access to corporate ${entry.corporateId}` });
            }
          } else if (access.scope === 'department') {
            if (!entry.departmentId || !access.departmentIds.includes(entry.departmentId)) {
              return res.status(403).json({ error: `No access to department ${entry.departmentId}` });
            }
          }
        }

        // Ensure requester can only assign roles with appropriate scope
        const [targetRole] = await db.select({ scope: roles.scope }).from(roles).where(eq(roles.id, entry.roleId)).limit(1);
        if (!targetRole) return res.status(400).json({ error: 'Role not found' });
        if (access.scope !== 'system' && targetRole.scope === 'system') {
          return res.status(403).json({ error: 'Cannot assign system-level roles' });
        }
      }

      // Transactional replace
      await db.transaction(async (tx) => {
        // Delete existing accesses
        await tx.delete(userCorporateAccesses).where(eq(userCorporateAccesses.userId, req.params.id));

        // Insert new accesses
        for (const accessEntry of accesses) {
          await tx.insert(userCorporateAccesses).values({
            userId: req.params.id,
            roleId: accessEntry.roleId,
            scope: accessEntry.scope,
            corporateId: accessEntry.corporateId || null,
            departmentId: accessEntry.departmentId || null,
            grantedBy: req.user!.userId,
          });
        }

        // Update user's authz_version
        await tx
          .update(users)
          .set({
            authzVersion: sql`${users.authzVersion} + 1`,
            updatedBy: req.user!.userId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, req.params.id));
      });

      // Audit log
      await createFRSAuditLog({
        userId: req.user!.userId,
        action: 'update',
        entityType: 'user_corporate_access',
        entityId: req.params.id,
        newValues: { accesses },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Corporate access updated' });
    }),
  );

  return router;
}
