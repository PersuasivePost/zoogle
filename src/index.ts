export * from './types';

import { config } from './core/config';
import { authRoutes } from './adapters/routes';
import { requireAuth } from './middleware/auth';
import { LibraryOptions } from './types';

class GoogleOAuthEasy {
  public configure(options: LibraryOptions): void {
    // 
    config.set(options);

    try {
      config.validate();
    } catch (error: any) {
      // thorww error
      throw new Error(`[GoogleOAuthEasy] Configuration error: ${error.message}`);
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