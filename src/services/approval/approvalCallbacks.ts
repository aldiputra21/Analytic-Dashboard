// Approval Callback Handlers
// Register all module-specific callbacks here.
// Each callback is invoked by the approval engine after final approval.
// requestedBy = UUID of the user who created the draft (used as createdBy for audit fields)

import { eq } from 'drizzle-orm';
import { db } from '../../db/connection';
import { registerCallback } from './callbackRegistry';
import {
  balanceSheets,
  incomeStatements,
  targetHeaders,
  targetDetails,
  weeklyCashFlows,
  cashRealizations,
  cashFlowProjectionHeaders,
  cashFlowProjectionDetails,
  bankLoans,
  corporates,
  departments,
  costCenters,
  projects,
} from '../../db/schema';

const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

// ============================================================
// Balance Sheet Callbacks (PoC)
// ============================================================

registerCallback('handleBalanceSheetCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, ...data } = payload as Record<string, unknown>;
  await db.insert(balanceSheets).values({
    ...data,
    createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
  } as any);
});

registerCallback('handleBalanceSheetEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required for handleBalanceSheetEdit');
  const { id: _id, createdBy: _cb, createdAt: _ca, ...data } = payload as Record<string, unknown>;
  await db.update(balanceSheets)
    .set({
      ...data,
      updatedBy: requestedBy ?? null,
      updatedAt: new Date(),
    } as any)
    .where(eq(balanceSheets.id, entityId));
});

registerCallback('handleBalanceSheetDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required for handleBalanceSheetDelete');
  await db.delete(balanceSheets).where(eq(balanceSheets.id, entityId));
});

// ============================================================
// Income Statement Callbacks
// ============================================================

registerCallback('handleIncomeStatementCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, ...data } = payload as Record<string, unknown>;
  await db.insert(incomeStatements).values({
    ...data,
    createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
  } as any);
});

registerCallback('handleIncomeStatementEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required for handleIncomeStatementEdit');
  const { id: _id, createdBy: _cb, createdAt: _ca, ...data } = payload as Record<string, unknown>;
  await db.update(incomeStatements)
    .set({
      ...data,
      updatedBy: requestedBy ?? null,
      updatedAt: new Date(),
    } as any)
    .where(eq(incomeStatements.id, entityId));
});

registerCallback('handleIncomeStatementDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required for handleIncomeStatementDelete');
  await db.delete(incomeStatements).where(eq(incomeStatements.id, entityId));
});

// ============================================================
// Income Statement Projection Callbacks (header-detail, uses transaction)
// ============================================================

registerCallback('handleIncomeStatementProjectionCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, details: rawDetails, ...headerData } = payload as Record<string, unknown>;
  const details = (rawDetails as Record<string, unknown>[] | undefined) ?? [];
  await db.transaction(async (tx) => {
    const [header] = await tx.insert(targetHeaders).values({
      ...headerData,
      createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
    } as any).returning({ id: targetHeaders.id });
    if (details.length > 0) {
      await tx.insert(targetDetails).values(
        details.map((d) => ({ ...d, targetHeaderId: header.id } as any)),
      );
    }
  });
});

registerCallback('handleIncomeStatementProjectionEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required for handleIncomeStatementProjectionEdit');
  const { id: _id, createdBy: _cb, createdAt: _ca, details: _details, ...data } = payload as Record<string, unknown>;
  await db.update(targetHeaders)
    .set({
      ...data,
      updatedBy: requestedBy ?? null,
      updatedAt: new Date(),
    } as any)
    .where(eq(targetHeaders.id, entityId));
});

registerCallback('handleIncomeStatementProjectionDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required for handleIncomeStatementProjectionDelete');
  await db.transaction(async (tx) => {
    // targetDetails has ON DELETE CASCADE, but we delete explicitly for clarity
    await tx.delete(targetDetails).where(eq(targetDetails.targetHeaderId, entityId));
    await tx.delete(targetHeaders).where(eq(targetHeaders.id, entityId));
  });
});

// ============================================================
// Weekly Cash Flow Callbacks
// ============================================================

registerCallback('handleWeeklyCashFlowCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, ...data } = payload as Record<string, unknown>;
  await db.insert(weeklyCashFlows).values({
    ...data,
    createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
  } as any);
});

registerCallback('handleWeeklyCashFlowEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required for handleWeeklyCashFlowEdit');
  const { id: _id, createdBy: _cb, createdAt: _ca, ...data } = payload as Record<string, unknown>;
  await db.update(weeklyCashFlows)
    .set({
      ...data,
      updatedBy: requestedBy ?? null,
      updatedAt: new Date(),
    } as any)
    .where(eq(weeklyCashFlows.id, entityId));
});

registerCallback('handleWeeklyCashFlowDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required for handleWeeklyCashFlowDelete');
  await db.delete(weeklyCashFlows).where(eq(weeklyCashFlows.id, entityId));
});

// ============================================================
// Realization Callbacks
// ============================================================

registerCallback('handleRealizationCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, ...data } = payload as Record<string, unknown>;
  await db.insert(cashRealizations).values({
    ...data,
    createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
  } as any);
});

registerCallback('handleRealizationEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required for handleRealizationEdit');
  const { id: _id, createdBy: _cb, createdAt: _ca, ...data } = payload as Record<string, unknown>;
  await db.update(cashRealizations)
    .set({
      ...data,
      updatedBy: requestedBy ?? null,
      updatedAt: new Date(),
    } as any)
    .where(eq(cashRealizations.id, entityId));
});

