/**
 * Next.js-specific entry point for Zoogle.
 * This avoids importing Express which causes bundling issues in Next.js.
 */

export * from './types';

import { config } from './core/config';
import { nextjsAdapter } from './adapters/nextjs';
import { withAuth } from './middleware/nextjs-auth';
import { LibraryOptions, ZoogleConfigError } from './types';

class GoogleOAuthNextJS {
  /**
   * Configures the Zoogle library. Must be called once at startup.
   */
  public configure(options: LibraryOptions): void {
    config.set(options);

    try {
      config.validate();
    } catch (error: any) {
      if (error instanceof ZoogleConfigError) {
        console.error('\n❌ Zoogle Configuration Error');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`Field: ${error.field}`);
        console.error(`Error: ${error.message}`);
        console.error('\nHow to Fix:');
        console.error(error.hint);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        throw error;
      }
      throw new Error(`[Zoogle] Configuration error: ${error.message}`);
    }
  }

  /**
   * Next.js handlers and middleware for API routes.
   */
  public get nextjs() {
    return {
      loginHandler: nextjsAdapter.loginHandler,
      callbackHandler: nextjsAdapter.callbackHandler,
      withAuth: withAuth,
    };
  }
}

export default new GoogleOAuthNextJS();

// Re-export Next.js middleware
export { withAuth } from './middleware/nextjs-auth';
