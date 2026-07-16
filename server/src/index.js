const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const { validateEnv } = require('./lib/env');
const logger = require('./lib/logger');
const { initSocket } = require('./lib/socket');
const authRoutes = require('./routes/auth.routes');
const cafeRoutes = require('./routes/cafe.routes');
const adminRoutes = require('./routes/admin.routes');
const healthRoutes = require('./routes/health.routes');
const bookingRoutes = require('./routes/bookings.routes');
const reviewRoutes = require('./routes/reviews.routes');
const { initExpireHoldsJob } = require('./jobs/expireHolds.job');
const { errorHandler } = require('./middleware/error.middleware');

validateEnv();

const app = express();
const server = http.createServer(app);

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
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.get('/', (req, res) => {
  res.status(200).json({ data: { status: 'ok', message: 'Backend is running' } });
});
app.use(errorHandler);

// Initialize Socket.io server
initSocket(server);

initExpireHoldsJob();

const port = Number(process.env.PORT) || 5000;
server.listen(port, () => {
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
