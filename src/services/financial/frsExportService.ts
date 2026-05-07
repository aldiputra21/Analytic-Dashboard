// src/services/financial/frsExportService.ts

import ExcelJS from 'exceljs';
import { db } from '../../db/connection';
import { eq, and, SQL, gte, lte, inArray } from 'drizzle-orm';
import {
  balanceSheets,
  incomeStatements,
  weeklyCashFlows,
  cashRealizations,
  bankLoans,
  cashFlowProjectionHeaders,
  cashFlowProjectionDetails,
  costCenters,
  targetHeaders,
  targetDetails,
} from '../../db/schema/cfd.js';
import {
  corporates,
  departments,
  projects,
} from '../../db/schema/public.js';

/**
 * Entity type mapping to table and module names
 */
const ENTITY_CONFIG = {
  balance_sheet: {
    table: balanceSheets,
    moduleNameId: 'Neraca',
    moduleNameEn: 'Balance Sheet',
  },
  income_statement: {
    table: incomeStatements,
    moduleNameId: 'Laba Rugi',
    moduleNameEn: 'Income Statement',
  },
  target: {
    table: targetHeaders,
    moduleNameId: 'Proyeksi Laba Rugi',
    moduleNameEn: 'Income Statement Projection',
    isOneToMany: true,
  },
  weekly_cash_flow: {
    table: weeklyCashFlows,
    moduleNameId: 'Arus Kas Weekly',
    moduleNameEn: 'Weekly Cash Flow',
  },
  realization: {
    table: cashRealizations,
    moduleNameId: 'Realisasi',
    moduleNameEn: 'Realization',
  },
  cash_flow_projection: {
    table: cashFlowProjectionHeaders,
    moduleNameId: 'Proyeksi Arus Kas',
    moduleNameEn: 'Cash Flow Projection',
    isOneToMany: true,
  },
  bank_loan: {
    table: bankLoans,
    moduleNameId: 'Pinjaman Bank',
    moduleNameEn: 'Bank Loan',
  },
  corporate: {
    table: corporates,
    moduleNameId: 'Perusahaan',
    moduleNameEn: 'Corporate',
  },
  department: {
    table: departments,
    moduleNameId: 'Departemen',
    moduleNameEn: 'Department',
  },
  cost_center: {
    table: costCenters,
    moduleNameId: 'Cost Center',
    moduleNameEn: 'Cost Center',
  },
  project: {
    table: projects,
    moduleNameId: 'Proyek',
    moduleNameEn: 'Project',
  },
} as const;

type EntityType = keyof typeof ENTITY_CONFIG;

interface ExportOptions {
  entityType: EntityType;
  format: 'xlsx' | 'csv';
  language: 'id' | 'en';
  filters?: Record<string, any>;
  corporateIds?: string[]; // For RBAC filtering
}

interface ColumnDefinition {
  key: string;
  labelId: string;
  labelEn: string;
  type?: 'currency' | 'date' | 'text' | 'number';
}

/**
 * Get column definitions for each entity type
 */
