import 'dotenv/config';
import { db } from '../src/db/connection';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const res = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'cfd' AND table_name = 'balance_sheets'
      ORDER BY ordinal_position;
    `);
    console.log('Columns in cfd.balance_sheets:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error checking columns:', err);
  } finally {
    process.exit(0);
  }
}

check();
