const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');

async function createOwner() {
  try {
    const email = 'owner_test@example.com';
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 12);

    // Upsert user
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: 'CAFE_ADMIN' },
      create: {
        email,
        name: 'Test Cafe Owner',
        role: 'CAFE_ADMIN',
        passwordHash,
      }
    });

    console.log('User created/updated:', user.email);

    // Upsert approved Cafe
    const cafeData = {
      name: 'Test Cafe Workspace',
      description: 'A cozy testing workspace cafe for debugging.',
      location: '123 Test Street',
      city: 'Aizawl',
      area: 'Zarkawt',
      latitude: 23.7272,
      longitude: 92.7178,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
      photos: [],
      status: 'APPROVED',
      operatingHours: {
        monday: { open: '08:00', close: '22:00', closed: false },
        tuesday: { open: '08:00', close: '22:00', closed: false },
        wednesday: { open: '08:00', close: '22:00', closed: false },
        thursday: { open: '08:00', close: '22:00', closed: false },
        friday: { open: '08:00', close: '22:00', closed: false },
        saturday: { open: '08:00', close: '22:00', closed: false },
        sunday: { open: '08:00', close: '22:00', closed: false }
      }
    };

    const existingCafe = await prisma.cafe.findFirst({
      where: { ownerId: user.id }
    });

    let cafe;
    if (existingCafe) {
      cafe = await prisma.cafe.update({
        where: { id: existingCafe.id },
        data: cafeData
      });
      console.log('Cafe updated:', cafe.name);
    } else {
      cafe = await prisma.cafe.create({
        data: {
          ...cafeData,
          ownerId: user.id
        }
      });
      console.log('Cafe created:', cafe.name);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createOwner();
