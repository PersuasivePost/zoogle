import express from 'express';
import type { Request, Response } from 'express';
import googleAuthPkg from 'zoogle';
import type { AppUser, GoogleUserProfile } from 'zoogle';
const googleAuth: any = (googleAuthPkg as any).default || googleAuthPkg;
import dotenv from 'dotenv';

// 1. Load environment variables
dotenv.config();

const app = express();

// 2. Define your findOrCreateUser function
const findOrCreateUser = async (profile: GoogleUserProfile): Promise<AppUser> => {
  console.log('User logged in:', profile);
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
  };
};

// 3. Configure the zoogle library
googleAuth.configure({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: 'http://localhost:3000/auth/google/callback',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'a-very-strong-secret',
  },
  findOrCreateUser: findOrCreateUser,
  
  // Optional: A custom success handler (Added types to fix next error)
  onSuccess: (user: AppUser, token: string, req: Request, res: Response) => {
    // For this test, let's just send the token as JSON
    res.json({
      message: 'Login successful!',
      token,
      user
    });
  }
});

// 4. Mount the auth routes
app.use('/auth/google', googleAuth.routes);

// 5. Create a public homepage
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <h1>Test Server for 'zoogle'</h1>
    <a href="/auth/google/login" style="font-size: 20px;">
      Test Login with Google
    </a>
  `);
});

// 6. Create a protected route
app.get('/profile', googleAuth.middleware, (req: Request & { user?: AppUser }, res: Response) => {
  res.json({
    message: 'This is a protected route!',
    user: req.user, // This comes from the JWT
  });
});

// 7. Start the server
app.listen(3000, () => {
  console.log('Test server running on http://localhost:3000');
  console.log('Ensure your .env file is set up and your Google Redirect URI is correct.');
});