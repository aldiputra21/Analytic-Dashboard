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

export const db = drizzle(pool, { schema });
