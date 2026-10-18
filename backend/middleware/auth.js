import { isDbConnected } from '../config/db.js';
import { allowInMemoryFallback, sessionCookieName } from '../config/security.js';
import { memoryStore } from '../store/memoryStore.js';
import { getSession, destroySession, touchSession } from '../store/sessionStore.js';
import { parseCookies } from '../utils/cookies.js';

export const protect = async (req, res, next) => {
  try {
    if (!isDbConnected && !allowInMemoryFallback) {
      return res.status(503).json({ message: 'Persistent storage is unavailable.' });
    }

    const token = parseCookies(req.headers.cookie)[sessionCookieName];
    const session = await getSession(token);
    if (!session || session.tokenVersion !== (memoryStore.adminCredentials.tokenVersion || 0)) {
      if (token) await destroySession(token);
      return res.status(401).json({ message: 'Not authorized, session expired.' });
    }

    req.sessionToken = token;
    req.session = session;
    req.sessionId = String(session._id || '');
    req.user = { id: session.adminId, role: 'admin' };
    await touchSession(token);
    return next();
  } catch (error) {
    console.error('Admin session validation failed:', error.message);
    return res.status(401).json({ message: 'Not authorized.' });
  }
};
