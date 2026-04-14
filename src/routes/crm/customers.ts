import { Router, Request, Response } from 'express';
import { requireCRMPermission } from '../../middleware/crmRbac';
import { logCreate, logUpdate } from '../../helpers/crmAuditLog';
import { CreateCustomerInput, CreateContactInput } from '../../types/crm';
import { db } from '../../db/connection';
import { customers, contacts, interactions } from '../../db/schema/crm';
import { eq, and, sql, desc, count } from 'drizzle-orm';

// ============================================================
// Customer & Contact Routes
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.10
// ============================================================

export function createCustomerRouter(): Router {
  const router = Router();

  // POST /api/crm/customers - Create new customer
  router.post(
    '/',
    requireCRMPermission('crm:write:customer', 'crm:write:all'),
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;
      const body = req.body as CreateCustomerInput;

      // Validate required fields (Req 1.4, 1.5)
      const errors: Record<string, string[]> = {};
      if (!body.companyName?.trim()) {
        errors.companyName = ['Nama perusahaan wajib diisi'];
      }
      if (!body.industry?.trim()) {
        errors.industry = ['Industri wajib diisi'];
      }
      if (!body.contacts || body.contacts.length === 0) {
        errors.contacts = ['Minimal satu kontak wajib diisi'];
      } else {
        const hasPIC = body.contacts.some((c) => c.role === 'PIC');
        if (!hasPIC) {
          errors.contacts = ['Minimal satu kontak dengan role PIC wajib diisi'];
        }
      }

      if (Object.keys(errors).length > 0) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Data tidak lengkap',
            details: errors,
          },
        });
        return;
      }

      // Check uniqueness (company_name + npwp) (Req 1.10)
      const [existing] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(
          body.npwp
            ? and(eq(customers.companyName, body.companyName.trim()), eq(customers.npwp, body.npwp))
            : and(eq(customers.companyName, body.companyName.trim()), sql`${customers.npwp} IS NULL`)
        )
        .limit(1);

      if (existing) {
        res.status(422).json({
          error: {
            code: 'DUPLICATE_CUSTOMER',
            message: 'Pelanggan dengan nama perusahaan dan NPWP yang sama sudah ada',
            details: { existingId: [existing.id] },
          },
        });
        return;
      }

      // Validate parentCustomerId if provided
      if (body.parentCustomerId) {
        const [parentExists] = await db
          .select({ id: customers.id })
          .from(customers)
          .where(eq(customers.id, body.parentCustomerId))
          .limit(1);
        if (!parentExists) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Parent customer tidak ditemukan',
              details: { parentCustomerId: ['Parent customer ID tidak valid'] },
            },
          });
          return;
        }
      }

      const result = await db.transaction(async (tx) => {
        const [created] = await tx.insert(customers).values({
          companyName: body.companyName.trim(),
          industry: body.industry.trim(),
          address: body.address ?? null,
          npwp: body.npwp ?? null,
          parentCustomerId: body.parentCustomerId ?? null,
          createdBy: userId,
        }).returning();

        for (const contact of body.contacts) {
          await tx.insert(contacts).values({
            customerId: created.id,
            name: contact.name.trim(),
            title: contact.title ?? null,
            phone: contact.phone ?? null,
            email: contact.email ?? null,
            role: contact.role,
            isPrimary: contact.isPrimary ?? false,
          });
        }

        return created;
      });

      await logCreate(userId, 'customer', result.id, {
        companyName: body.companyName,
        industry: body.industry,
      });

      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, result.id))
        .limit(1);
      const customerContacts = await db
        .select()
        .from(contacts)
        .where(eq(contacts.customerId, result.id));

      res.status(201).json({ ...mapCustomer(customer), contacts: customerContacts.map(mapContact) });
    }
  );

  // GET /api/crm/customers - List customers with search
  router.get(
    '/',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    async (req: Request, res: Response): Promise<void> => {
      const { search, status } = req.query;

      const conditions = [sql`1=1`];

      if (search) {
        const term = `%${search}%`;
        conditions.push(sql`(c.company_name ILIKE ${term} OR c.industry ILIKE ${term})`);
      }
      if (status) {
        conditions.push(sql`c.status = ${status as string}`);
      }

      const where = sql.join(conditions, sql` AND `);

      const rows = (await db.execute(sql`
        SELECT c.*,
          (SELECT COUNT(*) FROM crm.contacts WHERE customer_id = c.id AND role = 'PIC') AS pic_count,
          p.company_name AS parent_company_name
        FROM crm.customers c
        LEFT JOIN crm.customers p ON c.parent_customer_id = p.id
        WHERE ${where}
        ORDER BY c.created_at DESC
      `)).rows as Record<string, unknown>[];

      res.json(
        rows.map((c: any) => ({
          ...mapCustomer(c),
          picCount: Number(c.pic_count ?? 0),
        }))
      );
    }
  );

  // GET /api/crm/customers/:id - Get customer detail
  router.get(
    '/:id',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    async (req: Request, res: Response): Promise<void> => {
      const [customer] = (await db.execute(sql`
        SELECT c.*, p.company_name AS parent_company_name
        FROM crm.customers c
        LEFT JOIN crm.customers p ON c.parent_customer_id = p.id
        WHERE c.id = ${req.params.id}
      `)).rows as Record<string, unknown>[];

      if (!customer) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Pelanggan tidak ditemukan' },
        });
        return;
      }

      const customerContacts = await db
        .select()
        .from(contacts)
        .where(eq(contacts.customerId, req.params.id))
        .orderBy(desc(contacts.isPrimary));

      // Fetch child customers
      const children = (await db.execute(sql`
        SELECT c.id, c.company_name, c.industry, c.status,
          (SELECT COUNT(*) FROM crm.contacts WHERE customer_id = c.id AND role = 'PIC') AS pic_count
        FROM crm.customers c WHERE c.parent_customer_id = ${req.params.id}
        ORDER BY c.company_name
      `)).rows as Record<string, unknown>[];

      res.json({
        ...mapCustomer(customer),
        contacts: customerContacts.map(mapContact),
        children: children.map((ch: any) => ({
          id: ch.id,
          companyName: ch.company_name,
          industry: ch.industry,
          status: ch.status,
          picCount: Number(ch.pic_count ?? 0),
        })),
      });
    }
  );

  // PUT /api/crm/customers/:id - Update customer
  router.put(
    '/:id',
    requireCRMPermission('crm:write:customer', 'crm:write:all'),
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, req.params.id))
        .limit(1);

      if (!customer) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Pelanggan tidak ditemukan' },
        });
        return;
      }

      const body = req.body as Partial<CreateCustomerInput>;
      const errors: Record<string, string[]> = {};

      if (body.companyName !== undefined && !body.companyName.trim()) {
        errors.companyName = ['Nama perusahaan tidak boleh kosong'];
      }

      if (Object.keys(errors).length > 0) {
        res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid', details: errors },
        });
        return;
      }

      // Validate parentCustomerId if provided
      if (body.parentCustomerId !== undefined && body.parentCustomerId !== null) {
        if (body.parentCustomerId === req.params.id) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Customer tidak bisa menjadi parent dari dirinya sendiri',
              details: { parentCustomerId: ['Circular reference tidak diperbolehkan'] },
            },
          });
          return;
        }
        const [parentExists] = await db
          .select({ id: customers.id })
          .from(customers)
          .where(eq(customers.id, body.parentCustomerId))
          .limit(1);
        if (!parentExists) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Parent customer tidak ditemukan',
              details: { parentCustomerId: ['Parent customer ID tidak valid'] },
            },
          });
          return;
        }
        // Prevent circular: check if target parent is a descendant of current customer
        let checkId: string | null = body.parentCustomerId;
        while (checkId) {
          const [ancestor] = await db
            .select({ parentCustomerId: customers.parentCustomerId })
            .from(customers)
            .where(eq(customers.id, checkId))
            .limit(1);
          if (!ancestor) break;
          if (ancestor.parentCustomerId === req.params.id) {
            res.status(400).json({
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Circular reference: parent yang dipilih adalah anak perusahaan dari customer ini',
                details: { parentCustomerId: ['Circular reference tidak diperbolehkan'] },
              },
            });
            return;
          }
          checkId = ancestor.parentCustomerId;
        }
      }

      const newName = body.companyName?.trim() ?? customer.companyName;
      const newNpwp = body.npwp !== undefined ? body.npwp : customer.npwp;

      // Check uniqueness if name or npwp changed
      if (newName !== customer.companyName || newNpwp !== customer.npwp) {
        const dupCondition = newNpwp
          ? and(eq(customers.companyName, newName), eq(customers.npwp, newNpwp), sql`${customers.id} != ${req.params.id}`)
          : and(eq(customers.companyName, newName), sql`${customers.npwp} IS NULL`, sql`${customers.id} != ${req.params.id}`);
        const [dup] = await db
          .select({ id: customers.id })
          .from(customers)
          .where(dupCondition)
          .limit(1);

        if (dup) {
          res.status(422).json({
            error: {
              code: 'DUPLICATE_CUSTOMER',
              message: 'Pelanggan dengan nama perusahaan dan NPWP yang sama sudah ada',
              details: { existingId: [dup.id] },
            },
          });
          return;
        }
      }

      const oldValues = { ...customer };

      const newParent = body.parentCustomerId !== undefined
        ? (body.parentCustomerId ?? null)
        : customer.parentCustomerId;

      await db.update(customers).set({
        companyName: newName,
        industry: body.industry?.trim() ?? customer.industry,
        address: body.address !== undefined ? body.address : customer.address,
        npwp: newNpwp ?? null,
        status: (body as any).status ?? customer.status,
        parentCustomerId: newParent,
        updatedAt: new Date(),
        updatedBy: userId,
      }).where(eq(customers.id, req.params.id));

      await logUpdate(userId, 'customer', req.params.id, oldValues, req.body);

      const [updated] = (await db.execute(sql`
        SELECT c.*, p.company_name AS parent_company_name
        FROM crm.customers c
        LEFT JOIN crm.customers p ON c.parent_customer_id = p.id
        WHERE c.id = ${req.params.id}
      `)).rows as Record<string, unknown>[];
      const customerContacts = await db
        .select()
        .from(contacts)
        .where(eq(contacts.customerId, req.params.id))
        .orderBy(desc(contacts.isPrimary));

      res.json({ ...mapCustomer(updated), contacts: customerContacts.map(mapContact) });
    }
  );

  // GET /api/crm/customers/:id/interactions - Get customer interactions
  router.get(
    '/:id/interactions',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    async (req: Request, res: Response): Promise<void> => {
      const [customer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.id, req.params.id))
        .limit(1);

      if (!customer) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Pelanggan tidak ditemukan' },
        });
        return;
      }

      const rows = await db
        .select()
        .from(interactions)
        .where(
          and(
            eq(interactions.entityId, req.params.id),
            eq(interactions.entityType, 'customer')
          )
        )
        .orderBy(desc(interactions.interactionDate));

      res.json(rows.map(mapInteraction));
    }
  );

  return router;
}

