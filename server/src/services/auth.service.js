const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');

const SALT_ROUNDS = 12;
const JWT_EXPIRATION = '7d';

async function registerUser({ name, email, password, role }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already in use', 409, 'EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  let user;
  try {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('Email already in use', 409, 'EMAIL_ALREADY_EXISTS');
    }

    throw error;
  }

  const token = createJwt(user);
  return { user, token };
}

async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };

  const token = createJwt(safeUser);
  return { user: safeUser, token };
}

function createJwt(user) {
  const jti = uuidv4();
  const payload = {
    sub: user.id,
    role: user.role,
    jti,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
}

async function logoutUser({ jti, expiresAt }) {
  await prisma.tokenBlacklist.create({
    data: {
      jti,
      expiresAt,
    },
  });
}

async function isTokenBlacklisted(jti) {
  const blacklistEntry = await prisma.tokenBlacklist.findUnique({ where: { jti } });
  return Boolean(blacklistEntry);
}

module.exports = { registerUser, loginUser, logoutUser, isTokenBlacklisted };
