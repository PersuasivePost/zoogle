export * from './types';

import { config } from './core/config';
import { authRoutes } from './adapters/routes';
import { requireAuth } from './middleware/auth';
import { LibraryOptions, ZoogleConfigError } from './types';

class GoogleOAuthEasy {
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

  // routes
  public get routes() {
    return authRoutes;
  }

  // middleware
  public get middleware() {
    return requireAuth;
  }
}

export default new GoogleOAuthEasy();