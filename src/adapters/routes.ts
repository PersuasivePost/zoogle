import { Router, Request, Response, NextFunction } from 'express';
import { config } from '../core/config';
import { oauth } from '../core/oauth';
import { jwtUtils } from '../utils/jwt';

export const authRoutes = Router();

authRoutes.get('/login', (req: Request, res: Response) => {
  try {
    const authUrl = oauth.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error in /login route:', error);
    res.status(500).send('Login initiation failed');
  }
});

authRoutes.get(
  '/callback',
  async (req: Request, res: Response, next: NextFunction) => {
    const code = req.query.code as string;

    if (!code) {
      return res.status(400).send('No code provided by Google');
    }

    try {
      const tokens = await oauth.getTokens(code);

      const googleUser = await oauth.getUserInfo(tokens.access_token);

      if (!config.findOrCreateUser) {
        throw new Error('findOrCreateUser function is not configured.');
      }
      const user = await config.findOrCreateUser(googleUser);
      const token = jwtUtils.generateToken(user);
      if (config.onSuccess) {
        config.onSuccess(user, token, req, res, next);
      } else {
        res.status(200).json({
          success: true,
          token,
          user,
        });
      }
    } catch (error: any) {
      if (config.onError) {
        config.onError(error, req, res, next);
      } else {
        res.status(500).json({
          success: false,
          message: 'Authentication failed: ' + error.message,
        });
      }
    }
  },
);