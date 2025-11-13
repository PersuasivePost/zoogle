# 🔐 Zoogle - Google OAuth in 2 Minutes

Drop-in Google OAuth for Express. No Passport.js needed.

## Install
```bash
npm install zoogle
```

## Setup (3 steps)

### 1. Get Google Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable Google+ API → Create OAuth credentials
3. Add redirect URL: `http://localhost:3000/auth/google/callback`
4. Copy your `CLIENT_ID` and `CLIENT_SECRET`

### 2. Configure
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
```

### 3. Use

**Frontend:**
```html
<a href="/auth/google/login">Login with Google</a>
```

**Protect routes:**
```typescript
app.get('/profile', googleAuth.middleware, (req, res) => {
  res.json({ user: req.user });
});
```

Done! 🎉

## API

### `googleAuth.configure(options)`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `google.clientId` | string | Yes | From Google Console |
| `google.clientSecret` | string | Yes | From Google Console |
| `google.callbackURL` | string | Yes | Where Google redirects back |
| `jwt.secret` | string | Yes | Secret for JWT signing |
| `jwt.expiresIn` | string | No | Default: "7d" |
| `findOrCreateUser` | function | Yes | Your DB logic |
| `onSuccess` | function | No | Custom success handler |
| `onError` | function | No | Custom error handler |

### `googleAuth.routes`

Express router with two routes:
- `GET /login` - Redirects to Google
- `GET /callback` - Handles Google response

### `googleAuth.middleware`

Protects routes. Checks for valid JWT in `Authorization: Bearer <token>` header.

## Examples

See [examples/](./examples) folder.

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