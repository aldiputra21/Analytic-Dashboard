import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CircleCheckBig, ShieldAlert, Loader2, KeyRound, ArrowRight } from 'lucide-react';
import { activationI18n } from '../i18n/activation';
import { useAuth } from '../hooks/financial/useAuth';
import { apiFetch } from '../services/financial/apiFetch';
import { PasswordStrengthIndicator } from '../components/ui/PasswordStrengthIndicator';
import { usePasswordStrength } from '../hooks/financial/usePasswordStrength';

export const ActivateAccountPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useAuth();
  const t = activationI18n[language];

  const token = searchParams.get('token');
  
  const [step, setStep] = useState<'validating' | 'form' | 'success' | 'error'>('validating');
  const [userData, setUserData] = useState<{ username: string; email: string } | null>(null);
  const [errorType, setErrorType] = useState<'invalid' | 'expired' | 'generic'>('generic');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  const strength = usePasswordStrength(password);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStep('error');
        setErrorType('invalid');
        return;
      }

      try {
        const response = await apiFetch('/api/frs/auth/validate-activation-token', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.valid) {
          setUserData({ username: data.username, email: data.email });
          setStep('form');
        } else {
          setStep('error');
          setErrorType(data.reason === 'expired' ? 'expired' : 'invalid');
        }
      } catch (err) {
        console.error('Validation error:', err);
        setStep('error');
        setErrorType('generic');
      }
    };

    validateToken();
  }, [token]);

  useEffect(() => {
    if (step === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'success' && countdown === 0) {
      navigate('/login');
    }
  }, [step, countdown, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (password !== confirmPassword) {
      setValidationError(t.validation.passwordsNotMatch);
      return;
    }

    if (strength.level === 'weak') {
      setValidationError(t.validation.passwordWeak);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/api/frs/auth/activate-account', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setStep('success');
    } catch (err: any) {
      console.error('Activation error:', err);
      setValidationError(err.message || t.alerts.errorDesc);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf9f8]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Verifying activation link...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf9f8] p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              {errorType === 'expired' ? t.alerts.expiredTokenTitle : t.alerts.invalidTokenTitle}
            </h2>
            <p className="text-slate-500">
              {errorType === 'expired' ? t.alerts.expiredTokenDesc : t.alerts.invalidTokenDesc}
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full h-14 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            {language === 'id' ? 'Kembali ke Login' : 'Back to Login'}
          </button>
          <a href="#" className="text-sm font-bold text-indigo-600 hover:underline">
            {t.alerts.contactAdmin}
          </a>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf9f8] p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
            <CircleCheckBig className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">{t.alerts.successTitle}</h2>
            <p className="text-slate-500">{t.alerts.successDesc}</p>
          </div>
          <div className="w-full p-4 bg-slate-50 rounded-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {t.alerts.redirecting.replace('{seconds}', countdown.toString())}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcf9f8] p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.pageTitle}</h2>
          <p className="text-slate-500 font-medium">{t.subtitle}</p>
        </div>

        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <KeyRound size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{t.username}</p>
            <p className="text-slate-900 font-bold truncate">{userData?.username}</p>
            <p className="text-xs text-slate-500 truncate">{userData?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                {t.newPassword}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-4 pr-12 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                {t.confirmPassword}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-900"
                required
              />
            </div>
          </div>

          <div className="py-2">
            <PasswordStrengthIndicator password={password} language={language} />
          </div>

          {validationError && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3 text-red-600">
              <ShieldAlert size={20} className="shrink-0" />
              <p className="text-xs font-bold uppercase">{validationError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password || !confirmPassword}
            className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-xl shadow-indigo-200"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{t.activateButton}</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
