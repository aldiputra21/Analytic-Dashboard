// src/i18n/ratios.ts - Centralized ratio definitions (labels, units, descriptions)
import { Locale } from './commons';
import { RatioName } from '../types/financial/ratio';

export interface RatioInfo {
  label: string;
  unit: string;
  description: string;
}

export type RatiosCopy = Record<RatioName, RatioInfo>;

export const ratiosI18n: Record<Locale, RatiosCopy> = {
  id: {
    roa: { label: 'ROA', unit: '%', description: 'Return on Assets' },
    roe: { label: 'ROE', unit: '%', description: 'Return on Equity' },
    npm: { label: 'NPM', unit: '%', description: 'Net Profit Margin' },
    der: { label: 'DER', unit: 'x', description: 'Debt-to-Equity Ratio' },
    currentRatio: { label: 'Rasio Lancar', unit: 'x', description: 'Aset Lancar / Liabilitas Lancar' },
    quickRatio: { label: 'Rasio Cepat', unit: 'x', description: '(Aset Lancar - Persediaan) / Liabilitas Lancar' },
    cashRatio: { label: 'Rasio Kas', unit: 'x', description: 'Kas / Liabilitas Lancar' },
    ocfRatio: { label: 'Rasio OCF', unit: 'x', description: 'Arus Kas Operasi / Liabilitas Lancar' },
    dscr: { label: 'DSCR', unit: 'x', description: 'Debt Service Coverage Ratio' },
  },
  en: {
    roa: { label: 'ROA', unit: '%', description: 'Return on Assets' },
    roe: { label: 'ROE', unit: '%', description: 'Return on Equity' },
    npm: { label: 'NPM', unit: '%', description: 'Net Profit Margin' },
    der: { label: 'DER', unit: 'x', description: 'Debt-to-Equity Ratio' },
    currentRatio: { label: 'Current Ratio', unit: 'x', description: 'Current Assets / Current Liabilities' },
    quickRatio: { label: 'Quick Ratio', unit: 'x', description: '(Current Assets - Inventory) / Current Liabilities' },
    cashRatio: { label: 'Cash Ratio', unit: 'x', description: 'Cash / Current Liabilities' },
    ocfRatio: { label: 'OCF Ratio', unit: 'x', description: 'Operating Cash Flow / Current Liabilities' },
    dscr: { label: 'DSCR', unit: 'x', description: 'Debt Service Coverage Ratio' },
  },
};
