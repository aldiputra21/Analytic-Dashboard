import { HealthThresholds } from "./types";

export const HEALTH_THRESHOLDS: HealthThresholds = {
  roa: { healthy: 5, moderate: 2 },
  roe: { healthy: 15, moderate: 8 },
  npm: { healthy: 10, moderate: 5 },
  der: { healthy: 1, moderate: 2 },
  current_ratio: { healthy: 1.5, moderate: 1 },
  quick_ratio: { healthy: 1, moderate: 0.8 },
  cash_ratio: { healthy: 0.5, moderate: 0.2 },
  ocf_ratio: { healthy: 0.2, moderate: 0.1 },
};

export const COMPANY_COLORS = {
  ASI: {
    primary: "#0f172a",
    secondary: "#334155",
    light: "#f8fafc",
  },
  TSI: {
    primary: "#1e293b",
    secondary: "#475569",
    light: "#f1f5f9",
  },
  SUB3: {
    primary: "#7c3aed",
    secondary: "#a78bfa",
    light: "#f5f3ff",
  },
  SUB4: {
    primary: "#059669",
    secondary: "#34d399",
    light: "#f0fdf4",
  },
  SUB5: {
    primary: "#dc2626",
    secondary: "#f87171",
    light: "#fef2f2",
  }
};

export const TIME_RANGES = [
  { label: '3 Months', value: '3m', months: 3 },
  { label: '6 Months', value: '6m', months: 6 },
  { label: '1 Year', value: '1y', months: 12 },
  { label: '2 Years', value: '2y', months: 24 },
  { label: '3 Years', value: '3y', months: 36 },
  { label: '5 Years', value: '5y', months: 60 },
];
