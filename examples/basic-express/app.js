const express = require('express');
const dotenv = require('dotenv');
const googleAuth = require('../../dist').default; // Use compiled JS from dist

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3000;

// In-memory user store for demonstration purposes
const users = [];

const findOrCreateUser = async (profile) => {
  let user = users.find((u) => u.googleId === profile.id);

  if (user) {
    console.log('User found:', user.email);
    return user;
  }

  const newUser = {
    id: (users.length + 1).toString(),
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    googleId: profile.id,
  };

  users.push(newUser);
  console.log('New user created:', newUser.email);
  return newUser;
};

// Configure the Google authentication library
googleAuth.configure({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: 'http://localhost:3000/auth/google/callback',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'my-super-secret-key',
    expiresIn: '1h',
  },
  findOrCreateUser,
  onSuccess: (user, token, req, res) => {
    res.redirect(`/profile?token=${token}`);
  },
});

// Mount the authentication routes
app.use('/auth/google', googleAuth.routes);

app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to the Example App</h1>
    <p>This is a public page.</p>
    <a href="/auth/google/login" style="font-size: 20px; padding: 10px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 5px;">
      Login with Google
    </a>
  `);
});

const jsonwebtoken = require('jsonwebtoken');

app.get('/profile', (req, res, next) => {
  // Prefer token from query (used by the example redirect), otherwise fall back to middleware which expects Authorization header
  const queryToken = req.query.token;

  const sendProfile = (user, token) => {
    res.send(`
      <h1>Welcome, ${user?.name || user?.email}</h1>
      <p>This is a protected page. You can only see it if you are logged in.</p>
      <img src="${user?.picture}" alt="Profile Picture" />
      <h3>Your User Info (from JWT):</h3>
      <pre>${JSON.stringify(user, null, 2)}</pre>
      <h3>Your Token:</h3>
      <pre style="word-wrap: break-word;">${token}</pre>
      <a href="/">Go Home</a>
    `);
  };

  if (queryToken) {
    try {
      const decoded = jsonwebtoken.verify(
        String(queryToken),
        process.env.JWT_SECRET || 'my-super-secret-key',
      );

      const user = typeof decoded === 'object' ? decoded : null;

      if (!user) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      return sendProfile(user, queryToken);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  }

  // No token in query, fall back to middleware expecting Authorization header
  googleAuth.middleware(req, res, () => {
    const user = req.user;
    const token = req.query.token || 'Token not in URL (e.g., in Header)';
    return sendProfile(user, token);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Example server running on http://localhost:${PORT}`);
  console.log('🔑 Ensure .env file is configured with API keys');
  console.log('👉 Visit http://localhost:3000 to authenticate');
});
