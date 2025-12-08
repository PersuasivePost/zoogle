import { NextApiRequest, NextApiResponse } from 'next';
import { oauth } from '../core/oauth';
import { jwtUtils } from '../utils/jwt';
import { config } from '../core/config';
import { ZoogleOAuthError, ZoogleDatabaseError } from '../types';

/**
 * Next.js adapter for Zoogle OAuth.
 * Provides handlers that work with Next.js API routes.
 */
class NextJSAdapter {
  /**
   * Handler for /api/auth/google/login
   * Redirects user to Google OAuth consent screen.
   *
   * @example
   * // pages/api/auth/google/login.ts
   * import googleAuth from 'zoogle';
   * export default googleAuth.nextjs.loginHandler;
   */
  public loginHandler = async (
    req: NextApiRequest,
    res: NextApiResponse,
  ): Promise<void> => {
    try {
      const authUrl = oauth.getAuthUrl();
      res.redirect(authUrl);
    } catch (error: any) {
      console.error('Error in login handler:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate login',
        message: error.message,
      });
    }
  };

  /**
   * Handler for /api/auth/google/callback
   * Handles Google's OAuth callback, exchanges code for tokens,
   * and creates/finds the user.
   *
   * @example
   * // pages/api/auth/google/callback.ts
   * import googleAuth from 'zoogle';
   * export default googleAuth.nextjs.callbackHandler;
   */
  public callbackHandler = async (
    req: NextApiRequest,
    res: NextApiResponse,
  ): Promise<void> => {
    const { code } = req.query;

    // Validate authorization code
    if (!code || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        error_code: 'missing_code',
        message: 'No authorization code provided by Google',
      });
      return;
    }

    try {
      // Step 1: Exchange code for tokens
      const tokens = await oauth.getTokens(code);

      // Step 2: Get user info from Google
      const googleUser = await oauth.getUserInfo(tokens.access_token);

      // Step 3: Find or create user in database
      if (!config.findOrCreateUser) {
        throw new Error('findOrCreateUser function is not configured.');
      }

      let user;
      try {
        user = await config.findOrCreateUser(googleUser);
      } catch (dbError: any) {
        throw new ZoogleDatabaseError(
          'The findOrCreateUser function failed while saving the user to your database.',
          dbError,
        );
      }

      // Step 4: Generate JWT token
      const token = jwtUtils.generateToken(user);

      // Step 5: Call success handler or return default response
      if (config.onSuccess) {
        // Pass Next.js req/res to custom handler
        // Cast to any to allow both Express and Next.js types
        config.onSuccess(user, token, req as any, res as any, () => {});
      } else {
        res.status(200).json({
          success: true,
          token,
          user,
        });
      }
    } catch (error: any) {
      // Detailed logging for developers
      if (error instanceof ZoogleOAuthError) {
        console.error('🔴 Authentication failed at OAuth stage');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      } else if (error instanceof ZoogleDatabaseError) {
        console.error('\n❌ Zoogle Runtime Error: Database Operation Failed');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('The findOrCreateUser function failed.');
        console.error('\nYour Database Error Details:');
        console.error('  Message:', error.originalError.message);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      } else {
        console.error('Unknown error during authentication:', error);
      }

      // Call custom error handler or return default response
      if (config.onError) {
        config.onError(error, req as any, res as any, () => {});
      } else {
        res.status(500).json({
          success: false,
          error: 'Authentication failed',
          message: error.message,
        });
      }
    }
  };
}

export const nextjsAdapter = new NextJSAdapter();
