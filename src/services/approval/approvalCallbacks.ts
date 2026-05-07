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
  uploadSessions,
  uploadStagingRows,
  auditLogs,
} from '../../db/schema';
import * as fs from 'fs/promises';
import * as path from 'path';

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

// ============================================================
// Upload Callbacks — All 11 Modules
// ============================================================

/**
 * Helper function to create audit log for upload actions
 * Per Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
async function createUploadAuditLog(
  userId: string,
  entityType: string,
  sessionId: string,
  fileName: string,
  totalRows: number,
  validRows: number,
  invalidRows: number,
  status: 'completed' | 'failed',
  rows: Array<{ rowNumber: number; status: string; data: Record<string, unknown> }>,
  errorMessage?: string,
) {
  await db.insert(auditLogs).values({
    userId,
    action: 'upload',
    entityType,
    entityId: sessionId,
    metadata: {
      fileName,
      totalRows,
      validRows,
      invalidRows,
      status,
      ...(errorMessage && { errorMessage }),
      rows,
    },
    createdAt: new Date(),
  } as any);
}

/**
 * Helper function to delete uploaded file from storage
 */
async function deleteUploadedFile(filePath: string | null) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete uploaded file: ${filePath}`, error);
    // Don't throw - file deletion failure shouldn't block the upload process
  }
}

// --- Balance Sheet Upload ---

registerCallback('handleBalanceSheetUpload', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { sessionId } = payload as { sessionId: string };
  if (!sessionId) throw new Error('sessionId required for handleBalanceSheetUpload');

  await db.transaction(async (tx) => {
    // Fetch session info
    const [session] = await tx.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId));
    if (!session) throw new Error(`Upload session ${sessionId} not found`);

    // Fetch all valid staging rows
    const stagingRows = await tx.select()
      .from(uploadStagingRows)
      .where(eq(uploadStagingRows.sessionId, sessionId));

    const validRows = stagingRows.filter(row => row.isValid);
    if (validRows.length === 0) throw new Error('No valid rows to insert');

    // Bulk insert to main table
    const insertedRows: Array<{ rowNumber: number; status: string; data: Record<string, unknown> }> = [];
    for (const row of validRows) {
      const { id: _id, ...data } = row.rowData as Record<string, unknown>;
      await tx.insert(balanceSheets).values({
        ...data,
        createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
      } as any);
      insertedRows.push({
        rowNumber: row.rowNumber,
        status: 'inserted',
        data: row.rowData as Record<string, unknown>,
      });
    }

    // Update session status
    await tx.update(uploadSessions)
      .set({ status: 'approved', updatedBy: requestedBy ?? null, updatedAt: new Date() })
      .where(eq(uploadSessions.id, sessionId));

    // Delete staging rows
    await tx.delete(uploadStagingRows).where(eq(uploadStagingRows.sessionId, sessionId));

    // Delete uploaded file
    await deleteUploadedFile(session.filePath);

    // Create audit log
    await createUploadAuditLog(
      session.userId,
      'balance_sheet',
      sessionId,
      session.fileName,
      session.totalRows,
      session.validRows,
      session.invalidRows,
      'completed',
      insertedRows,
    );
  });
});

// --- Income Statement Upload ---

registerCallback('handleIncomeStatementUpload', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { sessionId } = payload as { sessionId: string };
  if (!sessionId) throw new Error('sessionId required for handleIncomeStatementUpload');

  await db.transaction(async (tx) => {
    const [session] = await tx.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId));
    if (!session) throw new Error(`Upload session ${sessionId} not found`);

    const stagingRows = await tx.select()
      .from(uploadStagingRows)
      .where(eq(uploadStagingRows.sessionId, sessionId));

    const validRows = stagingRows.filter(row => row.isValid);
    if (validRows.length === 0) throw new Error('No valid rows to insert');

    const insertedRows: Array<{ rowNumber: number; status: string; data: Record<string, unknown> }> = [];
    for (const row of validRows) {
      const { id: _id, ...data } = row.rowData as Record<string, unknown>;
      await tx.insert(incomeStatements).values({
        ...data,
        createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
      } as any);
      insertedRows.push({
        rowNumber: row.rowNumber,
        status: 'inserted',
        data: row.rowData as Record<string, unknown>,
      });
    }

    await tx.update(uploadSessions)
      .set({ status: 'approved', updatedBy: requestedBy ?? null, updatedAt: new Date() })
      .where(eq(uploadSessions.id, sessionId));

    await tx.delete(uploadStagingRows).where(eq(uploadStagingRows.sessionId, sessionId));
    await deleteUploadedFile(session.filePath);

    await createUploadAuditLog(
      session.userId,
      'income_statement',
      sessionId,
      session.fileName,
      session.totalRows,
      session.validRows,
      session.invalidRows,
      'completed',
      insertedRows,
    );
  });
});

// --- Income Statement Projection Upload (header-detail) ---

registerCallback('handleIncomeStatementProjectionUpload', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { sessionId } = payload as { sessionId: string };
  if (!sessionId) throw new Error('sessionId required for handleIncomeStatementProjectionUpload');

  await db.transaction(async (tx) => {
    const [session] = await tx.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId));
    if (!session) throw new Error(`Upload session ${sessionId} not found`);

    const stagingRows = await tx.select()
      .from(uploadStagingRows)
      .where(eq(uploadStagingRows.sessionId, sessionId));

    const validRows = stagingRows.filter(row => row.isValid);
    if (validRows.length === 0) throw new Error('No valid rows to insert');

    // Group rows by header identifier (assuming flat format with header fields repeated)
    const insertedRows: Array<{ rowNumber: number; status: string; data: Record<string, unknown> }> = [];
    
    // For projection modules, we need to handle header-detail relationship
    // Assuming rowData contains both header and detail fields
    for (const row of validRows) {
      const { id: _id, details: rawDetails, ...headerData } = row.rowData as Record<string, unknown>;
      const details = (rawDetails as Record<string, unknown>[] | undefined) ?? [];
      
      const [header] = await tx.insert(targetHeaders).values({
        ...headerData,
        createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
      } as any).returning({ id: targetHeaders.id });
      
      if (details.length > 0) {
        await tx.insert(targetDetails).values(
          details.map((d) => ({ ...d, targetHeaderId: header.id } as any)),
        );
      }
      
      insertedRows.push({
        rowNumber: row.rowNumber,
        status: 'inserted',
        data: row.rowData as Record<string, unknown>,
      });
    }

    await tx.update(uploadSessions)
      .set({ status: 'approved', updatedBy: requestedBy ?? null, updatedAt: new Date() })
      .where(eq(uploadSessions.id, sessionId));

    await tx.delete(uploadStagingRows).where(eq(uploadStagingRows.sessionId, sessionId));
    await deleteUploadedFile(session.filePath);

    await createUploadAuditLog(
      session.userId,
      'income_statement_projection',
      sessionId,
      session.fileName,
      session.totalRows,
      session.validRows,
      session.invalidRows,
      'completed',
      insertedRows,
    );
  });
});

// --- Weekly Cash Flow Upload ---

registerCallback('handleWeeklyCashFlowUpload', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { sessionId } = payload as { sessionId: string };
  if (!sessionId) throw new Error('sessionId required for handleWeeklyCashFlowUpload');

  await db.transaction(async (tx) => {
    const [session] = await tx.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId));
    if (!session) throw new Error(`Upload session ${sessionId} not found`);

    const stagingRows = await tx.select()
      .from(uploadStagingRows)
      .where(eq(uploadStagingRows.sessionId, sessionId));

    const validRows = stagingRows.filter(row => row.isValid);
    if (validRows.length === 0) throw new Error('No valid rows to insert');

    const insertedRows: Array<{ rowNumber: number; status: string; data: Record<string, unknown> }> = [];
    for (const row of validRows) {
      const { id: _id, ...data } = row.rowData as Record<string, unknown>;
      await tx.insert(weeklyCashFlows).values({
        ...data,
        createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
      } as any);
      insertedRows.push({
        rowNumber: row.rowNumber,
        status: 'inserted',
        data: row.rowData as Record<string, unknown>,
      });
    }

    await tx.update(uploadSessions)
      .set({ status: 'approved', updatedBy: requestedBy ?? null, updatedAt: new Date() })
      .where(eq(uploadSessions.id, sessionId));

    await tx.delete(uploadStagingRows).where(eq(uploadStagingRows.sessionId, sessionId));
    await deleteUploadedFile(session.filePath);

    await createUploadAuditLog(
      session.userId,
      'weekly_cash_flow',
      sessionId,
      session.fileName,
      session.totalRows,
      session.validRows,
      session.invalidRows,
      'completed',
      insertedRows,
    );
  });
});

// --- Realization Upload ---

registerCallback('handleRealizationUpload', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { sessionId } = payload as { sessionId: string };
  if (!sessionId) throw new Error('sessionId required for handleRealizationUpload');

  await db.transaction(async (tx) => {
    const [session] = await tx.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId));
    if (!session) throw new Error(`Upload session ${sessionId} not found`);

    const stagingRows = await tx.select()
      .from(uploadStagingRows)
      .where(eq(uploadStagingRows.sessionId, sessionId));

    const validRows = stagingRows.filter(row => row.isValid);
    if (validRows.length === 0) throw new Error('No valid rows to insert');

    const insertedRows: Array<{ rowNumber: number; status: string; data: Record<string, unknown> }> = [];
    for (const row of validRows) {
      const { id: _id, ...data } = row.rowData as Record<string, unknown>;
      await tx.insert(cashRealizations).values({
        ...data,
        createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
      } as any);
      insertedRows.push({
        rowNumber: row.rowNumber,
        status: 'inserted',
        data: row.rowData as Record<string, unknown>,
      });
    }

    await tx.update(uploadSessions)
      .set({ status: 'approved', updatedBy: requestedBy ?? null, updatedAt: new Date() })
      .where(eq(uploadSessions.id, sessionId));

    await tx.delete(uploadStagingRows).where(eq(uploadStagingRows.sessionId, sessionId));
    await deleteUploadedFile(session.filePath);

    await createUploadAuditLog(
      session.userId,
      'realization',
      sessionId,
      session.fileName,
      session.totalRows,
      session.validRows,
      session.invalidRows,
      'completed',
      insertedRows,
    );
  });
});

// --- Cash Flow Projection Upload (header-detail) ---

registerCallback('handleCashFlowProjectionUpload', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { sessionId } = payload as { sessionId: string };
  if (!sessionId) throw new Error('sessionId required for handleCashFlowProjectionUpload');

  await db.transaction(async (tx) => {
    const [session] = await tx.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId));
    if (!session) throw new Error(`Upload session ${sessionId} not found`);

    const stagingRows = await tx.select()
      .from(uploadStagingRows)
      .where(eq(uploadStagingRows.sessionId, sessionId));

    const validRows = stagingRows.filter(row => row.isValid);
    if (validRows.length === 0) throw new Error('No valid rows to insert');

    const insertedRows: Array<{ rowNumber: number; status: string; data: Record<string, unknown> }> = [];

    for (const row of validRows) {
      const rowData = row.rowData as Record<string, unknown>;
      const details = (rowData.details as Array<{ month: number; type: string; group: string; category: string; amount: string }> | undefined) ?? [];

      // Upsert header (corporateId + fiscalYear unique)
      const [header] = await tx.insert(cashFlowProjectionHeaders).values({
        corporateId: rowData.corporate_id as string,
        fiscalYear: rowData.fiscal_year as number,
        initialBalance: (rowData.initial_balance as string) || '0',
        notes: (rowData.notes as string) || null,
        createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
      }).onConflictDoUpdate({
        target: [cashFlowProjectionHeaders.corporateId, cashFlowProjectionHeaders.fiscalYear],
        set: {
          initialBalance: (rowData.initial_balance as string) || '0',
          notes: (rowData.notes as string) || null,
          updatedBy: requestedBy ?? null,
          updatedAt: new Date(),
        },
      }).returning({ id: cashFlowProjectionHeaders.id });

      if (details.length > 0) {
        // Remove existing upload-sourced details before re-inserting
        await tx.delete(cashFlowProjectionDetails)
          .where(eq(cashFlowProjectionDetails.headerId, header.id));

        await tx.insert(cashFlowProjectionDetails).values(
          details.map(d => ({
            headerId: header.id,
            month: d.month,
            group: d.group ?? 'operating',
            type: d.type,
            category: d.category || 'Upload',
            amount: d.amount,
          })),
        );
      }

      insertedRows.push({
        rowNumber: row.rowNumber,
        status: 'inserted',
        data: rowData,
      });
    }

    await tx.update(uploadSessions)
      .set({ status: 'approved', updatedBy: requestedBy ?? null, updatedAt: new Date() })
      .where(eq(uploadSessions.id, sessionId));

    await tx.delete(uploadStagingRows).where(eq(uploadStagingRows.sessionId, sessionId));
    await deleteUploadedFile(session.filePath);

    await createUploadAuditLog(
      session.userId,
      'cash_flow_projection',
      sessionId,
      session.fileName,
      session.totalRows,
      session.validRows,
      session.invalidRows,
      'completed',
      insertedRows,
    );
  });
});

// --- Bank Loan Upload ---

registerCallback('handleBankLoanUpload', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { sessionId } = payload as { sessionId: string };
  if (!sessionId) throw new Error('sessionId required for handleBankLoanUpload');

  await db.transaction(async (tx) => {
    const [session] = await tx.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId));
    if (!session) throw new Error(`Upload session ${sessionId} not found`);

    const stagingRows = await tx.select()
      .from(uploadStagingRows)
      .where(eq(uploadStagingRows.sessionId, sessionId));

    const validRows = stagingRows.filter(row => row.isValid);
    if (validRows.length === 0) throw new Error('No valid rows to insert');

    const insertedRows: Array<{ rowNumber: number; status: string; data: Record<string, unknown> }> = [];
    for (const row of validRows) {
      const { id: _id, ...data } = row.rowData as Record<string, unknown>;
      await tx.insert(bankLoans).values({
        ...data,
        createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
      } as any);
      insertedRows.push({
        rowNumber: row.rowNumber,
        status: 'inserted',
        data: row.rowData as Record<string, unknown>,
      });
    }

    await tx.update(uploadSessions)
      .set({ status: 'approved', updatedBy: requestedBy ?? null, updatedAt: new Date() })
      .where(eq(uploadSessions.id, sessionId));

    await tx.delete(uploadStagingRows).where(eq(uploadStagingRows.sessionId, sessionId));
    await deleteUploadedFile(session.filePath);

    await createUploadAuditLog(
      session.userId,
      'bank_loan',
      sessionId,
      session.fileName,
      session.totalRows,
      session.validRows,
      session.invalidRows,
      'completed',
      insertedRows,
    );
  });
});

// --- Corporate Upload ---

registerCallback('handleCorporateUpload', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { sessionId } = payload as { sessionId: string };
  if (!sessionId) throw new Error('sessionId required for handleCorporateUpload');

  await db.transaction(async (tx) => {
    const [session] = await tx.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId));
    if (!session) throw new Error(`Upload session ${sessionId} not found`);

    const stagingRows = await tx.select()
      .from(uploadStagingRows)
      .where(eq(uploadStagingRows.sessionId, sessionId));

    const validRows = stagingRows.filter(row => row.isValid);
    if (validRows.length === 0) throw new Error('No valid rows to insert');

    const insertedRows: Array<{ rowNumber: number; status: string; data: Record<string, unknown> }> = [];
    for (const row of validRows) {
      const { id: _id, ...data } = row.rowData as Record<string, unknown>;
      await tx.insert(corporates).values({
        ...data,
        createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
      } as any);
      insertedRows.push({
        rowNumber: row.rowNumber,
        status: 'inserted',
        data: row.rowData as Record<string, unknown>,
      });
    }

    await tx.update(uploadSessions)
      .set({ status: 'approved', updatedBy: requestedBy ?? null, updatedAt: new Date() })
      .where(eq(uploadSessions.id, sessionId));

    await tx.delete(uploadStagingRows).where(eq(uploadStagingRows.sessionId, sessionId));
    await deleteUploadedFile(session.filePath);

    await createUploadAuditLog(
      session.userId,
      'corporate',
      sessionId,
      session.fileName,
      session.totalRows,
      session.validRows,
      session.invalidRows,
      'completed',
      insertedRows,
    );
  });
});

// --- Department Upload ---

registerCallback('handleDepartmentUpload', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { sessionId } = payload as { sessionId: string };
  if (!sessionId) throw new Error('sessionId required for handleDepartmentUpload');

  await db.transaction(async (tx) => {
    const [session] = await tx.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId));
    if (!session) throw new Error(`Upload session ${sessionId} not found`);

    const stagingRows = await tx.select()
      .from(uploadStagingRows)
      .where(eq(uploadStagingRows.sessionId, sessionId));

    const validRows = stagingRows.filter(row => row.isValid);
    if (validRows.length === 0) throw new Error('No valid rows to insert');

    const insertedRows: Array<{ rowNumber: number; status: string; data: Record<string, unknown> }> = [];
    for (const row of validRows) {
      const { id: _id, ...data } = row.rowData as Record<string, unknown>;
      await tx.insert(departments).values({
        ...data,
        createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
      } as any);
      insertedRows.push({
        rowNumber: row.rowNumber,
        status: 'inserted',
        data: row.rowData as Record<string, unknown>,
      });
    }

    await tx.update(uploadSessions)
      .set({ status: 'approved', updatedBy: requestedBy ?? null, updatedAt: new Date() })
      .where(eq(uploadSessions.id, sessionId));

    await tx.delete(uploadStagingRows).where(eq(uploadStagingRows.sessionId, sessionId));
    await deleteUploadedFile(session.filePath);

    await createUploadAuditLog(
      session.userId,
      'department',
      sessionId,
      session.fileName,
      session.totalRows,
      session.validRows,
      session.invalidRows,
      'completed',
      insertedRows,
    );
  });
});

// --- Cost Center Upload ---

registerCallback('handleCostCenterUpload', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { sessionId } = payload as { sessionId: string };
  if (!sessionId) throw new Error('sessionId required for handleCostCenterUpload');

  await db.transaction(async (tx) => {
    const [session] = await tx.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId));
    if (!session) throw new Error(`Upload session ${sessionId} not found`);

    const stagingRows = await tx.select()
      .from(uploadStagingRows)
      .where(eq(uploadStagingRows.sessionId, sessionId));

    const validRows = stagingRows.filter(row => row.isValid);
    if (validRows.length === 0) throw new Error('No valid rows to insert');

    const insertedRows: Array<{ rowNumber: number; status: string; data: Record<string, unknown> }> = [];
    for (const row of validRows) {
      const { id: _id, ...data } = row.rowData as Record<string, unknown>;
      await tx.insert(costCenters).values({
        ...data,
        createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
      } as any);
      insertedRows.push({
        rowNumber: row.rowNumber,
        status: 'inserted',
        data: row.rowData as Record<string, unknown>,
      });
    }

    await tx.update(uploadSessions)
      .set({ status: 'approved', updatedBy: requestedBy ?? null, updatedAt: new Date() })
      .where(eq(uploadSessions.id, sessionId));

    await tx.delete(uploadStagingRows).where(eq(uploadStagingRows.sessionId, sessionId));
    await deleteUploadedFile(session.filePath);

    await createUploadAuditLog(
      session.userId,
      'cost_center',
      sessionId,
      session.fileName,
      session.totalRows,
      session.validRows,
      session.invalidRows,
      'completed',
      insertedRows,
    );
  });
});

// --- Project Upload ---

registerCallback('handleProjectUpload', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { sessionId } = payload as { sessionId: string };
  if (!sessionId) throw new Error('sessionId required for handleProjectUpload');

  await db.transaction(async (tx) => {
    const [session] = await tx.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId));
    if (!session) throw new Error(`Upload session ${sessionId} not found`);

    const stagingRows = await tx.select()
      .from(uploadStagingRows)
      .where(eq(uploadStagingRows.sessionId, sessionId));

    const validRows = stagingRows.filter(row => row.isValid);
    if (validRows.length === 0) throw new Error('No valid rows to insert');

    const insertedRows: Array<{ rowNumber: number; status: string; data: Record<string, unknown> }> = [];
    for (const row of validRows) {
      const { id: _id, ...data } = row.rowData as Record<string, unknown>;
      await tx.insert(projects).values({
        ...data,
        createdBy: requestedBy ?? SYSTEM_ACTOR_ID,
      } as any);
      insertedRows.push({
        rowNumber: row.rowNumber,
        status: 'inserted',
        data: row.rowData as Record<string, unknown>,
      });
    }

    await tx.update(uploadSessions)
      .set({ status: 'approved', updatedBy: requestedBy ?? null, updatedAt: new Date() })
      .where(eq(uploadSessions.id, sessionId));

    await tx.delete(uploadStagingRows).where(eq(uploadStagingRows.sessionId, sessionId));
    await deleteUploadedFile(session.filePath);

    await createUploadAuditLog(
      session.userId,
      'project',
      sessionId,
      session.fileName,
      session.totalRows,
      session.validRows,
      session.invalidRows,
      'completed',
      insertedRows,
    );
  });
});