function getColumnDefinitions(entityType: EntityType): ColumnDefinition[] {
  switch (entityType) {
    case 'balance_sheet':
      return [
        { key: 'period', labelId: 'Periode', labelEn: 'Period', type: 'text' },
        { key: 'corporateName', labelId: 'Perusahaan', labelEn: 'Corporate', type: 'text' },
        { key: 'cashAndBank', labelId: 'Kas dan Bank', labelEn: 'Cash and Bank', type: 'currency' },
        { key: 'accountsReceivable', labelId: 'Piutang', labelEn: 'Accounts Receivable', type: 'currency' },
        { key: 'workInProgress', labelId: 'Pekerjaan Dalam Proses', labelEn: 'Work in Progress', type: 'currency' },
        { key: 'inventory', labelId: 'Persediaan', labelEn: 'Inventory', type: 'currency' },
        { key: 'prepaidExpenses', labelId: 'Biaya Dibayar Dimuka', labelEn: 'Prepaid Expenses', type: 'currency' },
        { key: 'land', labelId: 'Tanah', labelEn: 'Land', type: 'currency' },
        { key: 'building', labelId: 'Bangunan', labelEn: 'Building', type: 'currency' },
        { key: 'equipment', labelId: 'Peralatan', labelEn: 'Equipment', type: 'currency' },
        { key: 'otherFixedAssets', labelId: 'Aktiva Tetap Lainnya', labelEn: 'Other Fixed Assets', type: 'currency' },
        { key: 'accountsPayable', labelId: 'Hutang Usaha', labelEn: 'Accounts Payable', type: 'currency' },
        { key: 'bankLoanCurrent', labelId: 'Pinjaman Bank Jangka Pendek', labelEn: 'Bank Loan Current', type: 'currency' },
        { key: 'otherCurrentLiabilities', labelId: 'Kewajiban Lancar Lainnya', labelEn: 'Other Current Liabilities', type: 'currency' },
        { key: 'bankLoanLongTerm', labelId: 'Pinjaman Bank Jangka Panjang', labelEn: 'Bank Loan Long Term', type: 'currency' },
        { key: 'otherLongTermLiabilities', labelId: 'Kewajiban Jangka Panjang Lainnya', labelEn: 'Other Long Term Liabilities', type: 'currency' },
        { key: 'shareholderLoan', labelId: 'Pinjaman Pemegang Saham', labelEn: 'Shareholder Loan', type: 'currency' },
        { key: 'capital', labelId: 'Modal', labelEn: 'Capital', type: 'currency' },
        { key: 'earningsAfterTax', labelId: 'Laba Setelah Pajak', labelEn: 'Earnings After Tax', type: 'currency' },
        { key: 'retainedEarnings', labelId: 'Laba Ditahan', labelEn: 'Retained Earnings', type: 'currency' },
        { key: 'dividends', labelId: 'Dividen', labelEn: 'Dividends', type: 'currency' },
        { key: 'notes', labelId: 'Catatan', labelEn: 'Notes', type: 'text' },
      ];

    case 'income_statement':
      return [
        { key: 'period', labelId: 'Periode', labelEn: 'Period', type: 'text' },
        { key: 'corporateName', labelId: 'Perusahaan', labelEn: 'Corporate', type: 'text' },
        { key: 'revenue', labelId: 'Pendapatan', labelEn: 'Revenue', type: 'currency' },
        { key: 'cogs', labelId: 'Harga Pokok Penjualan', labelEn: 'COGS', type: 'currency' },
        { key: 'operatingExpenses', labelId: 'Biaya Operasional', labelEn: 'Operating Expenses', type: 'currency' },
        { key: 'interestExpense', labelId: 'Biaya Bunga', labelEn: 'Interest Expense', type: 'currency' },
        { key: 'taxExpense', labelId: 'Biaya Pajak', labelEn: 'Tax Expense', type: 'currency' },
        { key: 'otherIncome', labelId: 'Pendapatan Lain', labelEn: 'Other Income', type: 'currency' },
        { key: 'otherExpense', labelId: 'Biaya Lain', labelEn: 'Other Expense', type: 'currency' },
        { key: 'notes', labelId: 'Catatan', labelEn: 'Notes', type: 'text' },
      ];

    case 'weekly_cash_flow':
      return [
        { key: 'period', labelId: 'Periode', labelEn: 'Period', type: 'text' },
        { key: 'week', labelId: 'Minggu', labelEn: 'Week', type: 'text' },
        { key: 'entityType', labelId: 'Tipe Entitas', labelEn: 'Entity Type', type: 'text' },
        { key: 'entityName', labelId: 'Nama Entitas', labelEn: 'Entity Name', type: 'text' },
        { key: 'operatingCashIn', labelId: 'Kas Masuk Operasional', labelEn: 'Operating Cash In', type: 'currency' },
        { key: 'operatingCashOut', labelId: 'Kas Keluar Operasional', labelEn: 'Operating Cash Out', type: 'currency' },
        { key: 'investingCashIn', labelId: 'Kas Masuk Investasi', labelEn: 'Investing Cash In', type: 'currency' },
        { key: 'investingCashOut', labelId: 'Kas Keluar Investasi', labelEn: 'Investing Cash Out', type: 'currency' },
        { key: 'financingCashIn', labelId: 'Kas Masuk Pendanaan', labelEn: 'Financing Cash In', type: 'currency' },
        { key: 'financingCashOut', labelId: 'Kas Keluar Pendanaan', labelEn: 'Financing Cash Out', type: 'currency' },
        { key: 'notes', labelId: 'Catatan', labelEn: 'Notes', type: 'text' },
      ];

    case 'realization':
      return [
        { key: 'transactionDate', labelId: 'Tanggal Transaksi', labelEn: 'Transaction Date', type: 'date' },
        { key: 'entityType', labelId: 'Tipe Entitas', labelEn: 'Entity Type', type: 'text' },
        { key: 'departmentName', labelId: 'Departemen', labelEn: 'Department', type: 'text' },
        { key: 'projectName', labelId: 'Proyek', labelEn: 'Project', type: 'text' },
        { key: 'costCenterName', labelId: 'Cost Center', labelEn: 'Cost Center', type: 'text' },
        { key: 'category', labelId: 'Kategori', labelEn: 'Category', type: 'text' },
        { key: 'amount', labelId: 'Jumlah', labelEn: 'Amount', type: 'currency' },
        { key: 'notes', labelId: 'Catatan', labelEn: 'Notes', type: 'text' },
      ];

    case 'bank_loan':
      return [
        { key: 'bankName', labelId: 'Bank', labelEn: 'Bank', type: 'text' },
        { key: 'corporateName', labelId: 'Perusahaan', labelEn: 'Corporate', type: 'text' },
        { key: 'amount', labelId: 'Jumlah', labelEn: 'Amount', type: 'currency' },
        { key: 'startDate', labelId: 'Tanggal Mulai', labelEn: 'Start Date', type: 'date' },
        { key: 'tenor', labelId: 'Tenor (Bulan)', labelEn: 'Tenor (Months)', type: 'number' },
        { key: 'interestType', labelId: 'Tipe Bunga', labelEn: 'Interest Type', type: 'text' },
        { key: 'interestRate', labelId: 'Suku Bunga', labelEn: 'Interest Rate', type: 'number' },
        { key: 'status', labelId: 'Status', labelEn: 'Status', type: 'text' },
        { key: 'creditType', labelId: 'Tipe Kredit', labelEn: 'Credit Type', type: 'text' },
        { key: 'alertMinDays', labelId: 'Alert Min Days', labelEn: 'Alert Min Days', type: 'number' },
      ];

    case 'corporate':
      return [
        { key: 'code', labelId: 'Kode', labelEn: 'Code', type: 'text' },
        { key: 'name', labelId: 'Nama', labelEn: 'Name', type: 'text' },
        { key: 'industry', labelId: 'Industri', labelEn: 'Industry', type: 'text' },
        { key: 'fiscalYearStartMonth', labelId: 'Bulan Awal Tahun Fiskal', labelEn: 'Fiscal Year Start Month', type: 'number' },
        { key: 'currency', labelId: 'Mata Uang', labelEn: 'Currency', type: 'text' },
        { key: 'taxRate', labelId: 'Tarif Pajak', labelEn: 'Tax Rate', type: 'number' },
        { key: 'isActive', labelId: 'Aktif', labelEn: 'Active', type: 'text' },
      ];

    case 'department':
      return [
        { key: 'code', labelId: 'Kode', labelEn: 'Code', type: 'text' },
        { key: 'name', labelId: 'Nama', labelEn: 'Name', type: 'text' },
        { key: 'corporateName', labelId: 'Perusahaan', labelEn: 'Corporate', type: 'text' },
        { key: 'headName', labelId: 'Kepala Departemen', labelEn: 'Department Head', type: 'text' },
        { key: 'description', labelId: 'Deskripsi', labelEn: 'Description', type: 'text' },
        { key: 'isActive', labelId: 'Aktif', labelEn: 'Active', type: 'text' },
      ];

    case 'cost_center':
      return [
        { key: 'code', labelId: 'Kode', labelEn: 'Code', type: 'text' },
        { key: 'name', labelId: 'Nama', labelEn: 'Name', type: 'text' },
        { key: 'corporateName', labelId: 'Perusahaan', labelEn: 'Corporate', type: 'text' },
        { key: 'category', labelId: 'Kategori', labelEn: 'Category', type: 'text' },
        { key: 'parentName', labelId: 'Parent', labelEn: 'Parent', type: 'text' },
        { key: 'description', labelId: 'Deskripsi', labelEn: 'Description', type: 'text' },
        { key: 'isActive', labelId: 'Aktif', labelEn: 'Active', type: 'text' },
      ];

    case 'project':
      return [
        { key: 'code', labelId: 'Kode', labelEn: 'Code', type: 'text' },
        { key: 'name', labelId: 'Nama', labelEn: 'Name', type: 'text' },
        { key: 'departmentName', labelId: 'Departemen', labelEn: 'Department', type: 'text' },
        { key: 'status', labelId: 'Status', labelEn: 'Status', type: 'text' },
        { key: 'startDate', labelId: 'Tanggal Mulai', labelEn: 'Start Date', type: 'date' },
        { key: 'endDate', labelId: 'Tanggal Selesai', labelEn: 'End Date', type: 'date' },
        { key: 'description', labelId: 'Deskripsi', labelEn: 'Description', type: 'text' },
        { key: 'isActive', labelId: 'Aktif', labelEn: 'Active', type: 'text' },
      ];

    case 'target': {
      return [
        { key: 'fiscalYear', labelId: 'Tahun Fiskal', labelEn: 'Fiscal Year', type: 'number' },
        { key: 'departmentName', labelId: 'Departemen', labelEn: 'Department', type: 'text' },
        { key: 'projectName', labelId: 'Proyek', labelEn: 'Project', type: 'text' },
        { key: 'month', labelId: 'Bulan', labelEn: 'Month', type: 'number' },
        { key: 'targetType', labelId: 'Tipe Target', labelEn: 'Target Type', type: 'text' },
        { key: 'costCenter', labelId: 'Cost Center', labelEn: 'Cost Center', type: 'text' },
        { key: 'amount', labelId: 'Jumlah', labelEn: 'Amount', type: 'currency' },
        { key: 'notes', labelId: 'Catatan', labelEn: 'Notes', type: 'text' },
      ];
    }

    case 'cash_flow_projection':
      return [
        { key: 'fiscalYear', labelId: 'Tahun Fiskal', labelEn: 'Fiscal Year', type: 'number' },
        { key: 'corporateName', labelId: 'Perusahaan', labelEn: 'Corporate', type: 'text' },
        { key: 'initialBalance', labelId: 'Saldo Awal', labelEn: 'Initial Balance', type: 'currency' },
        { key: 'month', labelId: 'Bulan', labelEn: 'Month', type: 'number' },
        { key: 'group', labelId: 'Grup', labelEn: 'Group', type: 'text' },
        { key: 'type', labelId: 'Tipe', labelEn: 'Type', type: 'text' },
        { key: 'category', labelId: 'Kategori', labelEn: 'Category', type: 'text' },
        { key: 'amount', labelId: 'Jumlah', labelEn: 'Amount', type: 'currency' },
        { key: 'detailNotes', labelId: 'Catatan Detail', labelEn: 'Detail Notes', type: 'text' },
      ];

    default:
      return [];
  }
}

