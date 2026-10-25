export const parseCookies = (header = '') => Object.fromEntries(
  header.split(';').map((part) => part.trim()).filter(Boolean).flatMap((part) => {
    const separator = part.indexOf('=');
    if (separator === -1) return [];
    try {
      return [[part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))]];
    } catch {
      // A malformed cookie must not turn a public request into a server error.
      return [];
    }
  }),
);

export const serializeCookie = (name, value, options = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${options.path || '/'}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join('; ');
};

export const appendCookie = (res, cookie) => {
  const existing = res.getHeader('Set-Cookie');
  const values = existing ? (Array.isArray(existing) ? existing : [existing]) : [];
  res.setHeader('Set-Cookie', [...values, cookie]);
};
