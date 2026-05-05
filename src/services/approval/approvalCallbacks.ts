// Approval Callback Handlers
// Register all module-specific callbacks here.
// Each callback is invoked by the approval engine after final approval.
// requestedBy = UUID of the user who created the draft (used as createdBy for audit fields)

import { eq } from 'drizzle-orm';
import { db } from '../../db/connection';
import { registerCallback } from './callbackRegistry';
import { balanceSheets } from '../../db/schema';

// ============================================================
// Balance Sheet Callbacks (PoC)
// ============================================================

registerCallback('handleBalanceSheetCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, ...data } = payload as Record<string, unknown>;
  await db.insert(balanceSheets).values({
    ...data,
    createdBy: requestedBy ?? '00000000-0000-0000-0000-000000000000',
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
// Add more module callbacks below as they are onboarded
// ============================================================
