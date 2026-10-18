import crypto from 'node:crypto';

const production = process.env.NODE_ENV === 'production';

export const isProduction = production;
export const allowInMemoryFallback = !production && process.env.ALLOW_IN_MEMORY_FALLBACK === 'true';
export const sessionCookieName = 'portfolio_admin_session';
export const csrfCookieName = 'portfolio_admin_csrf';
export const sessionTtlSeconds = 30 * 60;

const ephemeralSessionSecret = !production && allowInMemoryFallback
  ? crypto.randomBytes(32).toString('hex')
  : '';

export const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET?.trim() || process.env.JWT_SECRET?.trim() || ephemeralSessionSecret;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be configured with at least 32 characters.');
  }
  return secret;
};

export const assertProductionConfig = () => {
  if (!production) return;

  const missing = ['MONGO_URI', 'ADMIN_USERNAME', 'ADMIN_PASSWORD']
    .filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  getSessionSecret();
};

export const assertAdminStorageAvailable = () => {
  if (!allowInMemoryFallback) {
    return {
      available: false,
      message: production
        ? 'Persistent storage is unavailable. Admin access is temporarily disabled.'
        : 'MongoDB is required for admin changes. Set MONGO_URI or explicitly enable ALLOW_IN_MEMORY_FALLBACK for local-only work.',
    };
  }

  return { available: true, message: '' };
};
