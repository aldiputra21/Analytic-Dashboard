// Financial Data Validator (Data_Validator)
// Requirements: 2.1, 2.2, 2.7

import { CreateFinancialDataInput, BulkImportError } from '../../types/financial/financialData';

const REQUIRED_FIELDS: (keyof CreateFinancialDataInput)[] = [
  'subsidiaryId',
  'periodType',
  'periodStartDate',
  'periodEndDate',
  'revenue',
  'netProfit',
  'operatingCashFlow',
  'cash',
  'currentAssets',
  'currentLiabilities',
  'totalAssets',
  'totalEquity',
  'totalLiabilities',
];

const ACCOUNTING_TOLERANCE = 0.0001; // 0.01%

export interface ValidationResult {
  valid: boolean;
  errors: BulkImportError[];
}

/**
 * Validates a single financial data input.
 * Checks required fields and accounting equation.
 * Requirements: 2.1, 2.2
 */
export function validateFinancialData(
  input: Partial<CreateFinancialDataInput>,
  rowNumber = 0
): ValidationResult {
  const errors: BulkImportError[] = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    const value = (input as any)[field];
    if (value == null || value === '') {
      errors.push({ rowNumber, field, message: `${field} is required` });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate period type
  if (!['monthly', 'quarterly', 'annual'].includes(input.periodType!)) {
    errors.push({ rowNumber, field: 'periodType', message: 'periodType must be monthly, quarterly, or annual' });
  }

  // Validate numeric fields are non-negative where applicable
  const nonNegativeFields: (keyof CreateFinancialDataInput)[] = [
    'revenue', 'cash', 'currentAssets', 'totalAssets', 'currentLiabilities', 'totalLiabilities', 'totalEquity',
  ];
  for (const field of nonNegativeFields) {
    const value = (input as any)[field];
    if (typeof value === 'number' && value < 0) {
      errors.push({ rowNumber, field, message: `${field} must be non-negative` });
    }
  }

  // Validate accounting equation: total_assets = total_equity + total_liabilities within 0.01%
  if (errors.length === 0) {
    const { totalAssets, totalEquity, totalLiabilities } = input as CreateFinancialDataInput;
    const expected = totalEquity + totalLiabilities;
    const tolerance = Math.abs(expected) * ACCOUNTING_TOLERANCE;
    if (Math.abs(totalAssets - expected) > tolerance) {
      errors.push({
        rowNumber,
        field: 'totalAssets',
        message: `Accounting equation violated: totalAssets (${totalAssets}) must equal totalEquity (${totalEquity}) + totalLiabilities (${totalLiabilities}) within 0.01% tolerance`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
