import { consumeRateLimit } from '../store/rateLimitStore.js';

export const createRateLimiter = ({ limit, windowMs, keyGenerator = (req) => req.ip, message }) => async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  try {
    const result = await consumeRateLimit({ key: keyGenerator(req), limit, windowMs });
    if (!result.available) {
      return res.status(503).json({ message: 'Request protection is temporarily unavailable.' });
    }

    const resetSeconds = Math.max(1, Math.ceil((new Date(result.resetAt).getTime() - Date.now()) / 1000));
    res.setHeader('RateLimit-Limit', result.limit);
    res.setHeader('RateLimit-Remaining', result.remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(new Date(result.resetAt).getTime() / 1000));

    if (!result.allowed) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({ message });
    }

    return next();
  } catch (error) {
    console.error('Shared rate limiter failed:', error.message);
    return res.status(503).json({ message: 'Request protection is temporarily unavailable.' });
  }
};
