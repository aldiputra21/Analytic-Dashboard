import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../src/db/connection';

async function main() {
  await db.execute(sql`DROP SCHEMA IF EXISTS cfd CASCADE;`);
  await db.execute(sql`DROP SCHEMA IF EXISTS crm CASCADE;`);
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE;`);

  await db.execute(sql`
    DO $$
    DECLARE r record;
    BEGIN
      FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
      LOOP
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
      END LOOP;
    END $$;
  `);

  console.log('Database reset complete: dropped schemas cfd, crm, drizzle and all public tables.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
