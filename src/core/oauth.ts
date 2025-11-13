import axios from 'axios';
import { config } from './config';
import { GoogleUserProfile } from '../types';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

class OAuth {
  public getAuthUrl(): string {
    const options = {
      redirect_uri: config.google.callbackURL, 
      client_id: config.google.clientId,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
    };

    const qs = new URLSearchParams(options);

    return `${GOOGLE_AUTH_URL}?${qs.toString()}`;
  }

  public async getTokens(code: string): Promise<{ access_token: string }> {
    const values = {
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.callbackURL,
      grant_type: 'authorization_code',
    };

    try {
      const res = await axios.post(
        GOOGLE_TOKEN_URL,
        new URLSearchParams(values),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return res.data;
    } catch (error: any) {
      console.error('Failed to fetch Google tokens:', error.response?.data);
      throw new Error(
        'Failed to fetch Google tokens: ' +
          (error.response?.data?.error_description || error.message),
      );
    }
  }

  public async getUserInfo(accessToken: string): Promise<GoogleUserProfile> {
    try {
      const res = await axios.get(GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const profile: GoogleUserProfile = {
        id: res.data.id,
        email: res.data.email,
        name: res.data.name,
        picture: res.data.picture,
      };
      
      return profile;
    } catch (error: any) {
      console.error('Failed to fetch Google user info:', error.response?.data);
      throw new Error(
        'Failed to fetch Google user info: ' + error.message,
      );
    }
  }
}

export const oauth = new OAuth();