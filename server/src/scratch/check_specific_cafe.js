const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificCafe() {
  try {
    const cafe = await prisma.cafe.findUnique({
      where: { id: '4a25a9ef-3051-4487-bea4-c39cb1cf72d0' }
    });
    console.log('Database Cafe state:');
    console.log(JSON.stringify(cafe, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificCafe();