/**
 * Build WHERE clause based on filters
 */
function buildWhereClause(entityType: EntityType, filters: Record<string, any>, corporateIds?: string[]): SQL | undefined {
  const conditions: SQL[] = [];

  // ── RBAC: corporate scope filter ─────────────────────────────────────────
  if (corporateIds && corporateIds.length > 0) {
    const table = ENTITY_CONFIG[entityType].table as any;
    if (entityType === 'corporate') {
      conditions.push(inArray(table.id, corporateIds) as unknown as SQL);
    } else if (table.corporateId) {
      conditions.push(inArray(table.corporateId, corporateIds) as unknown as SQL);
    }
  }

  // ── Corporate filter ──────────────────────────────────────────────────────
  // BalanceSheet/IncomeStatement/WeeklyCashFlow mengirim `corporate` (UUID)
  // Modul lain mengirim `corporateId`
  const corporateIdValue = filters.corporate || filters.corporateId || '';
  if (corporateIdValue && String(corporateIdValue).trim() !== '') {
    const table = ENTITY_CONFIG[entityType].table as any;
    if (entityType === 'corporate') {
      conditions.push(eq(table.id, corporateIdValue));
    } else if (table.corporateId) {
      conditions.push(eq(table.corporateId, corporateIdValue));
    }
  }

  // ── Period filter (balance_sheet, income_statement) ───────────────────────
  // Modul ini mengirim periodStart dan periodEnd (format YYYY-MM)
  if (['balance_sheet', 'income_statement', 'weekly_cash_flow'].includes(entityType)) {
    const table = ENTITY_CONFIG[entityType].table as any;
    if (table.period) {
      if (filters.periodStart && String(filters.periodStart).trim() !== '') {
        conditions.push(gte(table.period, filters.periodStart) as unknown as SQL);
      }
      if (filters.periodEnd && String(filters.periodEnd).trim() !== '') {
        conditions.push(lte(table.period, filters.periodEnd) as unknown as SQL);
      }
      if (filters.period && String(filters.period).trim() !== '') {
        conditions.push(eq(table.period, filters.period));
      }
    }
  }

  // ── Department filter ─────────────────────────────────────────────────────
  if (filters.departmentId && String(filters.departmentId).trim() !== '') {
    const table = ENTITY_CONFIG[entityType].table as any;
    if (table.departmentId) {
      conditions.push(eq(table.departmentId, filters.departmentId));
    }
  }

  // ── Fiscal year filter (cash_flow_projection, income_statement_projection) ─
  const yearValue = filters.year || filters.fiscalYear || '';
  if (yearValue && String(yearValue).trim() !== '') {
    const table = ENTITY_CONFIG[entityType].table as any;
    if (table.fiscalYear) {
      conditions.push(eq(table.fiscalYear, Number(yearValue)));
    }
  }

  // ── Bank loan: status filter ──────────────────────────────────────────────
  if (entityType === 'bank_loan' && filters.status && String(filters.status).trim() !== '') {
    conditions.push(eq(bankLoans.status, filters.status));
  }

  // ── Realization: entityType filter ───────────────────────────────────────
  if (entityType === 'realization' && filters.entityType && String(filters.entityType).trim() !== '') {
    conditions.push(eq(cashRealizations.entityType, filters.entityType));
  }

  // ── Realization: category filter ─────────────────────────────────────────
  if (entityType === 'realization' && filters.category && String(filters.category).trim() !== '') {
    conditions.push(eq(cashRealizations.category, filters.category));
  }

  // ── Realization: date range filter ───────────────────────────────────────
  if (entityType === 'realization') {
    if (filters.dateFrom && String(filters.dateFrom).trim() !== '') {
      conditions.push(gte(cashRealizations.transactionDate, filters.dateFrom) as unknown as SQL);
    }
    if (filters.dateTo && String(filters.dateTo).trim() !== '') {
      conditions.push(lte(cashRealizations.transactionDate, filters.dateTo) as unknown as SQL);
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Format filter summary for display
 */
function formatFilterSummary(filters: Record<string, any>, language: 'id' | 'en'): string {
  if (!filters) {
    return language === 'id' ? 'Semua Data' : 'All Data';
  }

  const parts: string[] = [];

  // Corporate — gunakan label jika tersedia, fallback ke ID
  const corporateValue = filters.corporateLabel || filters.corporate || filters.corporateId || '';
  if (String(corporateValue).trim() !== '') {
    const label = language === 'id' ? 'Perusahaan' : 'Corporate';
    parts.push(`${label}: ${corporateValue}`);
  }

  // Department — gunakan label jika tersedia, fallback ke ID
  const departmentValue = filters.departmentLabel || filters.departmentId || '';
  if (String(departmentValue).trim() !== '') {
    const label = language === 'id' ? 'Departemen' : 'Department';
    parts.push(`${label}: ${departmentValue}`);
  }

  if (filters.period && String(filters.period).trim() !== '') {
    const label = language === 'id' ? 'Periode' : 'Period';
    parts.push(`${label}: ${filters.period}`);
  }

  if (filters.periodStart && String(filters.periodStart).trim() !== '') {
    const label = language === 'id' ? 'Dari' : 'From';
    parts.push(`${label}: ${filters.periodStart}`);
  }

  if (filters.periodEnd && String(filters.periodEnd).trim() !== '') {
    const label = language === 'id' ? 'Sampai' : 'To';
    parts.push(`${label}: ${filters.periodEnd}`);
  }

  if (filters.fiscalYear && String(filters.fiscalYear).trim() !== '') {
    const label = language === 'id' ? 'Tahun Fiskal' : 'Fiscal Year';
    parts.push(`${label}: ${filters.fiscalYear}`);
  }

  if (filters.year && String(filters.year).trim() !== '') {
    const label = language === 'id' ? 'Tahun' : 'Year';
    parts.push(`${label}: ${filters.year}`);
  }

  // Status (bank loan) — gunakan label jika tersedia
  const statusValue = filters.statusLabel || filters.status || '';
  if (String(statusValue).trim() !== '') {
    const label = language === 'id' ? 'Status' : 'Status';
    parts.push(`${label}: ${statusValue}`);
  }

  // Entity type (realization) — gunakan label jika tersedia
  const entityTypeValue = filters.entityTypeLabel || filters.entityType || '';
  if (String(entityTypeValue).trim() !== '') {
    const label = language === 'id' ? 'Tipe Entitas' : 'Entity Type';
    parts.push(`${label}: ${entityTypeValue}`);
  }

  // Category (realization) — gunakan label jika tersedia
  const categoryValue = filters.categoryLabel || filters.category || '';
  if (String(categoryValue).trim() !== '') {
    const label = language === 'id' ? 'Kategori' : 'Category';
    parts.push(`${label}: ${categoryValue}`);
  }

  if (filters.dateFrom && String(filters.dateFrom).trim() !== '') {
    const label = language === 'id' ? 'Dari Tanggal' : 'From Date';
    parts.push(`${label}: ${filters.dateFrom}`);
  }

  if (filters.dateTo && String(filters.dateTo).trim() !== '') {
    const label = language === 'id' ? 'Sampai Tanggal' : 'To Date';
    parts.push(`${label}: ${filters.dateTo}`);
  }

  return parts.length > 0 ? parts.join(' | ') : (language === 'id' ? 'Semua Data' : 'All Data');
}

/**
 * Format date to DD/MM/YYYY
 */
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Generate export file
 */
export async function generateExport(options: ExportOptions): Promise<Buffer> {
  const { entityType, format, language, filters = {}, corporateIds } = options;

  const config = ENTITY_CONFIG[entityType];
  if (!config) {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  const moduleName = language === 'id' ? config.moduleNameId : config.moduleNameEn;
  const columns = getColumnDefinitions(entityType);

  // Fetch data
  const whereClause = buildWhereClause(entityType, filters, corporateIds);
  const data: any[] = await (async () => {
    switch (entityType) {
    case 'balance_sheet': {
      const rows = await db
        .select({
          period: balanceSheets.period,
          corporateName: corporates.name,
          cashAndBank: balanceSheets.cashAndBank,
          accountsReceivable: balanceSheets.accountsReceivable,
          workInProgress: balanceSheets.workInProgress,
          inventory: balanceSheets.inventory,
          prepaidExpenses: balanceSheets.prepaidExpenses,
          land: balanceSheets.land,
          building: balanceSheets.building,
          equipment: balanceSheets.equipment,
          otherFixedAssets: balanceSheets.otherFixedAssets,
          accountsPayable: balanceSheets.accountsPayable,
          bankLoanCurrent: balanceSheets.bankLoanCurrent,
          otherCurrentLiabilities: balanceSheets.otherCurrentLiabilities,
          bankLoanLongTerm: balanceSheets.bankLoanLongTerm,
          otherLongTermLiabilities: balanceSheets.otherLongTermLiabilities,
          shareholderLoan: balanceSheets.shareholderLoan,
          capital: balanceSheets.capital,
          earningsAfterTax: balanceSheets.earningsAfterTax,
          retainedEarnings: balanceSheets.retainedEarnings,
          dividends: balanceSheets.dividends,
          notes: balanceSheets.notes,
        })
        .from(balanceSheets)
        .leftJoin(corporates, eq(balanceSheets.corporateId, corporates.id))
        .where(whereClause);
      return rows.map(r => ({
        period: r.period,
        corporateName: r.corporateName,
        cashAndBank: r.cashAndBank,
        accountsReceivable: r.accountsReceivable,
        workInProgress: r.workInProgress,
        inventory: r.inventory,
        prepaidExpenses: r.prepaidExpenses,
        land: r.land,
        building: r.building,
        equipment: r.equipment,
        otherFixedAssets: r.otherFixedAssets,
        accountsPayable: r.accountsPayable,
        bankLoanCurrent: r.bankLoanCurrent,
        otherCurrentLiabilities: r.otherCurrentLiabilities,
        bankLoanLongTerm: r.bankLoanLongTerm,
        otherLongTermLiabilities: r.otherLongTermLiabilities,
        shareholderLoan: r.shareholderLoan,
        capital: r.capital,
        earningsAfterTax: r.earningsAfterTax,
        retainedEarnings: r.retainedEarnings,
        dividends: r.dividends,
        notes: r.notes,
      }));
    }

    case 'income_statement': {
      const rows = await db
        .select({
          period: incomeStatements.period,
          corporateName: corporates.name,
          revenue: incomeStatements.revenue,
          cogs: incomeStatements.cogs,
          operatingExpenses: incomeStatements.operatingExpenses,
          interestExpense: incomeStatements.interestExpense,
          taxExpense: incomeStatements.taxExpense,
          otherIncome: incomeStatements.otherIncome,
          otherExpense: incomeStatements.otherExpense,
          notes: incomeStatements.notes,
        })
        .from(incomeStatements)
        .leftJoin(corporates, eq(incomeStatements.corporateId, corporates.id))
        .where(whereClause);
      return rows.map(r => ({
        period: r.period,
        corporateName: r.corporateName,
        revenue: r.revenue,
        cogs: r.cogs,
        operatingExpenses: r.operatingExpenses,
        interestExpense: r.interestExpense,
        taxExpense: r.taxExpense,
        otherIncome: r.otherIncome,
        otherExpense: r.otherExpense,
        notes: r.notes,
      }));
    }

    case 'weekly_cash_flow': {
      const rows = await db
        .select({
          period: weeklyCashFlows.period,
          week: weeklyCashFlows.week,
          entityType: weeklyCashFlows.entityType,
          operatingCashIn: weeklyCashFlows.operatingCashIn,
          operatingCashOut: weeklyCashFlows.operatingCashOut,
          investingCashIn: weeklyCashFlows.investingCashIn,
          investingCashOut: weeklyCashFlows.investingCashOut,
          financingCashIn: weeklyCashFlows.financingCashIn,
          financingCashOut: weeklyCashFlows.financingCashOut,
          notes: weeklyCashFlows.notes,
          entityName: corporates.name,
        })
        .from(weeklyCashFlows)
        .leftJoin(corporates, eq(weeklyCashFlows.corporateId, corporates.id))
        .where(whereClause);
      return rows.map(r => ({
        period: r.period,
        week: r.week,
        entityType: r.entityType,
        entityName: r.entityName,
        operatingCashIn: r.operatingCashIn,
        operatingCashOut: r.operatingCashOut,
        investingCashIn: r.investingCashIn,
        investingCashOut: r.investingCashOut,
        financingCashIn: r.financingCashIn,
        financingCashOut: r.financingCashOut,
        notes: r.notes,
      }));
    }

    case 'realization': {
      const rows = await db
        .select({
          transactionDate: cashRealizations.transactionDate,
          entityType: cashRealizations.entityType,
          category: cashRealizations.category,
          amount: cashRealizations.amount,
          notes: cashRealizations.notes,
          departmentName: departments.name,
          projectName: projects.name,
        })
        .from(cashRealizations)
        .leftJoin(departments, eq(cashRealizations.departmentId, departments.id))
        .leftJoin(projects, eq(cashRealizations.projectId, projects.id))
        .where(whereClause);
      return rows.map(r => ({
        transactionDate: r.transactionDate,
        entityType: r.entityType,
        departmentName: r.departmentName,
        projectName: r.projectName,
        costCenterName: null,
        category: r.category,
        amount: r.amount,
        notes: r.notes,
      }));
    }

    case 'bank_loan': {
      const rows = await db
        .select({
          amount: bankLoans.amount,
          startDate: bankLoans.startDate,
          tenor: bankLoans.tenor,
          interestType: bankLoans.interestType,
          interestRate: bankLoans.interestRate,
          status: bankLoans.status,
          creditType: bankLoans.creditType,
          alertMinDays: bankLoans.alertMinDays,
          corporateName: corporates.name,
        })
        .from(bankLoans)
        .leftJoin(corporates, eq(bankLoans.corporateId, corporates.id))
        .where(whereClause);
      return rows.map(r => ({
        bankName: null,
        corporateName: r.corporateName,
        amount: r.amount,
        startDate: r.startDate,
        tenor: r.tenor,
        interestType: r.interestType,
        interestRate: r.interestRate,
        status: r.status,
        creditType: r.creditType,
        alertMinDays: r.alertMinDays,
      }));
    }

    case 'target': {
      const rows = await db
        .select({
          fiscalYear: targetHeaders.fiscalYear,
          departmentName: departments.name,
          projectName: projects.name,
          targetType: targetDetails.targetType,
          month: targetDetails.month,
          costCenter: targetDetails.costCenter,
          amount: targetDetails.amount,
          notes: targetDetails.notes,
        })
        .from(targetHeaders)
        .leftJoin(departments, eq(targetHeaders.departmentId, departments.id))
        .leftJoin(projects, eq(targetHeaders.projectId, projects.id))
        .leftJoin(targetDetails, eq(targetDetails.targetHeaderId, targetHeaders.id))
        .where(whereClause);
      return rows.map(r => ({
        fiscalYear: r.fiscalYear,
        departmentName: r.departmentName,
        projectName: r.projectName,
        month: r.month,
        targetType: r.targetType,
        costCenter: r.costCenter,
        amount: r.amount,
        notes: r.notes,
      }));
    }

    case 'cash_flow_projection': {
      const rows = await db
        .select({
          fiscalYear: cashFlowProjectionHeaders.fiscalYear,
          initialBalance: cashFlowProjectionHeaders.initialBalance,
          corporateName: corporates.name,
          month: cashFlowProjectionDetails.month,
          group: cashFlowProjectionDetails.group,
          type: cashFlowProjectionDetails.type,
          category: cashFlowProjectionDetails.category,
          amount: cashFlowProjectionDetails.amount,
          detailNotes: cashFlowProjectionDetails.notes,
        })
        .from(cashFlowProjectionHeaders)
        .leftJoin(corporates, eq(cashFlowProjectionHeaders.corporateId, corporates.id))
        .leftJoin(cashFlowProjectionDetails, eq(cashFlowProjectionDetails.headerId, cashFlowProjectionHeaders.id))
        .where(whereClause);
      return rows.map(r => ({
        fiscalYear: r.fiscalYear,
        corporateName: r.corporateName,
        initialBalance: r.initialBalance,
        month: r.month,
        group: r.group,
        type: r.type,
        category: r.category,
        amount: r.amount,
        detailNotes: r.detailNotes,
      }));
    }

    case 'corporate': {
      const rows = await db
        .select({
          code: corporates.code,
          name: corporates.name,
          industry: corporates.industry,
          fiscalYearStartMonth: corporates.fiscalYearStartMonth,
          currency: corporates.currency,
          taxRate: corporates.taxRate,
          isActive: corporates.isActive,
        })
        .from(corporates)
        .where(whereClause);
      return rows.map(r => ({
        code: r.code,
        name: r.name,
        industry: r.industry,
        fiscalYearStartMonth: r.fiscalYearStartMonth,
        currency: r.currency,
        taxRate: r.taxRate,
        isActive: r.isActive ? (language === 'id' ? 'Ya' : 'Yes') : (language === 'id' ? 'Tidak' : 'No'),
      }));
    }

    case 'department': {
      const rows = await db
        .select({
          code: departments.code,
          name: departments.name,
          corporateName: corporates.name,
          headName: departments.headName,
          description: departments.description,
          isActive: departments.isActive,
        })
        .from(departments)
        .leftJoin(corporates, eq(departments.corporateId, corporates.id))
        .where(whereClause);
      return rows.map(r => ({
        code: r.code,
        name: r.name,
        corporateName: r.corporateName,
        headName: r.headName,
        description: r.description,
        isActive: r.isActive ? (language === 'id' ? 'Ya' : 'Yes') : (language === 'id' ? 'Tidak' : 'No'),
      }));
    }

    case 'cost_center': {
      const rows = await db
        .select({
          code: costCenters.code,
          name: costCenters.name,
          corporateName: corporates.name,
          category: costCenters.category,
          description: costCenters.description,
          isActive: costCenters.isActive,
        })
        .from(costCenters)
        .leftJoin(corporates, eq(costCenters.corporateId, corporates.id))
        .where(whereClause);
      return rows.map(r => ({
        code: r.code,
        name: r.name,
        corporateName: r.corporateName,
        category: r.category,
        parentName: null,
        description: r.description,
        isActive: r.isActive ? (language === 'id' ? 'Ya' : 'Yes') : (language === 'id' ? 'Tidak' : 'No'),
      }));
    }

    case 'project': {
      const rows = await db
        .select({
          code: projects.code,
          name: projects.name,
          departmentName: departments.name,
          startDate: projects.startDate,
          endDate: projects.endDate,
          status: projects.status,
          description: projects.description,
          isActive: projects.isActive,
        })
        .from(projects)
        .leftJoin(departments, eq(projects.departmentId, departments.id))
        .where(whereClause);
      return rows.map(r => ({
        code: r.code,
        name: r.name,
        departmentName: r.departmentName,
        status: r.status,
        startDate: r.startDate,
        endDate: r.endDate,
        description: r.description,
        isActive: r.isActive ? (language === 'id' ? 'Ya' : 'Yes') : (language === 'id' ? 'Tidak' : 'No'),
      }));
    }

    default:
      return [];
  }
  })();

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(moduleName);

  // Row 1: Module title — tulis di A1 saja, tanpa merge cell
  const titleRow = worksheet.addRow([moduleName]);
  titleRow.font = { bold: true, size: 14 };

  // Row 2: Filter summary — tulis di A2 saja, tanpa merge cell
  const filterSummary = formatFilterSummary(filters, language);
  const hasActiveFilter = filterSummary !== (language === 'id' ? 'Semua Data' : 'All Data');
  const filterRow = worksheet.addRow([filterSummary]);
  filterRow.font = { italic: true, color: { argb: 'FF666666' } };

  // Row 3 (jika ada filter aktif): baris kosong sebagai jeda
  // Row 3 (jika tidak ada filter): langsung header kolom
  if (hasActiveFilter) {
    worksheet.addRow([]); // baris kosong
  }

  // Row 3 (tanpa filter) / Row 4 (dengan filter): Column headers
  const headerLabels = columns.map(col => language === 'id' ? col.labelId : col.labelEn);
  const headerRow = worksheet.addRow(headerLabels);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Row 4+: Data rows
  for (const record of data) {
    const rowData = columns.map(col => {
      const value = record[col.key];

      if (col.type === 'date') {
        return formatDate(value);
      }

      if (col.type === 'currency' || col.type === 'number') {
        return value !== null && value !== undefined ? Number(value) : 0;
      }

      return value !== null && value !== undefined ? value : '';
    });

    const dataRow = worksheet.addRow(rowData);

    // Apply number formatting
    columns.forEach((col, index) => {
      const cell = dataRow.getCell(index + 1);
      if (col.type === 'currency') {
        cell.numFmt = '#,##0.00';
      }
    });
  }

  // Auto-fit columns (min 12, max 40)
  worksheet.columns.forEach((column, index) => {
    const col = columns[index];
    if (col?.type === 'currency' || col?.type === 'number') {
      column.width = 18;
    } else if (col?.type === 'date') {
      column.width = 14;
    } else {
      column.width = 20;
    }
  });

  // Generate file
  if (format === 'xlsx') {
    const xlsxBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(xlsxBuffer);
  } else {
    // CSV with UTF-8 BOM
    const csvBuffer = await workbook.csv.writeBuffer();
    const bom = Buffer.from('\uFEFF', 'utf8');
    return Buffer.concat([bom, Buffer.from(csvBuffer)]);
  }
}

/**
 * Generate filename for export
 */
export function generateExportFilename(entityType: EntityType, language: 'id' | 'en', format: 'xlsx' | 'csv'): string {
  const config = ENTITY_CONFIG[entityType];
  const moduleName = language === 'id' ? config.moduleNameId : config.moduleNameEn;
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const sanitizedName = moduleName.toLowerCase().replace(/\s+/g, '_');
  return `${sanitizedName}_${date}.${format}`;
}
