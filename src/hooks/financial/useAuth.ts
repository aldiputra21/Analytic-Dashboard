// useAuth.ts - Authentication hook for Financial Ratio Monitoring System
// Requirements: 9.6, 9.7, 9.8

import { useState, useEffect, useCallback } from 'react';
import { FRSUser as User } from '../../types/financial/user';

const API_BASE = '/api/frs';
const TOKEN_KEY = 'frs_token';
const USER_KEY = 'frs_user';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface LoginInput {
  username: string;
  password: string;
}

// ── Singleton store so all useAuth() instances share the same state ──────────
let _state: AuthState = { user: null, token: null, isLoading: true, error: null };
const _listeners = new Set<(s: AuthState) => void>();

function setState(next: AuthState | ((prev: AuthState) => AuthState)) {
  _state = typeof next === 'function' ? next(_state) : next;
  _listeners.forEach((fn) => fn(_state));
}

// Initialise from localStorage once at module load
(function init() {
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  if (token && userJson) {
    try {
      const user = JSON.parse(userJson) as User;
      _state = { user, token, isLoading: false, error: null };
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      _state = { user: null, token: null, isLoading: false, error: null };
    }
  } else {
    _state = { ..._state, isLoading: false };
  }
})();

// Listen for 401 events dispatched by apiFetch
window.addEventListener('frs:unauthorized', () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  setState({ user: null, token: null, isLoading: false, error: 'Session expired' });
});
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [state, setLocalState] = useState<AuthState>(_state);

  useEffect(() => {
    // Sync with singleton on mount (in case it changed before this component mounted)
    setLocalState(_state);
    _listeners.add(setLocalState);
    return () => { _listeners.delete(setLocalState); };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        setState((s) => ({ ...s, isLoading: false, error: data.error?.message || 'Login failed' }));
        return false;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setState({ user: data.user, token: data.token, isLoading: false, error: null });
      return true;
    } catch {
      setState((s) => ({ ...s, isLoading: false, error: 'Network error' }));
      return false;
    }
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
    setState({ user: null, token: null, isLoading: false, error: null });
  }, []);

  return {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    isOwner: state.user?.role === 'owner',
    isBOD: state.user?.role === 'bod',
    isSubsidiaryManager: state.user?.role === 'subsidiary_manager',
  };
}
