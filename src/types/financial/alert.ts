// Alert Types
// Requirements: 5.1 - 5.9

import { RatioName } from './ratio';

export type AlertSeverity = 'high' | 'medium' | 'low';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  subsidiaryId: string;
  financialDataId: string;
  ratioName: RatioName | string;
  severity: AlertSeverity;
  currentValue: number;
  thresholdValue: number;
  message: string;
  status: AlertStatus;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdAt: Date;
}

export interface CreateAlertInput {
  subsidiaryId: string;
  financialDataId: string;
  ratioName: string;
  severity: AlertSeverity;
  currentValue: number;
  thresholdValue: number;
  message: string;
}
