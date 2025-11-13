import {
  LibraryOptions,
  GoogleConfig,
  JWTConfig,
  FindOrCreateUserFn,
  SuccessHandler,
  ErrorHandler,
} from '../types'; // Import our "shapes" from Step 2

// This class will hold all our settings
class Config {
  // --- Google Settings ---
  public google: GoogleConfig = {
    clientId: '',
    clientSecret: '',
    callbackURL: '',
  };

  // --- JWT Settings ---
  public jwt: JWTConfig = {
    secret: '',
    expiresIn: '7d', // Default to 7 days
  };

  // --- User-provided Functions ---
  public findOrCreateUser: FindOrCreateUserFn | null = null;
  public onSuccess: SuccessHandler | null = null;
  public onError: ErrorHandler | null = null;

  /**
   * Loads the user's options into our config object.
   */
  public set(options: LibraryOptions): void {
    if (options.google) {
      this.google = { ...this.google, ...options.google };
    }

    if (options.jwt) {
      this.jwt = { ...this.jwt, ...options.jwt };
    }

    if (options.findOrCreateUser) {
      this.findOrCreateUser = options.findOrCreateUser;
    }

    if (options.onSuccess) {
      this.onSuccess = options.onSuccess;
    }

    if (options.onError) {
      this.onError = options.onError;
    }
  }

  /**
   * Checks that all required settings have been provided.
   */
  public validate(): void {
    if (!this.google.clientId) {
      throw new Error('Google [clientId] is required.');
    }
    if (!this.google.clientSecret) {
      throw new Error('Google [clientSecret] is required.');
    }
    if (!this.google.callbackURL) {
      throw new Error('Google [callbackURL] is required.');
    }
    if (!this.jwt.secret) {
      throw new Error('JWT [secret] is required.');
    }
    if (!this.findOrCreateUser) {
      throw new Error('[findOrCreateUser] function is required.');
    }
  }
}

// Create and export a SINGLETON instance.
// This means the entire library will share this one config object.
export const config = new Config();