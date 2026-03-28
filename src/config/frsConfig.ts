// FRS Server Configuration with Zod validation
// Requirements: 14.3

import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  APP_URL: z.string().url().optional(),

  // Database
  DATABASE_URL: z.string().min(1).default('./finance.db'),

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

  // Rate limiting
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().min(1).default(20),
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
