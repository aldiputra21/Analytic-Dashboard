export enum ErrorCode {
  // Authentication & Session
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INVALID_RESET_TOKEN = 'INVALID_RESET_TOKEN',
  AUTH_UPDATE_FAILED = 'AUTH_UPDATE_FAILED',
  AUTH_ACTIVATION_FAILED = 'AUTH_ACTIVATION_FAILED',
  AUTH_RESET_FAILED = 'AUTH_RESET_FAILED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',

  // Resource Access
  ACCESS_DENIED = 'ACCESS_DENIED',
  CORPORATE_ACCESS_DENIED = 'CORPORATE_ACCESS_DENIED',
  DEPARTMENT_ACCESS_DENIED = 'DEPARTMENT_ACCESS_DENIED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS = 'USERNAME_ALREADY_EXISTS',

  // Not Found
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  CORPORATE_NOT_FOUND = 'CORPORATE_NOT_FOUND',
  DEPARTMENT_NOT_FOUND = 'DEPARTMENT_NOT_FOUND',
  ROLE_NOT_FOUND = 'ROLE_NOT_FOUND',
  PERMISSION_NOT_FOUND = 'PERMISSION_NOT_FOUND',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  COST_CENTER_NOT_FOUND = 'COST_CENTER_NOT_FOUND',
  TARGET_NOT_FOUND = 'TARGET_NOT_FOUND',
  TARGET_DELETED = 'TARGET_DELETED',
  SUBSIDIARY_NOT_FOUND = 'SUBSIDIARY_NOT_FOUND',
  BANK_NOT_FOUND = 'BANK_NOT_FOUND',
  CURRENCY_NOT_FOUND = 'CURRENCY_NOT_FOUND',
  CORPORATE_SECTOR_NOT_FOUND = 'CORPORATE_SECTOR_NOT_FOUND',
  COST_CENTER_CATEGORY_NOT_FOUND = 'COST_CENTER_CATEGORY_NOT_FOUND',
  NOTIFICATION_CONFIG_NOT_FOUND = 'NOTIFICATION_CONFIG_NOT_FOUND',
  NOTIFICATION_NOT_FOUND = 'NOTIFICATION_NOT_FOUND',

  // Domain Specific - Mafinda/Financial
  PERIOD_REQUIRED = 'PERIOD_REQUIRED',
  CORPORATE_ID_REQUIRED = 'CORPORATE_ID_REQUIRED',
  DEPARTMENT_ID_REQUIRED = 'DEPARTMENT_ID_REQUIRED',
  INVALID_PERIOD_FORMAT = 'INVALID_PERIOD_FORMAT',
  
  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  DELETE_PROTECTED = 'DELETE_PROTECTED',
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: any;

  constructor(code: ErrorCode, message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(code: ErrorCode, message: string, details?: any) {
    return new AppError(code, message, 400, details);
  }

  static unauthorized(code: ErrorCode = ErrorCode.AUTH_UNAUTHORIZED, message: string = 'Unauthorized') {
    return new AppError(code, message, 401);
  }

  static forbidden(code: ErrorCode = ErrorCode.AUTH_FORBIDDEN, message: string = 'Forbidden') {
    return new AppError(code, message, 403);
  }

  static notFound(code: ErrorCode = ErrorCode.NOT_FOUND, message: string = 'Resource not found') {
    return new AppError(code, message, 404);
  }

  static internal(message: string = 'Internal server error', details?: any) {
    return new AppError(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, details);
  }

  static unprocessable(code: ErrorCode, message: string, details?: any) {
    return new AppError(code, message, 422, details);
  }

  static tooManyRequests(code: ErrorCode, message: string, details?: any) {
    return new AppError(code, message, 429, details);
  }
}
