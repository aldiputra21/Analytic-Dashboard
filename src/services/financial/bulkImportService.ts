// Bulk Import Service (CSV/Excel)
// Drizzle ORM PostgreSQL implementation — imports balance sheets & income statements

import * as XLSX from 'xlsx';
import {
  saveBalanceSheet,
  saveIncomeStatement,
  BalanceSheetInput,
  IncomeStatementInput,
} from '../mafinda/financialStatementService';

export interface BulkImportError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface BulkImportResult {
  successCount: number;
  errorCount: number;
  errors: BulkImportError[];
}

// Column mapping: CSV/Excel header → { target: 'bs' | 'is', field }
const COLUMN_MAP: Record<string, { target: 'bs' | 'is' | 'meta'; field: string }> = {
  department_id:            { target: 'meta', field: 'departmentId' },
  departmentid:             { target: 'meta', field: 'departmentId' },
  period:                   { target: 'meta', field: 'period' },
  // Balance sheet fields
  cash_and_bank:            { target: 'bs', field: 'cashAndBank' },
  cashandbank:              { target: 'bs', field: 'cashAndBank' },
  cash:                     { target: 'bs', field: 'cashAndBank' },
  accounts_receivable:      { target: 'bs', field: 'accountsReceivable' },
  accountsreceivable:       { target: 'bs', field: 'accountsReceivable' },
  work_in_progress:         { target: 'bs', field: 'workInProgress' },
  workinprogress:           { target: 'bs', field: 'workInProgress' },
  inventory:                { target: 'bs', field: 'inventory' },
  prepaid_expenses:         { target: 'bs', field: 'prepaidExpenses' },
  prepaidexpenses:          { target: 'bs', field: 'prepaidExpenses' },
  land:                     { target: 'bs', field: 'land' },
  building:                 { target: 'bs', field: 'building' },
  equipment:                { target: 'bs', field: 'equipment' },
  other_fixed_assets:       { target: 'bs', field: 'otherFixedAssets' },
  otherfixedassets:         { target: 'bs', field: 'otherFixedAssets' },
  accounts_payable:         { target: 'bs', field: 'accountsPayable' },
  accountspayable:          { target: 'bs', field: 'accountsPayable' },
  bank_loan_current:        { target: 'bs', field: 'bankLoanCurrent' },
  bankloancurrent:          { target: 'bs', field: 'bankLoanCurrent' },
  other_current_liabilities: { target: 'bs', field: 'otherCurrentLiabilities' },
  othercurrentliabilities:  { target: 'bs', field: 'otherCurrentLiabilities' },
  bank_loan_long_term:      { target: 'bs', field: 'bankLoanLongTerm' },
  bankloanlongterm:         { target: 'bs', field: 'bankLoanLongTerm' },
  other_long_term_liabilities: { target: 'bs', field: 'otherLongTermLiabilities' },
  otherlongtermliabilities: { target: 'bs', field: 'otherLongTermLiabilities' },
  shareholder_loan:         { target: 'bs', field: 'shareholderLoan' },
  shareholderloan:          { target: 'bs', field: 'shareholderLoan' },
  capital:                  { target: 'bs', field: 'capital' },
  earnings_after_tax:       { target: 'bs', field: 'earningsAfterTax' },
  earningsaftertax:         { target: 'bs', field: 'earningsAfterTax' },
  retained_earnings:        { target: 'bs', field: 'retainedEarnings' },
  retainedearnings:         { target: 'bs', field: 'retainedEarnings' },
  dividends:                { target: 'bs', field: 'dividends' },
  // Income statement fields
  revenue:                  { target: 'is', field: 'revenue' },
  cogs:                     { target: 'is', field: 'cogs' },
  cost_of_goods_sold:       { target: 'is', field: 'cogs' },
  operating_expenses:       { target: 'is', field: 'operatingExpenses' },
  operatingexpenses:        { target: 'is', field: 'operatingExpenses' },
  interest_expense:         { target: 'is', field: 'interestExpense' },
  interestexpense:          { target: 'is', field: 'interestExpense' },
  tax_expense:              { target: 'is', field: 'taxExpense' },
  taxexpense:               { target: 'is', field: 'taxExpense' },
};

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, '');
}

/**
 * Processes a bulk import file (CSV or Excel buffer).
 * Each row is split into a balance sheet record and an income statement record.
 */
export async function processBulkImport(
  fileBuffer: Buffer,
  _mimeType: string,
  createdBy: string,
): Promise<BulkImportResult> {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

  const allErrors: BulkImportError[] = [];
  let successCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 2; // 1-indexed, row 1 is header
    const rawRow = rawRows[i];

    const meta: Record<string, string> = {};
    const bsFields: Record<string, string> = {};
    const isFields: Record<string, string> = {};
    const rowErrors: BulkImportError[] = [];

    for (const [rawKey, value] of Object.entries(rawRow)) {
      const normalized = normalizeKey(rawKey);
      const mapping = COLUMN_MAP[normalized];
      if (!mapping) continue;

      if (mapping.target === 'meta') {
        meta[mapping.field] = String(value ?? '');
      } else {
        const num = parseFloat(String(value));
        if (isNaN(num)) {
          rowErrors.push({ rowNumber, field: mapping.field, message: `${mapping.field} must be a number, got: ${value}` });
        } else {
          const strVal = num.toFixed(2);
          if (mapping.target === 'bs') bsFields[mapping.field] = strVal;
          else isFields[mapping.field] = strVal;
        }
      }
    }

    if (!meta.departmentId) {
      rowErrors.push({ rowNumber, field: 'departmentId', message: 'departmentId is required' });
    }
    if (!meta.period || !/^\d{4}-\d{2}$/.test(meta.period)) {
      rowErrors.push({ rowNumber, field: 'period', message: 'period must be in YYYY-MM format' });
    }

    if (rowErrors.length > 0) {
      allErrors.push(...rowErrors);
      continue;
    }

    try {
      // Save balance sheet if any BS fields are present
      if (Object.keys(bsFields).length > 0) {
        const bsInput: BalanceSheetInput = {
          departmentId: meta.departmentId,
          period: meta.period,
          ...bsFields,
        };
        await saveBalanceSheet(bsInput, createdBy);
      }

      // Save income statement if any IS fields are present
      if (Object.keys(isFields).length > 0) {
        const isInput: IncomeStatementInput = {
          departmentId: meta.departmentId,
          period: meta.period,
          ...isFields,
        };
        await saveIncomeStatement(isInput, createdBy);
      }

      successCount++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      allErrors.push({ rowNumber, field: 'save', message });
    }
  }

  return {
    successCount,
    errorCount: allErrors.length,
    errors: allErrors,
  };
}
