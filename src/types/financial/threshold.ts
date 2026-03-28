// Threshold Types
// Requirements: 5.10, 15.1 - 15.8

import { RatioName } from './ratio';
import { PeriodType } from './financialData';

export type ThresholdStatus = 'healthy' | 'moderate' | 'risky';

export interface Threshold {
  id: string;
  subsidiaryId: string;
  ratioName: RatioName;
  periodType: PeriodType;

  // For ratios where higher is better (ROA, ROE, NPM, Current Ratio, Quick Ratio, Cash Ratio, OCF Ratio, DSCR)
  healthyMin?: number;
  moderateMin?: number;
  riskyMax?: number;

  // For ratios where lower is better (DER)
  healthyMax?: number;
  moderateMax?: number;
  riskyMin?: number;

  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface CreateThresholdInput {
  subsidiaryId: string;
  ratioName: RatioName;
  periodType: PeriodType;
  healthyMin?: number;
  moderateMin?: number;
  riskyMax?: number;
  healthyMax?: number;
  moderateMax?: number;
  riskyMin?: number;
}

// Industry default thresholds per ratio
export interface IndustryDefaults {
  [industrySector: string]: {
    [ratioName: string]: Omit<CreateThresholdInput, 'subsidiaryId' | 'ratioName' | 'periodType'>;
  };
}
