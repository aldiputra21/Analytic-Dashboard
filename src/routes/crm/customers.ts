import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireCRMPermission } from '../../middleware/crmRbac';
import { logCreate, logUpdate } from '../../helpers/crmAuditLog';
import { CreateCustomerInput, CreateContactInput } from '../../types/crm';

// ============================================================
// Customer & Contact Routes
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.10
// ============================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createCustomerRouter(db: Database.Database): Router {
  const router = Router();

  // POST /api/crm/customers - Create new customer
  router.post(
    '/',
    requireCRMPermission('crm:write:customer', 'crm:write:all'),
    (req: Request, res: Response): void => {
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
      const existing = db
        .prepare(
          'SELECT id FROM crm_customers WHERE company_name = ? AND (npwp = ? OR (npwp IS NULL AND ? IS NULL))'
        )
        .get(body.companyName.trim(), body.npwp ?? null, body.npwp ?? null) as
        | { id: string }
        | undefined;

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

      const customerId = generateId('CUST');

      const insertCustomer = db.prepare(
        `INSERT INTO crm_customers (id, company_name, industry, address, npwp, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      const insertContact = db.prepare(
        `INSERT INTO crm_contacts (id, customer_id, name, title, phone, email, role, is_primary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );

      const transaction = db.transaction(() => {
        insertCustomer.run(
          customerId,
          body.companyName.trim(),
          body.industry.trim(),
          body.address ?? null,
          body.npwp ?? null,
          userId
        );

        for (const contact of body.contacts) {
          insertContact.run(
            generateId('CONT'),
            customerId,
            contact.name.trim(),
            contact.title ?? null,
            contact.phone ?? null,
            contact.email ?? null,
            contact.role,
            contact.isPrimary ? 1 : 0
          );
        }
      });

      transaction();

      logCreate(db, userId, 'customer', customerId, {
        companyName: body.companyName,
        industry: body.industry,
      });

      const customer = db
        .prepare('SELECT * FROM crm_customers WHERE id = ?')
        .get(customerId) as any;
      const contacts = db
        .prepare('SELECT * FROM crm_contacts WHERE customer_id = ?')
        .all(customerId);

      res.status(201).json({ ...mapCustomer(customer), contacts: contacts.map(mapContact) });
    }
  );

  // GET /api/crm/customers - List customers with search
  router.get(
    '/',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    (req: Request, res: Response): void => {
      const { search, status } = req.query;

      let query = `
        SELECT c.*, 
          (SELECT COUNT(*) FROM crm_contacts WHERE customer_id = c.id AND role = 'PIC') as pic_count
        FROM crm_customers c
        WHERE 1=1
      `;
      const params: any[] = [];

      if (search) {
        query += ` AND (c.company_name LIKE ? OR c.industry LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }
      if (status) {
        query += ` AND c.status = ?`;
        params.push(status);
      }

      query += ` ORDER BY c.created_at DESC`;

      const customers = db.prepare(query).all(...params) as any[];

      res.json(
        customers.map((c) => ({
          ...mapCustomer(c),
          picCount: c.pic_count,
        }))
      );
    }
  );

  // GET /api/crm/customers/:id - Get customer detail
  router.get(
    '/:id',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    (req: Request, res: Response): void => {
      const customer = db
        .prepare('SELECT * FROM crm_customers WHERE id = ?')
        .get(req.params.id) as any;

      if (!customer) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Pelanggan tidak ditemukan' },
        });
        return;
      }

      const contacts = db
        .prepare('SELECT * FROM crm_contacts WHERE customer_id = ? ORDER BY is_primary DESC')
        .all(req.params.id);

      res.json({ ...mapCustomer(customer), contacts: contacts.map(mapContact) });
    }
  );

  // PUT /api/crm/customers/:id - Update customer
  router.put(
    '/:id',
    requireCRMPermission('crm:write:customer', 'crm:write:all'),
    (req: Request, res: Response): void => {
      const userId = req.userId!;
      const customer = db
        .prepare('SELECT * FROM crm_customers WHERE id = ?')
        .get(req.params.id) as any;

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

      const newName = body.companyName?.trim() ?? customer.company_name;
      const newNpwp = body.npwp !== undefined ? body.npwp : customer.npwp;

      // Check uniqueness if name or npwp changed
      if (newName !== customer.company_name || newNpwp !== customer.npwp) {
        const dup = db
          .prepare(
            `SELECT id FROM crm_customers 
             WHERE company_name = ? AND (npwp = ? OR (npwp IS NULL AND ? IS NULL)) AND id != ?`
          )
          .get(newName, newNpwp ?? null, newNpwp ?? null, req.params.id) as
          | { id: string }
          | undefined;

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

      db.prepare(
        `UPDATE crm_customers 
         SET company_name = ?, industry = ?, address = ?, npwp = ?, status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(
        newName,
        body.industry?.trim() ?? customer.industry,
        body.address !== undefined ? body.address : customer.address,
        newNpwp ?? null,
        (body as any).status ?? customer.status,
        req.params.id
      );

      logUpdate(db, userId, 'customer', req.params.id, oldValues, req.body);

      const updated = db
        .prepare('SELECT * FROM crm_customers WHERE id = ?')
        .get(req.params.id) as any;
      const contacts = db
        .prepare('SELECT * FROM crm_contacts WHERE customer_id = ? ORDER BY is_primary DESC')
        .all(req.params.id);

      res.json({ ...mapCustomer(updated), contacts: contacts.map(mapContact) });
    }
  );

  // GET /api/crm/customers/:id/interactions - Get customer interactions
  router.get(
    '/:id/interactions',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    (req: Request, res: Response): void => {
      const customer = db
        .prepare('SELECT id FROM crm_customers WHERE id = ?')
        .get(req.params.id);

      if (!customer) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Pelanggan tidak ditemukan' },
        });
        return;
      }

      const interactions = db
        .prepare(
          `SELECT * FROM crm_interactions 
           WHERE entity_id = ? AND entity_type = 'customer'
           ORDER BY interaction_date DESC`
        )
        .all(req.params.id);

      res.json(interactions.map(mapInteraction));
    }
  );

  return router;
}

