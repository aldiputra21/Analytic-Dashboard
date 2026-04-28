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
      await login({ username, password });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch for errors to toast them (except session expired which is handled above)
  useEffect(() => {
    if (error && error !== 'SESSION_EXPIRED' && error !== 'AUTH_UNAUTHORIZED') {
      toast.error(getErrorMessage(error, language), { id: 'auth-error' });
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
    <div className="space-y-5">
      <header className="mb-8">
        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'rgb(28, 27, 27)', marginBottom: '0.5rem' }}>
          {copy.title}
        </h2>
        <p style={{ color: 'rgb(95, 94, 94)', fontSize: '0.875rem' }}>
          {copy.subtitle}
        </p>
      </header>
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="username" style={{ color: 'rgb(28, 27, 27)' }}>
            {copy.emailLabel}
          </label>
          <div className="relative group">
            <input
              id="username"
              ref={usernameRef}
              placeholder={copy.emailPlaceholder}
              required
              className="w-full h-14 px-4 rounded-lg border-none focus:outline-none focus:ring-0 transition-colors"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ background: 'rgb(240, 237, 237)', color: 'rgb(28, 27, 27)' }}
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-0 group-focus-within:w-full transition-all duration-300" style={{ background: 'rgb(186, 0, 21)' }}></div>
          </div>
        </div>

        <div className="space-y-2 relative">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium" htmlFor="password" style={{ color: 'rgb(28, 27, 27)' }}>
              {copy.passwordLabel}
            </label>
          </div>
          <div className="relative group flex items-center rounded-lg transition-colors" style={{ background: 'rgb(240, 237, 237)' }}>
            <input
              id="password"
              placeholder={copy.passwordPlaceholder}
              required
              className="flex-1 h-14 px-4 bg-transparent border-none focus:outline-none focus:ring-0"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ color: 'rgb(28, 27, 27)' }}
            />
            <button 
              type="button" 
              className="px-4 transition-colors hover:opacity-70" 
              aria-label="Show password" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ color: 'rgb(146, 111, 107)' }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <div className="absolute bottom-0 left-0 h-0.5 w-0 group-focus-within:w-full transition-all duration-300" style={{ background: 'rgb(186, 0, 21)' }}></div>
          </div>
          <button 
            type="button" 
            onClick={() => setView('forgot-password')}
            className="absolute top-0 right-0 cursor-pointer text-xs font-semibold hover:underline underline-offset-4" 
            style={{ color: 'rgb(186, 0, 21)' }}
          >
            {copy.forgotPassword}
          </button>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || isLoading}
          className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-lg font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed" 
          style={{ 
            background: 'linear-gradient(135deg, rgb(213, 0, 18) 0%, rgb(238, 27, 35) 100%)', 
            fontFamily: 'Manrope, sans-serif', 
            fontSize: '0.9375rem', 
            boxShadow: 'rgba(213, 0, 18, 0.18) 0px 8px 18px' 
          }}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <span>{copy.submit}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-in" aria-hidden="true">
                <path d="m10 17 5-5-5-5"></path>
                <path d="M15 12H3"></path>
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              </svg>
            </>
          )}
        </button>

        <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid rgb(234, 231, 231)' }}>
          <p className="text-sm" style={{ color: 'rgb(95, 94, 94)' }}>
            {copy.noAccount} <button type="button" className="font-bold hover:underline underline-offset-4" style={{ color: 'rgb(186, 0, 21)' }}>{copy.contactAdministrator}</button>
          </p>
        </div>
      </form>
    </div>
  );

  const renderForgotPasswordView = () => (
    <form onSubmit={handleForgotPassword} className="space-y-5">
      <header className="mb-8">
        <button
          type="button"
          onClick={() => setView('login')}
          className="flex items-center gap-2 text-sm font-bold transition-colors cursor-pointer mb-4"
          style={{ color: 'rgb(186, 0, 21)' }}
        >
          <ArrowLeft size={14} />
          <span>{common.back}</span>
        </button>
        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'rgb(28, 27, 27)', marginBottom: '0.5rem' }}>
          {copy.forgotTitle}
        </h2>
        <p style={{ color: 'rgb(95, 94, 94)', fontSize: '0.875rem' }}>
          {copy.forgotSubtitle}
        </p>
      </header>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: 'rgb(28, 27, 27)' }}>
            {copy.emailLabel}
          </label>
          <div className="relative group">
            <input
              type="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full h-14 px-4 rounded-lg border-none focus:outline-none focus:ring-0 transition-colors"
              placeholder={copy.emailPlaceholder}
              required
              style={{ background: 'rgb(240, 237, 237)', color: 'rgb(28, 27, 27)' }}
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-0 group-focus-within:w-full transition-all duration-300" style={{ background: 'rgb(186, 0, 21)' }}></div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-lg font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        style={{ 
          background: 'linear-gradient(135deg, rgb(213, 0, 18) 0%, rgb(238, 27, 35) 100%)', 
          fontFamily: 'Manrope, sans-serif', 
          fontSize: '0.9375rem', 
          boxShadow: 'rgba(213, 0, 18, 0.18) 0px 8px 18px' 
        }}
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <span>{copy.sendResetLink}</span>}
      </button>
    </form>
  );

  return (
    <div className="flex overflow-hidden" style={{ background: 'rgb(252, 249, 248)', fontFamily: 'Inter, sans-serif', height: '100svh' }}>
      {/* Left side: branding/features */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center px-16" style={{ background: 'radial-gradient(circle at 10% 20%, rgba(226, 31, 38, 0.03) 0%, rgb(248, 246, 246) 90%)' }}>
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'rgb(186, 0, 21)' }}></div>
        <div className="mx-auto flex w-full max-w-xl flex-col items-start">
          <img alt="Titian Think Solution" className="w-full max-w-135 object-contain" src="/Logo.png" />
          <div className="mt-16 flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white" style={{ background: 'rgb(238, 27, 35)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <p className="whitespace-nowrap text-[0.98rem] leading-none tracking-[0.08em]" style={{ color: 'rgb(31, 29, 29)', fontWeight: 700 }}>
                {copy.featureOne}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white" style={{ background: 'rgb(238, 27, 35)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <p className="whitespace-nowrap text-[0.98rem] leading-none tracking-[0.08em]" style={{ color: 'rgb(31, 29, 29)', fontWeight: 700 }}>
                {copy.featureTwo}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: form */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center px-4 py-4 md:px-8 md:py-6 lg:px-12 lg:py-8" style={{ background: 'rgba(246, 243, 242, 0.5)' }}>
        {/* Language switcher */}
        <div className="absolute right-4 top-4 md:right-8 md:top-6 lg:right-12 lg:top-8">
          <div className="flex bg-white/80 backdrop-blur-sm p-1 rounded-full items-center gap-0.5 border border-slate-200 shadow-[rgba(28,27,27,0.07)_0px_4px_16px]">
            <div className="flex items-center justify-center w-6 h-6 text-slate-400 ml-1">
              <Languages size={14} />
            </div>
            <button
              onClick={() => setLanguage('id')}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase transition-all cursor-pointer",
                language === 'id' ? "bg-[#ba0015] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              ID
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase transition-all cursor-pointer",
                language === 'en' ? "bg-[#ba0015] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              EN
            </button>
          </div>
        </div>

        <div className="flex w-full max-w-md flex-col gap-3 md:gap-4">
          <div className="flex justify-center lg:hidden">
            <img alt="Titian Think Solution" className="h-10 object-contain" src="/Logo.png" />
          </div>
          <div className="w-full rounded-xl p-6 md:p-8" style={{ background: 'rgb(255, 255, 255)', boxShadow: 'rgba(28, 27, 27, 0.05) 0px 20px 40px', borderTop: '4px solid rgb(186, 0, 21)' }}>
            {view === 'login' && renderLoginView()}
            {view === 'forgot-password' && renderForgotPasswordView()}
          </div>
        </div>
      </div>
    </div>
  );
};
