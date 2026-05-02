/**
 * Centralized query keys for React Query to ensure consistency and easy invalidation.
 */
export const DASHBOARD_QUERY_KEYS = {
  corporates: ['corporates'],
  ratios: (filters: any) => ['ratios', filters],
  latestRatios: (period: string) => ['ratios', 'latest', period],
  mafindaDashboard: (filters: any) => ['mafinda', 'dashboard', filters],
  departments: ['departments'],
  projects: ['projects'],
};