// ============================================================
// Contacts Router (mounted separately for /api/crm/contacts/:id)
// ============================================================

export function createContactRouter(db: Database.Database): Router {
  const router = Router({ mergeParams: true });

  // POST /api/crm/customers/:customerId/contacts
  router.post(
    '/',
    requireCRMPermission('crm:write:customer', 'crm:write:all'),
    (req: Request, res: Response): void => {
      const userId = req.userId!;
      const { customerId } = req.params;

      const customer = db
        .prepare('SELECT id FROM crm_customers WHERE id = ?')
        .get(customerId);

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

      const contactId = generateId('CONT');

      db.prepare(
        `INSERT INTO crm_contacts (id, customer_id, name, title, phone, email, role, is_primary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        contactId,
        customerId,
        body.name.trim(),
        body.title ?? null,
        body.phone ?? null,
        body.email ?? null,
        body.role,
        body.isPrimary ? 1 : 0
      );

      logCreate(db, userId, 'contact', contactId, { customerId, name: body.name, role: body.role });

      const contact = db
        .prepare('SELECT * FROM crm_contacts WHERE id = ?')
        .get(contactId) as any;

      res.status(201).json(mapContact(contact));
    }
  );

  return router;
}

// ============================================================
// Standalone contact update/delete (mounted at /api/crm/contacts)
// ============================================================

export function createContactStandaloneRouter(db: Database.Database): Router {
  const router = Router();

  // PUT /api/crm/contacts/:id
  router.put(
    '/:id',
    requireCRMPermission('crm:write:customer', 'crm:write:all'),
    (req: Request, res: Response): void => {
      const userId = req.userId!;
      const contact = db
        .prepare('SELECT * FROM crm_contacts WHERE id = ?')
        .get(req.params.id) as any;

      if (!contact) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Kontak tidak ditemukan' },
        });
        return;
      }

      const body = req.body as Partial<CreateContactInput>;
      const oldValues = { ...contact };

      db.prepare(
        `UPDATE crm_contacts 
         SET name = ?, title = ?, phone = ?, email = ?, role = ?, is_primary = ?
         WHERE id = ?`
      ).run(
        body.name?.trim() ?? contact.name,
        body.title !== undefined ? body.title : contact.title,
        body.phone !== undefined ? body.phone : contact.phone,
        body.email !== undefined ? body.email : contact.email,
        body.role ?? contact.role,
        body.isPrimary !== undefined ? (body.isPrimary ? 1 : 0) : contact.is_primary,
        req.params.id
      );

      logUpdate(db, userId, 'contact', req.params.id, oldValues, req.body);

      const updated = db
        .prepare('SELECT * FROM crm_contacts WHERE id = ?')
        .get(req.params.id) as any;

      res.json(mapContact(updated));
    }
  );

  // DELETE /api/crm/contacts/:id
  router.delete(
    '/:id',
    requireCRMPermission('crm:write:customer', 'crm:write:all'),
    (req: Request, res: Response): void => {
      const userId = req.userId!;
      const contact = db
        .prepare('SELECT * FROM crm_contacts WHERE id = ?')
        .get(req.params.id) as any;

      if (!contact) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Kontak tidak ditemukan' },
        });
        return;
      }

      // Ensure at least one PIC remains
      const picCount = (
        db
          .prepare(
            `SELECT COUNT(*) as cnt FROM crm_contacts 
             WHERE customer_id = ? AND role = 'PIC' AND id != ?`
          )
          .get(contact.customer_id, req.params.id) as { cnt: number }
      ).cnt;

      if (contact.role === 'PIC' && picCount === 0) {
        res.status(422).json({
          error: {
            code: 'LAST_PIC',
            message: 'Tidak dapat menghapus kontak PIC terakhir. Minimal satu PIC harus ada.',
          },
        });
        return;
      }

      db.prepare('DELETE FROM crm_contacts WHERE id = ?').run(req.params.id);

      logUpdate(db, userId, 'contact', req.params.id, contact, { deleted: true });

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
    companyName: row.company_name,
    industry: row.industry,
    address: row.address,
    npwp: row.npwp,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContact(row: any) {
  return {
    id: row.id,
    customerId: row.customer_id,
    name: row.name,
    title: row.title,
    phone: row.phone,
    email: row.email,
    role: row.role,
    isPrimary: row.is_primary === 1,
    createdAt: row.created_at,
  };
}

function mapInteraction(row: any) {
  return {
    id: row.id,
    entityId: row.entity_id,
    entityType: row.entity_type,
    type: row.type,
    interactionDate: row.interaction_date,
    summary: row.summary,
    nextAction: row.next_action,
    nextActionDate: row.next_action_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
