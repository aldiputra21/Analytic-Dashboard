import React, { useEffect } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { useAuth } from '../../../hooks/financial/useAuth';
import { cn } from '../../../utils/cn';
import { Landmark } from 'lucide-react';

interface CorporateSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: React.ReactNode | string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  required?: boolean;
}

/**
 * CorporateSelector - Smart component that handles visibility based on user scope.
 * It uses useCorporates internally to determine if it should render.
 */
export const CorporateSelector: React.FC<CorporateSelectorProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select Corporate...',
  error,
  disabled,
  size = 'md',
  className,
  required
}) => {
  const { options, showSelector, defaultCorporateId, isLoading } = useCorporates();
  const { scope } = useAuth();

  // Auto-fill logic: if selector is hidden and current value is empty,
  // set it to the defaultCorporateId.
  useEffect(() => {
    if (!showSelector && !value && defaultCorporateId) {
      onChange(defaultCorporateId);
    }
  }, [showSelector, value, defaultCorporateId, onChange]);

  if (!showSelector || (options.length <= 1 && !isLoading)) {
    return null;
  }

  const select = (
    <SearchableSelect
      placeholder={placeholder}
      options={options}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled || isLoading}
      size={size}
      className={!label ? className : undefined}
    />
  );

  if (label) {
    return (
      <div className={cn("space-y-1.5", className)}>
        {typeof label === 'string' ? (
          <label className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
            <Landmark size={12} className="text-indigo-500" />
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        ) : (
          label
        )}
        {select}
      </div>
    );
  }

  return select;
};
