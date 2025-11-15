import { JWTConfig, GoogleConfig } from '../types';

/**
 * Load sensible configuration from environment variables.
 *
 * This helper reads common environment variable names and returns
 * an object suitable for spreading into `googleAuth.configure()`.
 */
export function loadFromEnv(): { google: GoogleConfig; jwt: JWTConfig } {
  const google: GoogleConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || process.env.GOOGLE_CALLBACK || '',
  };

  const jwt: JWTConfig = {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || undefined,
  };

  return { google, jwt };
}

export default loadFromEnv;
