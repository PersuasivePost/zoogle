import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { jwtUtils } from '../utils/jwt';
import { AppUser, ZoogleAuthError } from '../types';

// Extend Next.js request to include user
declare module 'next' {
  interface NextApiRequest {
    user?: AppUser;
  }
}

/**
 * Higher-order function middleware to protect Next.js API routes.
 * Verifies JWT token from Authorization header and attaches user to request.
 *
 * @param handler - The Next.js API handler to protect
 * @returns A wrapped handler that checks authentication first
 *
 * @example
 * // pages/api/profile.ts
 * import { withAuth } from 'zoogle';
 *
 * async function handler(req, res) {
 *   res.json({ user: req.user });
 * }
 *
 * export default withAuth(handler);
 */
export function withAuth(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    // 1. Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error_code: 'token_missing',
        message:
          'No authorization token provided. Please include an Authorization header with "Bearer <token>".',
      });
      return;
    }

    // 2. Check format: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error_code: 'token_malformed',
        message: 'Invalid token format. Expected format: "Bearer <token>".',
      });
      return;
    }

    const token = parts[1];

    // 3. Verify token
    try {
      const user = jwtUtils.verifyToken(token);

      // 4. Attach user to request
      req.user = user;

      // 5. Call the actual handler
      await handler(req, res);
      return;
    } catch (error) {
      // Handle ZoogleAuthError with specific error codes
      if (error instanceof ZoogleAuthError) {
        res.status(401).json({
          success: false,
          error_code: error.errorCode,
          message: error.message,   
        });
        return;
      }

      // Fallback for any other errors
      res.status(401).json({
        success: false,
        error_code: 'token_invalid',
        message: 'Token verification failed.',
      });
      return;
    }
  };
}
