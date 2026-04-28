import { eq } from 'drizzle-orm';
import { db } from '../../db/connection';
import { systemConfigs } from '../../db/schema/public';

export class ConfigService {
  private static instance: ConfigService;
  private cache: Map<string, any> = new Map();
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Initializes the cache by fetching all configs from the database.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    await this.refreshCache();
    this.isInitialized = true;
  }

  /**
   * Refreshes the cache by fetching all configs from the database.
   */
  public async refreshCache(): Promise<void> {
    const allConfigs = await db.select().from(systemConfigs);
    this.cache.clear();
    for (const config of allConfigs) {
      this.cache.set(config.key, config.value);
    }
  }

  /**
   * Gets a config value by key.
   * If cache is not initialized, it will initialize it first.
   */
  public async get<T = any>(key: string, defaultValue?: T): Promise<T> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }
    
    return defaultValue as T;
  }

  /**
   * Sets a config value in the database and updates the cache.
   */
  public async set(key: string, value: any, description?: string, userId?: string): Promise<void> {
    const existing = await db.select().from(systemConfigs).where(eq(systemConfigs.key, key)).limit(1);

    if (existing.length > 0) {
      await db.update(systemConfigs)
        .set({ 
          value, 
          description: description ?? existing[0].description,
          updatedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(systemConfigs.key, key));
    } else {
      if (!userId) throw new Error('userId is required for new configurations');
      await db.insert(systemConfigs)
        .values({ 
          key, 
          value, 
          description, 
          createdBy: userId 
        });
    }

    // Update local cache
    this.cache.set(key, value);
  }

  /**
   * Deletes a config from the database and removes from cache.
   */
  public async delete(key: string): Promise<void> {
    await db.delete(systemConfigs).where(eq(systemConfigs.key, key));
    this.cache.delete(key);
  }

  /**
   * Gets all configs from the cache.
   */
  public async getAll(): Promise<Record<string, any>> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return Object.fromEntries(this.cache);
  }
}

export const configService = ConfigService.getInstance();
