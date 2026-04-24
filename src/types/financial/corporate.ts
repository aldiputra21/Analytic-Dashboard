// src/types/financial/corporate.ts

export interface Corporate {
  id: string;
  name: string;
  code: string;
  logo?: string | null;
  industrySector: string;
  fiscalYearStartMonth: number; // 1-12
  currency: string;
  taxRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateCorporateInput {
  name: string;
  code: string;
  logo?: string;
  industrySector: string;
  fiscalYearStartMonth: number;
  currency?: string;
  taxRate: number;
}

export interface UpdateCorporateInput {
  name?: string;
  code?: string;
  logo?: string;
  industrySector?: string;
  fiscalYearStartMonth?: number;
  currency?: string;
  taxRate?: number;
  isActive?: boolean;
}
