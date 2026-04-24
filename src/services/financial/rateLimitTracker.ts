/**
 * Rate limit tracking and detection service.
 * Monitors 429 (Too Many Requests) responses and tracks when the user is rate limited.
 */

export interface RateLimitInfo {
  endpoint: string;
  retryAfterMs?: number;
  retryAfterDate?: Date;
  count: number;
  firstAttemptTime: number;
}

class RateLimitTracker {
  private rateLimitMap = new Map<string, RateLimitInfo>();
  private listeners = new Set<(info: RateLimitInfo) => void>();

  /**
   * Record a 429 rate limit response
   */
  public recordRateLimit(endpoint: string, retryAfter?: string | number): void {
    const now = Date.now();
    let retryAfterMs: number | undefined;
    let retryAfterDate: Date | undefined;

    if (typeof retryAfter === 'string') {
      const retryTime = new Date(retryAfter).getTime();
      if (!Number.isNaN(retryTime)) {
        retryAfterMs = Math.max(0, retryTime - now);
        retryAfterDate = new Date(retryTime);
      }
    } else if (typeof retryAfter === 'number') {
      retryAfterMs = retryAfter * 1000; // Convert seconds to ms
      retryAfterDate = new Date(now + retryAfterMs);
    }

    const existing = this.rateLimitMap.get(endpoint) || {
      endpoint,
      count: 0,
      firstAttemptTime: now,
    };

    const info: RateLimitInfo = {
      ...existing,
      retryAfterMs,
      retryAfterDate,
      count: existing.count + 1,
      firstAttemptTime: existing.firstAttemptTime,
    };

    this.rateLimitMap.set(endpoint, info);
    this.notifyListeners(info);
  }

  /**
   * Check if an endpoint is currently rate limited
   */
  public isRateLimited(endpoint: string): boolean {
    const info = this.rateLimitMap.get(endpoint);
    if (!info || !info.retryAfterMs) return false;

    // Check if retry period has expired
    const timeSinceFirstAttempt = Date.now() - info.firstAttemptTime;
    const initialRetryAfter = info.retryAfterMs;

    return timeSinceFirstAttempt < initialRetryAfter;
  }

  /**
   * Get rate limit info for an endpoint
   */
  public getRateLimitInfo(endpoint: string): RateLimitInfo | undefined {
    return this.rateLimitMap.get(endpoint);
  }

  /**
   * Subscribe to rate limit events
   */
  public subscribe(callback: (info: RateLimitInfo) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Clear all rate limit records
   */
  public clear(): void {
    this.rateLimitMap.clear();
  }

  /**
   * Clear rate limit for a specific endpoint
   */
  public clearEndpoint(endpoint: string): void {
    this.rateLimitMap.delete(endpoint);
  }

  private notifyListeners(info: RateLimitInfo): void {
    this.listeners.forEach((fn) => fn(info));
  }
}

// Export singleton instance
export const rateLimitTracker = new RateLimitTracker();

/**
 * Extract endpoint path from full URL
 * @example '/api/frs/auth/login' from 'https://app.com/api/frs/auth/login'
 */
export function getEndpointPath(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.pathname;
  } catch {
    // If URL parsing fails, return the input (assume it's already a path)
    return url;
  }
}

/**
 * Process a fetch response and track rate limits
 * Call this in your fetch wrapper to automatically track 429 responses
 */
export function processRateLimitResponse(url: string, response: Response): void {
  if (response.status === 429) {
    const endpoint = getEndpointPath(url);
    const retryAfter = response.headers.get('Retry-After');
    rateLimitTracker.recordRateLimit(endpoint, retryAfter || undefined);

    // Dispatch global event for UI to handle
    window.dispatchEvent(
      new CustomEvent('frs:rate-limited', {
        detail: {
          endpoint,
          retryAfter: retryAfter || undefined,
        },
      }),
    );
  }
}
