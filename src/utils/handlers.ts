import { SuccessHandler } from '../types';
import { Request, Response, NextFunction } from 'express';

/**
 * Common success handlers (pre-built) for post-login behavior.
 * Exported so library users can pick a handler instead of writing one.
 */
export const commonHandlers = {
  /**
   * Default JSON response handler. Returns { success: true, token, user }.
   */
  jsonResponse(): SuccessHandler {
    return (user, token, req: Request, res: Response) => {
      res.json({ success: true, token, user });
    };
  },

  /**
   * Returns a SuccessHandler that redirects to the provided URL and appends the token
   * as a query parameter named `token`.
   *
   * @param url Destination URL to redirect to
   */
  redirectWithToken(url: string): SuccessHandler {
    return (user, token, req: Request, res: Response) => {
      const separator = url.includes('?') ? '&' : '?';
      res.redirect(`${url}${separator}token=${encodeURIComponent(token)}`);
    };
  },

  /**
   * Returns a SuccessHandler that sets an HttpOnly cookie with the token and redirects.
   * Cookie is set with secure flag when NODE_ENV === 'production'.
   *
   * @param url Destination URL
   * @param cookieName Cookie name to use (defaults to 'token')
   * @param maxAge Optional maxAge in milliseconds
   */
  cookieAndRedirect(
    url: string,
    cookieName = 'token',
    maxAge?: number,
  ): SuccessHandler {
    return (user, token, req: Request, res: Response) => {
      const secure = process.env.NODE_ENV === 'production';
      const cookieOptions: any = {
        httpOnly: true,
        secure,
      };
      if (typeof maxAge === 'number') cookieOptions.maxAge = maxAge;

      res.cookie(cookieName, token, cookieOptions);
      res.redirect(url);
    };
  },
};

export default commonHandlers;
