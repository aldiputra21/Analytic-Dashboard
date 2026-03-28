// Subsidiary Types
// Requirements: 1.1, 1.2, 1.3

export interface Subsidiary {
  id: string;
  name: string;
  industrySector: string;
  fiscalYearStartMonth: number; // 1-12
  currency: string;
  taxRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateSubsidiaryInput {
  name: string;
  industrySector: string;
  fiscalYearStartMonth: number;
  currency?: string;
  taxRate: number;
}

export interface UpdateSubsidiaryInput {
  name?: string;
  industrySector?: string;
  fiscalYearStartMonth?: number;
  currency?: string;
  taxRate?: number;
}
