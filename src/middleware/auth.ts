import { Request, Response, NextFunction } from 'express';
import { jwtUtils } from '../utils/jwt';
import { AppUser } from '../types';

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
    return res.status(401).json({ message: 'No token provided' });
  }

  // 3. Check if it's in the correct format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token format is "Bearer <token>"' });
  }

  const token = parts[1];

  // 4. Verify the token using our JWT util
  try {
    const user = jwtUtils.verifyToken(token);

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // 5. SUCCESS: Attach user to the request object
    req.user = user;

    // 6. Pass control to the next function (the actual route handler)
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};