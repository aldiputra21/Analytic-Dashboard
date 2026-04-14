// FRSApp.tsx - Main entry point for the Financial Ratio Monitoring System
// Requirements: 4.2, 9.1, 12.1, 12.2

import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { ArrowLeft, CircleCheckBig, KeyRound, LogIn, Mail } from 'lucide-react';
import { loginI18n, loginLocales, type LoginLocale } from '../../i18n/login';
import { DashboardLayout, FRSPage } from './dashboard/DashboardLayout';
import { ProtectedRoute } from './shared/ProtectedRoute';
import { QueryProvider } from './shared/QueryProvider';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { ToastProvider } from './shared/Toast';
import { useAuth } from '../../hooks/financial/useAuth';
import { useAlerts } from '../../hooks/financial/useAlerts';
import { useSubsidiaries } from '../../hooks/financial/useSubsidiaries';

// Lazy-loaded route components for code splitting (Req 12.2)
const FRSDashboard = lazy(() => import('./dashboard/FRSDashboard').then((m) => ({ default: m.FRSDashboard })));
const ThresholdConfig = lazy(() => import('./admin/ThresholdConfig').then((m) => ({ default: m.ThresholdConfig })));
const AuditLog = lazy(() => import('./admin/AuditLog').then((m) => ({ default: m.AuditLog })));
const SubsidiaryManager = lazy(() => import('./admin/SubsidiaryManager').then((m) => ({ default: m.SubsidiaryManager })));
const UserManager = lazy(() => import('./admin/UserManager').then((m) => ({ default: m.UserManager })));
const FinancialDataForm = lazy(() => import('./data-entry/FinancialDataForm').then((m) => ({ default: m.FinancialDataForm })));
const BulkImport = lazy(() => import('./data-entry/BulkImport').then((m) => ({ default: m.BulkImport })));
const BenchmarkingTable = lazy(() => import('./reports/BenchmarkingTable').then((m) => ({ default: m.BenchmarkingTable })));
const ConsolidatedReport = lazy(() => import('./reports/ConsolidatedReport').then((m) => ({ default: m.ConsolidatedReport })));
const TrendAnalysis = lazy(() => import('./reports/TrendAnalysis').then((m) => ({ default: m.TrendAnalysis })));

// MAFINDA lazy-loaded components
const ManagementPage = lazy(() => import('../MAFINDA/management/ManagementPage').then((m) => ({ default: m.ManagementPage })));
const DataEntryPage = lazy(() => import('../MAFINDA/data-entry/DataEntryPage').then((m) => ({ default: m.DataEntryPage })));
const CRMPage = lazy(() => import('../MAFINDA/crm/CRMPage').then((m) => ({ default: m.CRMPage })));

// Skeleton screen for loading states (Req 12.1)
const PageSkeleton: React.FC = () => (
  <div className="p-6 space-y-4 animate-pulse">
    <div className="h-6 bg-slate-200 rounded w-1/3" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-slate-200 rounded-xl" />
      ))}
    </div>
    <div className="h-64 bg-slate-200 rounded-xl" />
  </div>
);

