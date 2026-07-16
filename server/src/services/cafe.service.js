const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');

async function createCafe(ownerId, data) {
  // Multi-tenant check: Limit each owner to one café registration for MVP onboarding
  const existingCafe = await prisma.cafe.findFirst({ where: { ownerId } });
  if (existingCafe) {
    throw new AppError('You have already submitted a café onboarding request.', 409, 'CAFE_ALREADY_EXISTS');
  }

  return await prisma.cafe.create({
    data: {
      ownerId,
      name: data.name,
      description: data.description,
      location: data.location,
      city: data.city,
      area: data.area,
      latitude: data.latitude,
      longitude: data.longitude,
      coverPhotoUrl: data.coverPhotoUrl,
      photos: data.photos,
      operatingHours: data.operatingHours,
      status: 'PENDING',
    },
  });
}

async function getPendingCafes() {
  return await prisma.cafe.findMany({
    where: { status: 'PENDING' },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getCafeById(id) {
  const cafe = await prisma.cafe.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!cafe) {
    throw new AppError('Café not found.', 404, 'CAFE_NOT_FOUND');
  }

  return cafe;
}

async function updateCafeStatus(id, status, reason = null) {
  await getCafeById(id); // Throws 404 if not found

  return await prisma.cafe.update({
    where: { id },
    data: {
      status,
      rejectionReason: reason,
    },
  });
}

async function getCafeByOwnerId(ownerId) {
  return await prisma.cafe.findFirst({
    where: { ownerId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

async function updateCafeProfile(id, ownerId, data) {
  const cafe = await getCafeById(id);

  if (cafe.ownerId !== ownerId) {
    throw new AppError('Forbidden: You do not own this café.', 403, 'FORBIDDEN');
  }

  return await prisma.cafe.update({
    where: { id },
    data,
  });
}

module.exports = {
  createCafe,
  getPendingCafes,
  getCafeById,
  updateCafeStatus,
  getCafeByOwnerId,
  updateCafeProfile,
};
