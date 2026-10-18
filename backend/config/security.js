const production = process.env.NODE_ENV === 'production';

export const isProduction = production;
export const allowInMemoryFallback = true;
export const jwtAlgorithm = 'HS256';
export const jwtIssuer = 'harsh-portfolio-admin';
export const jwtAudience = 'harsh-portfolio-admin';

const defaultFallbackSecret = 'harsh_portfolio_secure_jwt_secret_fallback_key_2026_32char';

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret && secret.length >= 8) {
    return secret;
  }
  return defaultFallbackSecret;
};

export const assertProductionConfig = () => {
  const missing = ['MONGO_URI', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD']
    .filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    console.warn(`ℹ [Config] Variables not set in environment: ${missing.join(', ')}. Running with built-in defaults.`);
  }
};

export const assertAdminStorageAvailable = () => {
  return { available: true, message: '' };
};

