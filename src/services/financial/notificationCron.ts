import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db/connection.js';
import { notificationConfigs, userCorporateAccesses } from '../../db/schema/public.js';
import { bankLoanInstallments, bankLoans } from '../../db/schema/cfd.js';
import { createNotification } from './notificationService.js';

type DbClient = typeof db;

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Returns installments that are unpaid, within the alert window, and belong
 * to an ongoing loan.
 *
 * Condition: status='unpaid' AND installment_date BETWEEN (today - alert_min_days) AND today
 *            AND loan.status='ongoing'
 */
export async function queryDueInstallments(dbClient: DbClient, today: Date) {
  const todayStr = today.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const rows = await dbClient
    .select({
      installmentId: bankLoanInstallments.id,
      installmentDate: bankLoanInstallments.installmentDate,
      amount: bankLoanInstallments.amount,
      bankLoanId: bankLoanInstallments.bankLoanId,
      alertMinDays: bankLoans.alertMinDays,
      corporateId: bankLoans.corporateId,
    })
    .from(bankLoanInstallments)
    .innerJoin(bankLoans, eq(bankLoanInstallments.bankLoanId, bankLoans.id))
    .where(
      and(
        eq(bankLoanInstallments.status, 'unpaid'),
        eq(bankLoans.status, 'ongoing'),
        // installment_date BETWEEN (today - alert_min_days) AND today
        // We use a raw SQL expression because alert_min_days is a per-row value
        sql`${bankLoanInstallments.installmentDate} BETWEEN
          (${todayStr}::date - ${bankLoans.alertMinDays} * INTERVAL '1 day')
          AND ${todayStr}::date`,
      ),
    );

  return rows;
}

/**
 * Returns active notification_configs for a given module + event_type.
 */
export async function getActiveNotificationConfigs(
  dbClient: DbClient,
  module: string,
  eventType: string,
) {
  return dbClient
    .select()
    .from(notificationConfigs)
    .where(
      and(
        eq(notificationConfigs.module, module),
        eq(notificationConfigs.eventType, eventType),
        eq(notificationConfigs.isActive, true),
      ),
    );
}

/**
 * Returns all users that have the given role in user_corporate_accesses.
 */
export async function getUsersByRole(dbClient: DbClient, roleId: string) {
  return dbClient
    .select({ userId: userCorporateAccesses.userId })
    .from(userCorporateAccesses)
    .where(eq(userCorporateAccesses.roleId, roleId));
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Main cron logic.
 * - Queries due installments
 * - Queries active notification configs for module='cfd', event_type='loan_installment_due'
 * - For each installment × role config, dispatches a notification to every user with that role
 * - Handles per-user errors gracefully (continues on error, counts errors)
 * - Logs summary: [NotificationCron] Done: sent=N, skipped=M, errors=K
 */
export async function runInstallmentNotificationCron(dbClient: DbClient = db) {
  const today = new Date();
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const [installments, configs] = await Promise.all([
      queryDueInstallments(dbClient, today),
      getActiveNotificationConfigs(dbClient, 'cfd', 'loan_installment_due'),
    ]);

    if (installments.length === 0 || configs.length === 0) {
      console.log(`[NotificationCron] Done: sent=${sent}, skipped=${skipped}, errors=${errors}`);
      return { sent, skipped, errors };
    }

    for (const installment of installments) {
      for (const config of configs) {
        let users: { userId: string }[];
        try {
          users = await getUsersByRole(dbClient, config.roleId);
        } catch (err) {
          console.error(`[NotificationCron] ERROR fetching users for role ${config.roleId}:`, err);
          errors++;
          continue;
        }

        if (users.length === 0) {
          skipped++;
          continue;
        }

        for (const { userId } of users) {
          try {
            await createNotification({
              sourceModule: 'cfd',
              sourceEntityType: 'bank_loan_installment',
              sourceEntityId: installment.installmentId,
              recipientUserId: userId,
              recipientRoleId: config.roleId,
              category: 'loan_installment_due',
              templateKey: 'cfd.loan_installment_due',
              templateVars: {
                installmentDate: installment.installmentDate,
                amount: installment.amount,
                bankLoanId: installment.bankLoanId,
              },
              payload: {
                installmentId: installment.installmentId,
                bankLoanId: installment.bankLoanId,
                corporateId: installment.corporateId,
                dueDate: installment.installmentDate,
                amount: installment.amount,
              },
              severity: 'high',
            });
            sent++;
          } catch (err: any) {
            // Unique constraint violation = duplicate → skip silently
            const isDuplicate =
              typeof err?.message === 'string' &&
              (err.message.includes('uq_notifications_source_recipient_template') ||
                err.message.includes('unique constraint') ||
                err.code === '23505');

            if (isDuplicate) {
              skipped++;
            } else {
              console.error(`[NotificationCron] ERROR sending to user ${userId}:`, err);
              errors++;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[NotificationCron] ERROR during cron execution:', err);
    errors++;
  }

  console.log(`[NotificationCron] Done: sent=${sent}, skipped=${skipped}, errors=${errors}`);
  return { sent, skipped, errors };
}
