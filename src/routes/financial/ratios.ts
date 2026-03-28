// Ratios API Routes
// Requirements: 12.2, 12.4, 8.1, 8.2, 6.1, 6.4, 6.5, 6.6, 6.7

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireFRSAuth } from '../../middleware/frsAuth';
import { authorize } from '../../middleware/frsRbac';
import { mapRowToRatios } from '../../services/financial/ratioCalculator';
import {
  getSubsidiaryRatioTrends,
  getSubsidiaryCAGR,
} from '../../services/financial/trendAnalyzer';
import {
  calculateBenchmarks,
  getIndustryBenchmarkComparison,
} from '../../services/financial/benchmarkingService';
import { RatioName } from '../../types/financial/ratio';
import { PeriodType } from '../../types/financial/financialData';

// Simple in-memory cache with 5-minute TTL
// Requirements: 12.4
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateRatiosCache(subsidiaryId?: string): void {
  if (subsidiaryId) {
    for (const key of cache.keys()) {
      if (key.includes(subsidiaryId)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}

export function createRatiosRouter(db: Database.Database): Router {
  const router = Router();
  router.use(requireFRSAuth);

  /**
   * GET /api/frs/ratios
   * Get calculated ratios with optional filters.
   * Implements 5-minute in-memory cache.
   * Requirements: 12.2, 12.4
   */
  router.get('/', authorize('financial_data', 'read', db), (req: Request, res: Response) => {
    const { subsidiaryId, periodType, startDate, endDate, limit } = req.query as Record<string, string>;

    const cacheKey = `ratios:${subsidiaryId ?? 'all'}:${periodType ?? 'all'}:${startDate ?? ''}:${endDate ?? ''}:${limit ?? ''}`;
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    let sql = `
      SELECT cr.*, fd.period_type, fd.period_start_date, fd.period_end_date, fd.updated_at as data_updated_at
      FROM frs_calculated_ratios cr
      JOIN frs_financial_data fd ON cr.financial_data_id = fd.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subsidiaryId) {
      sql += ' AND cr.subsidiary_id = ?';
      params.push(subsidiaryId);
    }

    // subsidiary_manager: restrict to their subsidiaries
    if (req.frsUser!.role === 'subsidiary_manager') {
      const accessRows = db
        .prepare('SELECT subsidiary_id FROM frs_user_subsidiary_access WHERE user_id = ?')
        .all(req.frsUser!.userId) as any[];
      if (accessRows.length === 0) {
        res.json([]);
        return;
      }
      const placeholders = accessRows.map(() => '?').join(',');
      sql += ` AND cr.subsidiary_id IN (${placeholders})`;
      params.push(...accessRows.map((r) => r.subsidiary_id));
    }

    if (periodType) {
      sql += ' AND fd.period_type = ?';
      params.push(periodType);
    }
    if (startDate) {
      sql += ' AND fd.period_start_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND fd.period_end_date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY fd.period_start_date DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const rows = db.prepare(sql).all(...params) as any[];
    const result = rows.map((row) => ({
      ...mapRowToRatios(row),
      periodType: row.period_type,
      periodStartDate: row.period_start_date,
      periodEndDate: row.period_end_date,
      dataUpdatedAt: row.data_updated_at,
    }));

    setCached(cacheKey, result);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  });

  /**
   * GET /api/frs/ratios/latest
   * Get the most recent ratio for each active subsidiary.
   */
  router.get('/latest', authorize('financial_data', 'read', db), (req: Request, res: Response) => {
    const cacheKey = `ratios:latest:${req.frsUser!.userId}`;
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    const sql = `
      SELECT cr.*, fd.period_type, fd.period_start_date, fd.period_end_date, fd.updated_at as data_updated_at
      FROM frs_calculated_ratios cr
      JOIN frs_financial_data fd ON cr.financial_data_id = fd.id
      JOIN subsidiaries s ON cr.subsidiary_id = s.id
      WHERE s.is_active = 1
        AND fd.period_start_date = (
          SELECT MAX(fd2.period_start_date)
          FROM frs_financial_data fd2
          WHERE fd2.subsidiary_id = cr.subsidiary_id
        )
      ORDER BY s.name ASC
    `;

    const rows = db.prepare(sql).all() as any[];
    const result = rows.map((row) => ({
      ...mapRowToRatios(row),
      periodType: row.period_type,
      periodStartDate: row.period_start_date,
      periodEndDate: row.period_end_date,
      dataUpdatedAt: row.data_updated_at,
    }));

    setCached(cacheKey, result);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  });

  /**
   * GET /api/frs/ratios/trends
   * Returns historical ratio data with moving averages and trend flags.
   * Supports time period filtering: 3m, 6m, 1y, 3y, 5y
   * Requirements: 8.1, 8.2
   */
  router.get('/trends', authorize('financial_data', 'read', db), (req: Request, res: Response) => {
    const { subsidiaryId, ratioName, periodType, period } = req.query as Record<string, string>;

    // Resolve date range from period shorthand
    let startDate: string | undefined;
    const now = new Date();
    if (period) {
      const d = new Date(now);
      switch (period) {
        case '3m': d.setMonth(d.getMonth() - 3); break;
        case '6m': d.setMonth(d.getMonth() - 6); break;
        case '1y': d.setFullYear(d.getFullYear() - 1); break;
        case '3y': d.setFullYear(d.getFullYear() - 3); break;
        case '5y': d.setFullYear(d.getFullYear() - 5); break;
      }
      startDate = d.toISOString().split('T')[0];
    }

    // Determine which subsidiaries to query
    let subsidiaryIds: string[] = [];
    if (subsidiaryId) {
      subsidiaryIds = [subsidiaryId];
    } else {
      const rows = db.prepare('SELECT id FROM subsidiaries WHERE is_active = 1').all() as any[];
      subsidiaryIds = rows.map((r) => r.id);
    }

    // Restrict subsidiary_manager to their assigned subsidiaries
    if (req.frsUser!.role === 'subsidiary_manager') {
      const accessRows = db
        .prepare('SELECT subsidiary_id FROM frs_user_subsidiary_access WHERE user_id = ?')
        .all(req.frsUser!.userId) as any[];
      const allowed = new Set(accessRows.map((r: any) => r.subsidiary_id));
      subsidiaryIds = subsidiaryIds.filter((id) => allowed.has(id));
    }

    const ratioNames: RatioName[] = ratioName
      ? [ratioName as RatioName]
      : ['roa', 'roe', 'npm', 'der', 'currentRatio', 'quickRatio', 'cashRatio', 'ocfRatio', 'dscr'];

    const results: any[] = [];
    for (const subId of subsidiaryIds) {
      for (const rn of ratioNames) {
        const trend = getSubsidiaryRatioTrends(
          db,
          subId,
          rn,
          periodType as PeriodType | undefined,
          startDate,
          undefined
        );
        results.push(trend);
      }

      // Include CAGR data
      const cagr = getSubsidiaryCAGR(db, subId);
      if (cagr.length > 0) {
        results.push({ subsidiaryId: subId, type: 'cagr', data: cagr });
      }
    }

    res.json(results);
  });

  /**
   * GET /api/frs/ratios/benchmark
   * Returns benchmarking data: rankings, portfolio averages, gaps.
   * Requirements: 6.1, 6.4, 6.5, 6.6, 6.7
   */
  router.get('/benchmark', authorize('financial_data', 'read', db), (req: Request, res: Response) => {
    const { periodType, startDate, endDate } = req.query as Record<string, string>;

    const cacheKey = `benchmark:${periodType ?? 'all'}:${startDate ?? ''}:${endDate ?? ''}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    const benchmarks = calculateBenchmarks(db, periodType as PeriodType | undefined, startDate, endDate);
    const industryComparisons = getIndustryBenchmarkComparison(db, periodType as PeriodType | undefined, startDate, endDate);

    const result = { benchmarks, industryComparisons };
    setCached(cacheKey, result);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  });

  return router;
}