// ============================================================
// Contacts Router (mounted separately for /api/crm/contacts/:id)
// ============================================================

export function createContactRouter(): Router {
  const router = Router({ mergeParams: true });

  // POST /api/crm/customers/:customerId/contacts
  router.post(
    '/',
    requireCRMPermission('crm:write:customer', 'crm:write:all'),
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;
      const { customerId } = req.params;

      const [customer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (!customer) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Pelanggan tidak ditemukan' },
        });
        return;
      }

      const body = req.body as CreateContactInput;
      const errors: Record<string, string[]> = {};

      if (!body.name?.trim()) errors.name = ['Nama kontak wajib diisi'];
      if (!body.role) errors.role = ['Role kontak wajib diisi'];

      if (Object.keys(errors).length > 0) {
        res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Data tidak lengkap', details: errors },
        });
        return;
      }

      const [created] = await db.insert(contacts).values({
        customerId,
        name: body.name.trim(),
        title: body.title ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        role: body.role,
        isPrimary: body.isPrimary ?? false,
      }).returning();

      await logCreate(userId, 'contact', created.id, { customerId, name: body.name, role: body.role });

      res.status(201).json(mapContact(created));
    }
  );

  return router;
}

// ============================================================
// Standalone contact update/delete (mounted at /api/crm/contacts)
// ============================================================

