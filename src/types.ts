export interface Company {
  id: string;
  name: string;
  color: string;
  industry?: string;
  fiscal_year_start?: string;
  currency?: string;
  tax_rate?: number;
  status?: 'Active' | 'Inactive';
  thresholds?: {
    liquidity_drop: number;
    der_rise: number;
    margin_drop_months: number;
  };
  ideal_ratios?: {
    current_ratio: number;
    quick_ratio: number;
    der: number;
    npm: number;
  };
}

export interface FinancialRatio {
  company_id: string;
  period: string;
  revenue: number;
  net_profit: number;
  operating_cash_flow: number;
  cash: number;
  current_assets: number;
  current_liabilities: number;
  quick_assets: number;
  ar_aging_90_plus: number;
  interest_expense: number;
  short_term_debt: number;
  long_term_debt: number;
  roa: number;
  roe: number;
  npm: number;
  der: number;
  current_ratio: number;
  quick_ratio: number;
  cash_ratio: number;
  ocf_ratio: number;
  dscr: number;
}

export interface User {
  id: number;
  username: string;
  role_id: string;
  role_name: string;
  status: 'Active' | 'Inactive';
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export type PeriodType = 'monthly' | 'quarterly' | 'yearly';

export interface HealthThresholds {
  [key: string]: {
    healthy: number;
    moderate: number;
  };
}
