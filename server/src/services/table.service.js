const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');

async function checkCafeOwnership(cafeId, ownerId) {
  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
  });

  if (!cafe) {
    throw new AppError('Café not found.', 404, 'CAFE_NOT_FOUND');
  }

  if (cafe.ownerId !== ownerId) {
    throw new AppError('Forbidden: You do not own this café.', 403, 'FORBIDDEN');
  }

  return cafe;
}

async function createTable(cafeId, ownerId, data) {
  await checkCafeOwnership(cafeId, ownerId);

  return await prisma.table.create({
    data: {
      cafeId,
      name: data.name,
      capacity: data.capacity,
      zone: data.zone,
      description: data.description,
      isActive: true,
    },
  });
}

async function getTables(cafeId) {
  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
  });

  if (!cafe) {
    throw new AppError('Café not found.', 404, 'CAFE_NOT_FOUND');
  }

  return await prisma.table.findMany({
    where: { cafeId },
    orderBy: { name: 'asc' },
  });
}

async function updateTable(cafeId, tableId, ownerId, data) {
  await checkCafeOwnership(cafeId, ownerId);

  const table = await prisma.table.findUnique({
    where: { id: tableId },
  });

  if (!table || table.cafeId !== cafeId) {
    throw new AppError('Table not found or does not belong to this café.', 404, 'TABLE_NOT_FOUND');
  }

  return await prisma.table.update({
    where: { id: tableId },
    data: {
      name: data.name,
      capacity: data.capacity,
      zone: data.zone,
      description: data.description,
      isActive: data.isActive,
    },
  });
}

async function deleteTable(cafeId, tableId, ownerId) {
  await checkCafeOwnership(cafeId, ownerId);

  const table = await prisma.table.findUnique({
    where: { id: tableId },
  });

  if (!table || table.cafeId !== cafeId) {
    throw new AppError('Table not found or does not belong to this café.', 404, 'TABLE_NOT_FOUND');
  }

  // Check if there are any bookings associated with this table (only if Booking model is migrated)
  if (prisma.booking) {
    const associatedBookings = await prisma.booking.findFirst({
      where: { tableId },
    });

    if (associatedBookings) {
      throw new AppError('Cannot delete table with existing bookings. Deactivate it instead.', 400, 'TABLE_HAS_BOOKINGS');
    }
  }

  return await prisma.table.delete({
    where: { id: tableId },
  });
}

async function updateHours(cafeId, ownerId, operatingHours) {
  await checkCafeOwnership(cafeId, ownerId);

  return await prisma.cafe.update({
    where: { id: cafeId },
    data: {
      operatingHours,
    },
  });
}

module.exports = {
  createTable,
  getTables,
  updateTable,
  deleteTable,
  updateHours,
};
