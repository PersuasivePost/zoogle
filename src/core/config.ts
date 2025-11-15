import {
  LibraryOptions,
  GoogleConfig,
  JWTConfig,
  FindOrCreateUserFn,
  SuccessHandler,
  ErrorHandler,
  ZoogleConfigError,
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
    // Root cause detection: maybe .env wasn't loaded at all
    if (!this.google.clientId && !this.google.clientSecret && !this.jwt.secret) {
      throw new ZoogleConfigError(
        'all',
        'All required secrets are missing',
        "Did you forget to load your .env file? Make sure you call require('dotenv').config() at the top of your entry file (e.g. server.ts) or otherwise load your environment variables.",
      );
    }

    // Fatal configuration errors (the app cannot start without these)
    if (!this.google.clientId) {
      throw new ZoogleConfigError(
        'google.clientId',
        'Missing: google.clientId',
        'You need a Client ID from Google Cloud Console. Go to https://console.cloud.google.com/apis/credentials and add GOOGLE_CLIENT_ID to your environment.',
      );
    }

    if (!this.google.clientSecret) {
      throw new ZoogleConfigError(
        'google.clientSecret',
        'Missing: google.clientSecret',
        'You need a Client Secret from Google Cloud Console. Add GOOGLE_CLIENT_SECRET to your environment.',
      );
    }

    if (!this.google.callbackURL) {
      throw new ZoogleConfigError(
        'google.callbackURL',
        'Missing: google.callbackURL',
        'Provide a callback URL (e.g. http://localhost:3000/auth/callback) and add it to your Google OAuth settings as an Authorized redirect URI.',
      );
    }

    if (!this.jwt.secret) {
      throw new ZoogleConfigError(
        'jwt.secret',
        'Missing: jwt.secret',
        'This is a long, random string used to sign user tokens. Generate one and set JWT_SECRET in your environment.',
      );
    }

    if (!this.findOrCreateUser) {
      throw new ZoogleConfigError(
        'findOrCreateUser',
        'Missing: findOrCreateUser function',
        'Zoogle needs an async function that takes a Google profile and returns (or creates) a user record in your database.',
      );
    }

    // Non-fatal warnings: insecure or placeholder values that should be fixed
    // 1) Placeholder detection for clientId / clientSecret
    const placeholderPattern = /YOUR_|CHANGE_ME|YOUR-CLIENT|your-/i;
    if (this.google.clientId && placeholderPattern.test(this.google.clientId)) {
      console.warn('\n⚠️  Zoogle Warning: google.clientId looks like a placeholder.');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('It appears you are using a placeholder Google Client ID (contains YOUR_ or CHANGE_ME).');
      console.warn('This will not work in production. Obtain a real Client ID from Google Cloud Console and set it in your environment.');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    if (this.google.clientSecret && placeholderPattern.test(this.google.clientSecret)) {
      console.warn('\n⚠️  Zoogle Warning: google.clientSecret looks like a placeholder.');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('It appears you are using a placeholder Google Client Secret. Replace it with the real secret from Google Cloud Console.');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // 2) Weak JWT secret detection
    const weakSecrets = ['secret', '123456', 'password', 'changeme', 'jwtsecret'];
    const secretLower = (this.jwt.secret || '').toLowerCase();
    if (weakSecrets.includes(secretLower)) {
      console.warn('\n⚠️  Zoogle Warning: Your JWT secret appears to be a weak placeholder.');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('Using a weak JWT secret is insecure. Generate a strong random secret:');
      console.warn("  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
      console.warn('Set it in your environment as JWT_SECRET.');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // 3) Secret length warning
    if (this.jwt.secret && this.jwt.secret.length < 32) {
      console.warn('\n⚠️  Zoogle Warning: JWT secret length is shorter than recommended (32 characters).');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('For security, use a 32+ character random secret. Example:');
      console.warn("  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // 4) HTTP callback in production
    if (
      process.env.NODE_ENV === 'production' &&
      this.google.callbackURL &&
      this.google.callbackURL.startsWith('http://')
    ) {
      console.warn('\n⚠️  Zoogle Security Warning: callbackURL is using http:// in production.');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('OAuth redirect URIs should use https:// in production to avoid token interception.');
      console.warn('Please update your callbackURL to use HTTPS and update your Google Cloud Console settings.');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }
}

export const config = new Config();