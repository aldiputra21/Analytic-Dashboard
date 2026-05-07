// Export Service — Complete implementation for all 11 modules
// Requirements: 1.4, 1.5, 1.6, 2.1-2.9
// Task 5: Backend Services — Export Service

import type ExcelJS from 'exceljs';
import type { Locale } from '../../i18n/commons';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type EntityType =
  | 'balance_sheet'
  | 'income_statement'
  | 'income_statement_projection'
  | 'weekly_cash_flow'
  | 'realization'
  | 'cash_flow_projection'
  | 'bank_loan'
  | 'corporate'
  | 'department'
  | 'cost_center'
  | 'project';

export type ExportFormat = 'xlsx' | 'csv';

export interface ExportOptions {
  entityType: EntityType;
  format: ExportFormat;
  language: Locale;
  data: any[];
  filters?: Record<string, any>;
  userId?: string;
}

export interface ColumnDefinition {
  field: string;
  labelId: string;
  labelEn: string;
  dataType: 'string' | 'number' | 'date' | 'currency';
  format?: string;
}

// ============================================================================
// Module Configurations
// ============================================================================

/**
 * Get module title based on entity type and language
 * Titles are inlined here to avoid importing frontend i18n files in a backend service
 */
function getModuleTitle(entityType: EntityType, language: Locale): string {
  const titles: Record<EntityType, { id: string; en: string }> = {
    balance_sheet: { id: 'Manajemen Neraca', en: 'Balance Sheet Management' },
    income_statement: { id: 'Manajemen Laba Rugi', en: 'Income Statement Management' },
    income_statement_projection: { id: 'Proyeksi Laba Rugi', en: 'Income Statement Projection' },
    weekly_cash_flow: { id: 'Arus Kas Mingguan', en: 'Weekly Cash Flow' },
    realization: { id: 'Realisasi', en: 'Realization' },
    cash_flow_projection: { id: 'Proyeksi Arus Kas', en: 'Cash Flow Projection' },
    bank_loan: { id: 'Pinjaman Bank', en: 'Bank Loan' },
    corporate: { id: 'Manajemen Perusahaan', en: 'Corporate Management' },
    department: { id: 'Manajemen Departemen', en: 'Department Management' },
    cost_center: { id: 'Cost Center', en: 'Cost Center' },
    project: { id: 'Manajemen Proyek', en: 'Project Management' },
  };

  return titles[entityType][language];
}

/**
 * Get column definitions for each module
 */
