// Dynamic Upload Template Generator
// Generates Excel templates on-demand with in-cell dropdowns populated from the DB,
// filtered by the requesting user's RBAC access context.

import ExcelJS, { type CellValue } from 'exceljs';
import { eq, and, inArray, asc } from 'drizzle-orm';
import { db } from '../../db/connection';
import {
  corporates,
  departments,
  projects,
  banks,
  corporateSectors,
  currencies,
  costCenterCategories,
} from '../../db/schema/public';
import type { EntityType } from './uploadService';

// ============================================================================
// Types
// ============================================================================

export interface AccessContext {
  scope: 'system' | 'corporate' | 'department';
  corporateIds: string[];
  departmentIds: string[];
  hasFullCorporateAccess: boolean;
}

export interface DropdownItem {
  code: string;  // value stored in the Excel cell (UUID or short code)
  label: string; // human-readable string shown in the dropdown
}

interface ColumnDef {
  field: string;
  labelId: string;
  width?: number;
  dropdown?: {
    type: 'database';
    refSheetName: string;
  } | {
    type: 'inline';
    formula: string; // e.g. '"W1,W2,W3,W4,W5"'
  };
}

interface TemplateModuleConfig {
  moduleNameId: string;
  instructionsId: string;
  columns: ColumnDef[];
  sampleData: Record<string, unknown>;
  startRecord: number; // row where data begins (usually 4)
}

// ============================================================================
// DB Fetchers
// ============================================================================

async function fetchCorporateItems(access: AccessContext): Promise<DropdownItem[]> {
  const query = db.select({
    id: corporates.id,
    code: corporates.code,
    name: corporates.name,
  }).from(corporates).where(
    access.scope === 'system' || access.hasFullCorporateAccess
      ? eq(corporates.isActive, true)
      : and(eq(corporates.isActive, true), inArray(corporates.id, access.corporateIds))
  ).orderBy(asc(corporates.code));

  const rows = await query;
  return rows.map(r => ({ code: r.id, label: `${r.code} - ${r.name}` }));
}

async function fetchDepartmentItems(access: AccessContext): Promise<DropdownItem[]> {
  const query = db.select({
    id: departments.id,
    code: departments.code,
    name: departments.name,
    corpCode: corporates.code,
  })
    .from(departments)
    .innerJoin(corporates, eq(departments.corporateId, corporates.id))
    .where(
      access.scope === 'system' || access.hasFullCorporateAccess
        ? eq(departments.isActive, true)
        : and(
          eq(departments.isActive, true),
          inArray(departments.corporateId, access.corporateIds.length > 0 ? access.corporateIds : ['__none__'])
        )
    )
    .orderBy(asc(corporates.code), asc(departments.code));

  const rows = await query;
  return rows.map(r => ({ code: r.id, label: `${r.corpCode}-${r.code} - ${r.name}` }));
}

async function fetchProjectItems(access: AccessContext): Promise<DropdownItem[]> {
  const query = db.select({
    id: projects.id,
    code: projects.code,
    name: projects.name,
  })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .where(
      access.scope === 'system' || access.hasFullCorporateAccess
        ? eq(projects.isActive, true)
        : access.corporateIds.length > 0
          ? and(
            eq(projects.isActive, true),
            inArray(departments.corporateId, access.corporateIds)
          )
          : and(
            eq(projects.isActive, true),
            inArray(projects.departmentId, access.departmentIds.length > 0 ? access.departmentIds : ['__none__'])
          )
    )
    .orderBy(asc(projects.code));

  const rows = await query;
  return rows.map(r => ({ code: r.id, label: `${r.code} - ${r.name}` }));
}

async function fetchBankItems(): Promise<DropdownItem[]> {
  const rows = await db.select({ id: banks.id, code: banks.code, name: banks.name })
    .from(banks)
    .where(eq(banks.status, 'active'))
    .orderBy(asc(banks.code));
  return rows.map(r => ({ code: r.id, label: `${r.code} - ${r.name}` }));
}

async function fetchSectorItems(): Promise<DropdownItem[]> {
  const rows = await db.select({ code: corporateSectors.code, labelId: corporateSectors.labelId })
    .from(corporateSectors)
    .where(eq(corporateSectors.status, 'active'))
    .orderBy(asc(corporateSectors.code));
  return rows.map(r => ({ code: r.code, label: `${r.code} - ${r.labelId}` }));
}

