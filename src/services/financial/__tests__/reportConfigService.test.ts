// Tests for reportConfigService
// Covers: unit tests for validateReportQuery (4.1),
//         PBT for validateReportQuery idempotency (4.2),
//         PBT for filterReportConfigs case-insensitive search (4.3)

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateReportQuery,
  stripSqlComments,
  filterReportConfigs,
  filterConfigSchema,
  columnConfigSchema,
} from '../reportConfigService.js';
import { z } from 'zod';

// ============================================================================
// 4.1 Unit tests for validateReportQuery
// ============================================================================

describe('validateReportQuery — unit tests', () => {
  it('accepts a simple SELECT query', () => {
    const result = validateReportQuery('SELECT * FROM users');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts a SELECT query with leading whitespace', () => {
    const result = validateReportQuery('   SELECT id FROM orders');
    expect(result.valid).toBe(true);
  });

  it('accepts a SELECT query with mixed case SELECT keyword', () => {
    const result = validateReportQuery('select id from orders');
    expect(result.valid).toBe(true);
  });

  it('rejects an empty query', () => {
    const result = validateReportQuery('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a query that starts with whitespace and non-SELECT keyword', () => {
    const result = validateReportQuery('  INSERT INTO users VALUES (1)');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('SELECT');
  });

  it('rejects a query starting with INSERT', () => {
    const result = validateReportQuery('INSERT INTO users VALUES (1)');
    expect(result.valid).toBe(false);
  });

  it('rejects a query starting with UPDATE', () => {
    const result = validateReportQuery('UPDATE users SET name = "x"');
    expect(result.valid).toBe(false);
  });

  it('rejects a SELECT query that contains INSERT as a whole word', () => {
    const result = validateReportQuery('SELECT * FROM users; INSERT INTO logs VALUES (1)');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('INSERT');
  });

  it('rejects a SELECT query that contains DROP as a whole word', () => {
    const result = validateReportQuery('SELECT * FROM users WHERE DROP = 1');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('DROP');
  });

  it('rejects a SELECT query that contains DELETE as a whole word', () => {
    const result = validateReportQuery('SELECT * FROM t WHERE DELETE = 1');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('DELETE');
  });

  it('rejects a SELECT query that contains TRUNCATE', () => {
    const result = validateReportQuery('SELECT 1; TRUNCATE TABLE users');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('TRUNCATE');
  });

  it('rejects a SELECT query that contains EXEC', () => {
    const result = validateReportQuery('SELECT 1; EXEC sp_something');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('EXEC');
  });

  it('does NOT reject a query where dangerous keyword appears as substring (not whole word)', () => {
    // "EXECUTOR" contains "EXEC" but is not a whole-word match
    const result = validateReportQuery('SELECT executor_name FROM jobs');
    expect(result.valid).toBe(true);
  });

  it('strips -- line comments before validation', () => {
    // After stripping, this becomes "SELECT * FROM users"
    const result = validateReportQuery('SELECT * FROM users -- WHERE id = 1');
    expect(result.valid).toBe(true);
  });

  it('strips /* */ block comments before validation', () => {
    const result = validateReportQuery('SELECT /* comment */ * FROM users');
    expect(result.valid).toBe(true);
  });

  it('strips block comment that hides a dangerous keyword', () => {
    // The INSERT is inside a comment, so after stripping it should be gone
    const result = validateReportQuery('SELECT * FROM users /* INSERT INTO logs */ WHERE id = 1');
    expect(result.valid).toBe(true);
  });

  it('strips -- comment that hides a dangerous keyword', () => {
    const result = validateReportQuery('SELECT * FROM users -- INSERT INTO logs');
    expect(result.valid).toBe(true);
  });

  it('rejects a query with dangerous keyword in uppercase', () => {
    const result = validateReportQuery('SELECT * FROM t; ALTER TABLE t ADD COLUMN x INT');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('ALTER');
  });

  it('rejects a query with dangerous keyword in lowercase', () => {
    const result = validateReportQuery('SELECT * FROM t; alter table t add column x int');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('ALTER');
  });

  it('rejects a query with VACUUM keyword', () => {
    const result = validateReportQuery('SELECT 1; VACUUM ANALYZE users');
    expect(result.valid).toBe(false);
  });

  it('returns error message mentioning the specific dangerous keyword', () => {
    const result = validateReportQuery('SELECT * FROM t; GRANT ALL ON t TO user1');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('GRANT');
  });
});

// ============================================================================
// stripSqlComments unit tests
// ============================================================================

describe('stripSqlComments', () => {
  it('removes -- line comments', () => {
    const result = stripSqlComments('SELECT * FROM t -- this is a comment');
    expect(result).toBe('SELECT * FROM t ');
  });

  it('removes /* */ block comments', () => {
    const result = stripSqlComments('SELECT /* block */ * FROM t');
    expect(result).toBe('SELECT  * FROM t');
  });

  it('removes multi-line block comments', () => {
    const result = stripSqlComments('SELECT *\n/* multi\nline\ncomment */\nFROM t');
    expect(result).toBe('SELECT *\n\nFROM t');
  });

  it('returns unchanged string when no comments', () => {
    const result = stripSqlComments('SELECT * FROM t WHERE id = 1');
    expect(result).toBe('SELECT * FROM t WHERE id = 1');
  });
});

// ============================================================================
// 4.2 Property test: validateReportQuery is idempotent
// Validates: Requirements 3.1, 3.2, 3.3
// ============================================================================

describe('Property 1: validateReportQuery is idempotent', () => {
  it('returns the same result when called twice on the same query', () => {
    fc.assert(
      fc.property(
        // Generate strings that start with SELECT after stripping comments
        fc.string({ minLength: 7, maxLength: 200 }).map((s) => 'SELECT ' + s),
        (query) => {
          const result1 = validateReportQuery(query);
          const result2 = validateReportQuery(query);
          expect(result1.valid).toBe(result2.valid);
          expect(result1.error).toBe(result2.error);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('is idempotent for arbitrary strings (valid or invalid)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 300 }),
        (query) => {
          const result1 = validateReportQuery(query);
          const result2 = validateReportQuery(query);
          expect(result1.valid).toBe(result2.valid);
          expect(result1.error).toBe(result2.error);
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ============================================================================
// 4.3 Property test: filterReportConfigs is case-insensitive
// Validates: Requirements 1.2
// ============================================================================

describe('Property 6: filterReportConfigs — case-insensitive search', () => {
  it('all results contain the query string in titleId or titleEn (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            titleId: fc.string({ minLength: 1, maxLength: 100 }),
            titleEn: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        fc.string({ minLength: 1, maxLength: 20 }),
        (configs, query) => {
          const results = filterReportConfigs(configs, query);
          for (const r of results) {
            const matchId = r.titleId.toLowerCase().includes(query.toLowerCase());
            const matchEn = r.titleEn.toLowerCase().includes(query.toLowerCase());
            expect(matchId || matchEn).toBe(true);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('no relevant results are excluded — all matching configs are returned', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            titleId: fc.string({ minLength: 1, maxLength: 100 }),
            titleEn: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        fc.string({ minLength: 1, maxLength: 20 }),
        (configs, query) => {
          const results = filterReportConfigs(configs, query);
          const q = query.toLowerCase();
          const expectedCount = configs.filter(
            (c) =>
              c.titleId.toLowerCase().includes(q) ||
              c.titleEn.toLowerCase().includes(q),
          ).length;
          expect(results.length).toBe(expectedCount);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('returns empty array when no configs match', () => {
    // Use a query that is very unlikely to match
    const configs = [
      { titleId: 'Laporan Keuangan', titleEn: 'Financial Report' },
      { titleId: 'Arus Kas', titleEn: 'Cash Flow' },
    ];
    const results = filterReportConfigs(configs, 'xyzzy_no_match_12345');
    expect(results).toHaveLength(0);
  });

  it('is case-insensitive — uppercase query matches lowercase title', () => {
    const configs = [{ titleId: 'laporan keuangan', titleEn: 'financial report' }];
    const results = filterReportConfigs(configs, 'LAPORAN');
    expect(results).toHaveLength(1);
  });

  it('is case-insensitive — lowercase query matches uppercase title', () => {
    const configs = [{ titleId: 'LAPORAN KEUANGAN', titleEn: 'FINANCIAL REPORT' }];
    const results = filterReportConfigs(configs, 'laporan');
    expect(results).toHaveLength(1);
  });
});

// ============================================================================
// Property 3: FilterConfig round-trip serialization
// Validates: Requirements 12.1, 12.3
// ============================================================================

describe('Property 3: FilterConfig round-trip serialization', () => {
  it('JSON round-trip preserves valid FilterConfig arrays', () => {
    const filterConfigArb = fc.record({
      paramName: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_]*$/),
      labelId: fc.string({ minLength: 1, maxLength: 50 }),
      labelEn: fc.string({ minLength: 1, maxLength: 50 }),
      type: fc.constantFrom(
        'text' as const, 'date' as const, 'date_range' as const,
        'numeric' as const, 'numeric_range' as const,
        'dropdown' as const, 'month' as const, 'month_range' as const
      ),
      order: fc.integer({ min: 1, max: 100 }),
    });

    fc.assert(
      fc.property(
        fc.array(filterConfigArb, { minLength: 1, maxLength: 10 }),
        (configs) => {
          const serialized = JSON.stringify(configs);
          const deserialized = JSON.parse(serialized);
          const parsed = z.array(filterConfigSchema).safeParse(deserialized);
          expect(parsed.success).toBe(true);
          if (parsed.success) {
            expect(parsed.data).toEqual(configs);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============================================================================
// Property 4: ColumnConfig round-trip serialization
// Validates: Requirements 12.2, 12.4
// ============================================================================

describe('Property 4: ColumnConfig round-trip serialization', () => {
  it('JSON round-trip preserves valid ColumnConfig arrays', () => {
    const columnConfigArb = fc.record({
      fieldName: fc.string({ minLength: 1, maxLength: 50 }),
      order: fc.integer({ min: 1, max: 100 }),
      dataType: fc.constantFrom('string' as const, 'number' as const, 'date' as const, 'currency' as const),
    });

    fc.assert(
      fc.property(
        fc.array(columnConfigArb, { minLength: 1, maxLength: 10 }),
        (configs) => {
          const serialized = JSON.stringify(configs);
          const deserialized = JSON.parse(serialized);
          const parsed = z.array(columnConfigSchema).safeParse(deserialized);
          expect(parsed.success).toBe(true);
          if (parsed.success) {
            expect(parsed.data).toEqual(configs);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
