import crypto from 'node:crypto';

const production = process.env.NODE_ENV === 'production';

export const isProduction = production;
export const allowInMemoryFallback = !production && process.env.ALLOW_IN_MEMORY_FALLBACK === 'true';
export const jwtAlgorithm = 'HS256';
export const jwtIssuer = 'harsh-portfolio-admin';
export const jwtAudience = 'harsh-portfolio-admin';
const ephemeralJwtSecret = !production && allowInMemoryFallback
  ? crypto.randomBytes(32).toString('hex')
  : '';

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim() || ephemeralJwtSecret;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return secret;
};

export const assertProductionConfig = () => {
  if (!production) return;

  const missing = ['MONGO_URI', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD']
    .filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  getJwtSecret();
};

export const assertAdminStorageAvailable = () => {
  if (!allowInMemoryFallback && process.env.NODE_ENV !== 'production') {
    return { available: false, message: 'MongoDB is required for admin changes. Set MONGO_URI or explicitly enable ALLOW_IN_MEMORY_FALLBACK for temporary local work.' };
  }

  if (!allowInMemoryFallback && production) {
    return { available: false, message: 'Persistent storage is unavailable. Admin access is temporarily disabled.' };
  }

  return { available: true, message: '' };
};
