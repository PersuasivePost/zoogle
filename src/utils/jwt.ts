import jwt from 'jsonwebtoken';
import { config } from '../core/config'; // Our settings
import { AppUser } from '../types'; // Our AppUser type

class JWTUtils {
  /**
   * 1. Generates a new JWT for a given user.
   * This is the "digital ID card" we give to the user.
   */
  public generateToken(user: AppUser): string {
    // We only want to store non-sensitive info in the token
    const payload = {
      id: user.id,
      email: user.email,
    };

    // Sign the token with our secret key
    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn, // e.g., "7d"
    });

    return token;
  }

  /**
   * 2. Verifies a JWT from the user.
   * This is us checking the "digital ID card."
   */
  public verifyToken(token: string): AppUser | null {
    try {
      // Check if the token is valid and signed with our secret
      const decoded = jwt.verify(
        token,
        config.jwt.secret,
      ) as AppUser;

      return decoded;
    } catch (error) {
      // Token is invalid (expired, wrong signature, etc.)
      return null;
    }
  }
}

// Export a singleton instance
export const jwtUtils = new JWTUtils();