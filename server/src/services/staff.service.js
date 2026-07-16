const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const { AppError } = require('../utils/errors');

async function createStaffUser(cafeId, ownerId, data) {
  const { name, email, password } = data;

  // 1. Tenancy check: verify the owner owns this café
  const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
  if (!cafe) {
    throw new AppError('Café not found.', 404, 'CAFE_NOT_FOUND');
  }
  if (cafe.ownerId !== ownerId) {
    throw new AppError('Forbidden: You do not own this café.', 403, 'FORBIDDEN');
  }

  // 2. Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email is already registered.', 400, 'EMAIL_TAKEN');
  }

  // 3. Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // 4. Create User (role CAFE_STAFF) and link in a transaction
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'CAFE_STAFF',
      },
    });

    const staffRecord = await tx.cafeStaff.create({
      data: {
        cafeId,
        userId: user.id,
        addedById: ownerId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return staffRecord;
  });
}

async function getCafeStaff(cafeId, ownerId) {
  // Tenancy check
  const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
  if (!cafe) {
    throw new AppError('Café not found.', 404, 'CAFE_NOT_FOUND');
  }
  if (cafe.ownerId !== ownerId) {
    throw new AppError('Forbidden: You do not own this café.', 403, 'FORBIDDEN');
  }

  return await prisma.cafeStaff.findMany({
    where: { cafeId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    },
    orderBy: {
      user: { name: 'asc' }
    }
  });
}

async function deleteStaffRecord(cafeId, staffId, ownerId) {
  // Tenancy check
  const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
  if (!cafe) {
    throw new AppError('Café not found.', 404, 'CAFE_NOT_FOUND');
  }
  if (cafe.ownerId !== ownerId) {
    throw new AppError('Forbidden: You do not own this café.', 403, 'FORBIDDEN');
  }

  const staff = await prisma.cafeStaff.findUnique({
    where: { id: staffId }
  });

  if (!staff) {
    throw new AppError('Staff member not found.', 404, 'STAFF_NOT_FOUND');
  }

  if (staff.cafeId !== cafeId) {
    throw new AppError('Forbidden: Staff member does not belong to your café.', 403, 'FORBIDDEN');
  }

  // Delete both user record and staff record in a transaction
  return await prisma.$transaction(async (tx) => {
    await tx.cafeStaff.delete({ where: { id: staffId } });
    await tx.user.delete({ where: { id: staff.userId } });
    return { success: true };
  });
}

module.exports = {
  createStaffUser,
  getCafeStaff,
  deleteStaffRecord,
};
