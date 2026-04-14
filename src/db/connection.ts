import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const db = drizzle(process.env.DATABASE_URL, { schema });
