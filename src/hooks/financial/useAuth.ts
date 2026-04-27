// useAuth.ts - Authentication hook for Financial Ratio Monitoring System
// Requirements: 9.6, 9.7, 9.8

/// <reference types="vite/client" />
import { useState, useEffect, useCallback, SetStateAction } from 'react';
import { FRSUser as User } from '../../types/financial/user';
import { apiFetch } from '../../services/financial/apiFetch';

const API_BASE = '/api/frs';
const TOKEN_KEY = 'frs_token';
const USER_KEY = 'frs_user';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  language: 'id' | 'en';
}

interface LoginInput {
  username: string;
  password: string;
}

interface ForgotPasswordInput {
  identifier: string;
}

interface ResetPasswordInput {
  token: string;
  password: string;
}

// ── Singleton store so all useAuth() instances share the same state ──────────
let _state: AuthState = { user: null, token: null, isLoading: true, error: null, language: 'id' };
let _config: { keepAliveIntervalMs: number } | null | undefined = undefined;
let _keepAliveInterval: any = null;
let _keepAliveSetupComplete = false; // Guard agar interval hanya di-setup sekali
const _listeners = new Set<(state: AuthState) => void>();
let _refreshPromise: Promise<void> | null = null;
let _initialized = false;
let _unauthorizedHandler: (() => void) | null = null;

function setState(next: AuthState | ((prev: AuthState) => AuthState)) {
  _state = typeof next === 'function' ? next(_state) : next;
  _listeners.forEach((fn) => fn(_state));
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    // Token expired jika waktu exp sudah lewat.
    // Buffer 5 detik ke BELAKANG untuk toleransi skew jam antar server/client.
    // JANGAN pakai buffer ke depan (+ 10000) karena itu menyebabkan logout prematur.
    return (payload.exp * 1000) < (Date.now() - 5000);
  } catch {
    return true;
  }
}

// FIX: Run initialization immediately to prevent stale _state during first render
initializeState();

// Initialize state from localStorage (only once, deferred to first hook call)
function initializeState() {
  if (_initialized) return;
  _initialized = true;

  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    // Check if token exists AND is NOT expired
    if (token && userJson && !isTokenExpired(token)) {
      try {
        const user = JSON.parse(userJson) as User;
        _state = { ..._state, user, token, isLoading: false, error: null };
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        _state = { ..._state, user: null, token: null, isLoading: false, error: null };
      }
    } else {
      // Clear expired or missing session
      if (token) {
        if (process.env.NODE_ENV === 'development') console.warn('[Auth] Clearing expired token on startup');
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      _state = { ..._state, user: null, token: null, isLoading: false, error: null };
    }

    // Load language preference
    const lang = localStorage.getItem('frs_lang');
    if (lang === 'en' || lang === 'id') {
      _state.language = lang;
    }
  } catch {
    // localStorage access restricted (e.g., iframe, private browsing)
    _state = { ..._state, user: null, token: null, isLoading: false, error: null };
  }
}

// Event listener for 401s (will be registered/unregistered in useEffect)
function handleUnauthorized() {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Auth] handleUnauthorized triggered. Clearing session state.');
  }
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // localStorage access restricted
  }
  _state = { ..._state, user: null, token: null, isLoading: false, error: 'SESSION_EXPIRED' };
  _listeners.forEach(fn => fn(_state));
}

// ── Activity Tracking for active keep-alive ─────────────────────────────────
let _lastActivity = Date.now();

function updateActivity() {
  _lastActivity = Date.now();
}

if (typeof window !== 'undefined') {
  window.addEventListener('mousedown', updateActivity);
  window.addEventListener('keydown', updateActivity);
}
// ─────────────────────────────────────────────────────────────────────────────

