// For handling Express request and response objects
import { Request, Response, NextFunction } from 'express';

/**
 * 1. Configuration types for library setup
 */

// Shape of the Google credentials object
export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
}

// Shape of the JWT configuration object
export interface JWTConfig {
  secret: string;
  expiresIn?: string; // e.g., "7d", "24h"
}

// Shape of the main options object for our `configure` function
export interface LibraryOptions {
  google: GoogleConfig;
  jwt: JWTConfig;
  findOrCreateUser: FindOrCreateUserFn;
  onSuccess?: SuccessHandler;
  onError?: ErrorHandler;
}

/**
 * 2. User-related types
 */

// The data we get back from Google about the user
export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}

// The user object as it exists IN YOUR database.
// We require an `id` (or `_id`) to create the JWT.
export interface AppUser {
  id: string | number; // Or `_id` for MongoDB
  email: string;
  [key: string]: any; // Allow any other properties
}

/**
 * 3. Function types (for callbacks)
 */

// The shape of the function YOU will provide to find a user in your DB
export type FindOrCreateUserFn = (
  profile: GoogleUserProfile,
) => Promise<AppUser>;

// Optional function to run on a successful login
export type SuccessHandler = (
  user: AppUser,
  token: string,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

// Optional function to run on a failed login
export type ErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;