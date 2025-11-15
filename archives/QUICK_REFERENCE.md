# 🚀 Zoogle Error Handling - Quick Reference

## 📦 Import Error Classes

```typescript
import googleAuth, { 
  ZoogleConfigError, 
  ZoogleOAuthError, 
  ZoogleDatabaseError, 
  ZoogleAuthError 
} from 'zoogle';
```

---

## 🎯 Phase 1: Configuration Errors

### Catch at Startup
```typescript
try {
  googleAuth.configure({
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: 'http://localhost:3000/auth/callback',
    },
    jwt: {
      secret: process.env.JWT_SECRET!, // Min 32 chars
    },
    findOrCreateUser: async (profile) => {
      // Your database logic
    },
  });
} catch (error) {
  if (error instanceof ZoogleConfigError) {
    console.error('Fix:', error.hint);
    process.exit(1); // Don't start with bad config
  }
}
```

---

## 🔄 Phase 2: Runtime Errors

### Custom Error Handler
```typescript
googleAuth.configure({
  // ... config
  onError: (error, req, res, next) => {
    if (error instanceof ZoogleOAuthError) {
      // Google API failed - check credentials
      logger.error('OAuth', error.statusCode, error.googleError);
      res.status(500).json({ 
        error_code: 'oauth_failed' 
      });
    } 
    else if (error instanceof ZoogleDatabaseError) {
      // Your database logic failed
      logger.error('DB', error.originalError);
      res.status(500).json({ 
        error_code: 'database_error' 
      });
    }
  },
});
```

---

## 🔐 Phase 3: Auth Middleware Errors

### Frontend Axios Interceptor
```typescript
axios.interceptors.response.use(
  response => response,
  async error => {
    const { error_code } = error.response?.data || {};
    
    switch (error_code) {
      case 'token_expired':
        // Refresh and retry
        const newToken = await refreshToken();
        error.config.headers['Authorization'] = `Bearer ${newToken}`;
        return axios(error.config);
        
      case 'token_missing':
      case 'token_malformed':
      case 'token_invalid':
        // Clear and redirect
        clearAuthToken();
        window.location.href = '/login';
        break;
    }
    
    return Promise.reject(error);
  }
);
```

---

## 📋 Error Code Reference

### Runtime (Callback Route)
| Code | Meaning | Action |
|------|---------|--------|
| `oauth_failed` | Google API error | Check credentials |
| `database_error` | DB operation failed | Check DB logic |
| `missing_code` | No auth code | Restart OAuth flow |

### Authentication (Protected Routes)
| Code | Meaning | Action |
|------|---------|--------|
| `token_missing` | No header | Redirect to login |
| `token_malformed` | Bad format | Redirect to login |
| `token_expired` | Expired | **Refresh token** |
| `token_invalid` | Bad signature | Redirect to login |

---

## ✅ Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error_code": "token_expired",
  "message": "Human-readable message"
}
```

---

## 🧪 Testing

```typescript
// Configuration error
expect(() => {
  googleAuth.configure({ /* bad config */ });
}).to.throw(ZoogleConfigError);

// Runtime error
const res = await request(app)
  .get('/auth/callback?code=bad')
  .expect(500);
expect(res.body.error_code).to.equal('oauth_failed');

// Auth error
const res = await request(app)
  .get('/protected')
  .set('Authorization', 'Bearer expired')
  .expect(401);
expect(res.body.error_code).to.equal('token_expired');
```

---

## 📚 Full Documentation

👉 **[Complete Error Handling Guide](./ERROR_HANDLING.md)**

---

## 💡 Pro Tips

1. ✅ Always catch `ZoogleConfigError` and exit(1) if config is bad
2. ✅ Use `error_code` in frontend, never parse `message` strings
3. ✅ Implement token refresh for `token_expired` errors
4. ✅ Log full errors server-side, send clean messages to users
5. ✅ Test error scenarios, don't just test the happy path

---

**Questions?** Check the full docs at [ERROR_HANDLING.md](./ERROR_HANDLING.md)