async function refreshSessionFromServer(): Promise<void> {
  if (_refreshPromise) {
    return _refreshPromise;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return;
  }

  _refreshPromise = (async () => {
    const shouldSetLoading = !_state.user;
    if (shouldSetLoading) setState((prev) => ({ ...prev, isLoading: true }));

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Refreshing session...');
      }

      const res = await apiFetch(`${API_BASE}/auth/me`);

      const latestToken = localStorage.getItem(TOKEN_KEY);
      if (token !== latestToken) return;

      if (res.ok) {
        const user = await res.json() as User;
        // FIX: Ambil token terbaru dari localStorage, bukan dari closure.
        // Token bisa sudah diperbarui via X-Refresh-Token header selama request berlangsung.
        const latestToken = localStorage.getItem(TOKEN_KEY);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setState(s => ({ ...s, user, token: latestToken || s.token, isLoading: false, error: null }));
        return;
      }

      if (res.status !== 401 && _state.user) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      if (!_state.user || res.status === 401) {
        if (token === latestToken) {
          console.warn('[Auth] Session expired');
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setState(s => ({ ...s, user: null, token: null, isLoading: false, error: 'SESSION_EXPIRED' }));
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [state, setLocalState] = useState<AuthState>(_state);

  useEffect(() => {
    // Sync with singleton on mount
    setLocalState(_state);
    _listeners.add(setLocalState);

    // Register 401 event listener in this component's lifecycle
    if (!_unauthorizedHandler) {
      _unauthorizedHandler = handleUnauthorized;
      window.addEventListener('frs:unauthorized', _unauthorizedHandler);
    }


    // FIX: Listener untuk token yang di-refresh via X-Refresh-Token header.
    // Sebelumnya didefinisikan tapi tidak pernah di-addEventListener.
    const handleTokenRefreshed = () => {
      const newToken = localStorage.getItem(TOKEN_KEY);
      if (newToken) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Auth] Token refreshed via X-Refresh-Token header, updating state.');
        }
        setState(s => ({ ...s, token: newToken }));
      }
    };
    window.addEventListener('frs:token-refreshed', handleTokenRefreshed);

    // Fetch config and setup keep-alive
    const setupKeepAlive = async () => {
      // FIX: Guard agar interval hanya di-setup sekali, mencegah race condition
      // ketika beberapa komponen mount bersamaan.
      if (_keepAliveSetupComplete) return;

      try {
        if (_config === undefined) {
          _config = null; // Mark as fetching
          const res = await fetch(`${API_BASE}/auth/config`);
          if (res.ok) {
            _config = await res.json();
          } else {
            _config = undefined; // Reset for retry
            return;
          }
        }

        // Wait if currently being fetched by another instance
        if (_config === null) return;

        _keepAliveSetupComplete = true;

        if (_config && _config.keepAliveIntervalMs > 0 && !_keepAliveInterval) {
          const intervalMs = _config.keepAliveIntervalMs;
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Auth] Keep-Alive polling enabled (${intervalMs}ms)`);
          }
          _keepAliveInterval = setInterval(() => {
            const now = Date.now();
            const token = localStorage.getItem(TOKEN_KEY);
            if (token && (now - _lastActivity < intervalMs * 2)) {
              void refreshSessionFromServer();
            }
          }, intervalMs);
        }
      } catch (err) {
        console.error('[Auth] Failed to load config:', err);
        _config = undefined;
        _keepAliveSetupComplete = false; // Allow retry on error
      }
    };

    setupKeepAlive();

    return () => {
      _listeners.delete(setLocalState);
      window.removeEventListener('frs:token-refreshed', handleTokenRefreshed);
      // Keep-alive interval tetap aktif untuk session app karena menggunakan localStorage langsung.

      if (_listeners.size === 0 && _unauthorizedHandler) {
        window.removeEventListener('frs:unauthorized', _unauthorizedHandler);
        _unauthorizedHandler = null;
      }
    };
  }, []);

  // Only refresh session once on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && _initialized) {
      void refreshSessionFromServer();
    }
  }, []); // Empty deps - only run on mount

  const login = useCallback(async (input: LoginInput) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    let lastError: unknown;
    const maxRetries = 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        const data = await res.json();
        if (!res.ok) {
          // Don't retry on client errors (400, 401, etc)
          setState((s) => ({ ...s, isLoading: false, error: data.error?.code || 'FRS_LOGIN_FAILED' }));
          return false;
        }

        // Success
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        
        // Update singleton and notify all listeners immediately
        setState({ 
          user: data.user, 
          token: data.token, 
          isLoading: false, 
          error: null,
          language: _state.language 
        });
        
        return true;
      } catch (error) {
        lastError = error;

        // Network error - retry with backoff
        if (attempt < maxRetries) {
          const delayMs = 500 * Math.pow(2, attempt); // 500ms, 1s
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
      }
    }

    // All retries exhausted
    setState((s) => ({ ...s, isLoading: false, error: 'NETWORK_ERROR' }));
    return false;
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore network errors on logout
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState(s => ({ ...s, user: null, token: null, isLoading: false, error: null }));
  }, []);

  const forgotPassword = useCallback(async (input: ForgotPasswordInput) => {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false as const, error: data.error?.code || 'NETWORK_ERROR' };
      }
      return { success: true as const, message: data.message as string };
    } catch {
      return { success: false as const, error: 'NETWORK_ERROR' };
    }
  }, []);

  const resetPassword = useCallback(async (input: ResetPasswordInput) => {
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false as const, error: data.error?.code || 'NETWORK_ERROR' };
      }
      return { success: true as const, message: data.message as string };
    } catch {
      return { success: false as const, error: 'NETWORK_ERROR' };
    }
  }, []);

  const updateProfile = useCallback(async (input: { fullName?: string; email?: string }) => {
    try {
      const res = await apiFetch(`${API_BASE}/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false as const, error: data.error?.code || 'NETWORK_ERROR' };
      }
      
      // Update local user state
      if (data.user && _state.user) {
        const newUser = { ..._state.user, ...data.user };
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        setState(s => ({ ...s, user: newUser }));
      }
      
      return { success: true as const, user: data.user };
    } catch {
      return { success: false as const, error: 'NETWORK_ERROR' };
    }
  }, []);

  const changePassword = useCallback(async (input: { currentPassword: string; newPassword: string }) => {
    try {
      const res = await apiFetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false as const, error: data.error?.code || 'NETWORK_ERROR' };
      }
      return { success: true as const, message: data.message as string };
    } catch {
      return { success: false as const, error: 'NETWORK_ERROR' };
    }
  }, []);

  const uploadAvatar = useCallback(async (avatarUrl: string) => {
    try {
      const res = await apiFetch(`${API_BASE}/auth/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false as const, error: data.error?.code || 'NETWORK_ERROR' };
      }
      
      // Update local user state
      if (_state.user) {
        const newUser = { ..._state.user, avatarUrl };
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        setState(s => ({ ...s, user: newUser }));
      }
      
      return { success: true as const, avatarUrl };
    } catch {
      return { success: false as const, error: 'NETWORK_ERROR' };
    }
  }, []);

  return {
    user: state.user,
    token: state.token,
    permissions: state.user?.permissions ?? [],
    isLoading: state.isLoading,
    error: state.error,
    login,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    uploadAvatar,
    logout,
    hasPermission: (permission: string) => (state.user?.permissions ?? []).includes(permission),
    isOwner: state.user?.role === 'owner',
    isBOD: state.user?.role === 'bod',
    isSubsidiaryManager: state.user?.role === 'subsidiary_manager',
    hasFullCorporateAccess: !!state.user?.hasFullCorporateAccess,
    subsidiaryIds: state.user?.subsidiaryIds ?? [],
    language: state.language,
    setLanguage: (lang: 'id' | 'en') => {
      localStorage.setItem('frs_lang', lang);
      setState(s => ({ ...s, language: lang }));
    },
    clearError: () => setState(s => ({ ...s, error: null }))
  };
}
