/**
 * Custom Error Classes for Zoogle
 * These provide better DX by allowing developers to catch specific errors
 * and handle them programmatically.
 */

/**
 * Base error class for all Zoogle errors
 */
export class ZoogleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ZoogleError';
    Object.setPrototypeOf(this, ZoogleError.prototype);
  }
}

/**
 * Configuration errors thrown during googleAuth.configure()
 * These indicate missing or invalid configuration options.
 */
export class ZoogleConfigError extends ZoogleError {
  public field: string;
  public hint: string;

  constructor(field: string, message: string, hint: string) {
    super(message);
    this.name = 'ZoogleConfigError';
    this.field = field;
    this.hint = hint;
    Object.setPrototypeOf(this, ZoogleConfigError.prototype);
  }
}

/**
 * OAuth errors thrown during Google authentication
 * These indicate issues with Google API communication.
 */
export class ZoogleOAuthError extends ZoogleError {
  public statusCode?: number;
  public googleError?: string;

  constructor(message: string, statusCode?: number, googleError?: string) {
    super(message);
    this.name = 'ZoogleOAuthError';
    this.statusCode = statusCode;
    this.googleError = googleError;
    Object.setPrototypeOf(this, ZoogleOAuthError.prototype);
  }
}

/**
 * Database errors thrown by findOrCreateUser function
 * These indicate issues with the developer's database logic.
 */
export class ZoogleDatabaseError extends ZoogleError {
  public originalError: Error;

  constructor(message: string, originalError: Error) {
    super(message);
    this.name = 'ZoogleDatabaseError';
    this.originalError = originalError;
    Object.setPrototypeOf(this, ZoogleDatabaseError.prototype);
  }
}

/**
 * JWT authentication errors with specific error codes
 * These help frontend developers handle token issues reliably.
 */
export class ZoogleAuthError extends ZoogleError {
  public errorCode: 'token_missing' | 'token_malformed' | 'token_expired' | 'token_invalid';

  constructor(
    errorCode: 'token_missing' | 'token_malformed' | 'token_expired' | 'token_invalid',
    message: string,
  ) {
    super(message);
    this.name = 'ZoogleAuthError';
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, ZoogleAuthError.prototype);
  }
}
