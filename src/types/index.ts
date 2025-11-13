import { Request, Response, NextFunction } from 'express';

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
}

export interface JWTConfig {
  secret: string;
  expiresIn?: string; // e.g., "7d", "24h"
}

export interface LibraryOptions {
  google: GoogleConfig;
  jwt: JWTConfig;
  findOrCreateUser: FindOrCreateUserFn;
  onSuccess?: SuccessHandler;
  onError?: ErrorHandler;
}

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface AppUser {
  id: string | number; // Or `_id` for MongoDB
  email: string;
  [key: string]: any; // Allow any other properties
}

export type FindOrCreateUserFn = (
  profile: GoogleUserProfile,
) => Promise<AppUser>;

export type SuccessHandler = (
  user: AppUser,
  token: string,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

export type ErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;