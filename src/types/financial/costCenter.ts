// src/types/financial/costCenter.ts

export interface CostCenter {
  id: string;
  parentId?: string | null;
  category: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date | null;
  createdBy?: string | null;
}

export interface CreateCostCenterInput {
  parentId?: string | null;
  category: string;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCostCenterInput {
  parentId?: string | null;
  category?: string;
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}