async function fetchCurrencyItems(): Promise<DropdownItem[]> {
  const rows = await db.select({ code: currencies.code, label: currencies.label })
    .from(currencies)
    .where(eq(currencies.status, 'active'))
    .orderBy(asc(currencies.code));
  return rows.map(r => ({ code: r.code, label: `${r.code} - ${r.label}` }));
}

async function fetchCostCenterCategoryItems(): Promise<DropdownItem[]> {
  const rows = await db.select({ code: costCenterCategories.code, labelId: costCenterCategories.labelId })
    .from(costCenterCategories)
    .where(eq(costCenterCategories.status, 'active'))
    .orderBy(asc(costCenterCategories.code));
  return rows.map(r => ({ code: r.code, label: `${r.code} - ${r.labelId}` }));
}

// ============================================================================
// ExcelJS Helpers
// ============================================================================

function columnIndexToLetter(idx: number): string {
  let letter = '';
  let n = idx;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function populateRefSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  items: DropdownItem[],
): string {
  let refSheet = workbook.getWorksheet(sheetName);
  if (!refSheet) {
    refSheet = workbook.addWorksheet(sheetName);
    refSheet.state = 'veryHidden';
  }
  items.forEach((item, idx) => {
    refSheet!.getCell(idx + 1, 1).value = item.label;
  });
  const total = items.length;
  return `${sheetName}!$A$1:$A$${total}`;
}

function applyListValidation(
  worksheet: ExcelJS.Worksheet,
  colIndex: number,
  startRow: number,
  endRow: number,
  formula: string,
): void {
  for (let row = startRow; row <= endRow; row++) {
    worksheet.getCell(row, colIndex).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [formula],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Nilai tidak valid',
      error: 'Pilih nilai dari daftar dropdown.',
    };
  }
}

// ============================================================================
// Standard Template Builder (Row 1 instruction / Row 2 empty / Row 3 headers / Row 4 sample)
// ============================================================================

