import express from 'express';
import dotenv from 'dotenv';
import googleAuth from '../../src'; // Import the Google authentication library
import { AppUser, GoogleUserProfile } from '../../src/types';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3000;

// In-memory user store for demonstration purposes
// In a production application, replace with a proper database (e.g., MongoDB, PostgreSQL)
const users: AppUser[] = [];

// User lookup and creation function required by the library
const findOrCreateUser = async (
  profile: GoogleUserProfile,
): Promise<AppUser> => {
  // Check if user exists in the store
  let user = users.find((u) => u.googleId === profile.id);

  if (user) {
    console.log('User found:', user.email);
    return user;
  }

  // Create new user if not found
  const newUser: AppUser = {
    id: (users.length + 1).toString(), // Auto-incrementing ID for demo
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    googleId: profile.id, // Store Google profile ID
  };

  users.push(newUser);
  console.log('New user created:', newUser.email);
  return newUser;
};

// Configure the Google authentication library
googleAuth.configure({
  // Google OAuth credentials
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: 'http://localhost:3000/auth/google/callback',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'my-super-secret-key',
    expiresIn: '1h', // Token expiration time
  },

  // User management function
  findOrCreateUser: findOrCreateUser,

  // Custom success handler (optional)
  // Redirects to profile page with token in query parameter
  onSuccess: (user, token, req, res) => {
    // In production, redirect to frontend application
    // res.redirect(`http://my-frontend.com/login-success?token=${token}`);
    
    // For demo, redirect to profile page
    res.redirect(`/profile?token=${token}`);
  },
});

// Mount the authentication routes
// Adds /login and /callback endpoints
app.use('/auth/google', googleAuth.routes);

// Application routes

// Public homepage
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to the Example App</h1>
    <p>This is a public page.</p>
    <a href="/auth/google/login" style="font-size: 20px; padding: 10px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 5px;">
      Login with Google
    </a>
  `);
});

// Protected profile page
// Requires authentication via middleware
app.get('/profile', (req, res) => {
  // User object attached by middleware after token verification
  const user = req.user;
  
  // Retrieve token from query parameter (for demo; typically from Authorization header)
  const token = req.query.token || 'Token not in URL (e.g., in Header)';

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
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Example server running on http://localhost:${PORT}`);
  console.log('🔑 Ensure .env file is configured with API keys');
  console.log('👉 Visit http://localhost:3000 to authenticate');
});