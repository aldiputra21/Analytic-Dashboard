// src/routes/financial/bankLoans.ts
// Bank Loans CRUD Routes + Installment Management
// Requirements: 5.1–5.11

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, ilike, or, and, count } from 'drizzle-orm';
import { db } from '../../db/connection';
import { bankLoans, bankLoanInstallments } from '../../db/schema/cfd';
import { banks, corporates } from '../../db/schema/public';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  generateFlatInstallments,
  validateEffectiveInstallments,
} from '../../services/financial/installmentScheduler';

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const createFlatLoanSchema = z.object({
  bankId: z.string().uuid(),
  corporateId: z.string().uuid(),
  amount: z.number().positive(),
  startDate: z.string().date(),
  tenor: z.number().int().positive(),
  interestType: z.literal('flat'),
  interestRate: z.number().min(0).max(1),
  alertMinDays: z.number().int().min(1).default(5),
  installmentAmount: z.number().positive(),
});

const createEffectiveLoanSchema = z
  .object({
    bankId: z.string().uuid(),
    corporateId: z.string().uuid(),
    amount: z.number().positive(),
    startDate: z.string().date(),
    tenor: z.number().int().positive(),
    interestType: z.literal('effective'),
    interestRate: z.number().min(0).max(1),
    alertMinDays: z.number().int().min(1).default(5),
    installments: z.array(
      z.object({
        installmentDate: z.string().date(),
        amount: z.number().positive(),
      }),
    ),
  })
  .refine(
    (data) => {
      const sum = data.installments.reduce((acc, i) => acc + i.amount, 0);
      return Math.abs(sum - data.amount) <= 0.01;
    },
    {
      message: 'Total installment amount must equal loan amount (tolerance: 0.01)',
      path: ['installments'],
    },
  )
  .refine((data) => data.installments.length === data.tenor, {
    message: 'Number of installments must equal tenor',
    path: ['installments'],
  });

const createLoanSchema = z.discriminatedUnion('interestType', [
  createFlatLoanSchema,
  createEffectiveLoanSchema,
]);

