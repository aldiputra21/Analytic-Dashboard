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
  }
};
