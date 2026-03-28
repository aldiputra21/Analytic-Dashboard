// Bulk Import Service (CSV/Excel)
// Requirements: 2.4, 2.5

import * as XLSX from 'xlsx';
import Database from 'better-sqlite3';
import { CreateFinancialDataInput, BulkImportResult, BulkImportError, PeriodType } from '../../types/financial/financialData';
import { validateFinancialData } from './dataValidator';
import { createFinancialData } from './financialDataService';
import { calculateAndStoreRatios } from './ratioCalculator';

const COLUMN_MAP: Record<string, keyof CreateFinancialDataInput> = {
  subsidiary_id: 'subsidiaryId',
  subsidiaryid: 'subsidiaryId',
  period_type: 'periodType',
  periodtype: 'periodType',
  period_start_date: 'periodStartDate',
  periodstartdate: 'periodStartDate',
  period_end_date: 'periodEndDate',
  periodenddate: 'periodEndDate',
  revenue: 'revenue',
  net_profit: 'netProfit',
  netprofit: 'netProfit',
  operating_cash_flow: 'operatingCashFlow',
  operatingcashflow: 'operatingCashFlow',
  interest_expense: 'interestExpense',
  interestexpense: 'interestExpense',
  cash: 'cash',
  inventory: 'inventory',
  current_assets: 'currentAssets',
  currentassets: 'currentAssets',
  total_assets: 'totalAssets',
  totalassets: 'totalAssets',
  current_liabilities: 'currentLiabilities',
  currentliabilities: 'currentLiabilities',
  short_term_debt: 'shortTermDebt',
  shorttermdebt: 'shortTermDebt',
  current_portion_long_term_debt: 'currentPortionLongTermDebt',
  currentportionlongtermdebt: 'currentPortionLongTermDebt',
  total_liabilities: 'totalLiabilities',
  totalliabilities: 'totalLiabilities',
  total_equity: 'totalEquity',
  totalequity: 'totalEquity',
};

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, '');
}

function parseRow(rawRow: Record<string, any>, rowNumber: number): { input: Partial<CreateFinancialDataInput>; errors: BulkImportError[] } {
  const input: Partial<CreateFinancialDataInput> = {};
  const errors: BulkImportError[] = [];

  for (const [rawKey, value] of Object.entries(rawRow)) {
    const normalized = normalizeKey(rawKey);
    const mappedKey = COLUMN_MAP[normalized];
    if (!mappedKey) continue;

    if (mappedKey === 'periodStartDate' || mappedKey === 'periodEndDate') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push({ rowNumber, field: mappedKey, message: `Invalid date: ${value}` });
      } else {
        (input as any)[mappedKey] = date;
      }
    } else if (mappedKey === 'periodType') {
      (input as any)[mappedKey] = String(value).toLowerCase() as PeriodType;
    } else if (mappedKey === 'subsidiaryId') {
      (input as any)[mappedKey] = String(value);
    } else {
      const num = parseFloat(value);
      if (isNaN(num)) {
        errors.push({ rowNumber, field: mappedKey, message: `${mappedKey} must be a number, got: ${value}` });
      } else {
        (input as any)[mappedKey] = num;
      }
    }
  }

  return { input, errors };
}

/**
 * Processes a bulk import file (CSV or Excel buffer).
 * Validates each row, processes valid rows, returns error report.
 * Requirements: 2.4, 2.5
 */
export function processBulkImport(
  db: Database.Database,
  fileBuffer: Buffer,
  mimeType: string,
  createdBy: string
): BulkImportResult {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

  const allErrors: BulkImportError[] = [];
  let successCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 2; // 1-indexed, row 1 is header
    const { input, errors: parseErrors } = parseRow(rawRows[i], rowNumber);

    if (parseErrors.length > 0) {
      allErrors.push(...parseErrors);
      continue;
    }

    const validation = validateFinancialData(input, rowNumber);
    if (!validation.valid) {
      allErrors.push(...validation.errors);
      continue;
    }

    const result = createFinancialData(db, input as CreateFinancialDataInput, createdBy);
    if (result.error) {
      allErrors.push({ rowNumber, field: 'subsidiaryId+period', message: result.error });
      continue;
    }

    // Trigger ratio calculation for each valid row
    calculateAndStoreRatios(db, result.data!);
    successCount++;
  }

  return {
    successCount,
    errorCount: allErrors.length,
    errors: allErrors,
  };
}
