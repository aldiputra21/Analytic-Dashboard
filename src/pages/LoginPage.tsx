import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, KeyRound, LogIn, Mail, Loader2, Eye, EyeOff, Languages } from 'lucide-react';
import { cn } from '../utils/cn';
import { loginI18n, loginLocales } from '../i18n/login';
import { commonsI18n } from '../i18n/commons';
import { useAuth } from '../hooks/financial/useAuth';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/errorUtils';

export const LoginPage: React.FC = () => {
  const { language, login, forgotPassword, isLoading, setLanguage, error, clearError } = useAuth();
  const common = commonsI18n[language];
  const copy = loginI18n[language];

  const [view, setView] = useState<'login' | 'forgot-password'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);


  // Autofocus on mount or view change
  useEffect(() => {
    if (view === 'login' && usernameRef.current) {
      usernameRef.current.focus();
    }
  }, [view]);

  // Handle session expired toast
  useEffect(() => {
    if (error === 'SESSION_EXPIRED' || error === 'AUTH_UNAUTHORIZED') {
      toast.error(getErrorMessage(error, language), { id: 'auth-error' });
      clearError();
    }
  }, [error, clearError, language]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await login({ username, password });
      if (!success) {
        // useAuth login will set the error code, but we show it here
        // If error is already set, we could use it, but since login returns false,
        // it's likely already in the state.
        // However, toast might fire BEFORE state update is reflected in local scope.
        // The current useAuth.login returns false AFTER updating state.
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch for errors to toast them (except session expired which is handled above)
  useEffect(() => {
    if (error && error !== 'SESSION_EXPIRED' && error !== 'AUTH_UNAUTHORIZED') {
      toast.error(getErrorMessage(error, language), { id: 'auth-error' });
      // We don't clear error here automatically to keep it in the UI if needed, 
      // but usually login page should clear it on next attempt.
    }
  }, [error, language]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await forgotPassword({ identifier });
      if (res.success) {
        toast.success(res.message);
        setView('login');
      } else {
        toast.error(getErrorMessage(res.error, language));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLoginView = () => (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1c1b1b] tracking-tight">{copy.title}</h1>
        <p className="text-[13.5px] text-[#5f5e5e] leading-relaxed font-medium">{copy.subtitle}</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#1c1b1b]">{copy.emailLabel}</label>
          <div className="relative group">
            <input
              ref={usernameRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-14 px-4 rounded-lg border-none focus:outline-none focus:ring-0 transition-colors bg-[#f0eded] text-[#1c1b1b] font-medium"
              placeholder="nama@perusahaan.com"
              required
              tabIndex={1}
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-0 group-focus-within:w-full transition-all duration-300 bg-[#ba0015]"></div>
          </div>
        </div>

        <div className="space-y-2 relative">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-[#1c1b1b]">{copy.passwordLabel}</label>
          </div>
          <div className="relative group flex items-center rounded-lg transition-colors bg-[#f0eded]">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              tabIndex={2}
              className="flex-1 h-14 px-4 bg-transparent border-none focus:outline-none focus:ring-0 text-[#1c1b1b] font-medium"
              placeholder={copy.passwordPlaceholder || 'Masukkan kata sandi Anda'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="px-4 transition-colors hover:opacity-70 text-[#926f6b]"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <div className="absolute bottom-0 left-0 h-0.5 w-0 group-focus-within:w-full transition-all duration-300 bg-[#ba0015]"></div>
          </div>
          <button
            type="button"
            onClick={() => setView('forgot-password')}
            tabIndex={4}
            className="absolute top-0 right-0 cursor-pointer text-xs font-semibold hover:underline underline-offset-4 text-[#ba0015]"
          >
            {copy.forgotPassword}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isLoading}
        tabIndex={3}
        className="flex h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-lg font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_12px_24px_rgba(213,0,18,0.2)]"
        style={{ backgroundColor: '#d50012' }}
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <>
            <span className="text-[16px]">{copy.submit}</span>
            <LogIn size={20} strokeWidth={2.5} />
          </>
        )}
      </button>

      <div className="text-center pt-2">
        <p className="text-[13px] text-[#5f5e5e] font-medium">
          {copy.noAccount} <button type="button" className="text-[#d50012] font-bold hover:underline">{copy.contactAdministrator}</button>
        </p>
      </div>
    </form>
  );

  const renderForgotPasswordView = () => (
    <form onSubmit={handleForgotPassword} className="space-y-5">
      <button
        type="button"
        onClick={() => setView('login')}
        className="flex items-center gap-2 text-sm font-bold text-[#ee1b23] hover:underline transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>{common.back}</span>
      </button>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-[#1c1b1b] tracking-tight">{copy.forgotTitle}</h1>
        <p className="text-sm text-[#5f5e5e] font-medium">{copy.forgotSubtitle}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#1c1b1b]">{copy.emailLabel}</label>
          <input
            type="email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full h-14 px-4 rounded-lg border-none focus:outline-none focus:ring-0 transition-colors bg-[#f0eded] text-[#1c1b1b] font-medium"
            placeholder="email@example.com"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-lg font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-[0_8px_18px_rgba(213,0,18,0.18)]"
        style={{ background: 'linear-gradient(135deg, #d50012 0%, #ee1b23 100%)' }}
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <span className="text-[15px]">{copy.sendResetLink}</span>}
      </button>
    </form>
  );

  return (
    <div className="flex min-h-[100svh] bg-[#f8f6f6]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Left side: branding/features */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-center px-24 bg-[#f8f6f6]">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#ba0015]" />
        <div className="w-full max-w-lg">
          <div className="mb-12">
            <img src="/Logo.png" alt="Titian Think Solution" className="w-full max-w-[400px] object-contain" />
          </div>

          <div className="flex flex-col gap-6 mt-16">
            {[
              { text: copy.featureOne },
              { text: copy.featureTwo }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ba0015] text-white shadow-lg shadow-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-[17px] font-black text-[#1c1b1b] tracking-wide uppercase">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: form */}
      <div className="relative w-full lg:w-[45%] flex items-center justify-center bg-[#f8f6f6] px-6 py-12">
        {/* Language selector */}
        <div className="absolute right-10 top-8 flex bg-white/80 backdrop-blur-sm p-1 rounded-xl items-center gap-0.5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-center w-6 h-6 text-slate-400 ml-1">
            <Languages size={14} />
          </div>
          <button
            onClick={() => setLanguage('id')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
              language === 'id' ? "bg-white text-[#d50012] shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
            )}
          >
            ID
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
              language === 'en' ? "bg-white text-[#d50012] shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
            )}
          >
            EN
          </button>
        </div>

        <div className="w-full max-w-[480px]">
          <div className="flex justify-center lg:hidden mb-8">
            <img src="/Logo.png" alt="Titian Think Solution" className="h-10 object-contain" />
          </div>

          <div className="w-full rounded-[1.25rem] bg-white p-10 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border-t-[4px] border-[#ba0015] animate-in zoom-in-95 duration-300">
            {view === 'login' && renderLoginView()}
            {view === 'forgot-password' && renderForgotPasswordView()}
          </div>
        </div>
      </div>
    </div>
  );
};
