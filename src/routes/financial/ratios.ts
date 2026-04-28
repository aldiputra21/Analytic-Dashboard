// Ratios API Routes
// Requirements: 12.2, 12.4, 8.1, 8.2, 6.1, 6.4, 6.5, 6.6, 6.7

import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors.js';
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
import { db } from '../../db/connection';
import { userCorporateAccesses, corporates } from '../../db/schema/public';
import { eq, and, sql } from 'drizzle-orm';

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

export function invalidateRatiosCache(corporateId?: string): void {
  if (corporateId) {
    for (const key of cache.keys()) {
      if (key.includes(corporateId)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}

export function createRatiosRouter(): Router {
  const router = Router();

  /**
   * GET /api/frs/ratios
   * Get calculated ratios with optional filters.
   * Implements 5-minute in-memory cache.
   * Requirements: 12.2, 12.4
   */
  router.get('/', requirePermission('cfd.dashboard.read'), asyncHandler(async (req: Request, res: Response) => {
    const { corporateId, departmentId, startDate, endDate, limit } = req.query as Record<string, string>;

    const cacheKey = `ratios:${corporateId ?? 'all'}:${departmentId ?? 'all'}:${startDate ?? ''}:${endDate ?? ''}:${limit ?? ''}`;
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    const conditions: ReturnType<typeof sql>[] = [sql`1=1`];

    if (corporateId) {
      conditions.push(sql`corporate_id = ${corporateId}`);
    }
    if (departmentId) {
      conditions.push(sql`department_id = ${departmentId}`);
    }

    // Context Filtering
    const access = req.accessContext!;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }
      if (!corporateId) {
        conditions.push(sql`corporate_id IN (${sql.join(access.corporateIds.map(id => sql`${id}`), sql`, `)})`);
      }
    }

    if (startDate) {
      conditions.push(sql`period >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`period <= ${endDate}`);
    }

    const whereClause = sql.join(conditions, sql` AND `);
    const limitClause = limit ? sql` LIMIT ${parseInt(limit)}` : sql``;

    const rows = (await db.execute(sql`
      SELECT * FROM cfd.v_financial_ratios
      WHERE ${whereClause}
      ORDER BY period DESC
      ${limitClause}
    `)).rows as any[];

    const result = rows.map((row: any) => ({
      ...mapRowToRatios(row),
      corporateId: row.corporate_id,
      period: row.period,
    }));

    setCached(cacheKey, result);
    res.setHeader('X-Cache', 'HIT');
    res.json(result);
  }));

  /**
   * GET /api/frs/ratios/latest
   * Get the most recent ratio for each active corporate.
   */
  router.get('/latest', requirePermission('cfd.dashboard.read'), asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = `ratios:latest:${req.user!.userId}`;
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    const access = req.accessContext!;
    let accessClause = sql`1=1`;
    if (access.scope !== 'system') {
      accessClause = sql`c.id IN (${sql.join(access.corporateIds.map(id => sql`${id}`), sql`, `)})`;
    }

    const rows = (await db.execute(sql`
      SELECT vr.*
      FROM cfd.v_financial_ratios vr
      JOIN public.corporates c ON vr.corporate_id = c.id
      WHERE c.is_active = true
        AND ${accessClause}
        AND vr.period = (
          SELECT MAX(vr2.period)
          FROM cfd.v_financial_ratios vr2
          WHERE vr2.corporate_id = vr.corporate_id
        )
      ORDER BY c.name ASC
    `)).rows as any[];

    const result = rows.map((row: any) => ({
      ...mapRowToRatios(row),
      corporateId: row.corporate_id,
      period: row.period,
    }));

    setCached(cacheKey, result);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  }));

  /**
   * GET /api/frs/ratios/trends
   * Returns historical ratio data with moving averages and trend flags.
   * Supports time period filtering: 3m, 6m, 1y, 3y, 5y
   * Requirements: 8.1, 8.2
   */
  router.get('/trends', requirePermission('cfd.trends.read'), asyncHandler(async (req: Request, res: Response) => {
    const { corporateId, ratioName, period } = req.query as Record<string, string>;

    const access = req.accessContext!;

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

    // Determine which corporates to query
    let corporateIds: string[];
    if (corporateId) {
      // Validate access to specific corporate
      if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }
      corporateIds = [corporateId];
    } else {
      if (access.scope === 'system') {
        const rows = await db
          .select({ id: corporates.id })
          .from(corporates)
          .where(eq(corporates.isActive, true));
        corporateIds = rows.map((r) => r.id);
      } else {
        corporateIds = access.corporateIds;
      }
    }

    const ratioNames: RatioName[] = ratioName
      ? [ratioName as RatioName]
      : ['roa', 'roe', 'npm', 'der', 'currentRatio', 'quickRatio', 'cashRatio', 'ocfRatio', 'dscr'];

    const results: any[] = [];
    for (const corpId of corporateIds) {
      for (const rn of ratioNames) {
        const trend = await getSubsidiaryRatioTrends(
          corpId,
          rn,
          startDate,
          undefined
        );
        results.push(trend);
      }

      // Include CAGR data
      const cagr = await getSubsidiaryCAGR(corpId);
      if (cagr.length > 0) {
        results.push({ corporateId: corpId, type: 'cagr', data: cagr });
      }
    }

    res.json(results);
  }));

  /**
   * GET /api/frs/ratios/benchmark
   * Returns benchmarking data: rankings, portfolio averages, gaps.
   * Requirements: 6.1, 6.4, 6.5, 6.6, 6.7
   */
  router.get('/benchmark', requirePermission('cfd.benchmarking.read'), asyncHandler(async (req: Request, res: Response) => {
    const access = req.accessContext!;
    const cacheKey = `benchmark:${req.user!.userId}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    const benchmarks = await calculateBenchmarks(access);
    const industryComparisons = await getIndustryBenchmarkComparison(access);

    const result = { benchmarks, industryComparisons };
    setCached(cacheKey, result);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  }));

  return router;
}
