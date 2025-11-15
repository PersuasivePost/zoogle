import { Request, Response, NextFunction } from 'express';

/**
 * Google OAuth configuration options.
 *
 * @see https://console.cloud.google.com/apis/credentials
 */
export interface GoogleConfig {
  /** Your Google OAuth Client ID. */
  clientId: string;

  /** Your Google OAuth Client Secret. */
  clientSecret: string;

  /**
   * The callback URL Google will redirect to after authentication.
   * Make sure this exact URL is registered in the Google Cloud Console
   * under "Authorized redirect URIs".
   *
   * @example "http://localhost:3000/auth/callback"
   */
  callbackURL: string;
}

/**
 * JWT configuration used to sign user tokens.
 *
 * @default expiresIn "7d"
 */
export interface JWTConfig {
  /** Secret used to sign JWTs. Use a long random string (>=32 chars). */
  secret: string;

  /** Token lifetime (e.g. "7d", "24h"). Defaults to "7d". */
  expiresIn?: string; // e.g., "7d", "24h"
}

/**
 * Full library options passed to `googleAuth.configure()`.
 */
export interface LibraryOptions {
  /** Google OAuth options. */
  google: GoogleConfig;

  /** JWT options. */
  jwt: JWTConfig;

  /**
   * Developer-provided function that takes a Google profile and returns a user
   * from your database (create it if necessary).
   */
  findOrCreateUser: FindOrCreateUserFn;

  /** Optional success handler called after authentication. */
  onSuccess?: SuccessHandler;

  /** Optional error handler called on authentication errors. */
  onError?: ErrorHandler;
}

/**
 * The Google user profile returned from Google APIs.
 */
export interface GoogleUserProfile {
  /** The Google account id */
  id: string;

  /** Primary email for the Google account */
  email: string;

  /** Full name */
  name: string;

  /** Profile picture URL */
  picture: string;
}

/**
 * Minimal shape for the application user object that Zoogle expects.
 */
export interface AppUser {
  /** Unique id for your user (string or number) */
  id: string | number; // Or `_id` for MongoDB

  /** Primary email address */
  email: string;

  /** Other optional properties your app may use */
  [key: string]: any; // Allow any other properties
}

/**
 * A function that receives a Google profile and must return a user from your database.
 *
 * @param profile The user data retrieved from Google after successful authentication.
 * @returns A Promise that resolves to your application's user object.
 *
 * @example
 * async function findOrCreateUser(profile) {
 *   let user = await db.users.findOne({ email: profile.email });
 *   if (!user) {
 *     user = await db.users.create({ email: profile.email, name: profile.name });
 *   }
 *   return user;
 * }
 */
export type FindOrCreateUserFn = (
  profile: GoogleUserProfile,
) => Promise<AppUser>;

/** Optional success handler called after a successful login. */
export type SuccessHandler = (
  user: AppUser,
  token: string,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

/** Optional error handler for the authentication flow. */
export type ErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

// Re-export error classes
export {
  ZoogleError,
  ZoogleConfigError,
  ZoogleOAuthError,
  ZoogleDatabaseError,
  ZoogleAuthError,
} from '../errors';