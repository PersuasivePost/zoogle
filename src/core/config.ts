import {
  LibraryOptions,
  GoogleConfig,
  JWTConfig,
  FindOrCreateUserFn,
  SuccessHandler,
  ErrorHandler,
} from '../types';

class Config {
  public google: GoogleConfig = {
    clientId: '',
    clientSecret: '',
    callbackURL: '',
  };

  public jwt: JWTConfig = {
    secret: '',
    expiresIn: '7d', // Default to 7 days
  };

  public findOrCreateUser: FindOrCreateUserFn | null = null;
  public onSuccess: SuccessHandler | null = null;
  public onError: ErrorHandler | null = null;

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

export const config = new Config();