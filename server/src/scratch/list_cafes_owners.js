const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listCafesAndOwners() {
  try {
    const cafes = await prisma.cafe.findMany({
      select: {
        id: true,
        name: true,
        ownerId: true,
        status: true
      }
    });
    console.log(JSON.stringify(cafes, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

listCafesAndOwners();
