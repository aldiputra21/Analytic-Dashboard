import React from 'react';
import { Check, X } from 'lucide-react';
import { calculatePasswordStrength } from '../../services/financial/passwordStrength';
import { commonsI18n } from '../../i18n/commons';

interface PasswordStrengthIndicatorProps {
  password: string;
  language: 'id' | 'en';
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  language,
}) => {
  const result = calculatePasswordStrength(password);
  const common = commonsI18n[language];

  // Color mapping for strength levels
  const getColorClasses = (level: string) => {
    switch (level) {
      case 'weak':
        return 'bg-red-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'good':
        return 'bg-blue-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-slate-300';
    }
  };

  const getLevelLabel = (level: string) => {
    return common.passwordStrength[level as keyof typeof common.passwordStrength];
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar - 4 segments */}
      <div className="space-y-2">
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => {
            const segmentThreshold = (i + 1) * 25;
            const isFilled = result.score >= segmentThreshold;
            return (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-all ${
                  isFilled ? getColorClasses(result.level) : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
            {language === 'id' ? 'Kekuatan Password' : 'Password Strength'}
          </span>
          <span
            className={`text-xs font-black uppercase tracking-widest ${
              result.level === 'weak'
                ? 'text-red-600'
                : result.level === 'fair'
                  ? 'text-yellow-600'
                  : result.level === 'good'
                    ? 'text-blue-600'
                    : 'text-green-600'
            }`}
          >
            {getLevelLabel(result.level)} ({result.score}/100)
          </span>
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
          {language === 'id' ? 'Persyaratan' : 'Requirements'}
        </p>
        <div className="space-y-2">
          {/* Min Length */}
          <div className="flex items-center gap-2">
            {result.checks.minLength ? (
              <Check size={16} className="text-green-500 shrink-0" />
            ) : (
              <X size={16} className="text-slate-300 shrink-0" />
            )}
            <span
              className={`text-xs font-medium ${
                result.checks.minLength ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              {language === 'id' ? 'Minimal 8 karakter' : 'At least 8 characters'}
            </span>
          </div>

          {/* Uppercase */}
          <div className="flex items-center gap-2">
            {result.checks.hasUppercase ? (
              <Check size={16} className="text-green-500 shrink-0" />
            ) : (
              <X size={16} className="text-slate-300 shrink-0" />
            )}
            <span
              className={`text-xs font-medium ${
                result.checks.hasUppercase ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              {language === 'id' ? 'Huruf besar (A-Z)' : 'Uppercase letter (A-Z)'}
            </span>
          </div>

          {/* Lowercase */}
          <div className="flex items-center gap-2">
            {result.checks.hasLowercase ? (
              <Check size={16} className="text-green-500 shrink-0" />
            ) : (
              <X size={16} className="text-slate-300 shrink-0" />
            )}
            <span
              className={`text-xs font-medium ${
                result.checks.hasLowercase ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              {language === 'id' ? 'Huruf kecil (a-z)' : 'Lowercase letter (a-z)'}
            </span>
          </div>

          {/* Number */}
          <div className="flex items-center gap-2">
            {result.checks.hasNumber ? (
              <Check size={16} className="text-green-500 shrink-0" />
            ) : (
              <X size={16} className="text-slate-300 shrink-0" />
            )}
            <span
              className={`text-xs font-medium ${
                result.checks.hasNumber ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              {language === 'id' ? 'Angka (0-9)' : 'Number (0-9)'}
            </span>
          </div>

          {/* Special Character */}
          <div className="flex items-center gap-2">
            {result.checks.hasSpecial ? (
              <Check size={16} className="text-green-500 shrink-0" />
            ) : (
              <X size={16} className="text-slate-300 shrink-0" />
            )}
            <span
              className={`text-xs font-medium ${
                result.checks.hasSpecial ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              {language === 'id' ? 'Karakter spesial (!@#$%^&*)' : 'Special character (!@#$%^&*)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
