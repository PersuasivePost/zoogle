export * from './types';

import { config } from './core/config';
import { authRoutes } from './adapters/routes';
import { requireAuth } from './middleware/auth';
import { LibraryOptions, ZoogleConfigError } from './types';

class GoogleOAuthEasy {
  /**
   * Configures the Zoogle library. Must be called once at startup.
   *
   * @param options Configuration options (google, jwt, findOrCreateUser, callbacks)
   */
  public configure(options: LibraryOptions): void {
    config.set(options);

    try {
      config.validate();
    } catch (error: any) {
      // Enhanced error handling for configuration
      if (error instanceof ZoogleConfigError) {
        // Log helpful error message to console
        console.error('\n❌ Zoogle Configuration Error');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`Field: ${error.field}`);
        console.error(`Error: ${error.message}`);
        console.error('\nHow to Fix:');
        console.error(error.hint);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Re-throw the error so the app doesn't start with bad config
        throw error;
      }

      // For any other error, wrap it
      throw new Error(`[Zoogle] Configuration error: ${error.message}`);
    }
  }

  /**
   * The Express router containing the `/login` and `/callback` endpoints.
   *
   * @example
   * app.use('/auth/google', googleAuth.routes);
   */
  // routes
  public get routes() {
    return authRoutes;
  }

  /**
   * Express middleware to protect routes. Verifies `Authorization: Bearer <token>`
   * and attaches the decoded user to `req.user` on success.
   *
   * @example
   * app.get('/profile', googleAuth.middleware, (req, res) => { res.json(req.user) });
   */
  // middleware
  public get middleware() {
    return requireAuth;
  }
}

export default new GoogleOAuthEasy();