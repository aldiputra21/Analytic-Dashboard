// Ratios API Routes
// Requirements: 12.2, 12.4, 8.1, 8.2, 6.1, 6.4, 6.5, 6.6, 6.7

import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors.js';
import { mapRowToRatios, calculateHealthScore } from '../../services/financial/ratioCalculator';
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
import { corporates } from '../../db/schema/public';
import { eq, sql } from 'drizzle-orm';

// Simple in-memory cache with 5-minute TTL
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
    // if (departmentId) {
    //   conditions.push(sql`department_id = ${departmentId}`);
    // }

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

    const resolvePeriodLimit = (p: string | undefined, isEnd: boolean) => {
      if (!p || (!p.includes('-Q') && !p.includes('-S'))) return p;
      const [year, part] = p.split('-');
      if (part === 'Q1') return isEnd ? `${year}-03` : `${year}-01`;
      if (part === 'Q2') return isEnd ? `${year}-06` : `${year}-04`;
      if (part === 'Q3') return isEnd ? `${year}-09` : `${year}-07`;
      if (part === 'Q4') return isEnd ? `${year}-12` : `${year}-10`;
      if (part === 'S1') return isEnd ? `${year}-06` : `${year}-01`;
      if (part === 'S2') return isEnd ? `${year}-12` : `${year}-07`;
      return p;
    };

    const resolvedStart = resolvePeriodLimit(startDate, false);
    const resolvedEnd = resolvePeriodLimit(endDate, true);

    if (resolvedStart) {
      conditions.push(sql`period >= ${resolvedStart}`);
    }
    if (resolvedEnd) {
      conditions.push(sql`period <= ${resolvedEnd}`);
    }

    const whereClause = sql.join(conditions, sql` AND `);
    const limitClause = limit ? sql` LIMIT ${parseInt(limit)}` : sql``;

    const rows = (await db.execute(sql`
      SELECT vr.*, c.name as corporate_name
      FROM cfd.v_financial_ratios vr
      JOIN public.corporates c ON vr.corporate_id = c.id
      WHERE ${whereClause}
      ORDER BY vr.period DESC
      ${limitClause}
    `)).rows as any[];

    const result = rows.map((row: any) => {
      const ratios = mapRowToRatios(row);
      // Calculate health score if missing from view
      if (ratios.healthScore === 0) {
        ratios.healthScore = calculateHealthScore(ratios);
      }
      return {
        ...ratios,
        corporateId: row.corporate_id,
        period: row.period,
        periodType: 'monthly',
        periodStartDate: `${row.period}-01`,
        periodEndDate: `${row.period}-31`, // Simple approximation
        dataUpdatedAt: row.updated_at ?? new Date().toISOString(),
      };
    });

    setCached(cacheKey, result);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  }));

  /**
   * GET /api/frs/ratios/latest
   * Get the most recent ratio for each active corporate.
   */
  router.get('/latest', requirePermission('cfd.dashboard.read'), asyncHandler(async (req: Request, res: Response) => {
    const { period } = req.query as Record<string, string>;
    const cacheKey = `ratios:latest:${req.user!.userId}:${period ?? 'current'}`;
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    // Resolve period to YYYY-MM if it's a quarter or semester
    let resolvedPeriod = period;
    if (period && (period.includes('-Q') || period.includes('-S'))) {
      const [year, part] = period.split('-');
      if (part === 'Q1') resolvedPeriod = `${year}-03`;
      else if (part === 'Q2') resolvedPeriod = `${year}-06`;
      else if (part === 'Q3') resolvedPeriod = `${year}-09`;
      else if (part === 'Q4') resolvedPeriod = `${year}-12`;
      else if (part === 'S1') resolvedPeriod = `${year}-06`;
      else if (part === 'S2') resolvedPeriod = `${year}-12`;
    }

    const access = req.accessContext!;
    let accessClause = sql`1=1`;
    if (access.scope !== 'system') {
      accessClause = sql`c.id IN (${sql.join(access.corporateIds.map(id => sql`${id}`), sql`, `)})`;
    }

    let periodFilter = resolvedPeriod ? sql`AND vr2.period <= ${resolvedPeriod}` : sql``;
    
    // If a specific year was provided in the period (e.g. "2027-Q1"), 
    // ensure we only fetch data from that year onwards.
    if (period && period.includes('-')) {
      const year = period.split('-')[0];
      periodFilter = sql`${periodFilter} AND vr2.period >= ${year + '-01'}`;
    }

    const rows = (await db.execute(sql`
      SELECT vr.*, c.name as corporate_name
      FROM cfd.v_financial_ratios vr
      JOIN public.corporates c ON vr.corporate_id = c.id
      WHERE c.is_active = true
        AND ${accessClause}
        AND vr.period = (
          SELECT MAX(vr2.period)
          FROM cfd.v_financial_ratios vr2
          WHERE vr2.corporate_id = vr.corporate_id
          ${periodFilter}
        )
      ORDER BY c.name ASC
    `)).rows as any[];

    const result = rows.map((row: any) => {
      const ratios = mapRowToRatios(row);
      // Calculate health score if missing from view
      if (ratios.healthScore === 0) {
        ratios.healthScore = calculateHealthScore(ratios);
      }
      return {
        ...ratios,
        corporateId: row.corporate_id,
        period: row.period,
        periodType: 'monthly',
        periodStartDate: `${row.period}-01`,
        periodEndDate: `${row.period}-31`,
        dataUpdatedAt: row.updated_at ?? new Date().toISOString(),
      };
    });

    setCached(cacheKey, result);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  }));

  /**
   * GET /api/frs/ratios/trends
   */
  router.get('/trends', requirePermission('cfd.trends.read'), asyncHandler(async (req: Request, res: Response) => {
    const { corporateId, ratioName, period } = req.query as Record<string, string>;
    const access = req.accessContext!;

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

    let corporateIds: string[];
    if (corporateId) {
      if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }
      corporateIds = [corporateId];
    } else {
      if (access.scope === 'system') {
        const rows = await db.select({ id: corporates.id }).from(corporates).where(eq(corporates.isActive, true));
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
        const trend = await getSubsidiaryRatioTrends(corpId, rn, startDate, undefined);
        results.push(trend);
      }
      const cagr = await getSubsidiaryCAGR(corpId);
      if (cagr.length > 0) {
        results.push({ corporateId: corpId, type: 'cagr', data: cagr });
      }
    }

    res.json(results);
  }));

  /**
   * GET /api/frs/ratios/benchmark
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
