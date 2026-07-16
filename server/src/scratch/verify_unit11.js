const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const prisma = require('../lib/prisma');

async function runTests() {
  console.log('Starting Unit 11 verification tests...');

  const suffix = Date.now();
  const customerEmail = `customer_${suffix}@test.com`;
  const ownerEmail = `owner_${suffix}@test.com`;
  const password = 'password123';

  let customerUser, ownerUser;
  let cafe, table;
  let expiredBooking;

  try {
    // 1. Register Customer and Owner
    console.log('\n--- 1. Creating Users ---');
    customerUser = await prisma.user.create({
      data: {
        name: 'Customer 1',
        email: customerEmail,
        passwordHash: 'dummy_hash',
        role: 'CUSTOMER'
      }
    });
    console.log(`Created Customer: ${customerUser.email}`);

    ownerUser = await prisma.user.create({
      data: {
        name: 'Owner 1',
        email: ownerEmail,
        passwordHash: 'dummy_hash',
        role: 'CAFE_ADMIN'
      }
    });
    console.log(`Created Owner: ${ownerUser.email}`);

    // 2. Create Café and Table
    console.log('\n--- 2. Setting up Café and Table ---');
    cafe = await prisma.cafe.create({
      data: {
        ownerId: ownerUser.id,
        name: 'Aura Cafe',
        description: 'Cozy and premium aura',
        location: '123 Aura St',
        city: 'Metropolis',
        area: 'Downtown',
        latitude: 40.7128,
        longitude: -74.0060,
        coverPhotoUrl: 'http://example.com/cover.png',
        photos: [],
        operatingHours: {},
        status: 'APPROVED'
      }
    });
    console.log(`Created Café: ${cafe.name} (${cafe.id})`);

    table = await prisma.table.create({
      data: {
        cafeId: cafe.id,
        name: 'Table 1',
        capacity: 4,
        zone: 'INDOOR',
        description: 'Nice window seat',
        isActive: true
      }
    });
    console.log(`Created Table: ${table.name}`);

    // 3. Create an artificially expired Booking Hold
    console.log('\n--- 3. Creating Expired Booking Hold directly in DB ---');
    // Set holdExpiresAt to 10 seconds in the past
    const holdExpiresAt = new Date(Date.now() - 10 * 1000);
    expiredBooking = await prisma.booking.create({
      data: {
        customerId: customerUser.id,
        cafeId: cafe.id,
        tableId: table.id,
        bookingDate: new Date(),
        startTime: '12:00',
        endTime: '14:00',
        partySize: 2,
        status: 'HELD',
        holdExpiresAt
      }
    });
    console.log(`Created HELD booking hold (${expiredBooking.id}) expiring at: ${holdExpiresAt.toISOString()}`);

    // 4. Wait for 35 seconds to allow the 30-second cron job to run
    console.log('\n--- 4. Waiting 35 seconds for background cron job to execute... ---');
    await new Promise((resolve) => setTimeout(resolve, 35 * 1000));

    // 5. Verify the booking state in the DB
    console.log('\n--- 5. Verifying Booking Status ---');
    const checkedBooking = await prisma.booking.findUnique({
      where: { id: expiredBooking.id }
    });

    console.log(`Booking status on database: ${checkedBooking.status}`);
    console.log(`Cancelled at: ${checkedBooking.cancelledAt}`);

    if (checkedBooking.status === 'CANCELLED' && checkedBooking.cancelledAt !== null) {
      console.log('✅ PASS: Expired booking hold was successfully cancelled by the cron job!');
    } else {
      console.error('❌ FAIL: Booking hold status did not transition to CANCELLED. Got status:', checkedBooking.status);
    }

  } catch (error) {
    console.error('❌ Test runner encountered error:', error.message);
  } finally {
    // Cleanup Database
    console.log('\nCleaning up database records...');
    if (expiredBooking) {
      await prisma.booking.delete({ where: { id: expiredBooking.id } }).catch(() => {});
    }
    if (table) {
      await prisma.table.delete({ where: { id: table.id } }).catch(() => {});
    }
    if (cafe) {
      await prisma.cafe.delete({ where: { id: cafe.id } }).catch(() => {});
    }
    if (customerUser) {
      await prisma.user.delete({ where: { id: customerUser.id } }).catch(() => {});
    }
    if (ownerUser) {
      await prisma.user.delete({ where: { id: ownerUser.id } }).catch(() => {});
    }
    console.log('Cleanup finished.');
  }
}

runTests();
