/**
 * Retry utility with exponential backoff for API calls.
 * Prevents cascading failures and rate limiting from repeated requests.
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,    // 1 second
  maxDelayMs: 10000,       // 10 seconds (cap to prevent excessive delays)
  backoffMultiplier: 2,    // Exponential: 1s, 2s, 4s, 8s, 10s (capped)
  shouldRetry: (error) => {
    // Retry on network errors or 5xx (server errors), not 4xx (client errors)
    if (error instanceof TypeError) return true;
    if (error instanceof Response) {
      return error.status >= 500;
    }
    return false;
  },
};

/**
 * Execute a function with exponential backoff retry logic.
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Result of the function or throws final error
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => fetch('/api/endpoint'),
 *   { maxRetries: 3, initialDelayMs: 1000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it doesn't pass shouldRetry check
      if (!config.shouldRetry(error, attempt)) {
        throw error;
      }

      // Don't delay after the last attempt
      if (attempt < config.maxRetries) {
        const delayMs = Math.min(
          config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelayMs,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * Wrap a fetch call with retry logic and 429 (rate limit) detection.
 *
 * @param url - Fetch URL
 * @param init - Fetch init options
 * @param options - Retry configuration
 * @returns Response from fetch
 *
 * @example
 * ```typescript
 * const response = await fetchWithRetry('/api/endpoint', { method: 'POST' });
 * ```
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  options: RetryOptions = {},
): Promise<Response> {
  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
    shouldRetry: (error: unknown, attempt: number) => {
      // Always retry on network errors
      if (error instanceof TypeError) return true;

      // Don't retry on 4xx errors (client errors)
      if (error instanceof Response && error.status >= 400 && error.status < 500) {
        // EXCEPT: 429 (Too Many Requests) should retry after backoff
        if (error.status === 429) return true;
        return false;
      }

      // Retry on 5xx errors (server errors)
      if (error instanceof Response && error.status >= 500) return true;

      // Use custom shouldRetry if provided
      if (options.shouldRetry) return options.shouldRetry(error, attempt);

      return false;
    },
  };

  const response = await retryWithBackoff(
    () => fetch(url, init),
    config,
  );

  // For non-ok responses, throw as error for retry logic to catch
  if (!response.ok) {
    const error = new Response(response.body, { status: response.status, statusText: response.statusText });
    throw error;
  }

  return response;
}
