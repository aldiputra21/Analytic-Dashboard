import { commonsI18n, Locale } from '../i18n/commons';
import { ErrorCode } from './errors';

/**
 * Gets a localized error message for a given ErrorCode.
 * If the code is not mapped, returns a default error message.
 * 
 * @param code The ErrorCode from the API response
 * @param language The current user language ('id' | 'en')
 * @returns Localized error message string
 */
export function getErrorMessage(code: string | undefined | null, language: Locale = 'id'): string {
  const common = commonsI18n[language];
  
  if (!code) return common.error;

  // Type-safe lookup in the errors mapping (includes SESSION_EXPIRED and ErrorCode keys)
  const errorsMap = common.errors as Record<string, string | undefined>;
  const mappedMessage = errorsMap[code];
  
  if (mappedMessage) return mappedMessage;

  // Fallback for specific categories if exact code not found
  if (code.startsWith('AUTH_')) return language === 'id' ? 'Masalah autentikasi' : 'Authentication issue';
  if (code.includes('NOT_FOUND')) return common.errors.NOT_FOUND || common.error;
  if (code.includes('ACCESS_DENIED')) return common.errors.ACCESS_DENIED || common.error;

  return common.error;
}
