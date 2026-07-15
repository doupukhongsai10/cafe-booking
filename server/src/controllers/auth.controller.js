const { registerSchema, loginSchema } = require('../validators/auth.validators');
const { registerUser, loginUser, logoutUser } = require('../services/auth.service');
const { AppError } = require('../utils/errors');

async function register(req, res) {
  const payload = registerSchema.parse(req.body);
  const { user, token } = await registerUser(payload);
  return res.status(201).json({ data: { user, token } });
}

async function login(req, res) {
  const payload = loginSchema.parse(req.body);
  const { user, token } = await loginUser(payload);
  return res.status(200).json({ data: { user, token } });
}

async function logout(req, res) {
  const user = req.user;
  if (!user || !user.jti || !user.expiresAt) {
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  await logoutUser({ jti: user.jti, expiresAt: user.expiresAt });
  return res.status(200).json({ data: { message: 'Logout successful' } });
}

module.exports = { register, login, logout };
