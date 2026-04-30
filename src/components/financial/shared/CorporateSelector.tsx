import React, { useEffect } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { useAuth } from '../../../hooks/financial/useAuth';

interface CorporateSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

/**
 * CorporateSelector - Smart component that handles visibility based on user scope.
 * It uses useCorporates internally to determine if it should render.
 */
export const CorporateSelector: React.FC<CorporateSelectorProps> = ({
  value,
  onChange,
  label = 'Corporate',
  placeholder = 'Select Corporate...',
  error,
  disabled,
  size = 'md'
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

  if (!showSelector && scope !== 'system') {
    return null;
  }

  return (
    <SearchableSelect
      label={label}
      placeholder={placeholder}
      options={options}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled || isLoading}
      size={size}
    />
  );
};
