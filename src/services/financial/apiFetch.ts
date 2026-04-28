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
        cache: 'no-store', // Prevent browser from using cached responses (Fixes 304 issues)
        headers: {
          ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          ...(tokenUsed ? { Authorization: `Bearer ${tokenUsed}` } : {}),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...(options.headers ?? {}),
        },
      });

      // For transient errors (5xx or 429), retry with exponential backoff on GET requests
      // EXCEPTION: Do not retry if it's a 503 Maintenance Mode error
      const isIdempotent = !options.method || options.method.toUpperCase() === 'GET';
      const isRateLimit = response.status === 429;
      const isServerError = response.status >= 500 && response.status !== 503; // Retry other 5xx
      
      // If 503, check if it's maintenance mode
      if (response.status === 503) {
        const clone = response.clone();
        const body = await clone.json().catch(() => ({}));
        if (body.error?.code === 'MAINTENANCE_MODE') {
          const currentToken = localStorage.getItem(TOKEN_KEY);
          if (tokenUsed === currentToken) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            window.dispatchEvent(new Event('frs:maintenance'));
          }
          return new Promise(() => {}); // Silent redirect
        }
        
        // If 503 but NOT maintenance (e.g. real overloaded server), retry it if idempotent
        if (isIdempotent && attempt < maxRetries) {
          lastError = response;
          const delayMs = Math.min(500 * Math.pow(2, attempt) + Math.random() * 100, 2000);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
      }

      if (isIdempotent && (isServerError || isRateLimit) && attempt < maxRetries) {
        lastError = response;
        const delayMs = Math.min(500 * Math.pow(2, attempt) + Math.random() * 100, 2000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // If 401, handle session expiry or potential race conditions during token refresh
      if (response.status === 401) {
        const currentToken = localStorage.getItem(TOKEN_KEY);
        
        // CASE A: Token has ALREADY changed in localStorage while this request was in flight.
        if (tokenUsed !== currentToken && attempt < maxRetries) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[API] 401 at ${url} but token already changed. Retrying with new token.`);
          }
          continue; 
        }

        // CASE B: Token is still the same. Trigger logout.
        if (tokenUsed === currentToken) {
          const now = Date.now();
          if (now - _lastUnauthorizedTime > UNAUTHORIZED_DEBOUNCE_MS) {
            _lastUnauthorizedTime = now;
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            window.dispatchEvent(new Event('frs:unauthorized'));
          }
          
          // SILENT REDIRECT: Return a pending promise that never resolves.
          // This prevents the calling component from receiving the 401 response
          // and triggering its own "Gagal memuat data" toast.
          // The component will be unmounted anyway as the app redirects to /login.
          return new Promise(() => {});
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
      lastError = error;
      if (attempt < maxRetries) {
        const delayMs = Math.min(500 * Math.pow(2, attempt), 2000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error('API request failed');
}