export function createContactStandaloneRouter(): Router {
  const router = Router();

  // PUT /api/crm/contacts/:id
  router.put(
    '/:id',
    requireCRMPermission('crm:write:customer', 'crm:write:all'),
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;
      const [contact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, req.params.id))
        .limit(1);

      if (!contact) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Kontak tidak ditemukan' },
        });
        return;
      }

      const body = req.body as Partial<CreateContactInput>;
      const oldValues = { ...contact };

      const [updated] = await db.update(contacts).set({
        name: body.name?.trim() ?? contact.name,
        title: body.title !== undefined ? body.title : contact.title,
        phone: body.phone !== undefined ? body.phone : contact.phone,
        email: body.email !== undefined ? body.email : contact.email,
        role: body.role ?? contact.role,
        isPrimary: body.isPrimary !== undefined ? body.isPrimary : contact.isPrimary,
      }).where(eq(contacts.id, req.params.id)).returning();

      await logUpdate(userId, 'contact', req.params.id, oldValues, req.body);

      res.json(mapContact(updated));
    }
  );

  // DELETE /api/crm/contacts/:id
  router.delete(
    '/:id',
    requireCRMPermission('crm:write:customer', 'crm:write:all'),
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;
      const [contact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, req.params.id))
        .limit(1);

      if (!contact) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Kontak tidak ditemukan' },
        });
        return;
      }

      // Ensure at least one PIC remains
      if (contact.role === 'PIC') {
        const [picCount] = await db
          .select({ cnt: count() })
          .from(contacts)
          .where(
            and(
              eq(contacts.customerId, contact.customerId),
              eq(contacts.role, 'PIC'),
              sql`${contacts.id} != ${req.params.id}`
            )
          );

        if ((picCount?.cnt ?? 0) === 0) {
          res.status(422).json({
            error: {
              code: 'LAST_PIC',
              message: 'Tidak dapat menghapus kontak PIC terakhir. Minimal satu PIC harus ada.',
            },
          });
          return;
        }
      }

      await db.delete(contacts).where(eq(contacts.id, req.params.id));

      await logUpdate(userId, 'contact', req.params.id, contact, { deleted: true });

      res.json({ success: true });
    }
  );

  return router;
}

