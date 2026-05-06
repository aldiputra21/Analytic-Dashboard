// FRS Server Configuration with Zod validation
// Requirements: 14.3

import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  APP_URL: z.string().url().optional(),

  // Database
  DATABASE_URL: z.string().url().refine(
    (v) => v.startsWith('postgresql://') || v.startsWith('postgres://'),
    { message: 'DATABASE_URL must be a PostgreSQL connection string (postgresql:// or postgres://)' }
  ),
  DATABASE_READONLY_URL: z.string().url().refine(
    (v) => v.startsWith('postgresql://') || v.startsWith('postgres://'),
    { message: 'DATABASE_READONLY_URL must be a PostgreSQL connection string (postgresql:// or postgres://)' }
  ).optional(),
  DB_POOL_MAX: z.coerce.number().int().min(1).default(10),

  // JWT
  FRS_JWT_SECRET: z
    .string()
    .min(16, 'FRS_JWT_SECRET must be at least 16 characters')
    .default('frs-dev-secret-change-in-production'),
  FRS_JWT_EXPIRES_IN: z.string().default('30m'),

  // Backup
  BACKUP_LOCATION: z.string().default('./backups'),
  BACKUP_ENCRYPTION_KEY: z.string().default(''),

  // SMTP (all optional - system degrades gracefully without email)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

  // Cache
  CACHE_TTL: z.coerce.number().int().min(0).default(300000),
  STATIC_CACHE_MAX_AGE: z.coerce.number().int().min(0).default(86400000), // 1 day default in ms

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(900000), // 15 minutes default
  RATE_LIMIT_MAX: z.coerce.number().int().min(0).default(500),             // per-user (authenticated) or per-IP (public); 0 = unlimited
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().min(0).default(10),         // per-username login attempts per 15 min; 0 = unlimited
  RATE_LIMIT_AUTH_IP_MAX: z.coerce.number().int().min(0).default(200),     // per-IP login attempts per 15 min; 0 = unlimited
  RATE_LIMIT_QUERY_MAX: z.coerce.number().int().min(0).default(20),        // test-query & schema endpoints
  RATE_LIMIT_QUERY_WINDOW_MS: z.coerce.number().int().min(1000).default(60000), // 1 minute default for query endpoints
});

export type FRSConfig = z.infer<typeof configSchema>;

let _config: FRSConfig | null = null;

/**
 * Validates and returns the FRS configuration from environment variables.
 * Throws on startup if required variables are missing or invalid.
 * Requirements: 14.3
 */
export function getFRSConfig(): FRSConfig {
  if (_config) return _config;

  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`[FRS] Invalid configuration:\n${issues}`);
  }

  // Warn about insecure defaults in production
  if (result.data.NODE_ENV === 'production') {
    if (result.data.FRS_JWT_SECRET === 'frs-dev-secret-change-in-production') {
      console.warn('[FRS] WARNING: Using default JWT secret in production. Set FRS_JWT_SECRET.');
    }
    if (!result.data.BACKUP_ENCRYPTION_KEY) {
      console.warn('[FRS] WARNING: BACKUP_ENCRYPTION_KEY not set. Backups will use a weak derived key.');
    }
  }

  _config = result.data;
  return _config;
}

/** Resets the cached config (useful for tests). */
export function resetFRSConfig(): void {
  _config = null;
}