registerCallback('handleRealizationDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required for handleRealizationDelete');
  await db.delete(cashRealizations).where(eq(cashRealizations.id, entityId));
});

// ============================================================
// Cash Flow Projection Callbacks (header-detail, uses transaction)
// ============================================================

registerCallback('handleCashFlowProjectionCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, details: rawDetails, ...headerData } = payload as Record<string, unknown>;
  const details = (rawDetails as Record<string, unknown>[] | undefined) ?? [];
  await db.transaction(async (tx) => {
    const [header] = await tx.insert(cashFlowProjectionHeaders).values({
      ...headerData,
      createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
    } as any).returning({ id: cashFlowProjectionHeaders.id });
    if (details.length > 0) {
      await tx.insert(cashFlowProjectionDetails).values(
        details.map((d) => ({ ...d, headerId: header.id } as any)),
      );
    }
  });
});

registerCallback('handleCashFlowProjectionEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required for handleCashFlowProjectionEdit');
  const { id: _id, createdBy: _cb, createdAt: _ca, details: _details, ...data } = payload as Record<string, unknown>;
  await db.update(cashFlowProjectionHeaders)
    .set({
      ...data,
      updatedBy: requestedBy ?? null,
      updatedAt: new Date(),
    } as any)
    .where(eq(cashFlowProjectionHeaders.id, entityId));
});

registerCallback('handleCashFlowProjectionDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required for handleCashFlowProjectionDelete');
  await db.transaction(async (tx) => {
    // cashFlowProjectionDetails has ON DELETE CASCADE, but we delete explicitly for clarity
    await tx.delete(cashFlowProjectionDetails).where(eq(cashFlowProjectionDetails.headerId, entityId));
    await tx.delete(cashFlowProjectionHeaders).where(eq(cashFlowProjectionHeaders.id, entityId));
  });
});

// ============================================================
// Bank Loan Callbacks
// ============================================================

registerCallback('handleBankLoanCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, ...data } = payload as Record<string, unknown>;
  await db.insert(bankLoans).values({
    ...data,
    createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
  } as any);
});

registerCallback('handleBankLoanEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required for handleBankLoanEdit');
  const { id: _id, createdBy: _cb, createdAt: _ca, ...data } = payload as Record<string, unknown>;
  await db.update(bankLoans)
    .set({
      ...data,
      updatedBy: requestedBy ?? null,
      updatedAt: new Date(),
    } as any)
    .where(eq(bankLoans.id, entityId));
});

registerCallback('handleBankLoanDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required for handleBankLoanDelete');
  await db.delete(bankLoans).where(eq(bankLoans.id, entityId));
});

// ============================================================
// Corporate Callbacks
// ============================================================

registerCallback('handleCorporateCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, ...data } = payload as Record<string, unknown>;
  await db.insert(corporates).values({
    ...data,
    createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
  } as any);
});

registerCallback('handleCorporateEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required for handleCorporateEdit');
  const { id: _id, createdBy: _cb, createdAt: _ca, ...data } = payload as Record<string, unknown>;
  await db.update(corporates)
    .set({
      ...data,
      updatedBy: requestedBy ?? null,
      updatedAt: new Date(),
    } as any)
    .where(eq(corporates.id, entityId));
});

registerCallback('handleCorporateDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required for handleCorporateDelete');
  await db.delete(corporates).where(eq(corporates.id, entityId));
});

// ============================================================
// Department Callbacks
// ============================================================

registerCallback('handleDepartmentCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, ...data } = payload as Record<string, unknown>;
  await db.insert(departments).values({
    ...data,
    createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
  } as any);
});

registerCallback('handleDepartmentEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required for handleDepartmentEdit');
  const { id: _id, createdBy: _cb, createdAt: _ca, ...data } = payload as Record<string, unknown>;
  await db.update(departments)
    .set({
      ...data,
      updatedBy: requestedBy ?? null,
      updatedAt: new Date(),
    } as any)
    .where(eq(departments.id, entityId));
});

registerCallback('handleDepartmentDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required for handleDepartmentDelete');
  await db.delete(departments).where(eq(departments.id, entityId));
});

// ============================================================
// Cost Center Callbacks
// ============================================================

registerCallback('handleCostCenterCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, ...data } = payload as Record<string, unknown>;
  await db.insert(costCenters).values({
    ...data,
    createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
  } as any);
});

registerCallback('handleCostCenterEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required for handleCostCenterEdit');
  const { id: _id, createdBy: _cb, createdAt: _ca, ...data } = payload as Record<string, unknown>;
  await db.update(costCenters)
    .set({
      ...data,
      updatedBy: requestedBy ?? null,
      updatedAt: new Date(),
    } as any)
    .where(eq(costCenters.id, entityId));
});

registerCallback('handleCostCenterDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required for handleCostCenterDelete');
  await db.delete(costCenters).where(eq(costCenters.id, entityId));
});

// ============================================================
// Project Callbacks
// ============================================================

registerCallback('handleProjectCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, ...data } = payload as Record<string, unknown>;
  await db.insert(projects).values({
    ...data,
    createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
  } as any);
});

registerCallback('handleProjectEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required for handleProjectEdit');
  const { id: _id, createdBy: _cb, createdAt: _ca, ...data } = payload as Record<string, unknown>;
  await db.update(projects)
    .set({
      ...data,
      updatedBy: requestedBy ?? null,
      updatedAt: new Date(),
    } as any)
    .where(eq(projects.id, entityId));
});

registerCallback('handleProjectDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required for handleProjectDelete');
  await db.delete(projects).where(eq(projects.id, entityId));
});
