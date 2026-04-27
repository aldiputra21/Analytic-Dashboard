/**
 * Password Strength Service
 * Calculates password strength based on length, complexity, and character variety.
 * Used by both backend validation and frontend UI components.
 */

export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  score: number; // 0-100
  level: PasswordStrengthLevel;
  checks: {
    minLength: boolean; // >= 8 chars
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

/**
 * Calculate password strength based on multiple criteria.
 * Scoring breakdown:
 * - Minimum length (8 chars): 20 points
 * - Extra length (12+ chars): 10 points
 * - Uppercase letters: 20 points
 * - Lowercase letters: 20 points
 * - Numbers: 20 points
 * - Special characters: 10 points
 * Total: 100 points max
 *
 * Levels:
 * - weak: score <= 25
 * - fair: 25 < score <= 50
 * - good: 50 < score <= 75
 * - strong: score > 75
 */
export function calculatePasswordStrength(
  password: string
): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  let score = 0;

  // Base length check (8+ chars)
  if (checks.minLength) score += 20;

  // Extra length bonus (12+ chars)
  if (password.length >= 12) score += 10;

  // Character variety
  if (checks.hasUppercase) score += 20;
  if (checks.hasLowercase) score += 20;
  if (checks.hasNumber) score += 20;
  if (checks.hasSpecial) score += 10;

  // Determine level based on score
  const level: PasswordStrengthLevel =
    score <= 25
      ? 'weak'
      : score <= 50
        ? 'fair'
        : score <= 75
          ? 'good'
          : 'strong';

  return { score, level, checks };
}

/**
 * Check if password meets minimum acceptable strength.
 * Minimum acceptable level is 'fair' (score > 25).
 * Rejects 'weak' passwords.
 */
export function isPasswordAcceptable(result: PasswordStrengthResult): boolean {
  return result.score > 25;
}