// ============================================================
// Mappers
// ============================================================

function mapCustomer(row: any) {
  return {
    id: row.id,
    companyName: row.companyName ?? row.company_name,
    industry: row.industry,
    address: row.address,
    npwp: row.npwp,
    parentCustomerId: row.parentCustomerId ?? row.parent_customer_id ?? null,
    parentCompanyName: row.parentCompanyName ?? row.parent_company_name ?? null,
    status: row.status,
    createdBy: row.createdBy ?? row.created_by,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

function mapContact(row: any) {
  return {
    id: row.id,
    customerId: row.customerId ?? row.customer_id,
    name: row.name,
    title: row.title,
    phone: row.phone,
    email: row.email,
    role: row.role,
    isPrimary: row.isPrimary ?? row.is_primary ?? false,
    createdAt: row.createdAt ?? row.created_at,
  };
}

function mapInteraction(row: any) {
  return {
    id: row.id,
    entityId: row.entityId ?? row.entity_id,
    entityType: row.entityType ?? row.entity_type,
    type: row.type,
    interactionDate: row.interactionDate ?? row.interaction_date,
    summary: row.summary,
    nextAction: row.nextAction ?? row.next_action,
    nextActionDate: row.nextActionDate ?? row.next_action_date,
    createdBy: row.createdBy ?? row.created_by,
    createdAt: row.createdAt ?? row.created_at,
  };
}
