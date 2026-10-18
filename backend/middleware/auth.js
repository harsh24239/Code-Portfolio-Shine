import jwt from 'jsonwebtoken';
import { isDbConnected } from '../config/db.js';
import { allowInMemoryFallback, getJwtSecret, jwtAlgorithm, jwtAudience, jwtIssuer } from '../config/security.js';
import { memoryStore } from '../store/memoryStore.js';

export const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!isDbConnected && !allowInMemoryFallback) {
        return res.status(503).json({ message: 'Persistent storage is unavailable.' });
      }
      const decoded = jwt.verify(token, getJwtSecret(), {
        algorithms: [jwtAlgorithm],
        issuer: jwtIssuer,
        audience: jwtAudience,
      });
      if (decoded.role !== 'admin' || decoded.tokenVersion !== (memoryStore.adminCredentials.tokenVersion || 0)) {
        return res.status(401).json({ message: 'Not authorized, session expired' });
      }
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
