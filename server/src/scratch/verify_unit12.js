const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const prisma = require('../lib/prisma');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('Starting Unit 12 verification tests...');
  console.log(`Using API URL: ${API_URL}`);

  const suffix = Date.now();
  const customerEmail = `customer_${suffix}@test.com`;
  const ownerEmail = `owner_${suffix}@test.com`;
  const password = 'password123';

  let customerToken, ownerToken;
  let customerUser, ownerUser;
  let cafe, table;
  let bookingFar, bookingNear;

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
        operatingHours: {
          monday: { open: '00:00', close: '23:59', closed: false },
          tuesday: { open: '00:00', close: '23:59', closed: false },
          wednesday: { open: '00:00', close: '23:59', closed: false },
          thursday: { open: '00:00', close: '23:59', closed: false },
          friday: { open: '00:00', close: '23:59', closed: false },
          saturday: { open: '00:00', close: '23:59', closed: false },
          sunday: { open: '00:00', close: '23:59', closed: false }
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
    console.log(`Created Table: ${table.name}`);

    // 3. Place Bookings:
    // Booking Far: tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString();

    console.log(`\n--- 3. Creating Booking Far (Tomorrow) ---`);
    const farRes = await axios.post(
      `${API_URL}/bookings`,
      {
        tableId: table.id,
        bookingDate: tomorrowDateStr,
        startTime: '12:00',
        endTime: '14:00',
        partySize: 2
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    bookingFar = farRes.data.data.booking;
    console.log(`Created Booking Far: ${bookingFar.id} on date ${bookingFar.bookingDate}`);

    // Booking Near: 15 minutes in the future
    // To construct this, we'll set the booking date to today and start time to 15 minutes from now.
    // E.g., if now is 13:40, start time is 13:55
    const nowTime = new Date();
    nowTime.setMinutes(nowTime.getMinutes() + 15);
    const nearHours = String(nowTime.getUTCHours()).padStart(2, '0');
    const nearMinutes = String(nowTime.getUTCMinutes()).padStart(2, '0');
    const nearStartTime = `${nearHours}:${nearMinutes}`;
    
    // Set end time to 1 hour after nearStartTime
    const endTimeObj = new Date(nowTime);
    endTimeObj.setHours(endTimeObj.getHours() + 1);
    const nearEndHours = String(endTimeObj.getUTCHours()).padStart(2, '0');
    const nearEndMinutes = String(endTimeObj.getUTCMinutes()).padStart(2, '0');
    const nearEndTime = `${nearEndHours}:${nearEndMinutes}`;

    // Note: We use UTC hours/minutes because the server sets the booking date in UTC 00:00:00.
    // In UTC, bookingDate + nearStartTime will combine to the exact UTC timestamp 15 minutes from now.
    const todayDateStr = new Date().toISOString();

    console.log(`--- Creating Booking Near (15 mins from now: ${nearStartTime} UTC) ---`);
    const nearRes = await axios.post(
      `${API_URL}/bookings`,
      {
        tableId: table.id,
        bookingDate: todayDateStr,
        startTime: nearStartTime,
        endTime: nearEndTime,
        partySize: 2
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    bookingNear = nearRes.data.data.booking;
    console.log(`Created Booking Near: ${bookingNear.id} starting at ${bookingNear.startTime} UTC`);

    // 4. Test GET /api/bookings/my
    console.log('\n--- 4. Querying Customer Booking History ---');
    const listRes = await axios.get(`${API_URL}/bookings/my`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const history = listRes.data.data.bookings;
    console.log(`History length: ${history.length}`);
    const foundFar = history.find(b => b.id === bookingFar.id);
    const foundNear = history.find(b => b.id === bookingNear.id);
    
    if (foundFar && foundFar.cafe && foundFar.table && foundNear) {
      console.log('✅ PASS: History fetched successfully, contains café & table details.');
    } else {
      console.error('❌ FAIL: History fetched incomplete details.', history);
    }

    // 5. Test 20-Minute cancellation rule (near hold should fail to cancel)
    console.log('\n--- 5. Testing 20-Minute Cancellation Limit ---');
    try {
      await axios.patch(
        `${API_URL}/bookings/${bookingNear.id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      console.error('❌ FAIL: Allowed cancellation of a booking starting in 15 minutes!');
    } catch (err) {
      if (err.response && err.response.status === 403 && err.response.data.code === 'CANCELLATION_WINDOW_CLOSED') {
        console.log('✅ PASS: Cancellation correctly blocked with 403 CANCELLATION_WINDOW_CLOSED.');
      } else {
        console.error('❌ FAIL: Expected 403 CANCELLATION_WINDOW_CLOSED, got:', err.response?.status || err.message, err.response?.data);
      }
    }

    // 6. Test Happy Path Cancellation (far hold should succeed to cancel)
    console.log('\n--- 6. Testing Happy Path Cancellation (Tomorrow Booking) ---');
    const cancelRes = await axios.patch(
      `${API_URL}/bookings/${bookingFar.id}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    const cancelledBooking = cancelRes.data.data.booking;
    if (cancelledBooking.status === 'CANCELLED' && cancelledBooking.cancelledAt !== null) {
      console.log('✅ PASS: Tomorrow booking successfully cancelled!');
    } else {
      console.error('❌ FAIL: Expected status CANCELLED, got:', cancelledBooking);
    }

    // 7. Test Tenant Isolation: Owner tries to cancel Customer's active booking
    console.log('\n--- 7. Testing Tenant Isolation on Cancellation ---');
    try {
      await axios.patch(
        `${API_URL}/bookings/${bookingNear.id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${ownerToken}` } }
      );
      console.error('❌ FAIL: Owner allowed to cancel Customer\'s booking!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('✅ PASS: Owner cancellation request blocked with 403.');
      } else {
        console.error('❌ FAIL: Expected 403, got:', err.response?.status || err.message);
      }
    }

  } catch (error) {
    console.error('❌ Test runner encountered error:', error.response?.data || error.message);
  } finally {
    // Cleanup Database
    console.log('\nCleaning up database records...');
    if (bookingFar) {
      await prisma.booking.delete({ where: { id: bookingFar.id } }).catch(() => {});
    }
    if (bookingNear) {
      await prisma.booking.delete({ where: { id: bookingNear.id } }).catch(() => {});
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
