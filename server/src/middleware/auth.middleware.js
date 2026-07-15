const jwt = require('jsonwebtoken');
const { isTokenBlacklisted } = require('../services/auth.service');
const { AppError } = require('../utils/errors');

async function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }

  const token = authorization.replace('Bearer ', '').trim();

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }

  const isBlacklisted = await isTokenBlacklisted(payload.jti);
  if (isBlacklisted) {
    throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
  }

  req.user = {
    id: payload.sub,
    role: payload.role,
    jti: payload.jti,
    expiresAt: new Date(payload.exp * 1000),
  };

  next();
}

module.exports = { authMiddleware };
