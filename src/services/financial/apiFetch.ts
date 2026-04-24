// Centralized fetch helper for FRS API
// Automatically attaches Bearer token and handles 401 by clearing session
// Implements exponential backoff retry for transient failures
// Tracks 429 rate limit responses for UI feedback

const TOKEN_KEY = 'frs_token';
const USER_KEY = 'frs_user';

// Debounce 401 events to prevent cascade of re-renders
let _lastUnauthorizedTime = 0;
const UNAUTHORIZED_DEBOUNCE_MS = 1000; // Only dispatch event once per second

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let lastError: unknown;
  const maxRetries = 2;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const tokenUsed = localStorage.getItem(TOKEN_KEY);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          ...(tokenUsed ? { Authorization: `Bearer ${tokenUsed}` } : {}),
          ...(options.headers ?? {}),
        },
      });

      // For transient errors (5xx or 429), retry with exponential backoff on GET requests
      // Non-idempotent methods (POST, PUT, DELETE) should NOT retry to avoid side effects
      const isIdempotent = !options.method || options.method.toUpperCase() === 'GET';
      if (isIdempotent && response.status !== 401 && (response.status >= 500 || response.status === 429) && attempt < maxRetries) {
        lastError = response;
        const delayMs = Math.min(
          500 * Math.pow(2, attempt) + Math.random() * 100, // Add jitter
          2000,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // For all other responses (including 4xx), return immediately
      // Process rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        window.dispatchEvent(
          new CustomEvent('frs:rate-limited', {
            detail: { endpoint: new URL(url, window.location.origin).pathname, retryAfter },
          }),
        );
      }

      // If 401, clear stale session so user is redirected to login
      if (response.status === 401) {
        const currentToken = localStorage.getItem(TOKEN_KEY);
        // Only handle 401 if the token used for this request is still the current token.
        // This prevents stale background requests from clearing a new session.
        if (tokenUsed === currentToken) {
          const now = Date.now();
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[API] 401 Unauthorized at ${url}. Triggering logout.`);
          }
          if (now - _lastUnauthorizedTime > UNAUTHORIZED_DEBOUNCE_MS) {
            _lastUnauthorizedTime = now;
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            window.dispatchEvent(new Event('frs:unauthorized'));
          }
        }
      }

      // Process sliding expiration (keep-alive)
      const refreshToken = response.headers.get('X-Refresh-Token');
      if (refreshToken) {
        localStorage.setItem(TOKEN_KEY, refreshToken);
        window.dispatchEvent(new CustomEvent('frs:token-refreshed', { detail: refreshToken }));
      }

      return response;
    } catch (error) {
      // Network error - retry with exponential backoff
      lastError = error;
      if (attempt < maxRetries) {
        const delayMs = Math.min(
          500 * Math.pow(2, attempt), // 500ms, 1s, 2s
          2000, // max 2 seconds
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
    }
  }

  // All retries exhausted
  if (lastError instanceof Error) {
    throw lastError;
  }
  
  throw new Error('API request failed');
}