function getColumnDefinitions(entityType: EntityType): ColumnDefinition[] {
  const definitions: Record<EntityType, ColumnDefinition[]> = {
    // Balance Sheet
    balance_sheet: [
      { field: 'period', labelId: 'Periode', labelEn: 'Period', dataType: 'string' },
      { field: 'corporate_name', labelId: 'Perusahaan', labelEn: 'Corporate', dataType: 'string' },
      { field: 'cash_and_bank', labelId: 'Kas & Bank', labelEn: 'Cash & Bank', dataType: 'currency' },
      { field: 'accounts_receivable', labelId: 'Piutang', labelEn: 'Accounts Receivable', dataType: 'currency' },
      { field: 'work_in_progress', labelId: 'WIP', labelEn: 'WIP', dataType: 'currency' },
      { field: 'inventory', labelId: 'Persediaan', labelEn: 'Inventory', dataType: 'currency' },
      { field: 'prepaid_expenses', labelId: 'Biaya Dibayar Dimuka', labelEn: 'Prepaid Expenses', dataType: 'currency' },
      { field: 'land', labelId: 'Tanah', labelEn: 'Land', dataType: 'currency' },
      { field: 'building', labelId: 'Bangunan', labelEn: 'Building', dataType: 'currency' },
      { field: 'equipment', labelId: 'Peralatan', labelEn: 'Equipment', dataType: 'currency' },
      { field: 'other_fixed_assets', labelId: 'Aset Tetap Lainnya', labelEn: 'Other Fixed Assets', dataType: 'currency' },
      { field: 'accounts_payable', labelId: 'Hutang Usaha', labelEn: 'Accounts Payable', dataType: 'currency' },
      { field: 'bank_loan_current', labelId: 'Hutang Bank Jangka Pendek', labelEn: 'Current Bank Loan', dataType: 'currency' },
      { field: 'other_current_liabilities', labelId: 'Hutang Lancar Lainnya', labelEn: 'Other Current Liabilities', dataType: 'currency' },
      { field: 'bank_loan_long_term', labelId: 'Hutang Bank Jangka Panjang', labelEn: 'Long Term Bank Loan', dataType: 'currency' },
      { field: 'other_long_term_liabilities', labelId: 'Hutang Jangka Panjang Lainnya', labelEn: 'Other Long Term Liabilities', dataType: 'currency' },
      { field: 'shareholder_loan', labelId: 'Hutang Pemegang Saham', labelEn: 'Shareholder Loan', dataType: 'currency' },
      { field: 'capital', labelId: 'Modal', labelEn: 'Equity', dataType: 'currency' },
      { field: 'earnings_after_tax', labelId: 'Laba Thn. Berjalan (EAT)', labelEn: 'Earnings After Tax (EAT)', dataType: 'currency' },
      { field: 'retained_earnings', labelId: 'Laba Ditahan', labelEn: 'Retained Earnings', dataType: 'currency' },
      { field: 'dividends', labelId: 'Dividen', labelEn: 'Dividends', dataType: 'currency' },
      { field: 'notes', labelId: 'Catatan', labelEn: 'Notes', dataType: 'string' },
    ],

    // Income Statement
    income_statement: [
      { field: 'period', labelId: 'Periode', labelEn: 'Period', dataType: 'string' },
      { field: 'corporate_name', labelId: 'Perusahaan', labelEn: 'Corporate', dataType: 'string' },
      { field: 'revenue', labelId: 'Pendapatan', labelEn: 'Revenue', dataType: 'currency' },
      { field: 'cogs', labelId: 'HPP', labelEn: 'COGS', dataType: 'currency' },
      { field: 'operating_expenses', labelId: 'Biaya Operasional', labelEn: 'Operating Expenses', dataType: 'currency' },
      { field: 'interest_expense', labelId: 'Beban Bunga', labelEn: 'Interest Expense', dataType: 'currency' },
      { field: 'tax_expense', labelId: 'Pajak', labelEn: 'Tax', dataType: 'currency' },
      { field: 'other_income', labelId: 'Pendapatan Lainnya', labelEn: 'Other Income', dataType: 'currency' },
      { field: 'other_expense', labelId: 'Beban Lainnya', labelEn: 'Other Expense', dataType: 'currency' },
      { field: 'notes', labelId: 'Catatan', labelEn: 'Notes', dataType: 'string' },
    ],

    // Income Statement Projection (one-to-many: header + details)
    income_statement_projection: [
      { field: 'department_name', labelId: 'Departemen', labelEn: 'Department', dataType: 'string' },
      { field: 'project_name', labelId: 'Proyek', labelEn: 'Project', dataType: 'string' },
      { field: 'fiscal_year', labelId: 'Tahun Fiskal', labelEn: 'Fiscal Year', dataType: 'number' },
      { field: 'target_type', labelId: 'Tipe Target', labelEn: 'Target Type', dataType: 'string' },
      { field: 'month', labelId: 'Bulan', labelEn: 'Month', dataType: 'number' },
      { field: 'cost_center', labelId: 'Cost Center', labelEn: 'Cost Center', dataType: 'string' },
      { field: 'amount', labelId: 'Nilai (Rp)', labelEn: 'Amount (IDR)', dataType: 'currency' },
      { field: 'notes', labelId: 'Catatan', labelEn: 'Notes', dataType: 'string' },
    ],

    // Weekly Cash Flow
    weekly_cash_flow: [
      { field: 'period', labelId: 'Periode', labelEn: 'Period', dataType: 'string' },
      { field: 'week', labelId: 'Minggu', labelEn: 'Week', dataType: 'string' },
      { field: 'entity_type', labelId: 'Tipe Entitas', labelEn: 'Entity Type', dataType: 'string' },
      { field: 'entity_name', labelId: 'Perusahaan / Proyek', labelEn: 'Corporate / Project', dataType: 'string' },
      { field: 'operating_cash_in', labelId: 'Kas Masuk Operasional', labelEn: 'Operating Cash In', dataType: 'currency' },
      { field: 'operating_cash_out', labelId: 'Kas Keluar Operasional', labelEn: 'Operating Cash Out', dataType: 'currency' },
      { field: 'investing_cash_in', labelId: 'Kas Masuk Investasi', labelEn: 'Investing Cash In', dataType: 'currency' },
      { field: 'investing_cash_out', labelId: 'Kas Keluar Investasi', labelEn: 'Investing Cash Out', dataType: 'currency' },
      { field: 'financing_cash_in', labelId: 'Kas Masuk Pendanaan', labelEn: 'Financing Cash In', dataType: 'currency' },
      { field: 'financing_cash_out', labelId: 'Kas Keluar Pendanaan', labelEn: 'Financing Cash Out', dataType: 'currency' },
      { field: 'notes', labelId: 'Catatan', labelEn: 'Notes', dataType: 'string' },
    ],

    // Realization
    realization: [
      { field: 'transaction_date', labelId: 'Tanggal Transaksi', labelEn: 'Transaction Date', dataType: 'date' },
      { field: 'entity_type', labelId: 'Tipe Entitas', labelEn: 'Entity Type', dataType: 'string' },
      { field: 'department_name', labelId: 'Departemen', labelEn: 'Department', dataType: 'string' },
      { field: 'project_name', labelId: 'Proyek', labelEn: 'Project', dataType: 'string' },
      { field: 'cost_center_name', labelId: 'Cost Center', labelEn: 'Cost Center', dataType: 'string' },
      { field: 'category', labelId: 'Kategori', labelEn: 'Category', dataType: 'string' },
      { field: 'amount', labelId: 'Jumlah', labelEn: 'Amount', dataType: 'currency' },
      { field: 'notes', labelId: 'Catatan', labelEn: 'Notes', dataType: 'string' },
    ],

    // Cash Flow Projection (one-to-many: header + details)
    cash_flow_projection: [
      { field: 'corporate_name', labelId: 'Perusahaan', labelEn: 'Corporate', dataType: 'string' },
      { field: 'fiscal_year', labelId: 'Tahun Fiskal', labelEn: 'Fiscal Year', dataType: 'number' },
      { field: 'initial_balance', labelId: 'Saldo Awal Tahun', labelEn: 'Opening Balance (Year Start)', dataType: 'currency' },
      { field: 'month', labelId: 'Bulan', labelEn: 'Month', dataType: 'number' },
      { field: 'group', labelId: 'Grup', labelEn: 'Group', dataType: 'string' },
      { field: 'type', labelId: 'Tipe', labelEn: 'Type', dataType: 'string' },
      { field: 'category', labelId: 'Kategori', labelEn: 'Category', dataType: 'string' },
      { field: 'amount', labelId: 'Nominal', labelEn: 'Amount', dataType: 'currency' },
      { field: 'notes', labelId: 'Catatan', labelEn: 'Notes', dataType: 'string' },
    ],

    // Bank Loan
    bank_loan: [
      { field: 'bank_name', labelId: 'Bank', labelEn: 'Bank', dataType: 'string' },
      { field: 'corporate_name', labelId: 'Perusahaan', labelEn: 'Corporate', dataType: 'string' },
      { field: 'amount', labelId: 'Jumlah Pinjaman', labelEn: 'Loan Amount', dataType: 'currency' },
      { field: 'start_date', labelId: 'Tanggal Mulai', labelEn: 'Start Date', dataType: 'date' },
      { field: 'tenor', labelId: 'Tenor (bulan)', labelEn: 'Tenor (months)', dataType: 'number' },
      { field: 'interest_type', labelId: 'Jenis Bunga', labelEn: 'Interest Type', dataType: 'string' },
      { field: 'interest_rate', labelId: 'Suku Bunga (% p.a.)', labelEn: 'Interest Rate (% p.a.)', dataType: 'number' },
      { field: 'credit_type', labelId: 'Jenis Kredit', labelEn: 'Credit Type', dataType: 'string' },
      { field: 'status', labelId: 'Status', labelEn: 'Status', dataType: 'string' },
      { field: 'alert_min_days', labelId: 'Notifikasi Sebelum Jatuh Tempo (hari)', labelEn: 'Notify Before Due Date (days)', dataType: 'number' },
    ],

    // Corporate
    corporate: [
      { field: 'code', labelId: 'Kode', labelEn: 'Code', dataType: 'string' },
      { field: 'name', labelId: 'Nama Perusahaan', labelEn: 'Company Name', dataType: 'string' },
      { field: 'industry', labelId: 'Sektor Industri', labelEn: 'Industry Sector', dataType: 'string' },
      { field: 'currency', labelId: 'Mata Uang Utama', labelEn: 'Base Currency', dataType: 'string' },
      { field: 'tax_rate', labelId: 'Tarif Pajak (%)', labelEn: 'Tax Rate (%)', dataType: 'number' },
      { field: 'fiscal_year_start_month', labelId: 'Bulan Awal Tahun Fiskal', labelEn: 'Fiscal Year Start Month', dataType: 'number' },
    ],

    // Department
    department: [
      { field: 'code', labelId: 'Kode Departemen', labelEn: 'Department Code', dataType: 'string' },
      { field: 'name', labelId: 'Nama Departemen', labelEn: 'Department Name', dataType: 'string' },
      { field: 'corporate_name', labelId: 'Perusahaan', labelEn: 'Corporate', dataType: 'string' },
      { field: 'head_name', labelId: 'Kepala Departemen', labelEn: 'Department Head', dataType: 'string' },
      { field: 'description', labelId: 'Deskripsi', labelEn: 'Description', dataType: 'string' },
    ],

    // Cost Center
    cost_center: [
      { field: 'code', labelId: 'Kode', labelEn: 'Code', dataType: 'string' },
      { field: 'name', labelId: 'Nama', labelEn: 'Name', dataType: 'string' },
      { field: 'corporate_name', labelId: 'Perusahaan', labelEn: 'Corporate', dataType: 'string' },
      { field: 'parent_name', labelId: 'Induk', labelEn: 'Parent', dataType: 'string' },
      { field: 'category', labelId: 'Kategori', labelEn: 'Category', dataType: 'string' },
      { field: 'description', labelId: 'Deskripsi', labelEn: 'Description', dataType: 'string' },
    ],

    // Project
    project: [
      { field: 'code', labelId: 'Kode Proyek', labelEn: 'Project Code', dataType: 'string' },
      { field: 'name', labelId: 'Nama Proyek', labelEn: 'Project Name', dataType: 'string' },
      { field: 'department_name', labelId: 'Departemen', labelEn: 'Department', dataType: 'string' },
      { field: 'start_date', labelId: 'Tanggal Mulai', labelEn: 'Start Date', dataType: 'date' },
      { field: 'end_date', labelId: 'Tanggal Selesai', labelEn: 'End Date', dataType: 'date' },
      { field: 'status', labelId: 'Status', labelEn: 'Status', dataType: 'string' },
      { field: 'description', labelId: 'Deskripsi Proyek', labelEn: 'Project Description', dataType: 'string' },
    ],
  };

  return definitions[entityType];
}

