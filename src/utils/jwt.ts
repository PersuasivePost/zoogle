import * as jwt from 'jsonwebtoken';
import { config } from '../core/config';
import { AppUser, ZoogleAuthError } from '../types';

class JWTUtils {
  public generateToken(user: AppUser): string {
    const payload = {
      id: user.id,
      email: user.email,
    };

    const token = (jwt as any).sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn || '7d',
    });

    return token;
  }

  public verifyToken(token: string): AppUser {
    try {
      const decoded = (jwt as any).verify(token, config.jwt.secret);

      // jwt.verify can return a string or an object (JwtPayload). We expect an object with id/email.
      if (typeof decoded === 'string' || decoded === null) {
        throw new ZoogleAuthError(
          'token_invalid',
          'Token verification failed: Invalid token format',
        );
      }

      const payload = decoded as jwt.JwtPayload;

      // Make a best-effort AppUser from the token payload
      const user: AppUser = {
        id: (payload as any).id,
        email: (payload as any).email,
        // include any other claims if present
        ...(payload as any),
      };

      return user;
    } catch (error: any) {
      // Check if it's already our custom error
      if (error instanceof ZoogleAuthError) {
        throw error;
      }

      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        throw new ZoogleAuthError(
          'token_expired',
          'Token has expired. Please log in again.',
        );
      }

      if (error.name === 'JsonWebTokenError') {
        throw new ZoogleAuthError(
          'token_invalid',
          'Invalid token signature or format.',
        );
      }

      if (error.name === 'NotBeforeError') {
        throw new ZoogleAuthError(
          'token_invalid',
          'Token is not yet valid.',
        );
      }

      // Unknown JWT error
      throw new ZoogleAuthError(
        'token_invalid',
        'Token verification failed: ' + error.message,
      );
    }
  }
}

export const jwtUtils = new JWTUtils();