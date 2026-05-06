// reportCleanupService.ts
// Cleanup expired report outputs based on retention policy.
//
// Requirements: 8.3, 8.4, 8.5, 8.7, 11.4

import fs from 'fs/promises';
import { eq, and, lt, sql } from 'drizzle-orm';
import { db } from '../../db/connection.js';
import { reportOutputs, reportConfigs } from '../../db/schema/index.js';
import { createFRSAuditLog } from './auditLogService.js';
import { configService } from '../management/configService.js';
import { upsertNotification } from './notificationService.js';

// ============================================================================
// Constants & Defaults
// ============================================================================

const DEFAULT_OUTPUT_PATH = './storage/report-outputs';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Reads the report_output_path from system_configs.
 * Falls back to DEFAULT_OUTPUT_PATH and logs a warning if not configured.
 */
async function getOutputPath(): Promise<string> {
  const value = await configService.get<string>('report_output_path');
  if (!value) {
    console.warn(
      '[ReportCleanup] system_configs key "report_output_path" not found. ' +
        `Using default: ${DEFAULT_OUTPUT_PATH}`,
    );
    return DEFAULT_OUTPUT_PATH;
  }
  return value;
}

// ============================================================================
// runCleanup
// ============================================================================

/**
 * Identifies all report_outputs with retention_type='days' where completed_at
 * has passed retention_days, then for each:
 *  1. Deletes the physical file (if it exists; missing file is not an error)
 *  2. Updates status to 'expired' and sets deleted_at
 *  3. Inserts an audit_log entry (action='report_expired')
 *
 * Returns { deleted: N, errors: K } where:
 *  - deleted = number of outputs successfully marked expired
 *  - errors  = number of outputs that encountered an unexpected error
 *
 * Requirements: 8.3, 8.4, 8.5, 8.7, 11.4
 *
 * @param dbClient - Optional Drizzle DB client (defaults to the shared `db`).
 *                   Pass a test client to isolate unit tests.
 */
export async function runCleanup(
  dbClient: typeof db = db,
): Promise<{ deleted: number; errors: number }> {
  // Log the output path for context (Requirement 9.2)
  await getOutputPath();

  // ── Query expired outputs ─────────────────────────────────────────────────
  // Join report_outputs with report_configs to access retention_days.
  // Filter:
  //   - report_configs.retention_type = 'days'
  //   - report_outputs.status = 'completed'  (only clean up completed ones)
  //   - report_outputs.completed_at < now() - interval of retention_days days
  //
  // Requirements: 8.3
  const expiredOutputs = await dbClient
    .select({
      id: reportOutputs.id,
      outputPath: reportOutputs.outputPath,
      outputFilename: reportOutputs.outputFilename,
      userId: reportOutputs.userId,
      retentionDays: reportConfigs.retentionDays,
    })
    .from(reportOutputs)
    .innerJoin(reportConfigs, eq(reportOutputs.reportConfigId, reportConfigs.id))
    .where(
      and(
        eq(reportConfigs.retentionType, 'days'),
        eq(reportOutputs.status, 'completed'),
        // completed_at < now() - interval 'N days'
        // Uses a raw SQL expression because Drizzle does not have a built-in
        // interval subtraction helper for dynamic values.
        sql`${reportOutputs.completedAt} < now() - (${reportConfigs.retentionDays} || ' days')::interval`,
      ),
    );

  let deleted = 0;
  let errors = 0;

  for (const output of expiredOutputs) {
    try {
      // ── 1. Delete physical file (if it exists) ──────────────────────────
      // Requirement 8.4, 8.7: missing file must not stop the process
      if (output.outputPath) {
        try {
          await fs.unlink(output.outputPath);
        } catch (fsErr: unknown) {
          const nodeErr = fsErr as NodeJS.ErrnoException;
          if (nodeErr.code === 'ENOENT') {
            // File not found — log a warning but continue (Requirement 8.7)
            console.warn(
              `[ReportCleanup] Physical file not found (continuing): ${output.outputPath}`,
            );
          } else {
            // Unexpected FS error — log but still proceed to mark expired
            console.error(
              `[ReportCleanup] Unexpected error deleting file ${output.outputPath}:`,
              fsErr,
            );
          }
        }
      }

      // ── 2. Update status to 'expired' and set deleted_at ───────────────
      // Requirement 8.4
      await dbClient
        .update(reportOutputs)
        .set({
          status: 'expired',
          deletedAt: new Date(),
        })
        .where(eq(reportOutputs.id, output.id));
      
      // Update notification to hide download button
      upsertNotification({
        sourceModule: 'public',
        sourceEntityType: 'report_output',
        sourceEntityId: output.id,
        recipientUserId: output.userId,
        category: 'report',
        templateKey: 'report_ready',
        templateVars: { reportTitleId: 'Laporan', reportTitleEn: 'Report' },
        payload: { outputId: output.id, reportStatus: 'expired' },
        severity: 'low',
        createdBy: 'system',
      }).catch(() => {});

      // ── 3. Insert audit log entry ───────────────────────────────────────
      // Requirement 8.5, 11.4
      await createFRSAuditLog({
        userId: output.userId,
        action: 'report_expired',
        entityType: 'report_output',
        entityId: output.id,
        newValues: {
          filename: output.outputFilename ?? output.outputPath ?? null,
          reason: `Retention period of ${output.retentionDays ?? 0} day(s) exceeded`,
          deletedAt: new Date().toISOString(),
        },
      });

      deleted++;
    } catch (err) {
      // Per-entry errors must not stop the overall loop (Requirement 8.7)
      console.error(`[ReportCleanup] Error processing output ${output.id}:`, err);
      errors++;
    }
  }

  console.log(`[ReportCleanup] Cleanup complete — deleted: ${deleted}, errors: ${errors}`);
  return { deleted, errors };
}
