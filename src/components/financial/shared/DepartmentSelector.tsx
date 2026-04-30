import React, { useEffect } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { useDepartments } from '../../../hooks/financial/useDepartments';
import { useAuth } from '../../../hooks/financial/useAuth';

interface DepartmentSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  corporateId?: string; // Optional filtering by corporate
}

/**
 * DepartmentSelector - Smart component that handles visibility based on user scope.
 */
export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  value,
  onChange,
  label = 'Department',
  placeholder = 'Select Department...',
  error,
  disabled,
  size = 'md',
  corporateId
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

  return (
    <SearchableSelect
      label={label}
      placeholder={placeholder}
      options={filteredOptions}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled || isLoading}
      size={size}
    />
  );
};
