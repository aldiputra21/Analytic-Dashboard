import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getFRSConfig } from '../config/frsConfig.js';
import * as schema from './schema/index.js';

const config = getFRSConfig();

// Use Pool for better performance in production
const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: config.DB_POOL_MAX,
});

// Add pool error listener to prevent process crashes on idle client errors (Core Backend Requirement)
pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err);
  // Optional: In production, we might want to signal a restart to the process manager
});

export const db = drizzle(pool, { schema });
export { pool };
