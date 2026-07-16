const cron = require('node-cron');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

function initExpireHoldsJob() {
  // Run every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const now = new Date();

      // Find all booking holds that have expired
      const expiredHolds = await prisma.booking.findMany({
        where: {
          status: 'HELD',
          holdExpiresAt: {
            lt: now,
          },
        },
        select: {
          id: true,
        },
      });

      if (expiredHolds.length > 0) {
        const expiredIds = expiredHolds.map((hold) => hold.id);

        const updateResult = await prisma.booking.updateMany({
          where: {
            id: {
              in: expiredIds,
            },
          },
          data: {
            status: 'CANCELLED',
            cancelledAt: now,
          },
        });

        logger.info(`Expired holds job: cancelled ${updateResult.count} stale holds.`, { expiredIds });

        // Note: Socket.io emitter table:available will be triggered here in Phase 5 (Unit 20).
      }
    } catch (error) {
      logger.error('Expired holds job encountered an error', {
        error: error.message,
        stack: error.stack,
      });
    }
  });

  logger.info('Expired holds cron job initialized schedule (every 30 seconds)');
}

module.exports = {
  initExpireHoldsJob,
};
