# Error Handling in Zoogle

Zoogle provides comprehensive error handling across three critical phases of authentication. This guide explains how to handle each type of error effectively.

## 🎯 Custom Error Classes

Zoogle provides custom error classes that you can catch programmatically:

```typescript
import googleAuth, { 
  ZoogleConfigError, 
  ZoogleOAuthError, 
  ZoogleDatabaseError, 
  ZoogleAuthError 
} from 'zoogle';
```

### Error Hierarchy

- **`ZoogleError`** - Base class for all Zoogle errors
  - **`ZoogleConfigError`** - Configuration errors (Phase 1)
  - **`ZoogleOAuthError`** - Google API errors (Phase 2)
  - **`ZoogleDatabaseError`** - Database errors (Phase 2)
  - **`ZoogleAuthError`** - JWT authentication errors (Phase 3)

---

## 📋 Phase 1: Configuration Errors

These errors occur when `googleAuth.configure()` is called with missing or invalid configuration.

### What Gets Validated

1. **`google.clientId`** - Required
2. **`google.clientSecret`** - Required
3. **`google.callbackURL`** - Required
4. **`jwt.secret`** - Required (minimum 32 characters)
5. **`findOrCreateUser`** - Required function

### Example Error

```typescript
try {
  googleAuth.configure({
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: '', // ❌ Missing!
      callbackURL: 'http://localhost:3000/auth/callback',
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
    },
    findOrCreateUser: async (profile) => {
      // your logic
    },
  });
} catch (error) {
  if (error instanceof ZoogleConfigError) {
    console.error('Field:', error.field);        // "google.clientSecret"
    console.error('Message:', error.message);     // "Missing: google.clientSecret"
    console.error('Hint:', error.hint);          // Detailed help message
  }
}
```

### Console Output (For Developer)

When a configuration error occurs, Zoogle logs a helpful message:

```
❌ Zoogle Configuration Error
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Field: google.clientSecret
Error: Missing: google.clientSecret

How to Fix:
You need a Client Secret from Google Cloud Console. It should be 
listed alongside your Client ID. Add it to your .env file as 
GOOGLE_CLIENT_SECRET=...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Handling Configuration Errors

```typescript
try {
  googleAuth.configure(config);
} catch (error) {
  if (error instanceof ZoogleConfigError) {
    // Programmatically handle specific fields
    switch (error.field) {
      case 'google.clientId':
        console.error('Please set GOOGLE_CLIENT_ID in .env');
        break;
      case 'jwt.secret':
        console.error('Please generate a JWT secret');
        break;
      default:
        console.error(error.hint);
    }
    process.exit(1); // Don't start the server with bad config
  }
}
```

---

## 🔄 Phase 2: Runtime Authentication Errors

These errors occur during the OAuth flow when a user tries to log in.

### Two Types of Runtime Errors

#### 1. OAuth/Google API Errors (`ZoogleOAuthError`)

**When it happens:**
- Invalid `clientId` or `clientSecret`
- Callback URL mismatch
- Authorization code expired or already used
- Google API is down

**Console Output (For Developer):**

```
❌ Zoogle Runtime Error: Failed to get tokens from Google
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This usually means one of the following:
  1. Your clientId or clientSecret is incorrect
  2. Your callbackURL doesn't match what's in Google Cloud Console
  3. The authorization code has expired or was already used

What to check:
  → Go to https://console.cloud.google.com/apis/credentials
  → Verify your Client ID matches GOOGLE_CLIENT_ID in .env
  → Verify your Client Secret matches GOOGLE_CLIENT_SECRET in .env
  → Ensure your callback URL is in "Authorized redirect URIs"

Google API Error Details:
  Status Code: 400
  Error: invalid_grant
  Description: Bad Request
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**JSON Response (For Frontend):**

```json
{
  "success": false,
  "error_code": "oauth_failed",
  "message": "Authentication with Google failed. Please try again or contact support."
}
```

#### 2. Database Errors (`ZoogleDatabaseError`)

**When it happens:**
- Your `findOrCreateUser` function throws an error
- Database connection issues
- Duplicate key violations
- Invalid database queries

**Console Output (For Developer):**