const updateLoanSchema = z.object({
  bankId: z.string().uuid().optional(),
  corporateId: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
  startDate: z.string().date().optional(),
  tenor: z.number().int().positive().optional(),
  interestType: z.enum(['flat', 'effective']).optional(),
  interestRate: z.number().min(0).max(1).optional(),
  status: z.enum(['ongoing', 'paid']).optional(),
  alertMinDays: z.number().int().min(1).optional(),
});

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function createBankLoansRouter(): Router {
  const router = Router();

  /**
   * GET /api/bank-loans
   * List bank loans with optional search, status filter, and pagination.
   */
  router.get('/', requirePermission('cfd.bank_loans.read'), asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(bankLoans.interestType, `%${search}%`),
          ilike(bankLoans.status, `%${search}%`),
        ),
      );
    }

    if (status === 'ongoing' || status === 'paid') {
      conditions.push(eq(bankLoans.status, status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [records, [{ totalCount }]] = await Promise.all([
      db
        .select({
          id: bankLoans.id,
          bankId: bankLoans.bankId,
          corporateId: bankLoans.corporateId,
          amount: bankLoans.amount,
          startDate: bankLoans.startDate,
          tenor: bankLoans.tenor,
          interestType: bankLoans.interestType,
          interestRate: bankLoans.interestRate,
          status: bankLoans.status,
          alertMinDays: bankLoans.alertMinDays,
          createdBy: bankLoans.createdBy,
          createdAt: bankLoans.createdAt,
          updatedBy: bankLoans.updatedBy,
          updatedAt: bankLoans.updatedAt,
          bankName: banks.name,
          corporateName: corporates.name,
        })
        .from(bankLoans)
        .leftJoin(banks, eq(bankLoans.bankId, banks.id))
        .leftJoin(corporates, eq(bankLoans.corporateId, corporates.id))
        .where(where)
        .orderBy(bankLoans.createdAt)
        .limit(pageSize)
        .offset(offset),
      db.select({ totalCount: count() }).from(bankLoans).where(where),
    ]);

    // Fetch installment counts for each loan
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        const [paidCount] = await db
          .select({ count: count() })
          .from(bankLoanInstallments)
          .where(and(
            eq(bankLoanInstallments.bankLoanId, record.id),
            eq(bankLoanInstallments.status, 'paid')
          ));

        const [totalCount] = await db
          .select({ count: count() })
          .from(bankLoanInstallments)
          .where(eq(bankLoanInstallments.bankLoanId, record.id));

        return {
          ...record,
          paidInstallmentsCount: paidCount?.count || 0,
          totalInstallmentsCount: totalCount?.count || 0,
        };
      })
    );

    return res.json({ records: enrichedRecords, totalCount: Number(totalCount) });
  }));

  /**
   * POST /api/bank-loans
   * Create a new bank loan with installments (flat or effective).
   * Uses a DB transaction to insert loan + installments atomically.
   */
  router.post('/', requirePermission('cfd.bank_loans.write'), asyncHandler(async (req: Request, res: Response) => {
    const parsed = createLoanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }

    const data = parsed.data;

    // For effective type, run additional validation via service
    if (data.interestType === 'effective') {
      const validation = validateEffectiveInstallments(
        data.installments,
        data.tenor,
        data.amount,
      );
      if (!validation.valid) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error,
          },
        });
      }
    }

    const loan = await db.transaction(async (tx) => {
      // Insert the loan record
      const [newLoan] = await tx
        .insert(bankLoans)
        .values({
          bankId: data.bankId,
          corporateId: data.corporateId,
          amount: String(data.amount),
          startDate: data.startDate,
          tenor: data.tenor,
          interestType: data.interestType,
          interestRate: String(data.interestRate),
          alertMinDays: data.alertMinDays,
          createdBy: req.user!.userId,
        })
        .returning();

      // Generate and insert installments
      let installmentRecords: {
        bankLoanId: string;
        installmentDate: string;
        amount: number;
        status: 'unpaid';
      }[];

      if (data.interestType === 'flat') {
        installmentRecords = generateFlatInstallments(
          newLoan.id,
          data.startDate,
          data.tenor,
          data.installmentAmount,
        );
      } else {
        // effective — use installments from body
        installmentRecords = data.installments.map((inst) => ({
          bankLoanId: newLoan.id,
          installmentDate: inst.installmentDate,
          amount: inst.amount,
          status: 'unpaid' as const,
        }));
      }

      await tx.insert(bankLoanInstallments).values(
        installmentRecords.map((inst) => ({
          bankLoanId: inst.bankLoanId,
          installmentDate: inst.installmentDate,
          amount: String(inst.amount),
          status: inst.status,
        })),
      );

      return newLoan;
    });

    return res.status(201).json(loan);
  }));

  /**
   * GET /api/bank-loans/:id
   * Get a single bank loan by ID.
   */
  router.get('/:id', requirePermission('cfd.bank_loans.read'), asyncHandler(async (req: Request, res: Response) => {
    const [loan] = await db
      .select({
        id: bankLoans.id,
        bankId: bankLoans.bankId,
        corporateId: bankLoans.corporateId,
        amount: bankLoans.amount,
        startDate: bankLoans.startDate,
        tenor: bankLoans.tenor,
        interestType: bankLoans.interestType,
        interestRate: bankLoans.interestRate,
        status: bankLoans.status,
        alertMinDays: bankLoans.alertMinDays,
        createdBy: bankLoans.createdBy,
        createdAt: bankLoans.createdAt,
        updatedBy: bankLoans.updatedBy,
        updatedAt: bankLoans.updatedAt,
        bankName: banks.name,
        corporateName: corporates.name,
      })
      .from(bankLoans)
      .leftJoin(banks, eq(bankLoans.bankId, banks.id))
      .leftJoin(corporates, eq(bankLoans.corporateId, corporates.id))
      .where(eq(bankLoans.id, req.params.id))
      .limit(1);

    if (!loan) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Bank loan not found' },
      });
    }

    // Fetch installments
    const installments = await db
      .select()
      .from(bankLoanInstallments)
      .where(eq(bankLoanInstallments.bankLoanId, req.params.id))
      .orderBy(bankLoanInstallments.installmentDate);

    // Count paid installments
    const [paidCount] = await db
      .select({ count: count() })
      .from(bankLoanInstallments)
      .where(and(
        eq(bankLoanInstallments.bankLoanId, req.params.id),
        eq(bankLoanInstallments.status, 'paid')
      ));

    return res.json({
      ...loan,
      installments,
      paidInstallmentsCount: paidCount?.count || 0,
      totalInstallmentsCount: installments.length,
    });
  }));

  /**
   * PUT /api/bank-loans/:id
   * Update a bank loan (header fields only; installments managed separately).
   */
  router.put('/:id', requirePermission('cfd.bank_loans.write'), asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateLoanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }

    const [existing] = await db
      .select()
      .from(bankLoans)
      .where(eq(bankLoans.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Bank loan not found' },
      });
    }

    const updateData: Record<string, unknown> = {
      updatedBy: req.user!.userId,
      updatedAt: new Date(),
    };

    if (parsed.data.bankId !== undefined) updateData.bankId = parsed.data.bankId;
    if (parsed.data.corporateId !== undefined) updateData.corporateId = parsed.data.corporateId;
    if (parsed.data.amount !== undefined) updateData.amount = String(parsed.data.amount);
    if (parsed.data.startDate !== undefined) updateData.startDate = parsed.data.startDate;
    if (parsed.data.tenor !== undefined) updateData.tenor = parsed.data.tenor;
    if (parsed.data.interestType !== undefined) updateData.interestType = parsed.data.interestType;
    if (parsed.data.interestRate !== undefined) updateData.interestRate = String(parsed.data.interestRate);
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.alertMinDays !== undefined) updateData.alertMinDays = parsed.data.alertMinDays;

    const [updated] = await db
      .update(bankLoans)
      .set(updateData)
      .where(eq(bankLoans.id, req.params.id))
      .returning();

    return res.json(updated);
  }));

  /**
   * DELETE /api/bank-loans/:id
   * Delete a bank loan (installments cascade-deleted via FK).
   */
  router.delete('/:id', requirePermission('cfd.bank_loans.delete'), asyncHandler(async (req: Request, res: Response) => {
    const [existing] = await db
      .select()
      .from(bankLoans)
      .where(eq(bankLoans.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Bank loan not found' },
      });
    }

    await db.delete(bankLoans).where(eq(bankLoans.id, req.params.id));

    return res.json({ success: true });
  }));

  /**
   * GET /api/bank-loans/:id/installments
   * List all installments for a specific bank loan.
   */
  router.get(
    '/:id/installments',
    requirePermission('cfd.bank_loans.read'),
    asyncHandler(async (req: Request, res: Response) => {
      const [loan] = await db
        .select()
        .from(bankLoans)
        .where(eq(bankLoans.id, req.params.id))
        .limit(1);

      if (!loan) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Bank loan not found' },
        });
      }

      const installments = await db
        .select()
        .from(bankLoanInstallments)
        .where(eq(bankLoanInstallments.bankLoanId, req.params.id))
        .orderBy(bankLoanInstallments.installmentDate);

      return res.json({ records: installments, totalCount: installments.length });
    })
  );

  /**
   * PATCH /api/bank-loans/:id/installments/:installmentId/mark-paid
   * Mark a single installment as paid.
   * If all installments are now paid, update the parent loan status to 'paid'.
   */
  router.patch(
    '/:id/installments/:installmentId/mark-paid',
    requirePermission('cfd.bank_loans.write'),
    asyncHandler(async (req: Request, res: Response) => {
      const { id: loanId, installmentId } = req.params;

      // Verify loan exists
      const [loan] = await db
        .select()
        .from(bankLoans)
        .where(eq(bankLoans.id, loanId))
        .limit(1);

      if (!loan) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Bank loan not found' },
        });
      }

      // Verify installment exists and belongs to this loan
      const [installment] = await db
        .select()
        .from(bankLoanInstallments)
        .where(
          and(
            eq(bankLoanInstallments.id, installmentId),
            eq(bankLoanInstallments.bankLoanId, loanId),
          ),
        )
        .limit(1);

      if (!installment) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Installment not found' },
        });
      }

      if (installment.status === 'paid') {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'Installment is already marked as paid' },
        });
      }

      const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

      await db.transaction(async (tx) => {
        // Mark this installment as paid
        await tx
          .update(bankLoanInstallments)
          .set({ status: 'paid', paidDate: today })
          .where(eq(bankLoanInstallments.id, installmentId));

        // Count remaining unpaid installments for this loan
        const [{ unpaidCount }] = await tx
          .select({ unpaidCount: count() })
          .from(bankLoanInstallments)
          .where(
            and(
              eq(bankLoanInstallments.bankLoanId, loanId),
              eq(bankLoanInstallments.status, 'unpaid'),
            ),
          );

        // If no more unpaid installments remain, mark the loan as paid
        // Note: we subtract 1 because the current installment is still 'unpaid' in DB
        // until the update above commits — but since we're in a transaction, the
        // update is visible within the same tx, so unpaidCount already reflects 0.
        if (Number(unpaidCount) === 0) {
          await tx
            .update(bankLoans)
            .set({ status: 'paid', updatedBy: req.user!.userId, updatedAt: new Date() })
            .where(eq(bankLoans.id, loanId));
        }
      });

      // Fetch updated installment to return
      const [updated] = await db
        .select()
        .from(bankLoanInstallments)
        .where(eq(bankLoanInstallments.id, installmentId))
        .limit(1);

      return res.json(updated);
    })
  );

  return router;
}
