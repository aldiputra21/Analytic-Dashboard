import { useMemo } from 'react';
import {
  calculatePasswordStrength,
  PasswordStrengthResult,
} from '../../services/financial/passwordStrength';

/**
 * Hook to calculate password strength in real-time.
 * Re-exports the frontend-side calculation from passwordStrength service.
 * Requirements: 25.4
 */
export function usePasswordStrength(password: string): PasswordStrengthResult {
  return useMemo(() => calculatePasswordStrength(password), [password]);
}