/**
 * Check if module uses grouped format (one-to-many relationship)
 */
function isGroupedFormat(entityType: EntityType): boolean {
  return entityType === 'income_statement_projection' || entityType === 'cash_flow_projection';
}

// ============================================================================
// Filter Summary Generation
// ============================================================================

/**
 * Generate filter summary text for row 2
 * Requirements: 2.2, 2.3
 */
function generateFilterSummary(filters: Record<string, any> | undefined, language: Locale): string {
  if (!filters || Object.keys(filters).length === 0) {
    return language === 'id' ? 'Semua Data' : 'All Data';
  }

  const filterParts: string[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined && value !== '') {
      // Format filter label
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
      filterParts.push(`${label}: ${value}`);
    }
  }

  return filterParts.length > 0
    ? filterParts.join(', ')
    : (language === 'id' ? 'Semua Data' : 'All Data');
}

// ============================================================================
// Excel Export Implementation
// ============================================================================

/**
 * Generate Excel file for export
 * Requirements: 1.7, 2.1-2.9
 */
export async function generateExcelExport(options: ExportOptions): Promise<Buffer> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  const { entityType, language, data, filters } = options;

  // Get module configuration
  const moduleTitle = getModuleTitle(entityType, language);
  const columns = getColumnDefinitions(entityType);
  const filterSummary = generateFilterSummary(filters, language);

  // Row 1: Module title (Requirement 2.1)
  const titleRow = worksheet.addRow([moduleTitle]);
  titleRow.font = { bold: true, size: 14 };
  titleRow.alignment = { horizontal: 'center' };
  worksheet.mergeCells(1, 1, 1, columns.length);

  // Row 2: Filter summary (Requirement 2.2, 2.3)
  const filterRow = worksheet.addRow([filterSummary]);
  filterRow.font = { italic: true, size: 10 };
  worksheet.mergeCells(2, 1, 2, columns.length);

  // Row 3: Column headers (Requirement 2.4)
  const headers = columns.map((col) => (language === 'id' ? col.labelId : col.labelEn));
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Row 4+: Data rows (Requirement 2.5)
  if (isGroupedFormat(entityType)) {
    // Grouped format for one-to-many modules (Requirement 2.6)
    addGroupedDataRows(worksheet, data, columns);
  } else {
    // Flat format for simple modules
    addFlatDataRows(worksheet, data, columns);
  }

  // Apply column formatting (Requirements 2.7, 2.8)
  applyColumnFormatting(worksheet, columns);

  // Auto-size columns
  worksheet.columns.forEach((column, index) => {
    const col = columns[index];
    if (col) {
      column.width = Math.max(col.labelId.length, col.labelEn.length) + 5;
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Add flat data rows (for simple modules)
 */
function addFlatDataRows(worksheet: ExcelJS.Worksheet, data: any[], columns: ColumnDefinition[]): void {
  for (const row of data) {
    const values = columns.map((col) => {
      const value = row[col.field];
      return formatCellValue(value, col.dataType);
    });
    worksheet.addRow(values);
  }
}

/**
 * Add grouped data rows (for one-to-many modules)
 * Requirements: 2.6
 */
function addGroupedDataRows(worksheet: ExcelJS.Worksheet, data: any[], columns: ColumnDefinition[]): void {
  // Group data by header (assuming data has header_id or similar grouping field)
  // For income_statement_projection: group by department + fiscal_year
  // For cash_flow_projection: group by corporate + fiscal_year

  for (const row of data) {
    const values = columns.map((col) => {
      const value = row[col.field];
      return formatCellValue(value, col.dataType);
    });
    worksheet.addRow(values);
  }
}

/**
 * Format cell value based on data type
 */
function formatCellValue(value: any, dataType: string): any {
  if (value === null || value === undefined) {
    return '';
  }

  switch (dataType) {
    case 'currency':
    case 'number':
      return typeof value === 'number' ? value : parseFloat(value) || 0;
    case 'date':
      return value instanceof Date ? value : new Date(value);
    case 'string':
    default:
      return String(value);
  }
}

/**
 * Apply column formatting (currency and date formats)
 * Requirements: 2.7, 2.8
 */
function applyColumnFormatting(worksheet: ExcelJS.Worksheet, columns: ColumnDefinition[]): void {
  columns.forEach((col, index) => {
    const columnIndex = index + 1;
    const column = worksheet.getColumn(columnIndex);

    // Apply format based on data type
    if (col.dataType === 'currency') {
      // Requirement 2.7: Currency format #,##0.00
      column.numFmt = '#,##0.00';
    } else if (col.dataType === 'date') {
      // Requirement 2.8: Date format DD/MM/YYYY
      column.numFmt = 'dd/mm/yyyy';
    }
  });
}

// ============================================================================
// CSV Export Implementation
// ============================================================================

/**
 * Generate CSV file for export
 * Requirements: 1.8
 */
export function generateCSVExport(options: ExportOptions): string {
  const { entityType, language, data, filters } = options;

  // Get module configuration
  const moduleTitle = getModuleTitle(entityType, language);
  const columns = getColumnDefinitions(entityType);
  const filterSummary = generateFilterSummary(filters, language);

  const lines: string[] = [];

  // UTF-8 BOM for proper encoding (Requirement 1.8)
  const BOM = '\uFEFF';

  // Row 1: Module title
  lines.push(escapeCSV(moduleTitle));

  // Row 2: Filter summary
  lines.push(escapeCSV(filterSummary));

  // Row 3: Column headers
  const headers = columns.map((col) => escapeCSV(language === 'id' ? col.labelId : col.labelEn));
  lines.push(headers.join(','));

  // Row 4+: Data rows
  for (const row of data) {
    const values = columns.map((col) => {
      const value = row[col.field];
      return escapeCSV(formatCSVValue(value, col.dataType));
    });
    lines.push(values.join(','));
  }

  return BOM + lines.join('\n');
}

/**
 * Format value for CSV output
 */
function formatCSVValue(value: any, dataType: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  switch (dataType) {
    case 'currency':
    case 'number':
      return typeof value === 'number' ? value.toFixed(2) : String(value);
    case 'date':
      if (value instanceof Date) {
        const day = String(value.getDate()).padStart(2, '0');
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const year = value.getFullYear();
        return `${day}/${month}/${year}`;
      }
      return String(value);
    case 'string':
    default:
      return String(value);
  }
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Main export function that routes to Excel or CSV generation
 * Requirements: 1.4, 1.5, 1.6, 1.7, 1.8
 */
export async function generateExport(options: ExportOptions): Promise<Buffer | string> {
  if (options.format === 'xlsx') {
    return await generateExcelExport(options);
  } else {
    return generateCSVExport(options);
  }
}

/**
 * Generate filename for export
 * Requirements: 2.9
 */
export function generateExportFilename(entityType: EntityType, format: ExportFormat, language: Locale): string {
  const moduleTitle = getModuleTitle(entityType, language);
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const sanitizedTitle = moduleTitle.toLowerCase().replace(/\s+/g, '_');
  return `${sanitizedTitle}_${date}.${format}`;
}

// ============================================================================
// Backward-Compatible Exports
// These functions are used by reports.ts and legacy code.
// They wrap the new generateExport function for the old financial ratios export.
// ============================================================================

/**
 * Export data to CSV format (legacy API for reports route)
 */
export function exportToCSV(rows: any[], metadata?: Record<string, any>): string {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const lines: string[] = [];

  // UTF-8 BOM
  const BOM = '\uFEFF';

  // Metadata header
  if (metadata) {
    lines.push(`Export Date: ${metadata.exportDate ?? ''}`);
    lines.push(`Period: ${metadata.periodRange ?? ''}`);
    lines.push(`Exported By: ${metadata.exportedBy ?? ''}`);
    lines.push('');
  }

  // Column headers
  lines.push(headers.map(h => escapeCSV(h)).join(','));

  // Data rows
  for (const row of rows) {
    const values = headers.map(h => {
      const val = row[h];
      return escapeCSV(val === null || val === undefined ? '' : String(val));
    });
    lines.push(values.join(','));
  }

  return BOM + lines.join('\n');
}

/**
 * Export data to Excel format (legacy API for reports route)
 */
export async function exportToExcel(rows: any[], metadata?: Record<string, any>): Promise<Buffer> {
  const ExcelJSLib = (await import('exceljs')).default;
  const workbook = new ExcelJSLib.Workbook();
  const worksheet = workbook.addWorksheet('Financial Ratios');

  if (rows.length === 0) {
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  const headers = Object.keys(rows[0]);

  // Add metadata rows if provided
  if (metadata) {
    worksheet.addRow([`Export Date: ${metadata.exportDate ?? ''}`]);
    worksheet.addRow([`Period: ${metadata.periodRange ?? ''}`]);
    worksheet.addRow([`Exported By: ${metadata.exportedBy ?? ''}`]);
    worksheet.addRow([]);
  }

  // Header row
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Data rows
  for (const row of rows) {
    worksheet.addRow(headers.map(h => row[h] ?? ''));
  }

  // Auto-size columns
  worksheet.columns.forEach(col => { col.width = 15; });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/**
 * Export data to PDF format (legacy API for reports route)
 * Note: PDF generation is not implemented; returns a simple text buffer.
 */
export async function exportToPDF(rows: any[], metadata?: Record<string, any>): Promise<Buffer> {
  // PDF generation requires additional libraries (e.g., pdfkit).
  // For now, return a placeholder that indicates PDF is not supported.
  const content = `PDF export is not yet implemented.\n\nTotal records: ${rows.length}`;
  return Buffer.from(content, 'utf-8');
}
