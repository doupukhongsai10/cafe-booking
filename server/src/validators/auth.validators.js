const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Email must be valid'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.enum(['CUSTOMER', 'CAFE_ADMIN']).default('CUSTOMER'),
});

const loginSchema = z.object({
  email: z.string().email('Email must be valid'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
