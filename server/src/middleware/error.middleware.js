const { AppError } = require('../utils/errors');
const logger = require('../lib/logger');
const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  logger.error('Error occurred in request', { 
    message: err.message, 
    stack: err.stack,
    name: err.constructor.name 
  });

  if (err instanceof ZodError) {
    const message = err.errors.map((issue) => issue.message).join('; ');
    return res.status(400).json({ error: message, code: 'VALIDATION_ERROR' });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
}

module.exports = { errorHandler };
