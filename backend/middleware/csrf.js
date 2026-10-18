import crypto from 'node:crypto';
import { csrfCookieName } from '../config/security.js';
import { parseCookies, appendCookie, serializeCookie } from '../utils/cookies.js';
import { verifyCsrf } from '../store/sessionStore.js';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const issueCsrfToken = (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[csrfCookieName] || crypto.randomBytes(32).toString('base64url');
  appendCookie(res, serializeCookie(csrfCookieName, token, { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' }));
  res.json({ csrfToken: token });
};

export const requireCsrf = (req, res, next) => {
  if (!unsafeMethods.has(req.method)) return next();
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[csrfCookieName];
  const headerToken = req.get('X-CSRF-Token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'CSRF validation failed.' });
  }
  if (req.session && !verifyCsrf(req.session, headerToken)) {
    return res.status(403).json({ message: 'CSRF validation failed.' });
  }
  return next();
};
