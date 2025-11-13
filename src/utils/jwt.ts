import * as jwt from 'jsonwebtoken';
import { config } from '../core/config';
import { AppUser } from '../types';

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

  public verifyToken(token: string): AppUser | null {
    try {
  const decoded = (jwt as any).verify(token, config.jwt.secret);

      // jwt.verify can return a string or an object (JwtPayload). We expect an object with id/email.
      if (typeof decoded === 'string' || decoded === null) {
        return null;
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
    } catch (error) {
      return null;
    }
  }
}

export const jwtUtils = new JWTUtils();