const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCafes() {
  try {
    const cafes = await prisma.cafe.findMany({
      select: {
        id: true,
        name: true,
        status: true
      }
    });
    console.log('Cafes in Database:');
    console.log(JSON.stringify(cafes, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkCafes();
