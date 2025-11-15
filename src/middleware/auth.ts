import { Request, Response, NextFunction } from 'express';
import { jwtUtils } from '../utils/jwt';
import { AppUser, ZoogleAuthError } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: AppUser;
    }
  }
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 1. Get the Authorization header
  const authHeader = req.headers.authorization;

  // 2. Check if it exists
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error_code: 'token_missing',
      message: 'No authorization token provided. Please include an Authorization header with "Bearer <token>".',
    });
  }

  // 3. Check if it's in the correct format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error_code: 'token_malformed',
      message: 'Invalid token format. Expected format: "Bearer <token>".',
    });
  }

  const token = parts[1];

  // 4. Verify the token using our JWT util
  try {
    const user = jwtUtils.verifyToken(token);

    // 5. SUCCESS: Attach user to the request object
    req.user = user;

    // 6. Pass control to the next function (the actual route handler)
    next();
  } catch (error) {
    // Handle ZoogleAuthError with specific error codes
    if (error instanceof ZoogleAuthError) {
      return res.status(401).json({
        success: false,
        error_code: error.errorCode,
        message: error.message,
      });
    }

    // Fallback for any other errors
    return res.status(401).json({
      success: false,
      error_code: 'token_invalid',
      message: 'Token verification failed.',
    });
  }
};