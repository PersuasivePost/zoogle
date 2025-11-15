import { Router, Request, Response, NextFunction } from 'express';
import { config } from '../core/config';
import { oauth } from '../core/oauth';
import { jwtUtils } from '../utils/jwt';
import { ZoogleOAuthError, ZoogleDatabaseError } from '../types';

export const authRoutes = Router();

authRoutes.get('/login', (req: Request, res: Response) => {
  try {
    const authUrl = oauth.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error in /login route:', error);
    res.status(500).send('Login initiation failed');
  }
});

authRoutes.get(
  '/callback',
  async (req: Request, res: Response, next: NextFunction) => {
    const code = req.query.code as string;

    if (!code) {
      return res.status(400).json({
        success: false,
        error_code: 'missing_code',
        message: 'No authorization code provided by Google',
      });
    }

    try {
      // Step 1: Get tokens from Google
      const tokens = await oauth.getTokens(code);

      // Step 2: Get user info from Google
      const googleUser = await oauth.getUserInfo(tokens.access_token);

      // Step 3: Save user to database using developer's function
      if (!config.findOrCreateUser) {
        throw new Error('findOrCreateUser function is not configured.');
      }

      let user;
      try {
        user = await config.findOrCreateUser(googleUser);
      } catch (dbError: any) {
        // Wrap database errors for better developer feedback
        throw new ZoogleDatabaseError(
          'The findOrCreateUser function failed while saving the user to your database.',
          dbError,
        );
      }

      // Step 4: Generate JWT token
      const token = jwtUtils.generateToken(user);

      // Step 5: Call success handler or return default response
      if (config.onSuccess) {
        config.onSuccess(user, token, req, res, next);
      } else {
        res.status(200).json({
          success: true,
          token,
          user,
        });
      }
    } catch (error: any) {
      // Dual-Logging Strategy: Detailed logs for developer, clean response for user

      // --- FOR THE DEVELOPER (Server Console) ---
      if (error instanceof ZoogleOAuthError) {
        // OAuth/Google API errors - already logged in oauth.ts
        // Just log that we caught it here
        console.error('🔴 Authentication failed at OAuth stage');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.stack) {
          console.error('Stack trace:', error.stack);
        }
      } else if (error instanceof ZoogleDatabaseError) {
        // Database errors from findOrCreateUser
        console.error('\n❌ Zoogle Runtime Error: Database Operation Failed');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('The findOrCreateUser function failed.');
        console.error('This means there\'s an issue with YOUR database logic.');
        console.error('\nWhat to check:');
        console.error('  → Is your database connection working?');
        console.error('  → Does the user table/collection exist?');
        console.error('  → Are you handling duplicate emails correctly?');
        console.error('  → Check the error details below for specifics');
        console.error('\nYour Database Error Details:');
        console.error('  Message:', error.originalError.message);
        console.error('  Name:', error.originalError.name);
        if (error.originalError.stack) {
          console.error('  Stack:', error.originalError.stack);
        }
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      } else {
        // Unknown error
        console.error('\n❌ Zoogle Runtime Error: Unknown error during authentication');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }

      // --- FOR THE USER/FRONTEND (Clean JSON Response) ---
      if (config.onError) {
        // Use developer's custom error handler
        config.onError(error, req, res, next);
      } else {
        // Default error response - clean and safe
        if (error instanceof ZoogleOAuthError) {
          res.status(500).json({
            success: false,
            error_code: 'oauth_failed',
            message: 'Authentication with Google failed. Please try again or contact support.',
          });
        } else if (error instanceof ZoogleDatabaseError) {
          res.status(500).json({
            success: false,
            error_code: 'database_error',
            message: 'Failed to create your account. Please try again or contact support.',
          });
        } else {
          res.status(500).json({
            success: false,
            error_code: 'unknown_error',
            message: 'Authentication failed. Please try again or contact support.',
          });
        }
      }
    }
  },
);