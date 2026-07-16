const { Server } = require('socket.io');
const logger = require('./logger');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join_cafe', (cafeId) => {
      socket.join(`cafe:${cafeId}`);
      logger.info(`Socket ${socket.id} joined room cafe:${cafeId}`);
    });

    socket.on('leave_cafe', (cafeId) => {
      socket.leave(`cafe:${cafeId}`);
      logger.info(`Socket ${socket.id} left room cafe:${cafeId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitTableHeld(cafeId, tableId) {
  if (io) {
    io.to(`cafe:${cafeId}`).emit('table:held', { tableId });
    logger.info(`Socket event emitted: table:held for table ${tableId} in cafe ${cafeId}`);
  }
}

function emitTableConfirmed(cafeId, tableId) {
  if (io) {
    io.to(`cafe:${cafeId}`).emit('table:confirmed', { tableId });
    logger.info(`Socket event emitted: table:confirmed for table ${tableId} in cafe ${cafeId}`);
  }
}

function emitTableAvailable(cafeId, tableId) {
  if (io) {
    io.to(`cafe:${cafeId}`).emit('table:available', { tableId });
    logger.info(`Socket event emitted: table:available for table ${tableId} in cafe ${cafeId}`);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitTableHeld,
  emitTableConfirmed,
  emitTableAvailable,
};
