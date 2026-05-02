import React, { useEffect } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { useDepartments } from '../../../hooks/financial/useDepartments';
import { useAuth } from '../../../hooks/financial/useAuth';
import { cn } from '../../../utils/cn';

interface DepartmentSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: React.ReactNode | string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  corporateId?: string; // Optional filtering by corporate
  required?: boolean;
  className?: string;
}

/**
 * DepartmentSelector - Smart component that handles visibility based on user scope.
 */
export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select Department...',
  error,
  disabled,
  size = 'md',
  corporateId,
  required,
  className
}) => {
  const { options, showSelector, defaultDepartmentId, isLoading } = useDepartments();
  const { scope } = useAuth();

  // Auto-fill logic
  useEffect(() => {
    if (!showSelector && !value && defaultDepartmentId) {
      onChange(defaultDepartmentId);
    }
  }, [showSelector, value, defaultDepartmentId, onChange]);

  if (!showSelector && scope !== 'system') {
    return null;
  }

  // Filter options by corporateId if provided
  const filteredOptions = corporateId
    ? options.filter(opt => (opt as any).corporateId === corporateId)
    : options;

  const select = (
    <SearchableSelect
      placeholder={placeholder}
      options={filteredOptions}
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
