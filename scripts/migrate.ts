import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getFRSConfig } from '../src/config/frsConfig.js';

async function runMigration() {
  const config = getFRSConfig();
  
  console.log('[Migrate] Starting database migrations...');
  
  const pool = new pg.Pool({
    connectionString: config.DATABASE_URL,
    max: 1, // Only need 1 connection for migration
  });

  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('[Migrate] Migrations completed successfully');
  } catch (err) {
    console.error('[Migrate] Error running migrations:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
