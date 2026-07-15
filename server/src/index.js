const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { validateEnv } = require('./lib/env');
const logger = require('./lib/logger');
const authRoutes = require('./routes/auth.routes');
const cafeRoutes = require('./routes/cafe.routes');
const adminRoutes = require('./routes/admin.routes');
const healthRoutes = require('./routes/health.routes');
const { errorHandler } = require('./middleware/error.middleware');

validateEnv();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`, { body: req.body });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/cafes', cafeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);
app.get('/', (req, res) => {
  res.status(200).json({ data: { status: 'ok', message: 'Backend is running' } });
});
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
  logger.info('Server listening', { port });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message });
  process.exit(1);
});
