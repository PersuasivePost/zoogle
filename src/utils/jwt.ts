import jwt from 'jsonwebtoken';
import { config } from '../core/config';
import { AppUser } from '../types';

class JWTUtils {
  public generateToken(user: AppUser): string {
    const payload = {
      id: user.id,
      email: user.email,
    };

    const token = jwt.sign(payload, config.jwt.secret as string, {
      expiresIn: config.jwt.expiresIn || '7d',
    });

    return token;
  }

  public verifyToken(token: string): AppUser | null {
    try {
      const decoded = jwt.verify(
        token,
        config.jwt.secret,
      ) as AppUser;

      return decoded;
    } catch (error) {
      return null;
    }
  }
}

export const jwtUtils = new JWTUtils();