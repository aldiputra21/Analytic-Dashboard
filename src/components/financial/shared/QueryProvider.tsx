import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Load stale time from environment variable
const STALE_TIME = Number(import.meta.env.VITE_DASHBOARD_STALE_TIME) || 300000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours (inactive)
      refetchOnWindowFocus: false, // Prevent redundant fetches on focus
      retry: 1,
    },
  },
});

/**
 * Provides TanStack Query client to the application.
 */
export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
