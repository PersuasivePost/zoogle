import axios from 'axios';
import { config } from './config'; // Our settings from Step 3
import { GoogleUserProfile } from '../types'; // Our type from Step 2

// These are the Google API endpoints we need to talk to
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

class OAuth {
  /**
   * 1. Generates the URL that the user will click to log in with Google.
   */
  public getAuthUrl(): string {
    const options = {
      redirect_uri: config.google.callbackURL, 
      client_id: config.google.clientId,
      access_type: 'offline', // Request a refresh token
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '), // Scopes must be space-separated
    };

    // Create a new URLSearchParams object to format the query string
    const qs = new URLSearchParams(options);

    return `${GOOGLE_AUTH_URL}?${qs.toString()}`;
  }

  /**
   * 2. Exchanges the temporary 'code' for an 'access_token'.
   */
  public async getTokens(code: string): Promise<{ access_token: string }> {
    const values = {
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.callbackURL,
      grant_type: 'authorization_code',
    };

    try {
      // Make a POST request to Google's token endpoint
      const res = await axios.post(
        GOOGLE_TOKEN_URL,
        new URLSearchParams(values), // Google expects this as x-www-form-urlencoded
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return res.data; // This will contain the access_token
    } catch (error: any) {
      // Log the full error to the console for debugging
      console.error('Failed to fetch Google tokens:', error.response?.data);
      throw new Error(
        'Failed to fetch Google tokens: ' +
          (error.response?.data?.error_description || error.message),
      );
    }
  }

  /**
   * 3. Uses the 'access_token' to get the user's profile info.
   */
  public async getUserInfo(accessToken: string): Promise<GoogleUserProfile> {
    try {
      // Make a GET request to Google's userinfo endpoint
      const res = await axios.get(GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // We explicitly map to our internal type for safety
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

// Export a singleton instance
export const oauth = new OAuth();