```
❌ Zoogle Runtime Error: Database Operation Failed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The findOrCreateUser function failed.
This means there's an issue with YOUR database logic.

What to check:
  → Is your database connection working?
  → Does the user table/collection exist?
  → Are you handling duplicate emails correctly?
  → Check the error details below for specifics

Your Database Error Details:
  Message: duplicate key error collection: users index: email_1
  Name: MongoError
  Stack: ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**JSON Response (For Frontend):**

```json
{
  "success": false,
  "error_code": "database_error",
  "message": "Failed to create your account. Please try again or contact support."
}
```

### Custom Error Handling

You can provide a custom error handler:

```typescript
googleAuth.configure({
  // ... other config
  onError: (error, req, res, next) => {
    if (error instanceof ZoogleOAuthError) {
      // Log to your error tracking service
      logger.error('OAuth failed', { 
        statusCode: error.statusCode,
        googleError: error.googleError 
      });
      
      // Send custom response
      res.status(500).json({
        success: false,
        message: 'Google login failed. Please try again.',
        supportEmail: 'support@yourapp.com',
      });
    } else if (error instanceof ZoogleDatabaseError) {
      // Log the original database error
      logger.error('Database error', { 
        originalError: error.originalError 
      });
      
      res.status(500).json({
        success: false,
        message: 'Account creation failed. Please contact support.',
      });
    } else {
      // Generic error
      res.status(500).json({
        success: false,
        message: 'Authentication failed. Please try again.',
      });
    }
  },
});
```

---

## 🔐 Phase 3: API Authentication Errors

These errors occur when protected routes validate JWT tokens using `requireAuth` middleware.

### Error Codes

Zoogle provides **specific error codes** that frontend developers can use to handle token issues reliably:

| Error Code | HTTP Status | Description | Frontend Action |
|------------|-------------|-------------|-----------------|
| `token_missing` | 401 | No Authorization header provided | Redirect to login |
| `token_malformed` | 401 | Token doesn't match "Bearer <token>" format | Clear token, redirect to login |
| `token_expired` | 401 | Token has expired | Attempt token refresh |
| `token_invalid` | 401 | Invalid signature or format | Clear token, redirect to login |

### Example Error Responses

#### Missing Token

```json
{
  "success": false,
  "error_code": "token_missing",
  "message": "No authorization token provided. Please include an Authorization header with \"Bearer <token>\"."
}
```

#### Expired Token

```json
{
  "success": false,
  "error_code": "token_expired",
  "message": "Token has expired. Please log in again."
}
```

#### Invalid Token

```json
{
  "success": false,
  "error_code": "token_invalid",
  "message": "Invalid token signature or format."
}
```

### Frontend Error Handling

**❌ BAD (Fragile):**

```typescript
// Don't do this - string matching is unreliable
try {
  const response = await api.get('/protected');
} catch (error) {
  if (error.response.data.message.includes('expired')) {
    // This breaks if message text changes
    refreshToken();
  }
}
```

**✅ GOOD (Robust):**

```typescript
// Do this - use error codes
try {
  const response = await api.get('/protected');
} catch (error) {
  const { error_code } = error.response.data;
  
  switch (error_code) {
    case 'token_expired':
      // Reliable: We know exactly what happened
      await refreshToken();
      return retryRequest();
      
    case 'token_missing':
    case 'token_malformed':
    case 'token_invalid':
      // Clear bad token and redirect
      clearAuthToken();
      redirectToLogin();
      break;
      
    default:
      showGenericError();
  }
}
```

### Axios Interceptor Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const { error_code } = error.response?.data || {};

    // Handle token expiration
    if (error_code === 'token_expired' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh the token
        const newToken = await refreshAccessToken();
        
        // Update the header
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearAuthToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other auth errors
    if (['token_missing', 'token_malformed', 'token_invalid'].includes(error_code)) {
      clearAuthToken();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 🛠️ Testing Error Handling

### Test Configuration Errors

```typescript
import { expect } from 'chai';
import googleAuth, { ZoogleConfigError } from 'zoogle';

describe('Configuration Errors', () => {
  it('should throw ZoogleConfigError for missing clientId', () => {
    expect(() => {
      googleAuth.configure({
        google: {
          clientId: '', // Missing
          clientSecret: 'secret',
          callbackURL: 'http://localhost:3000/auth/callback',
        },
        jwt: { secret: 'long-secret-key-here-minimum-32-chars' },
        findOrCreateUser: async (profile) => ({ id: 1, email: profile.email }),
      });
    }).to.throw(ZoogleConfigError);
  });
});
```

### Test Runtime Errors

```typescript
import { expect } from 'chai';
import request from 'supertest';
import app from './app';

describe('Runtime Errors', () => {
  it('should return oauth_failed error for invalid credentials', async () => {
    const response = await request(app)
      .get('/auth/callback?code=invalid-code')
      .expect(500);

    expect(response.body).to.deep.equal({
      success: false,
      error_code: 'oauth_failed',
      message: 'Authentication with Google failed. Please try again or contact support.',
    });
  });
});
```

### Test Auth Middleware Errors

```typescript
describe('Auth Middleware Errors', () => {
  it('should return token_missing error', async () => {
    const response = await request(app)
      .get('/protected-route')
      .expect(401);

    expect(response.body.error_code).to.equal('token_missing');
  });

  it('should return token_expired error', async () => {
    const expiredToken = generateExpiredToken();

    const response = await request(app)
      .get('/protected-route')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body.error_code).to.equal('token_expired');
  });
});
```

---

## 📊 Error Tracking

Integrate with error tracking services:

```typescript
import * as Sentry from '@sentry/node';

googleAuth.configure({
  // ... other config
  onError: (error, req, res, next) => {
    // Log to Sentry with context
    Sentry.captureException(error, {
      tags: {
        errorType: error.name,
      },
      extra: {
        userId: req.user?.id,
        requestPath: req.path,
        ...(error instanceof ZoogleOAuthError && {
          statusCode: error.statusCode,
          googleError: error.googleError,
        }),
        ...(error instanceof ZoogleDatabaseError && {
          databaseError: error.originalError.message,
        }),
      },
    });

    // Default error response
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  },
});
```

---

## 🎯 Best Practices

### ✅ DO

1. **Always catch `ZoogleConfigError` in production** - Don't let your app start with bad config
2. **Use error codes in frontend** - They're reliable and won't break with message changes
3. **Log full errors server-side** - But send clean messages to users
4. **Implement token refresh logic** - Handle `token_expired` gracefully
5. **Monitor errors** - Track error rates and types in production

### ❌ DON'T

1. **Don't expose sensitive info** - Never send API keys or secrets in error responses
2. **Don't ignore configuration errors** - They indicate setup problems
3. **Don't parse error messages** - Use error codes instead
4. **Don't let expired tokens kill UX** - Implement automatic refresh
5. **Don't forget to log** - You need debugging info when things go wrong

---

## 📚 Summary

Zoogle's error handling gives you:

✅ **Custom error classes** - Catch and handle specific error types  
✅ **Detailed developer logs** - Know exactly what went wrong and how to fix it  
✅ **Clean user responses** - Safe, helpful messages for end users  
✅ **Error codes** - Reliable error handling in frontend  
✅ **Pro-level DX** - Spend less time debugging, more time building

For more examples, see the [examples/](./examples/) directory.
