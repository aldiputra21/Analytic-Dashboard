// Scheduled Report Service
// PostgreSQL implementation — stub: no frs_scheduled_reports table in new schema.
// TODO: Add scheduled_reports table to schema if this feature is needed.

export interface ScheduledReport {
  id: string;
  name: string;
  reportType: 'consolidated' | 'individual' | 'benchmark';
  corporateIds: string[];
  format: 'pdf' | 'excel';
  scheduleFrequency: 'monthly' | 'quarterly' | 'annual';
  scheduleDay: number;
  recipients: string[];
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
  createdBy: string;
}

export interface CreateScheduledReportInput {
  name: string;
  reportType: 'consolidated' | 'individual' | 'benchmark';
  corporateIds: string[];
  periodType: string;
  format: 'pdf' | 'excel';
  scheduleFrequency: 'monthly' | 'quarterly' | 'annual';
  scheduleDay: number;
  recipients: string[];
}

/**
 * Calculates the next run date based on frequency and day.
 */
export function calculateNextRun(
  frequency: 'monthly' | 'quarterly' | 'annual',
  scheduleDay: number,
  from: Date = new Date(),
): Date {
  const next = new Date(from);
  const day = Math.min(scheduleDay, 28);

  if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
    next.setDate(day);
  } else if (frequency === 'quarterly') {
    next.setMonth(next.getMonth() + 3);
    next.setDate(day);
  } else {
    next.setFullYear(next.getFullYear() + 1);
    next.setDate(day);
  }

  next.setHours(8, 0, 0, 0);
  return next;
}

// ── Stub functions — feature disabled until scheduled_reports table is added ──

export async function createScheduledReport(
  _input: CreateScheduledReportInput,
  _createdBy: string,
): Promise<{ report?: ScheduledReport; error?: string }> {
  return { error: 'Scheduled reports feature is not yet available in the PostgreSQL version.' };
}

export async function listScheduledReports(): Promise<ScheduledReport[]> {
  return [];
}

export async function deleteScheduledReport(
  _id: string,
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Scheduled reports feature is not yet available.' };
}

export async function getDueScheduledReports(): Promise<ScheduledReport[]> {
  return [];
}

export async function executeScheduledReport(
  _report: ScheduledReport,
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Scheduled reports feature is not yet available.' };
}

export async function runScheduler(): Promise<void> {
  // No-op until scheduled_reports table is added
}
