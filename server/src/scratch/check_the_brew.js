const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTheBrew() {
  try {
    const cafe = await prisma.cafe.findUnique({
      where: { id: '8fc8f3cf-d994-491b-85dc-40a10f51cdaa' }
    });
    console.log('Database Brew state:');
    console.log(JSON.stringify(cafe, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkTheBrew();
