/**
 * installmentScheduler.ts
 * Pure functions for generating and validating bank loan installment schedules.
 * No DB calls — easy to unit test.
 *
 * Feature: cfd-financial-enhancements
 * Requirements: 5.2, 5.3, 5.4, 5.5
 */

export interface InstallmentRecord {
  bankLoanId: string;
  installmentDate: string; // 'YYYY-MM-DD'
  amount: number;
  status: 'unpaid';
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Adds k months to a 'YYYY-MM-DD' date string.
 * Handles month-end edge cases by clamping to the last day of the target month.
 */
function addMonths(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1 + months, day);

  // If day overflowed into the next month, clamp to last day of target month
  const targetMonth = ((month - 1 + months) % 12 + 12) % 12;
  if (date.getMonth() !== targetMonth) {
    // Clamp: set to last day of the intended month
    date.setDate(0);
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generates a flat installment schedule for a bank loan.
 *
 * @param loanId - UUID of the bank loan
 * @param startDate - Loan start date in 'YYYY-MM-DD' format
 * @param tenor - Number of installments (months)
 * @param installmentAmount - Fixed amount per installment
 * @returns Array of `tenor` installment records ready for DB insertion (without `id`)
 *
 * Requirements: 5.2, 5.3
 */
export function generateFlatInstallments(
  loanId: string,
  startDate: string,
  tenor: number,
  installmentAmount: number,
): InstallmentRecord[] {
  const installments: InstallmentRecord[] = [];

  for (let k = 1; k <= tenor; k++) {
    installments.push({
      bankLoanId: loanId,
      installmentDate: addMonths(startDate, k),
      amount: installmentAmount,
      status: 'unpaid',
    });
  }

  return installments;
}

/**
 * Validates a set of effective installments against the loan amount and tenor.
 *
 * @param installments - Array of installment objects with at least an `amount` field
 * @param tenor - Expected number of installments
 * @param loanAmount - Total loan amount to validate against
 * @returns `{ valid: true }` or `{ valid: false, error: string }`
 *
 * Requirements: 5.4, 5.5
 */
export function validateEffectiveInstallments(
  installments: { amount: number }[],
  tenor: number,
  loanAmount: number,
): ValidationResult {
  if (installments.length !== tenor) {
    return {
      valid: false,
      error: `Number of installments (${installments.length}) must equal tenor (${tenor})`,
    };
  }

  const sum = installments.reduce((acc, inst) => acc + inst.amount, 0);
  if (Math.abs(sum - loanAmount) > 0.01) {
    return {
      valid: false,
      error: `Total installment amount (${sum.toFixed(2)}) must equal loan amount (${loanAmount.toFixed(2)}) with tolerance 0.01`,
    };
  }

  return { valid: true };
}