function buildStandardWorksheet(
  workbook: ExcelJS.Workbook,
  config: TemplateModuleConfig,
): ExcelJS.Worksheet {
  const ws = workbook.addWorksheet(config.moduleNameId);
  const totalCols = config.columns.length;

  // Row 1: Instructions
  const instrCell = ws.getCell(1, 1);
  instrCell.value = config.instructionsId;
  instrCell.font = { bold: true, size: 11 };
  instrCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F3FF' } };
  instrCell.alignment = { vertical: 'middle', wrapText: true };
  ws.mergeCells(1, 1, 1, totalCols);
  ws.getRow(1).height = 30;

  // Row 3: Headers
  const headerRow = ws.getRow(3);
  config.columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.labelId;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  headerRow.height = 20;

  // Column widths
  config.columns.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width ?? Math.max(15, col.labelId.length + 4);
  });

  // Row 4: Sample data
  const sampleRow = ws.getRow(4);
  config.columns.forEach((col, i) => {
    const cell = sampleRow.getCell(i + 1);
    cell.value = (config.sampleData[col.field] ?? '') as CellValue;
    cell.font = { italic: true, color: { argb: 'FF808080' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    cell.alignment = { vertical: 'middle' };
  });
  ws.getCell(4, 1).note = 'Ini adalah contoh data. Hapus baris ini dan isi dengan data Anda.';

  return ws;
}

function applyDropdowns(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  config: TemplateModuleConfig,
  dropdownData: Map<string, DropdownItem[]>,
): void {
  const startRow = config.startRecord;
  const endRow = startRow + 999;

  config.columns.forEach((col, i) => {
    const colIdx = i + 1;
    if (!col.dropdown) return;

    if (col.dropdown.type === 'inline') {
      applyListValidation(worksheet, colIdx, startRow, endRow, col.dropdown.formula);
    } else {
      const items = dropdownData.get(col.field);
      if (!items || items.length === 0) return;
      const formula = populateRefSheet(workbook, col.dropdown.refSheetName, items);
      applyListValidation(worksheet, colIdx, startRow, endRow, formula);
    }
  });
}

// ============================================================================
// Per-module Configs
// ============================================================================

function getBalanceSheetConfig(): TemplateModuleConfig {
  return {
    moduleNameId: 'Neraca',
    instructionsId: 'Isi data mulai dari baris 4. Pilih perusahaan dari dropdown. Format period: YYYY-MM (contoh: 2026-05). Semua nilai dalam angka tanpa pemisah ribuan.',
    startRecord: 4,
    columns: [
      { field: 'corporate_id', labelId: 'Perusahaan', width: 30, dropdown: { type: 'database', refSheetName: '_ref_corporate' } },
      { field: 'period', labelId: 'Periode', width: 12 },
      { field: 'cash_and_bank', labelId: 'Kas & Bank' },
      { field: 'accounts_receivable', labelId: 'Piutang Usaha' },
      { field: 'work_in_progress', labelId: 'Pekerjaan Dalam Proses' },
      { field: 'inventory', labelId: 'Persediaan' },
      { field: 'prepaid_expenses', labelId: 'Biaya Dibayar Dimuka' },
      { field: 'land', labelId: 'Tanah' },
      { field: 'building', labelId: 'Bangunan' },
      { field: 'equipment', labelId: 'Peralatan' },
      { field: 'other_fixed_assets', labelId: 'Aset Tetap Lainnya' },
      { field: 'accounts_payable', labelId: 'Hutang Usaha' },
      { field: 'bank_loan_current', labelId: 'Pinjaman Bank Jangka Pendek' },
      { field: 'other_current_liabilities', labelId: 'Kewajiban Lancar Lainnya' },
      { field: 'bank_loan_long_term', labelId: 'Pinjaman Bank Jangka Panjang' },
      { field: 'other_long_term_liabilities', labelId: 'Kewajiban Jangka Panjang Lainnya' },
      { field: 'shareholder_loan', labelId: 'Pinjaman Pemegang Saham' },
      { field: 'capital', labelId: 'Modal' },
      { field: 'earnings_after_tax', labelId: 'Laba Setelah Pajak' },
      { field: 'retained_earnings', labelId: 'Laba Ditahan' },
      { field: 'dividends', labelId: 'Dividen' },
      { field: 'notes', labelId: 'Catatan', width: 25 },
    ],
    sampleData: {
      corporate_id: 'Pilih perusahaan dari dropdown',
      period: '2026-05',
      cash_and_bank: 1000000,
      accounts_receivable: 500000,
      work_in_progress: 200000,
      inventory: 300000,
      prepaid_expenses: 50000,
      land: 2000000,
      building: 1500000,
      equipment: 800000,
      other_fixed_assets: 100000,
      accounts_payable: 400000,
      bank_loan_current: 300000,
      other_current_liabilities: 100000,
      bank_loan_long_term: 1000000,
      other_long_term_liabilities: 200000,
      shareholder_loan: 500000,
      capital: 3000000,
      earnings_after_tax: 450000,
      retained_earnings: 200000,
      dividends: 100000,
      notes: 'Contoh data - hapus baris ini',
    },
  };
}

function getIncomeStatementConfig(): TemplateModuleConfig {
  return {
    moduleNameId: 'Laba Rugi',
    instructionsId: 'Isi data mulai dari baris 4. Pilih perusahaan dari dropdown. Format period: YYYY-MM (contoh: 2026-05). Semua nilai dalam angka tanpa pemisah ribuan.',
    startRecord: 4,
    columns: [
      { field: 'corporate_id', labelId: 'Perusahaan', width: 30, dropdown: { type: 'database', refSheetName: '_ref_corporate' } },
      { field: 'period', labelId: 'Periode', width: 12 },
      { field: 'revenue', labelId: 'Pendapatan' },
      { field: 'cogs', labelId: 'Harga Pokok Penjualan' },
      { field: 'operating_expenses', labelId: 'Biaya Operasional' },
      { field: 'interest_expense', labelId: 'Biaya Bunga' },
      { field: 'tax_expense', labelId: 'Biaya Pajak' },
      { field: 'other_income', labelId: 'Pendapatan Lain' },
      { field: 'other_expense', labelId: 'Biaya Lain' },
      { field: 'notes', labelId: 'Catatan', width: 25 },
    ],
    sampleData: {
      corporate_id: 'Pilih perusahaan dari dropdown',
      period: '2026-05',
      revenue: 5000000,
      cogs: 2000000,
      operating_expenses: 1500000,
      interest_expense: 100000,
      tax_expense: 350000,
      other_income: 50000,
      other_expense: 20000,
      notes: 'Contoh data - hapus baris ini',
    },
  };
}

function getIncomeStatementProjectionConfig(): TemplateModuleConfig {
  return {
    moduleNameId: 'Proyeksi Laba Rugi',
    instructionsId: 'Isi data mulai dari baris 4. Pilih departemen dari dropdown (format: KODE_CORP-KODE_DEPT - Nama). Proyek bersifat opsional. Format month: 1-12.',
    startRecord: 4,
    columns: [
      { field: 'header_ref', labelId: 'Referensi Header', width: 18 },
      { field: 'department_id', labelId: 'Departemen', width: 35, dropdown: { type: 'database', refSheetName: '_ref_department' } },
      { field: 'project_id', labelId: 'Proyek (Opsional)', width: 30, dropdown: { type: 'database', refSheetName: '_ref_project' } },
      { field: 'fiscal_year', labelId: 'Tahun Fiskal', width: 14 },
      { field: 'month', labelId: 'Bulan (1-12)', width: 14, dropdown: { type: 'inline', formula: '"1,2,3,4,5,6,7,8,9,10,11,12"' } },
      { field: 'account_code', labelId: 'Kode Akun', width: 14 },
      { field: 'account_name', labelId: 'Nama Akun', width: 25 },
      { field: 'amount', labelId: 'Jumlah' },
      { field: 'notes', labelId: 'Catatan', width: 25 },
    ],
    sampleData: {
      header_ref: 'DEPT-2026',
      department_id: 'Pilih departemen dari dropdown',
      project_id: '',
      fiscal_year: 2026,
      month: 5,
      account_code: '4000',
      account_name: 'Pendapatan',
      amount: 1000000,
      notes: 'Contoh data - hapus baris ini',
    },
  };
}

function getWeeklyCashFlowConfig(): TemplateModuleConfig {
  return {
    moduleNameId: 'Arus Kas Mingguan',
    instructionsId: 'Isi data mulai dari baris 4. Pilih perusahaan dari dropdown. entity_type: corporate/project. entity_id: UUID perusahaan atau proyek. Week: W1-W5. Semua nilai dalam angka.',
    startRecord: 4,
    columns: [
      { field: 'corporate_id', labelId: 'Perusahaan', width: 30, dropdown: { type: 'database', refSheetName: '_ref_corporate' } },
      { field: 'entity_type', labelId: 'Tipe Entitas', width: 16, dropdown: { type: 'inline', formula: '"corporate,project"' } },
      { field: 'entity_id', labelId: 'ID Proyek (jika tipe=project)', width: 30, dropdown: { type: 'database', refSheetName: '_ref_project' } },
      { field: 'period', labelId: 'Periode', width: 12 },
      { field: 'week', labelId: 'Minggu', width: 10, dropdown: { type: 'inline', formula: '"W1,W2,W3,W4,W5"' } },
      { field: 'operating_cash_in', labelId: 'Kas Masuk Operasional' },
      { field: 'operating_cash_out', labelId: 'Kas Keluar Operasional' },
      { field: 'investing_cash_in', labelId: 'Kas Masuk Investasi' },
      { field: 'investing_cash_out', labelId: 'Kas Keluar Investasi' },
      { field: 'financing_cash_in', labelId: 'Kas Masuk Pendanaan' },
      { field: 'financing_cash_out', labelId: 'Kas Keluar Pendanaan' },
      { field: 'notes', labelId: 'Catatan', width: 25 },
    ],
    sampleData: {
      corporate_id: 'Pilih perusahaan dari dropdown',
      entity_type: 'corporate',
      entity_id: '',
      period: '2026-05',
      week: 'W1',
      operating_cash_in: 500000,
      operating_cash_out: 300000,
      investing_cash_in: 0,
      investing_cash_out: 100000,
      financing_cash_in: 200000,
      financing_cash_out: 50000,
      notes: 'Contoh data - hapus baris ini',
    },
  };
}

function getRealizationConfig(): TemplateModuleConfig {
  return {
    moduleNameId: 'Realisasi',
    instructionsId: 'Isi data mulai dari baris 4. entity_type: department/project. Pilih departemen dan proyek dari dropdown. category: cash-in/cash-out. Format transaction_date: YYYY-MM-DD.',
    startRecord: 4,
    columns: [
      { field: 'entity_type', labelId: 'Tipe Entitas', width: 16, dropdown: { type: 'inline', formula: '"department,project"' } },
      { field: 'department_id', labelId: 'Departemen', width: 35, dropdown: { type: 'database', refSheetName: '_ref_department' } },
      { field: 'project_id', labelId: 'Proyek (Opsional)', width: 30, dropdown: { type: 'database', refSheetName: '_ref_project' } },
      { field: 'transaction_date', labelId: 'Tanggal Transaksi', width: 18 },
      { field: 'category', labelId: 'Kategori', width: 14, dropdown: { type: 'inline', formula: '"cash-in,cash-out"' } },
      { field: 'cost_center_id', labelId: 'ID Cost Center (Opsional)', width: 28 },
      { field: 'amount', labelId: 'Jumlah' },
      { field: 'notes', labelId: 'Catatan', width: 25 },
    ],
    sampleData: {
      entity_type: 'department',
      department_id: 'Pilih departemen dari dropdown',
      project_id: '',
      transaction_date: '2026-05-15',
      category: 'cash-in',
      cost_center_id: '',
      amount: 250000,
      notes: 'Contoh data - hapus baris ini',
    },
  };
}

function getBankLoanConfig(): TemplateModuleConfig {
  return {
    moduleNameId: 'Pinjaman Bank',
    instructionsId: 'Isi data mulai dari baris 4. Pilih perusahaan dan bank dari dropdown. credit_type: KMK/KMI. interest_type: flat/effective. Format start_date: YYYY-MM-DD. Tenor dalam bulan. interest_rate dalam desimal (contoh: 0.12 untuk 12%).',
    startRecord: 4,
    columns: [
      { field: 'corporate_id', labelId: 'Perusahaan', width: 30, dropdown: { type: 'database', refSheetName: '_ref_corporate' } },
      { field: 'bank_id', labelId: 'Bank', width: 30, dropdown: { type: 'database', refSheetName: '_ref_bank' } },
      { field: 'credit_type', labelId: 'Jenis Kredit', width: 14, dropdown: { type: 'inline', formula: '"KMK,KMI"' } },
      { field: 'amount', labelId: 'Jumlah' },
      { field: 'start_date', labelId: 'Tanggal Mulai', width: 16 },
      { field: 'tenor', labelId: 'Tenor (Bulan)', width: 16 },
      { field: 'interest_type', labelId: 'Jenis Bunga', width: 14, dropdown: { type: 'inline', formula: '"flat,effective"' } },
      { field: 'interest_rate', labelId: 'Suku Bunga (desimal)', width: 22 },
      { field: 'alert_min_days', labelId: 'Alert Min Hari', width: 18 },
    ],
    sampleData: {
      corporate_id: 'Pilih perusahaan dari dropdown',
      bank_id: 'Pilih bank dari dropdown',
      credit_type: 'KMK',
      amount: 5000000,
      start_date: '2026-01-01',
      tenor: 12,
      interest_type: 'flat',
      interest_rate: 0.12,
      alert_min_days: 30,
    },
  };
}

function getCorporateConfig(): TemplateModuleConfig {
  const monthInline = '"Januari,Februari,Maret,April,Mei,Juni,Juli,Agustus,September,Oktober,November,Desember"';
  return {
    moduleNameId: 'Perusahaan',
    instructionsId: 'Isi data mulai dari baris 4. Pilih sektor industri dan mata uang dari dropdown. fiscal_year_start_month: nama bulan awal tahun fiskal. tax_rate dalam angka desimal (contoh: 0.11 untuk 11%).',
    startRecord: 4,
    columns: [
      { field: 'name', labelId: 'Nama Perusahaan', width: 30 },
      { field: 'code', labelId: 'Kode', width: 12 },
      { field: 'industry', labelId: 'Sektor Industri', width: 25, dropdown: { type: 'database', refSheetName: '_ref_sector' } },
      { field: 'currency', labelId: 'Mata Uang', width: 20, dropdown: { type: 'database', refSheetName: '_ref_currency' } },
      { field: 'fiscal_year_start_month', labelId: 'Bulan Awal Tahun Fiskal', width: 26, dropdown: { type: 'inline', formula: monthInline } },
      { field: 'tax_rate', labelId: 'Tarif Pajak (desimal)', width: 22 },
    ],
    sampleData: {
      name: 'PT Contoh Sejahtera',
      code: 'CONTH',
      industry: 'Pilih sektor dari dropdown',
      currency: 'Pilih mata uang dari dropdown',
      fiscal_year_start_month: 'Januari',
      tax_rate: 0.11,
    },
  };
}

function getDepartmentConfig(): TemplateModuleConfig {
  return {
    moduleNameId: 'Departemen',
    instructionsId: 'Isi data mulai dari baris 4. Pilih perusahaan dari dropdown.',
    startRecord: 4,
    columns: [
      { field: 'corporate_id', labelId: 'Perusahaan', width: 30, dropdown: { type: 'database', refSheetName: '_ref_corporate' } },
      { field: 'name', labelId: 'Nama Departemen', width: 30 },
      { field: 'code', labelId: 'Kode', width: 12 },
      { field: 'description', labelId: 'Deskripsi', width: 30 },
      { field: 'head_name', labelId: 'Nama Kepala Departemen', width: 28 },
    ],
    sampleData: {
      corporate_id: 'Pilih perusahaan dari dropdown',
      name: 'Departemen Keuangan',
      code: 'FIN',
      description: 'Departemen keuangan dan akuntansi',
      head_name: 'Budi Santoso',
    },
  };
}

function getCostCenterConfig(): TemplateModuleConfig {
  return {
    moduleNameId: 'Cost Center',
    instructionsId: 'Isi data mulai dari baris 4. Pilih perusahaan dan kategori dari dropdown.',
    startRecord: 4,
    columns: [
      { field: 'corporate_id', labelId: 'Perusahaan', width: 30, dropdown: { type: 'database', refSheetName: '_ref_corporate' } },
      { field: 'name', labelId: 'Nama Cost Center', width: 30 },
      { field: 'code', labelId: 'Kode', width: 12 },
      { field: 'category', labelId: 'Kategori', width: 25, dropdown: { type: 'database', refSheetName: '_ref_cc_category' } },
      { field: 'description', labelId: 'Deskripsi', width: 30 },
    ],
    sampleData: {
      corporate_id: 'Pilih perusahaan dari dropdown',
      name: 'Cost Center Operasional',
      code: 'OPS-001',
      category: 'Pilih kategori dari dropdown',
      description: 'Biaya operasional umum',
    },
  };
}

function getProjectConfig(): TemplateModuleConfig {
  return {
    moduleNameId: 'Proyek',
    instructionsId: 'Isi data mulai dari baris 4. Pilih departemen dari dropdown. Format start_date & end_date: YYYY-MM-DD.',
    startRecord: 4,
    columns: [
      { field: 'department_id', labelId: 'Departemen', width: 35, dropdown: { type: 'database', refSheetName: '_ref_department' } },
      { field: 'name', labelId: 'Nama Proyek', width: 30 },
      { field: 'code', labelId: 'Kode', width: 12 },
      { field: 'description', labelId: 'Deskripsi', width: 30 },
      { field: 'start_date', labelId: 'Tanggal Mulai', width: 16 },
      { field: 'end_date', labelId: 'Tanggal Selesai (Opsional)', width: 26 },
      { field: 'status', labelId: 'Status', width: 14, dropdown: { type: 'inline', formula: '"planning,active,completed,cancelled"' } },
    ],
    sampleData: {
      department_id: 'Pilih departemen dari dropdown',
      name: 'Proyek Pembangunan Gedung',
      code: 'PRJ-001',
      description: 'Proyek pembangunan gedung baru',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      status: 'active',
    },
  };
}

// ============================================================================
// Cash Flow Projection Wide Format Builder
// ============================================================================

const CFP_MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
const CFP_MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

async function buildCashFlowProjectionTemplate(
  workbook: ExcelJS.Workbook,
  access: AccessContext,
): Promise<void> {
  const ws = workbook.addWorksheet('Proyeksi Arus Kas');

  // Fixed columns: corporate, fiscal_year, initial_balance, notes (4 cols)
  // Then 12 months × 2 (cash_in, cash_out) = 24 cols
  // Total = 28 cols
  const totalCols = 28;

  // ── Row 1: Instructions (merged) ─────────────────────────────────────────
  const instrCell = ws.getCell(1, 1);
  instrCell.value = 'Isi data mulai dari baris 5. Pilih perusahaan dari dropdown. Kolom bulanan diisi nilai cash in dan cash out. Kosongkan sel jika tidak ada nilai.';
  instrCell.font = { bold: true, size: 11 };
  instrCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F3FF' } };
  instrCell.alignment = { vertical: 'middle', wrapText: true };
  ws.mergeCells(1, 1, 1, totalCols);
  ws.getRow(1).height = 30;

  // ── Row 2: Empty ─────────────────────────────────────────────────────────

  // ── Row 3: First header row ───────────────────────────────────────────────
  const hdr3 = ws.getRow(3);
  hdr3.height = 20;

  const hdrStyle = {
    font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF4472C4' } },
    alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
  };
  const hdrStyleAlt = {
    font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF2E75B6' } },
    alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
  };

  // Static headers in row 3
  ['Perusahaan', 'Tahun Fiskal', 'Saldo Awal', 'Catatan/Keterangan'].forEach((label, i) => {
    const cell = hdr3.getCell(i + 1);
    cell.value = label;
    Object.assign(cell, hdrStyle);
    // Merge row 3 + row 4 for fixed columns
    ws.mergeCells(3, i + 1, 4, i + 1);
  });

  // Month name headers (merged 2 cols each)
  CFP_MONTHS_ID.forEach((month, i) => {
    const colStart = 5 + i * 2;
    const cell = hdr3.getCell(colStart);
    cell.value = month;
    Object.assign(cell, i % 2 === 0 ? hdrStyle : hdrStyleAlt);
    ws.mergeCells(3, colStart, 3, colStart + 1);
  });

  // ── Row 4: Sub-header (cash in / cash out for each month) ────────────────
  const hdr4 = ws.getRow(4);
  hdr4.height = 18;

  CFP_MONTHS_ID.forEach((_, i) => {
    const colStart = 5 + i * 2;
    const style = i % 2 === 0 ? hdrStyle : hdrStyleAlt;

    const ciCell = hdr4.getCell(colStart);
    ciCell.value = 'Cash In';
    Object.assign(ciCell, style);

    const coCell = hdr4.getCell(colStart + 1);
    coCell.value = 'Cash Out';
    Object.assign(coCell, style);
  });

  // ── Column widths ─────────────────────────────────────────────────────────
  ws.getColumn(1).width = 30; // corporate
  ws.getColumn(2).width = 14; // fiscal_year
  ws.getColumn(3).width = 16; // initial_balance
  ws.getColumn(4).width = 25; // notes
  for (let i = 5; i <= totalCols; i++) {
    ws.getColumn(i).width = 14;
  }

  // ── Row 5: Sample data ────────────────────────────────────────────────────
  const sampleRow = ws.getRow(5);
  const sampleStyle = {
    font: { italic: true, color: { argb: 'FF808080' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF0F0F0' } },
    alignment: { vertical: 'middle' as const },
  };

  sampleRow.getCell(1).value = 'Pilih perusahaan dari dropdown';
  sampleRow.getCell(2).value = 2026;
  sampleRow.getCell(3).value = 1000000;
  sampleRow.getCell(4).value = 'Contoh data - hapus baris ini';
  // Jan cash in/out as sample
  sampleRow.getCell(5).value = 500000;
  sampleRow.getCell(6).value = 300000;

  for (let col = 1; col <= totalCols; col++) {
    Object.assign(sampleRow.getCell(col), sampleStyle);
  }
  sampleRow.getCell(1).note = 'Ini adalah contoh data. Hapus baris ini dan isi dengan data Anda.';

  // ── Dropdown for corporate (col 1, rows 5-1004) ───────────────────────────
  const corporateItems = await fetchCorporateItems(access);
  if (corporateItems.length > 0) {
    const formula = populateRefSheet(workbook, '_ref_corporate', corporateItems);
    applyListValidation(ws, 1, 5, 1004, formula);
  }
}

// ============================================================================
// Public API
// ============================================================================

export interface DropdownResolutionData {
  corporateItems: DropdownItem[];
  departmentItems: DropdownItem[];
  projectItems: DropdownItem[];
  bankItems: DropdownItem[];
  sectorItems: DropdownItem[];
  currencyItems: DropdownItem[];
  ccCategoryItems: DropdownItem[];
}

export async function fetchDropdownDataForResolution(
  entityType: EntityType,
  access: AccessContext,
): Promise<DropdownResolutionData> {
  const needsCorporate = ['balance_sheet', 'income_statement', 'weekly_cash_flow', 'cash_flow_projection', 'bank_loan', 'department', 'cost_center'].includes(entityType);
  const needsDepartment = ['income_statement_projection', 'realization', 'project'].includes(entityType);
  const needsProject = ['income_statement_projection', 'weekly_cash_flow', 'realization'].includes(entityType);
  const needsBank = entityType === 'bank_loan';
  const needsSector = entityType === 'corporate';
  const needsCurrency = entityType === 'corporate';
  const needsCcCategory = entityType === 'cost_center';

  const [corp, dept, proj, bank, sector, currency, ccCat] = await Promise.all([
    needsCorporate ? fetchCorporateItems(access) : Promise.resolve([]),
    needsDepartment ? fetchDepartmentItems(access) : Promise.resolve([]),
    needsProject ? fetchProjectItems(access) : Promise.resolve([]),
    needsBank ? fetchBankItems() : Promise.resolve([]),
    needsSector ? fetchSectorItems() : Promise.resolve([]),
    needsCurrency ? fetchCurrencyItems() : Promise.resolve([]),
    needsCcCategory ? fetchCostCenterCategoryItems() : Promise.resolve([]),
  ]);

  return {
    corporateItems: corp,
    departmentItems: dept,
    projectItems: proj,
    bankItems: bank,
    sectorItems: sector,
    currencyItems: currency,
    ccCategoryItems: ccCat,
  };
}

export async function generateDynamicTemplate(
  entityType: EntityType,
  access: AccessContext,
  _language: 'id' | 'en' = 'id',
): Promise<Buffer> {
  // Cash Flow Projection has a completely different wide-format structure
  if (entityType === 'cash_flow_projection') {
    const workbook = new ExcelJS.Workbook();
    await buildCashFlowProjectionTemplate(workbook, access);
    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  // All other modules use the standard 4-row structure
  const configMap: Record<Exclude<EntityType, 'cash_flow_projection'>, () => TemplateModuleConfig> = {
    balance_sheet: getBalanceSheetConfig,
    income_statement: getIncomeStatementConfig,
    income_statement_projection: getIncomeStatementProjectionConfig,
    weekly_cash_flow: getWeeklyCashFlowConfig,
    realization: getRealizationConfig,
    bank_loan: getBankLoanConfig,
    corporate: getCorporateConfig,
    department: getDepartmentConfig,
    cost_center: getCostCenterConfig,
    project: getProjectConfig,
  };

  const config = configMap[entityType as Exclude<EntityType, 'cash_flow_projection'>]();
  const workbook = new ExcelJS.Workbook();
  const worksheet = buildStandardWorksheet(workbook, config);

  // Fetch DB dropdown data needed for this module
  const dropdownDataForModule = await fetchDropdownDataForResolution(entityType, access);

  const dropdownData = new Map<string, DropdownItem[]>([
    ['corporate_id', dropdownDataForModule.corporateItems],
    ['department_id', dropdownDataForModule.departmentItems],
    ['project_id', dropdownDataForModule.projectItems],
    ['entity_id', dropdownDataForModule.projectItems], // entity_id uses project list
    ['bank_id', dropdownDataForModule.bankItems],
    ['industry', dropdownDataForModule.sectorItems],
    ['currency', dropdownDataForModule.currencyItems],
    ['category', dropdownDataForModule.ccCategoryItems], // cost_center category
  ]);

  applyDropdowns(workbook, worksheet, config, dropdownData);

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
