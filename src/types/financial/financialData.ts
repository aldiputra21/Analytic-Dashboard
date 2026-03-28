// Financial Data Types
// Requirements: 2.1, 2.2, 2.3

export type PeriodType = 'monthly' | 'quarterly' | 'annual';

export interface FinancialData {
  id: string;
  subsidiaryId: string;
  periodType: PeriodType;
  periodStartDate: Date;
  periodEndDate: Date;

  // Income Statement
  revenue: number;
  netProfit: number;
  operatingCashFlow: number;
  interestExpense: number;

  // Balance Sheet
  cash: number;
  inventory: number;
  currentAssets: number;
  totalAssets: number;
  currentLiabilities: number;
  shortTermDebt: number;
  currentPortionLongTermDebt: number;
  totalLiabilities: number;
  totalEquity: number;

  // Metadata
  isRestated: boolean;
  restatementReason?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateFinancialDataInput {
  subsidiaryId: string;
  periodType: PeriodType;
  periodStartDate: Date;
  periodEndDate: Date;
  revenue: number;
  netProfit: number;
  operatingCashFlow: number;
  interestExpense?: number;
  cash: number;
  inventory?: number;
  currentAssets: number;
  totalAssets: number;
  currentLiabilities: number;
  shortTermDebt?: number;
  currentPortionLongTermDebt?: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface UpdateFinancialDataInput extends Partial<CreateFinancialDataInput> {
  restatementReason?: string;
}

export interface BulkImportRow extends CreateFinancialDataInput {
  rowNumber: number;
}

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
