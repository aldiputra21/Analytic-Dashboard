// Scheduled Report Service
// Requirements: 10.5, 10.6

import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';
import { generateConsolidatedReport } from './reportGenerator';
import { exportToExcel, exportToPDF } from './exportService';
import { PeriodType } from '../../types/financial/financialData';

export interface ScheduledReport {
  id: string;
  name: string;
  reportType: 'consolidated' | 'individual' | 'benchmark';
  subsidiaryIds: string[];
  periodType: PeriodType;
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
  subsidiaryIds: string[];
  periodType: PeriodType;
  format: 'pdf' | 'excel';
  scheduleFrequency: 'monthly' | 'quarterly' | 'annual';
  scheduleDay: number;
  recipients: string[];
}

function generateId(): string {
  return `sr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function mapRowToScheduledReport(row: any): ScheduledReport {
  return {
    id: row.id,
    name: row.name,
    reportType: row.report_type,
    subsidiaryIds: JSON.parse(row.subsidiary_ids),
    periodType: row.period_type,
    format: row.format,
    scheduleFrequency: row.schedule_frequency,
    scheduleDay: row.schedule_day,
    recipients: JSON.parse(row.recipients),
    isActive: Boolean(row.is_active),
    lastRun: row.last_run ? new Date(row.last_run) : undefined,
    nextRun: new Date(row.next_run),
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
  };
}

/**
 * Calculates the next run date based on frequency and day.
 */
export function calculateNextRun(
  frequency: 'monthly' | 'quarterly' | 'annual',
  scheduleDay: number,
  from: Date = new Date()
): Date {
  const next = new Date(from);
  const day = Math.min(scheduleDay, 28); // Cap at 28 to avoid month-end issues

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

  next.setHours(8, 0, 0, 0); // Run at 8 AM
  return next;
}

/**
 * Creates a scheduled report.
 * Requirements: 10.5
 */
export function createScheduledReport(
  db: Database.Database,
  input: CreateScheduledReportInput,
  createdBy: string
): { report?: ScheduledReport; error?: string } {
  if (input.scheduleDay < 1 || input.scheduleDay > 31) {
    return { error: 'scheduleDay must be between 1 and 31' };
  }
  if (input.recipients.length === 0) {
    return { error: 'At least one recipient is required' };
  }

  const id = generateId();
  const nextRun = calculateNextRun(input.scheduleFrequency, input.scheduleDay);

  db.prepare(`
    INSERT INTO frs_scheduled_reports
      (id, name, report_type, subsidiary_ids, period_type, format,
       schedule_frequency, schedule_day, recipients, is_active, next_run, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, ?)
  `).run(
    id,
    input.name,
    input.reportType,
    JSON.stringify(input.subsidiaryIds),
    input.periodType,
    input.format,
    input.scheduleFrequency,
    input.scheduleDay,
    JSON.stringify(input.recipients),
    nextRun.toISOString(),
    createdBy,
  );

  const row = db.prepare('SELECT * FROM frs_scheduled_reports WHERE id = ?').get(id) as any;
  return { report: mapRowToScheduledReport(row) };
}

/**
 * Lists all scheduled reports.
 * Requirements: 10.5
 */
export function listScheduledReports(db: Database.Database): ScheduledReport[] {
  const rows = db
    .prepare('SELECT * FROM frs_scheduled_reports ORDER BY created_at DESC')
    .all() as any[];
  return rows.map(mapRowToScheduledReport);
}

/**
 * Deletes a scheduled report.
 * Requirements: 10.5
 */
export function deleteScheduledReport(
  db: Database.Database,
  id: string
): { success: boolean; error?: string } {
  const existing = db.prepare('SELECT id FROM frs_scheduled_reports WHERE id = ?').get(id);
  if (!existing) return { success: false, error: 'Scheduled report not found' };

  db.prepare('DELETE FROM frs_scheduled_reports WHERE id = ?').run(id);
  return { success: true };
}

/**
 * Gets scheduled reports that are due to run.
 */
export function getDueScheduledReports(db: Database.Database): ScheduledReport[] {
  const now = new Date().toISOString();
  const rows = db
    .prepare('SELECT * FROM frs_scheduled_reports WHERE is_active = 1 AND next_run <= ?')
    .all(now) as any[];
  return rows.map(mapRowToScheduledReport);
}

/**
 * Sends a report via email using SMTP.
 * Requirements: 10.6
 */
async function sendReportEmail(
  recipients: string[],
  reportName: string,
  format: 'pdf' | 'excel',
  buffer: Buffer
): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.warn('[ScheduledReport] SMTP not configured, skipping email delivery');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPassword },
  });

  const ext = format === 'pdf' ? 'pdf' : 'xlsx';
  const mimeType = format === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  await transporter.sendMail({
    from: smtpUser,
    to: recipients.join(', '),
    subject: `Scheduled Report: ${reportName} - ${new Date().toLocaleDateString()}`,
    text: `Please find attached the scheduled financial report: ${reportName}.\n\nGenerated on: ${new Date().toISOString()}`,
    attachments: [
      {
        filename: `${reportName.replace(/\s+/g, '-')}-${Date.now()}.${ext}`,
        content: buffer,
        contentType: mimeType,
      },
    ],
  });
}

/**
 * Executes a scheduled report: generates and emails it.
 * Requirements: 10.5, 10.6
 */
export async function executeScheduledReport(
  db: Database.Database,
  report: ScheduledReport
): Promise<{ success: boolean; error?: string }> {
  try {
    // Determine period dates based on frequency
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (report.scheduleFrequency === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (report.scheduleFrequency === 'quarterly') {
      const q = Math.floor(now.getMonth() / 3);
      periodStart = new Date(now.getFullYear(), (q - 1) * 3, 1);
      periodEnd = new Date(now.getFullYear(), q * 3, 0);
    } else {
      periodStart = new Date(now.getFullYear() - 1, 0, 1);
      periodEnd = new Date(now.getFullYear() - 1, 11, 31);
    }

    const startStr = periodStart.toISOString().split('T')[0];
    const endStr = periodEnd.toISOString().split('T')[0];

    const consolidatedReport = generateConsolidatedReport(db, report.periodType, startStr, endStr);

    // Build rows for export
    const rows = consolidatedReport.contributions.map((c) => ({
      subsidiary_name: c.subsidiaryName,
      period_type: report.periodType,
      period_start_date: startStr,
      period_end_date: endStr,
      revenue: c.revenue,
      net_profit: c.netProfit,
      revenue_contribution: c.revenueContribution,
      profit_contribution: c.profitContribution,
    }));

    const metadata = {
      exportDate: new Date().toISOString(),
      periodRange: `${startStr} to ${endStr}`,
      exportedBy: 'Scheduled Report System',
    };

    let buffer: Buffer;
    if (report.format === 'pdf') {
      buffer = await exportToPDF(rows, metadata);
    } else {
      buffer = exportToExcel(rows, metadata);
    }

    await sendReportEmail(report.recipients, report.name, report.format, buffer);

    // Update last_run and next_run
    const nextRun = calculateNextRun(report.scheduleFrequency, report.scheduleDay);
    db.prepare(`
      UPDATE frs_scheduled_reports SET last_run = ?, next_run = ? WHERE id = ?
    `).run(new Date().toISOString(), nextRun.toISOString(), report.id);

    // Log to audit log
    db.prepare(`
      INSERT INTO frs_audit_log (id, user_id, action, entity_type, entity_id, new_values, created_at)
      VALUES (?, 'system', 'export', 'scheduled_report', ?, ?, CURRENT_TIMESTAMP)
    `).run(
      `al_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      report.id,
      JSON.stringify({ reportName: report.name, recipients: report.recipients, format: report.format }),
    );

    return { success: true };
  } catch (err: any) {
    console.error('[ScheduledReport] Execution failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Scheduler: checks for due reports and executes them.
 * Call this on a cron interval (e.g., every hour).
 * Requirements: 10.5, 10.6
 */
export async function runScheduler(db: Database.Database): Promise<void> {
  const dueReports = getDueScheduledReports(db);
  for (const report of dueReports) {
    await executeScheduledReport(db, report);
  }
}
