# 🔐 Zoogle - Google OAuth in 2 Minutes

Drop-in Google OAuth for **Express** and **Next.js**. No Passport.js needed.

## Install

```bash
npm install zoogle
```

## Quick Start

### For Express

```typescript
import express from 'express';
import googleAuth from 'zoogle';

const app = express();

googleAuth.configure({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  async findOrCreateUser(profile) {
    // Your database logic
    return await User.findOrCreate({ googleId: profile.id });
  },
});

// Mount routes
app.use('/auth/google', googleAuth.routes);

// Protect routes
app.get('/profile', googleAuth.middleware, (req, res) => {
  res.json({ user: req.user });
});
```

### For Next.js

#### 1. Create config file

```typescript
// lib/zoogle.ts
import googleAuth from 'zoogle';

googleAuth.configure({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: 'http://localhost:3000/auth/google/callback',
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
  },
  async findOrCreateUser(profile) {
    // Your database logic
    return await User.findOrCreate({ googleId: profile.id });
  },
  onSuccess: (user, token, req, res) => {
    (res as any).redirect(`/?token=${token}`);
  },
});

export default googleAuth;
```

#### 2. Create API routes

```typescript
// pages/auth/google/login.ts
import googleAuth from '../../lib/zoogle';
export default googleAuth.nextjs.loginHandler;
```

```typescript
// pages/auth/google/callback.ts
import googleAuth from '../../lib/zoogle';
export default googleAuth.nextjs.callbackHandler;
```

#### 3. Protect routes

```typescript
// pages/api/profile.ts
import { withAuth } from 'zoogle';

async function handler(req, res) {
  res.json({ user: req.user });
}

export default withAuth(handler);
```

#### 4. Frontend

```tsx
// Login button
<a href="/api/auth/google/login">
  <button>Login with Google</button>
</a>;

// Make authenticated requests
fetch('/api/profile', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

Done! 🎉

## Setup (Get Google Credentials)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable Google+ API → Create OAuth credentials
3. Add redirect URL: `http://localhost:3000/auth/google/callback` (Express) or `http://localhost:3000/api/auth/google/callback` (Next.js)
4. Copy your `CLIENT_ID` and `CLIENT_SECRET`

## API

### `googleAuth.configure(options)`

| Option                | Type     | Required | Description                 |
| --------------------- | -------- | -------- | --------------------------- |
| `google.clientId`     | string   | Yes      | From Google Console         |
| `google.clientSecret` | string   | Yes      | From Google Console         |
| `google.callbackURL`  | string   | Yes      | Where Google redirects back |
| `jwt.secret`          | string   | Yes      | Secret for JWT signing      |
| `jwt.expiresIn`       | string   | No       | Default: "7d"               |
| `findOrCreateUser`    | function | Yes      | Your DB logic               |
| `onSuccess`           | function | No       | Custom success handler      |
| `onError`             | function | No       | Custom error handler        |

### `googleAuth.routes`

Express router with two routes:

- `GET /login` - Redirects to Google
- `GET /callback` - Handles Google response

### `googleAuth.middleware`

Protects routes. Checks for valid JWT in `Authorization: Bearer <token>` header.

### `googleAuth.nextjs`

Object containing Next.js-specific handlers:

- `loginHandler` - API route handler for login
- `callbackHandler` - API route handler for callback
- `withAuth` - Higher-order function to protect API routes

### `withAuth(handler)`

Protects Next.js API routes. Wrap your handler with this function:

```typescript
import { withAuth } from 'zoogle';

export default withAuth(async (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

## Framework Support

| Framework              | Status |
| ---------------------- | ------ |
| Express                | ✅     |
| Next.js (Pages Router) | ✅     |
| Next.js (App Router)   | 🔄     |
| Fastify                | 🔄     |

## Error Handling

Zoogle provides comprehensive error handling with custom error classes and helpful error messages. See the detailed [Error Handling Guide](./archives/ERROR_HANDLING.md) for:

- 📋 **Configuration Errors** - Catch missing or invalid config at startup
- 🔄 **Runtime Errors** - Handle OAuth and database errors gracefully
- 🔐 **Authentication Errors** - Use error codes for reliable frontend handling

Quick example:

```typescript
import googleAuth, { ZoogleConfigError } from 'zoogle';

try {
  googleAuth.configure({
    // ... your config
  });
} catch (error) {
  if (error instanceof ZoogleConfigError) {
    console.error('Config field:', error.field);
    console.error('How to fix:', error.hint);
  }
}
```

Frontend token handling:

```typescript
// Reliable error handling with error codes
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const { error_code } = error.response?.data || {};

    if (error_code === 'token_expired') {
      return refreshToken().then(retry);
    }

    if (error_code === 'token_invalid') {
      redirectToLogin();
    }
  },
);
```

👉 **[Read the full Error Handling Guide](./archives/ERROR_HANDLING.md)**

## Examples

See [examples/](./examples) folder.

- **[Express Example](./examples/basic-express)** - Basic Express setup
- **[Next.js Example](./examples/nextjs-app)** - Complete Next.js app with frontend

### Login Template Example

🚀 **[Zoogle Auth Template](https://github.com/PersuasivePost/zoogle-auth-template)**  
Add Google Login to ANY Express project in literally 2 minutes! A beautiful, production-ready authentication template powered by Zoogle. Just copy, paste, and you're done! ✨

---

### License

<a href="./LICENSE">MIT</a>

---

### **Task 6: Create an Example** 💡

**People learn from examples!**

Create: `examples/basic-express/`

**File structure:**

```
examples/basic-express/
├── package.json
├── .env.example
├── src/
│   └── app.ts
└── README.md
```