// Login form
interface LoginFormProps {
  onLogin: (input: { username: string; password: string }) => Promise<boolean>;
  onForgotPassword: (input: { identifier: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
  onResetPassword: (input: { token: string; password: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
  error: string | null;
  isLoading: boolean;
}

type AuthView = 'login' | 'forgot-password' | 'reset-password';

const getInitialAuthState = (): { view: AuthView; token: string } => {
  const params = new URLSearchParams(window.location.search);
  const auth = params.get('auth');
  const token = params.get('token') || '';

  if (auth === 'reset' && token) {
    return { view: 'reset-password', token };
  }

  return { view: 'login', token: '' };
};

const updateAuthUrl = (view: AuthView, token?: string) => {
  const url = new URL(window.location.href);
  if (view === 'reset-password' && token) {
    url.searchParams.set('auth', 'reset');
    url.searchParams.set('token', token);
  } else {
    url.searchParams.delete('auth');
    url.searchParams.delete('token');
  }
  window.history.replaceState({}, '', url);
};

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onForgotPassword, onResetPassword, error, isLoading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [{ view, token }, setAuthState] = useState(getInitialAuthState);
  const [language, setLanguage] = useState<LoginLocale>('id');
  const [langOpen, setLangOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotState, setForgotState] = useState<{ isSubmitting: boolean; error: string | null; success: string | null }>({ isSubmitting: false, error: null, success: null });
  const [resetState, setResetState] = useState<{ isSubmitting: boolean; error: string | null; success: string | null }>({ isSubmitting: false, error: null, success: null });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const copy = loginI18n[language];

  const translateApiError = (code: string | null): string => {
    if (!code) return '';
    const map: Partial<Record<string, keyof typeof copy>> = {
      FRS_INVALID_CREDENTIALS: 'errorInvalidCredentials',
      FRS_LOGIN_FAILED: 'errorInvalidCredentials',
      SESSION_EXPIRED: 'errorSessionExpired',
      NETWORK_ERROR: 'errorNetwork',
      FRS_SERVER_ERROR: 'errorServer',
      FRS_WEAK_PASSWORD: 'errorWeakPassword',
      FRS_VALIDATION_ERROR: 'errorValidation',
      FRS_INVALID_RESET_TOKEN: 'resetLinkInvalid',
      RESET_LINK_INVALID: 'resetLinkInvalid',
      PASSWORD_MISMATCH: 'passwordMismatch',
    };
    const key = map[code];
    return key ? (copy[key] as string) : copy.errorServer;
  };

  useEffect(() => {
    const syncFromUrl = () => setAuthState(getInitialAuthState());
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin({ username, password });
  };

  const navigateAuthView = (nextView: AuthView, nextToken = '') => {
    setForgotState({ isSubmitting: false, error: null, success: null });
    setResetState({ isSubmitting: false, error: null, success: null });
    if (nextView !== 'forgot-password') {
      setEmail('');
    }
    if (nextView !== 'reset-password') {
      setNewPassword('');
      setConfirmPassword('');
      setShowResetPassword(false);
      setShowResetConfirmPassword(false);
    }
    setAuthState({ view: nextView, token: nextToken });
    updateAuthUrl(nextView, nextToken);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotState({ isSubmitting: true, error: null, success: null });
    const result = await onForgotPassword({ identifier: email });
    if (!result.success) {
      setForgotState({ isSubmitting: false, error: result.error ?? 'NETWORK_ERROR', success: null });
      return;
    }
    setForgotState({ isSubmitting: false, error: null, success: copy.forgotSuccessMessage });
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setResetState({ isSubmitting: false, error: 'RESET_LINK_INVALID', success: null });
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetState({ isSubmitting: false, error: 'PASSWORD_MISMATCH', success: null });
      return;
    }

    setResetState({ isSubmitting: true, error: null, success: null });
    const result = await onResetPassword({ token, password: newPassword });
    if (!result.success) {
      setResetState({ isSubmitting: false, error: result.error ?? 'NETWORK_ERROR', success: null });
      return;
    }

    setResetState({ isSubmitting: false, error: null, success: copy.passwordResetComplete });
    window.setTimeout(() => navigateAuthView('login'), 1400);
  };

  const renderInlineMessage = (tone: 'error' | 'success', message: string) => (
    <div
      className="rounded-lg px-4 py-3 text-sm font-medium"
      style={tone === 'error' ? { background: '#ffdad6', color: '#93000a' } : { background: '#dbf4dc', color: '#135b24' }}
    >
      {message}
    </div>
  );

  const renderBackToLogin = () => (
    <button
      type="button"
      onClick={() => navigateAuthView('login')}
      className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
      style={{ color: '#ba0015' }}
    >
      <ArrowLeft size={16} />
      <span>{copy.backToLogin}</span>
    </button>
  );

  const renderCardHeader = (title: string, subtitle: string) => (
    <header className="mb-8">
      <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#1c1b1b', marginBottom: '0.5rem' }}>
        {title}
      </h2>
      <p style={{ color: '#5f5e5e', fontSize: '0.875rem' }}>
        {subtitle}
      </p>
    </header>
  );

  const renderLoginView = () => (
    <>
      {renderCardHeader(copy.title, copy.subtitle)}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: '#1c1b1b' }} htmlFor="username">
            {copy.emailLabel}
          </label>
          <div className="relative group">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={copy.emailPlaceholder}
              required
              className="w-full h-14 px-4 rounded-lg border-none focus:outline-none focus:ring-0 transition-colors"
              style={{ background: '#f0eded', color: '#1c1b1b' }}
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-0 group-focus-within:w-full transition-all duration-300" style={{ background: '#ba0015' }} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium" style={{ color: '#1c1b1b' }} htmlFor="password">
              {copy.passwordLabel}
            </label>
            <button
              type="button"
              onClick={() => navigateAuthView('forgot-password')}
              className="cursor-pointer text-xs font-semibold hover:underline underline-offset-4"
              style={{ color: '#ba0015' }}
            >
              {copy.forgotPassword}
            </button>
          </div>
          <div className="relative group flex items-center rounded-lg transition-colors" style={{ background: '#f0eded' }}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={copy.passwordPlaceholder}
              required
              className="flex-1 h-14 px-4 bg-transparent border-none focus:outline-none focus:ring-0"
              style={{ color: '#1c1b1b' }}
            />
            <button
              type="button"
              className="px-4 transition-colors hover:opacity-70"
              style={{ color: '#926f6b' }}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
            <div className="absolute bottom-0 left-0 h-0.5 w-0 group-focus-within:w-full transition-all duration-300" style={{ background: '#ba0015' }} />
          </div>
        </div>

        <div className="flex items-center gap-3 py-1">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border"
            style={{ accentColor: '#ba0015' }}
          />
          <label htmlFor="remember" className="text-sm font-medium select-none cursor-pointer" style={{ color: '#5f5e5e' }}>
            {copy.rememberDevice}
          </label>
        </div>

        {error && renderInlineMessage('error', translateApiError(error))}

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-lg font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #d50012 0%, #ee1b23 100%)', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', boxShadow: '0 8px 18px rgba(213, 0, 18, 0.18)' }}
        >
          <span>{isLoading ? copy.submitting : copy.submit}</span>
          <LogIn size={18} strokeWidth={2.4} />
        </button>
      </form>

      <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid #eae7e7' }}>
        <p className="text-sm" style={{ color: '#5f5e5e' }}>
          {copy.noAccount}{' '}
          <a href="#" className="font-bold hover:underline underline-offset-4" style={{ color: '#ba0015' }}>
            {copy.contactAdministrator}
          </a>
        </p>
      </div>
    </>
  );

  const renderForgotPasswordView = () => (
    <>
      {renderCardHeader(copy.forgotTitle, copy.forgotSubtitle)}
      <p className="mb-6 text-sm" style={{ color: '#5f5e5e' }}>{copy.forgotHelper}</p>

      {forgotState.success ? (
        <div className="space-y-6">
          <div className="rounded-xl border px-5 py-5" style={{ borderColor: '#d5ead7', background: '#f1fbf2' }}>
            <div className="mb-3 flex items-center gap-3" style={{ color: '#135b24' }}>
              <CircleCheckBig size={20} />
              <h3 className="text-base font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>{copy.forgotSuccessTitle}</h3>
            </div>
            <p className="text-sm" style={{ color: '#275b33' }}>{forgotState.success}</p>
          </div>
          {renderBackToLogin()}
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleForgotPasswordSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: '#1c1b1b' }} htmlFor="forgot-email">
              {copy.emailLabel}
            </label>
            <div className="relative group">
              <input
                id="forgot-email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy.emailPlaceholder}
                required
                className="w-full h-14 px-4 rounded-lg border-none focus:outline-none focus:ring-0 transition-colors"
                style={{ background: '#f0eded', color: '#1c1b1b' }}
              />
              <div className="absolute bottom-0 left-0 h-0.5 w-0 group-focus-within:w-full transition-all duration-300" style={{ background: '#ba0015' }} />
            </div>
          </div>

          {forgotState.error && renderInlineMessage('error', translateApiError(forgotState.error))}

          <button
            type="submit"
            disabled={forgotState.isSubmitting}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-lg font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #d50012 0%, #ee1b23 100%)', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', boxShadow: '0 8px 18px rgba(213, 0, 18, 0.18)' }}
          >
            <span>{forgotState.isSubmitting ? copy.sendingResetLink : copy.sendResetLink}</span>
            <Mail size={18} strokeWidth={2.4} />
          </button>

          {renderBackToLogin()}
        </form>
      )}
    </>
  );

  const renderResetPasswordView = () => (
    <>
      {renderCardHeader(copy.resetTitle, copy.resetSubtitle)}
      <p className="mb-6 text-sm" style={{ color: '#5f5e5e' }}>{copy.resetHelper}</p>

      {resetState.success ? (
        <div className="space-y-6">
          <div className="rounded-xl border px-5 py-5" style={{ borderColor: '#d5ead7', background: '#f1fbf2' }}>
            <div className="mb-3 flex items-center gap-3" style={{ color: '#135b24' }}>
              <CircleCheckBig size={20} />
              <h3 className="text-base font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>{copy.resetSuccessTitle}</h3>
            </div>
            <p className="text-sm" style={{ color: '#275b33' }}>{resetState.success}</p>
          </div>
          {renderBackToLogin()}
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleResetPasswordSubmit}>
          {!token && renderInlineMessage('error', copy.resetLinkInvalid)}

          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: '#1c1b1b' }} htmlFor="new-password">
              {copy.passwordLabel}
            </label>
            <div className="relative group flex items-center rounded-lg transition-colors" style={{ background: '#f0eded' }}>
              <input
                id="new-password"
                type={showResetPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={copy.passwordPlaceholder}
                required
                className="flex-1 h-14 px-4 bg-transparent border-none focus:outline-none focus:ring-0"
                style={{ color: '#1c1b1b' }}
              />
              <button
                type="button"
                className="px-4 transition-colors hover:opacity-70"
                style={{ color: '#926f6b' }}
                onClick={() => setShowResetPassword((prev) => !prev)}
                aria-label={showResetPassword ? 'Hide password' : 'Show password'}
              >
                <KeyRound size={18} />
              </button>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 group-focus-within:w-full transition-all duration-300" style={{ background: '#ba0015' }} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: '#1c1b1b' }} htmlFor="confirm-password">
              {copy.confirmPasswordLabel}
            </label>
            <div className="relative group flex items-center rounded-lg transition-colors" style={{ background: '#f0eded' }}>
              <input
                id="confirm-password"
                type={showResetConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={copy.confirmPasswordPlaceholder}
                required
                className="flex-1 h-14 px-4 bg-transparent border-none focus:outline-none focus:ring-0"
                style={{ color: '#1c1b1b' }}
              />
              <button
                type="button"
                className="px-4 transition-colors hover:opacity-70"
                style={{ color: '#926f6b' }}
                onClick={() => setShowResetConfirmPassword((prev) => !prev)}
                aria-label={showResetConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
              >
                <KeyRound size={18} />
              </button>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 group-focus-within:w-full transition-all duration-300" style={{ background: '#ba0015' }} />
            </div>
          </div>

          <p className="text-xs leading-5" style={{ color: '#926f6b' }}>{copy.passwordRequirements}</p>

          {resetState.error && renderInlineMessage('error', translateApiError(resetState.error))}

          <button
            type="submit"
            disabled={resetState.isSubmitting || !token}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-lg font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #d50012 0%, #ee1b23 100%)', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', boxShadow: '0 8px 18px rgba(213, 0, 18, 0.18)' }}
          >
            <span>{resetState.isSubmitting ? copy.resettingPassword : copy.resetPassword}</span>
            <KeyRound size={18} strokeWidth={2.4} />
          </button>

          {renderBackToLogin()}
        </form>
      )}
    </>
  );

  return (
    <div className="flex overflow-hidden" style={{ background: '#fcf9f8', fontFamily: 'Inter, sans-serif', height: '100svh' }}>

      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-center px-16"
        style={{ background: 'radial-gradient(circle at 10% 20%, rgba(226, 31, 38, 0.03) 0%, #f8f6f6 90%)' }}
      >
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: '#ba0015' }} />
        <div className="mx-auto flex w-full max-w-xl flex-col items-start">
          <img src="/Logo.png" alt="Titian Think Solution" className="w-full max-w-135 object-contain" />

          <div className="mt-16 flex flex-col gap-8">
            {[copy.featureOne, copy.featureTwo].map((feature) => (
              <div key={feature} className="flex items-center gap-4">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: '#ee1b23' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p
                  className="whitespace-nowrap text-[0.98rem] leading-none tracking-[0.08em]"
                  style={{ color: '#1f1d1d', fontWeight: 700 }}
                >
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="relative w-full lg:w-1/2 flex items-center justify-center px-4 py-4 md:px-8 md:py-6 lg:px-12 lg:py-8"
        style={{ background: 'rgba(246, 243, 242, 0.5)' }}
      >
        {/* ── Language dropdown (custom) ── */}
        <div ref={langRef} className="absolute right-4 top-4 md:right-8 md:top-6 lg:right-12 lg:top-8">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            onClick={() => setLangOpen((prev) => !prev)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold shadow-sm backdrop-blur-sm transition-colors"
            style={{
              background: 'rgba(255,255,255,0.82)',
              borderColor: 'rgba(146,111,107,0.16)',
              boxShadow: '0 4px 16px rgba(28,27,27,0.07)',
              color: '#1c1b1b',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#5f5e5e' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{copy.localeName}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} style={{ color: '#926f6b' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {langOpen && (
            <ul
              role="listbox"
              aria-label="Select language"
              className="absolute right-0 z-50 mt-1.5 w-28 overflow-hidden rounded-xl border py-1 shadow-xl"
              style={{ background: '#ffffff', borderColor: 'rgba(146,111,107,0.14)', boxShadow: '0 12px 32px rgba(28,27,27,0.12)' }}
            >
              {loginLocales.map((loc) => (
                <li
                  key={loc}
                  role="option"
                  aria-selected={language === loc}
                  onClick={() => { setLanguage(loc); setLangOpen(false); }}
                  className="flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    background: language === loc ? '#ffdad6' : 'transparent',
                    color: language === loc ? '#ba0015' : '#1c1b1b',
                  }}
                >
                  <span>{loginI18n[loc].localeName}</span>
                  {language === loc && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex w-full max-w-md flex-col gap-3 md:gap-4">
          <div className="flex justify-center lg:hidden">
            <img src="/Logo.png" alt="Titian Think Solution" className="h-10 object-contain" />
          </div>

          <div
            className="w-full rounded-xl p-6 md:p-8"
            style={{ background: '#ffffff', boxShadow: '0 20px 40px rgba(28, 27, 27, 0.05)', borderTop: '4px solid #ba0015' }}
          >
            {view === 'login' && renderLoginView()}
            {view === 'forgot-password' && renderForgotPasswordView()}
            {view === 'reset-password' && renderResetPasswordView()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder for pages not yet implemented
const ComingSoon: React.FC<{ page: string }> = ({ page }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <p className="text-slate-500 font-medium capitalize">{page}</p>
    <p className="text-sm text-slate-400 mt-1">This section is coming soon</p>
  </div>
);

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<FRSPage>('dashboard');
  const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState<string | undefined>();
  const { alerts } = useAlerts({ status: 'active' });
  const { subsidiaries } = useSubsidiaries();
  const alertCount = React.useMemo(() => alerts.filter((a) => a.status === 'active').length, [alerts]);

  // Pick first subsidiary for threshold config if none selected
  const thresholdSubsidiaryId = selectedSubsidiaryId ?? subsidiaries[0]?.id;
  const thresholdSubsidiaryName = React.useMemo(
    () => subsidiaries.find((s) => s.id === thresholdSubsidiaryId)?.name ?? '',
    [subsidiaries, thresholdSubsidiaryId]
  );

  const handleNavigate = React.useCallback((page: FRSPage) => setCurrentPage(page), []);
  const handleSubsidiaryChange = React.useCallback((id: string) => setSelectedSubsidiaryId(id), []);

  const renderPage = React.useCallback(() => {
    switch (currentPage) {
      case 'dashboard': return <FRSDashboard />;
      case 'benchmarking': return (
        <div className="space-y-6">
          <BenchmarkingTable />
        </div>
      );
      case 'trends': return (
        <div className="space-y-6">
          <TrendAnalysis />
        </div>
      );
      case 'reports': return (
        <div className="space-y-6">
          <ConsolidatedReport />
        </div>
      );
      case 'thresholds':
        return thresholdSubsidiaryId ? (
          <div className="p-6 space-y-4">
            {subsidiaries.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">Subsidiary:</label>
                <select
                  value={thresholdSubsidiaryId}
                  onChange={(e) => handleSubsidiaryChange(e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {subsidiaries.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            <ThresholdConfig subsidiaryId={thresholdSubsidiaryId} subsidiaryName={thresholdSubsidiaryName} />
          </div>
        ) : (
          <ComingSoon page="thresholds" />
        );
      case 'subsidiaries':
        return (
          <div className="p-6">
            <SubsidiaryManager />
          </div>
        );
      case 'users':
        return (
          <div className="p-6">
            <UserManager />
          </div>
        );
      case 'audit-log':
        return (
          <div className="p-6">
            <AuditLog />
          </div>
        );
      case 'data-entry':
        return (
          <div className="p-6 max-w-3xl">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-900">Manual Data Entry</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter financial data for a subsidiary period</p>
            </div>
            <FinancialDataForm />
          </div>
        );
      case 'bulk-import':
        return (
          <div className="p-6 max-w-2xl">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-900">Bulk Import</h2>
              <p className="text-xs text-slate-500 mt-0.5">Import financial data from CSV or Excel file</p>
            </div>
            <BulkImport />
          </div>
        );
      // MAFINDA pages
      case 'mafinda-management':
        return (
          <div className="p-4">
            <ManagementPage />
          </div>
        );
      case 'mafinda-data-entry':
        return (
          <div className="p-4">
            <DataEntryPage />
          </div>
        );
      case 'crm-dashboard':
        return <CRMPage activeTab="dashboard" />;
      case 'crm-opportunities':
        return <CRMPage activeTab="opportunities" />;
      case 'crm-customers':
        return <CRMPage activeTab="customers" />;
      case 'crm-proposals':
        return <CRMPage activeTab="proposals" />;
      case 'crm-contracts':
        return <CRMPage activeTab="contracts" />;
      case 'crm-approvals':
        return <CRMPage activeTab="approvals" />;
      case 'crm-reimburse':
        return <CRMPage activeTab="reimburse" />;
      default: return <ComingSoon page={currentPage} />;
    }
  }, [currentPage, thresholdSubsidiaryId, thresholdSubsidiaryName, subsidiaries, handleSubsidiaryChange]);

  return (
    <DashboardLayout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      alertCount={alertCount}
    >
      <Suspense fallback={<PageSkeleton />}>
        {renderPage()}
      </Suspense>
    </DashboardLayout>
  );
};

export const FRSApp: React.FC = () => {
  const { user, isLoading, login, forgotPassword, resetPassword, error } = useAuth();

  if (isLoading) return null;
  if (!user) return <LoginForm onLogin={login} onForgotPassword={forgotPassword} onResetPassword={resetPassword} error={error} isLoading={isLoading} />;

  return (
    <ProtectedRoute>
      <AppContent />
    </ProtectedRoute>
  );
};

// Wrap with QueryProvider so all child hooks share the SWR cache
const FRSAppWithProviders: React.FC = () => (
  <ErrorBoundary>
    <ToastProvider>
      <QueryProvider>
        <FRSApp />
      </QueryProvider>
    </ToastProvider>
  </ErrorBoundary>
);

export default FRSAppWithProviders;
