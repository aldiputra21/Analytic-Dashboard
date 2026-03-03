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

export interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  entity_type: 'financial_data' | 'company' | 'user' | 'threshold';
  entity_id: string;
  company_id?: string;
  period?: string;
  changed_fields?: string;
  old_values?: string;
  new_values?: string;
  justification?: string;
  timestamp: string;
}

export interface TimeRange {
  label: string;
  value: string;
  months: number;
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

export interface IncomeStatementInput {
  revenue: number;
  cogs: number;
  gross_profit: number;
  operating_expenses: number;
  ebit: number;
  interest_expense: number;
  tax: number;
  net_profit: number;
}

export interface BalanceSheetInput {
  // Aset Lancar
  kas: number;
  deposito: number;
  piutang_usaha: number;
  piutang_lainnya: number;
  uang_muka: number;
  pekerjaan_dalam_proses: number;
  pajak_dibayar_dimuka: number;
  beban_dibayar_dimuka: number;
  aset_lancar: number;
  
  // Aset Tidak Lancar
  aset_tetap: number;
  aset_tak_berwujud: number;
  aset_lain: number;
  aset_tak_lancar: number;
  
  // Total Aset
  total_aset: number;
  
  // Kewajiban Jangka Pendek
  utang_usaha: number;
  utang_pajak: number;
  utang_pembiayaan_pendek: number;
  beban_ymhd_pendek: number;
  utang_bank_pendek: number;
  jumlah_kewajiban_pendek: number;
  
  // Kewajiban Jangka Panjang
  utang_pemg_saham: number;
  beban_ymhd_panjang: number;
  utang_bank_panjang: number;
  utang_pembiayaan_panjang: number;
  utang_lainnya: number;
  jumlah_kewajiban_panjang: number;
  
  // Total Kewajiban
  jumlah_kewajiban: number;
  
  // Ekuitas
  modal_saham: number;
  laba_ditahan_ditentukan: number;
  laba_ditahan_belum_ditentukan: number;
  lr_tahun_berjalan: number;
  jumlah_ekuitas: number;
  
  // Total Kewajiban & Ekuitas
  jumlah_kewajiban_ekuitas: number;
}

export interface CashFlowInput {
  operating_cash_flow: number;
  investing_cash_flow: number;
  financing_cash_flow: number;
  net_cash_flow: number;
}
