const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBookings() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: {
          select: { name: true }
        }
      }
    });
    console.log('Bookings in database:');
    console.log(JSON.stringify(bookings, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookings();
