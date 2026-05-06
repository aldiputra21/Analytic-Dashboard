/**
 * Read-only database connection for executing report queries.
 *
 * Uses DATABASE_READONLY_URL if provided (recommended for production — point to
 * a read replica or a PostgreSQL user with SELECT-only privileges).
 * Falls back to DATABASE_URL with a 30-second statement_timeout to prevent
 * long-running queries from blocking the main connection pool.
 *
 * Requirements: 3.5, 3.7
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getFRSConfig } from '../config/frsConfig.js';
import * as schema from './schema/index.js';

const READONLY_STATEMENT_TIMEOUT_MS = 30_000;

const config = getFRSConfig();

const connectionString = config.DATABASE_READONLY_URL ?? config.DATABASE_URL;

if (!config.DATABASE_READONLY_URL) {
  console.warn(
    '[DB:readonly] DATABASE_READONLY_URL is not set. ' +
    'Falling back to DATABASE_URL with statement_timeout=' +
    `${READONLY_STATEMENT_TIMEOUT_MS}ms. ` +
    'For production, configure a dedicated read-only user or read replica.'
  );
}

const readonlyPool = new pg.Pool({
  connectionString,
  // Keep the readonly pool small — it is only used for report generation
  max: 5,
});

// Apply statement_timeout on every new connection so long-running report
// queries are automatically cancelled after 30 seconds (Requirement 3.7).
readonlyPool.on('connect', (client) => {
  client.query(`SET statement_timeout = ${READONLY_STATEMENT_TIMEOUT_MS}`).catch((err) => {
    console.error('[DB:readonly] Failed to set statement_timeout:', err);
  });
});

readonlyPool.on('error', (err) => {
  console.error('[DB:readonly] Unexpected error on idle client:', err);
});

/**
 * Drizzle ORM instance backed by the read-only connection pool.
 * Use this exclusively for SELECT queries inside report generation.
 * Never use it for INSERT / UPDATE / DELETE operations.
 */
export const readonlyDb = drizzle(readonlyPool, { schema });
export { readonlyPool };
