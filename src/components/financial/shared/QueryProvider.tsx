// QueryProvider.tsx - Lightweight stale-while-revalidate cache provider
// Requirements: 4.8, 12.2

import React, { createContext, useContext, useCallback, useRef } from 'react';

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
  staleAt: number;
}

interface QueryContextValue {
  get: (key: string) => CacheEntry | undefined;
  set: (key: string, data: unknown, staleTtlMs: number) => void;
  invalidate: (keyPrefix: string) => void;
}

const QueryContext = createContext<QueryContextValue | null>(null);

const DEFAULT_STALE_TTL_MS = 30 * 1000; // 30 seconds stale time

/**
 * Provides a shared in-memory cache with stale-while-revalidate semantics.
 * Components can read stale data immediately while a background refetch occurs.
 */
export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const get = useCallback((key: string): CacheEntry | undefined => {
    return cacheRef.current.get(key);
  }, []);

  const set = useCallback((key: string, data: unknown, staleTtlMs = DEFAULT_STALE_TTL_MS) => {
    cacheRef.current.set(key, {
      data,
      fetchedAt: Date.now(),
      staleAt: Date.now() + staleTtlMs,
    });
  }, []);

  const invalidate = useCallback((keyPrefix: string) => {
    for (const key of cacheRef.current.keys()) {
      if (key.startsWith(keyPrefix)) {
        cacheRef.current.delete(key);
      }
    }
  }, []);

  return (
    <QueryContext.Provider value={{ get, set, invalidate }}>
      {children}
    </QueryContext.Provider>
  );
};

export function useQueryCache(): QueryContextValue {
  const ctx = useContext(QueryContext);
  if (!ctx) throw new Error('useQueryCache must be used within QueryProvider');
  return ctx;
}

/** Returns true if the cache entry is stale (but still usable for SWR) */
export function isStale(entry: CacheEntry): boolean {
  return Date.now() > entry.staleAt;
}
