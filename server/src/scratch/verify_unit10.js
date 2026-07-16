const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const prisma = require('../lib/prisma');

const API_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('Starting Unit 10 verification tests...');
  console.log(`Using API URL: ${API_URL}`);

  const suffix = Date.now();
  const customerEmail = `customer_${suffix}@test.com`;
  const ownerEmail = `owner_${suffix}@test.com`;
  const password = 'password123';

  let customerToken, ownerToken;
  let customerUser, ownerUser;
  let cafe, table;
  let bookingHold;

  try {
    // 1. Register Customer and Owner
    console.log('\n--- 1. Registering Users ---');
    const regCust = await axios.post(`${API_URL}/auth/register`, {
      name: 'Customer 1',
      email: customerEmail,
      password,
      role: 'CUSTOMER'
    });
    customerToken = regCust.data.data.token;
    customerUser = regCust.data.data.user;
    console.log(`Registered Customer: ${customerUser.email}`);

    const regOwner = await axios.post(`${API_URL}/auth/register`, {
      name: 'Owner 1',
      email: ownerEmail,
      password,
      role: 'CAFE_ADMIN'
    });
    ownerToken = regOwner.data.data.token;
    ownerUser = regOwner.data.data.user;
    console.log(`Registered Owner: ${ownerUser.email}`);

    // 2. Create Café and Table directly in DB
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
        operatingHours: {
          monday: { open: '08:00', close: '20:00', closed: false },
          tuesday: { open: '08:00', close: '20:00', closed: false },
          wednesday: { open: '08:00', close: '20:00', closed: false },
          thursday: { open: '08:00', close: '20:00', closed: false },
          friday: { open: '08:00', close: '22:00', closed: false },
          saturday: { open: '09:00', close: '22:00', closed: false },
          sunday: { open: '09:00', close: '18:00', closed: true } // Closed on Sunday
        },
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
    console.log(`Created Table: ${table.name} (capacity: ${table.capacity})`);

    // 3. Test Booking Hold (Happy Path)
    // We will book for next Monday (or any weekday in the future to avoid closed Sunday)
    // Let's find the date of next Monday
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
    const bookingDateStr = nextMonday.toISOString(); // Target Monday at UTC

    console.log(`\n--- 3. Placing Booking Hold (Happy Path) on Date: ${bookingDateStr.split('T')[0]} ---`);
    const holdRes = await axios.post(
      `${API_URL}/bookings`,
      {
        tableId: table.id,
        bookingDate: bookingDateStr,
        startTime: '12:00',
        endTime: '14:00',
        partySize: 2
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    bookingHold = holdRes.data.data.booking;
    console.log(`✅ PASS: Booking hold successfully placed! Status: ${bookingHold.status}`);
    console.log(`Expires at: ${bookingHold.holdExpiresAt}`);

    // 4. Test Overlapping Booking Protection (Conflict 409)
    console.log('\n--- 4. Testing Overlapping Booking Protection (409 Conflict) ---');
    try {
      await axios.post(
        `${API_URL}/bookings`,
        {
          tableId: table.id,
          bookingDate: bookingDateStr,
          startTime: '13:00',
          endTime: '15:00', // overlaps 12:00-14:00
          partySize: 2
        },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      console.error('❌ FAIL: Overlapping booking hold was created successfully!');
    } catch (err) {
      if (err.response && err.response.status === 409) {
        console.log('✅ PASS: Overlapping hold request rejected with 409 Conflict.');
      } else {
        console.error('❌ FAIL: Expected 409, got:', err.response?.status || err.message);
      }
    }

    // 5. Test Exceeding Capacity Validation (400)
    console.log('\n--- 5. Testing Exceeding Capacity Validation ---');
    try {
      await axios.post(
        `${API_URL}/bookings`,
        {
          tableId: table.id,
          bookingDate: bookingDateStr,
          startTime: '15:00',
          endTime: '16:00',
          partySize: 6 // table capacity is 4
        },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      console.error('❌ FAIL: Booking exceeding capacity was allowed!');
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.error.includes('capacity')) {
        console.log('✅ PASS: Capacity check successfully rejected with 400.');
      } else {
        console.error('❌ FAIL: Expected 400 capacity error, got:', err.response?.status || err.message, err.response?.data);
      }
    }

    // 6. Test Closed Day Validation (400)
    // Find next Sunday
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
    const sundayDateStr = nextSunday.toISOString();

    console.log('\n--- 6. Testing Closed Day Validation ---');
    try {
      await axios.post(
        `${API_URL}/bookings`,
        {
          tableId: table.id,
          bookingDate: sundayDateStr,
          startTime: '10:00',
          endTime: '12:00',
          partySize: 2
        },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      console.error('❌ FAIL: Booking on a closed day was allowed!');
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.error.includes('closed')) {
        console.log('✅ PASS: Closed day request rejected with 400.');
      } else {
        console.error('❌ FAIL: Expected 400 closed error, got:', err.response?.status || err.message, err.response?.data);
      }
    }

    // 7. Test Outside Operating Hours Validation (400)
    console.log('\n--- 7. Testing Operating Hours Boundaries ---');
    try {
      await axios.post(
        `${API_URL}/bookings`,
        {
          tableId: table.id,
          bookingDate: bookingDateStr,
          startTime: '07:00', // open at 08:00
          endTime: '09:00',
          partySize: 2
        },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      console.error('❌ FAIL: Booking outside operating hours was allowed!');
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.error.includes('operating hours')) {
        console.log('✅ PASS: Outside operating hours request rejected with 400.');
      } else {
        console.error('❌ FAIL: Expected 400 operating hours error, got:', err.response?.status || err.message, err.response?.data);
      }
    }

    // 8. Test Booking Hold Confirmation (Happy Path)
    console.log('\n--- 8. Testing Booking Confirmation ---');
    const confirmRes = await axios.post(
      `${API_URL}/bookings/${bookingHold.id}/confirm`,
      {},
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    const confirmedBooking = confirmRes.data.data.booking;
    if (confirmedBooking.status === 'CONFIRMED' && confirmedBooking.holdExpiresAt === null) {
      console.log('✅ PASS: Booking successfully confirmed!');
    } else {
      console.error('❌ FAIL: Booking confirmation returned:', confirmedBooking);
    }

    // 9. Test Multi-Tenancy / Tenant Isolation: Owner trying to confirm Customer's booking
    console.log('\n--- 9. Testing Tenant Isolation on Confirmation ---');
    try {
      await axios.post(
        `${API_URL}/bookings/${bookingHold.id}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${ownerToken}` } }
      );
      console.error('❌ FAIL: Owner successfully confirmed booking that belongs to Customer!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('✅ PASS: Owner confirmation rejected with 403 Forbidden.');
      } else {
        console.error('❌ FAIL: Expected 403, got:', err.response?.status || err.message);
      }
    }

  } catch (error) {
    console.error('❌ Test runner encountered error:', error.response?.data || error.message);
  } finally {
    // Cleanup Database
    console.log('\nCleaning up database records...');
    if (bookingHold) {
      await prisma.booking.delete({ where: { id: bookingHold.id } }).catch(() => {});
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
