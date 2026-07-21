const prisma = require('../lib/prisma');

async function checkCafes() {
  try {
    const cafes = await prisma.cafe.findMany({
      select: {
        id: true,
        name: true,
        operatingHours: true,
      }
    });
    console.log('Cafes count:', cafes.length);
    cafes.forEach(c => {
      console.log(`Cafe: ${c.name} (ID: ${c.id})`);
      console.log('Operating Hours:', JSON.stringify(c.operatingHours, null, 2));
    });
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCafes();
