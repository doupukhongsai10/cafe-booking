const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const prisma = require('../lib/prisma');

const API_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('Starting Unit 7 verification tests...');
  console.log(`Using API URL: ${API_URL}`);

  const suffix = Date.now();
  const ownerAEmail = `owner_a_${suffix}@test.com`;
  const ownerBEmail = `owner_b_${suffix}@test.com`;
  const password = 'password123';

  let tokenA, tokenB;
  let userA, userB;
  let cafeA, cafeB;
  let tableA;

  try {
    // 1. Register Owner A and Owner B
    console.log('\n--- 1. Registering Owner A and Owner B ---');
    const regARes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Owner A',
      email: ownerAEmail,
      password,
      role: 'CAFE_ADMIN'
    });
    tokenA = regARes.data.data.token;
    userA = regARes.data.data.user;
    console.log(`Registered Owner A: ${userA.email}`);

    const regBRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Owner B',
      email: ownerBEmail,
      password,
      role: 'CAFE_ADMIN'
    });
    tokenB = regBRes.data.data.token;
    userB = regBRes.data.data.user;
    console.log(`Registered Owner B: ${userB.email}`);

    // 2. Create Café A and Café B (bypass review status or set APPROVED/PENDING)
    console.log('\n--- 2. Creating Cafés directly in DB ---');
    cafeA = await prisma.cafe.create({
      data: {
        ownerId: userA.id,
        name: 'Cafe A',
        description: 'Cafe A description',
        location: 'Address A',
        city: 'City A',
        area: 'Area A',
        latitude: 40.7128,
        longitude: -74.0060,
        coverPhotoUrl: 'http://example.com/cover.png',
        photos: [],
        operatingHours: {},
        status: 'APPROVED'
      }
    });
    console.log(`Created Cafe A: ${cafeA.name} (${cafeA.id})`);

    cafeB = await prisma.cafe.create({
      data: {
        ownerId: userB.id,
        name: 'Cafe B',
        description: 'Cafe B description',
        location: 'Address B',
        city: 'City B',
        area: 'Area B',
        latitude: 40.7128,
        longitude: -74.0060,
        coverPhotoUrl: 'http://example.com/cover.png',
        photos: [],
        operatingHours: {},
        status: 'APPROVED'
      }
    });
    console.log(`Created Cafe B: ${cafeB.name} (${cafeB.id})`);

    // 3. Test Table Creation (Happy Path) for Café A
    console.log('\n--- 3. Testing Table Creation (Happy Path) ---');
    const tableRes = await axios.post(
      `${API_URL}/cafes/${cafeA.id}/tables`,
      {
        name: 'Table 1',
        capacity: 4,
        zone: 'INDOOR',
        description: 'Cozy window table'
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    tableA = tableRes.data.data.table;
    console.log(`Successfully created table: ${tableA.name} in Cafe A (capacity: ${tableA.capacity})`);

    // 4. Test Multi-Tenancy Protection: Owner B trying to add table to Café A
    console.log('\n--- 4. Testing Multi-Tenancy Protection: Owner B adding table to Café A ---');
    try {
      await axios.post(
        `${API_URL}/cafes/${cafeA.id}/tables`,
        {
          name: 'Intruder Table',
          capacity: 2,
          zone: 'OUTDOOR',
          description: 'Should fail'
        },
        { headers: { Authorization: `Bearer ${tokenB}` } }
      );
      console.error('❌ FAIL: Owner B successfully created table in Cafe A!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('✅ PASS: Owner B request was rejected with 403 Forbidden.');
      } else {
        console.error('❌ FAIL: Expected 403, got:', err.response?.status || err.message);
      }
    }

    // 5. Test Listing Tables
    console.log('\n--- 5. Testing Table Listing ---');
    const listRes = await axios.get(
      `${API_URL}/cafes/${cafeA.id}/tables`,
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const tables = listRes.data.data.tables;
    if (tables.length === 1 && tables[0].id === tableA.id) {
      console.log('✅ PASS: Successfully listed 1 table in Cafe A.');
    } else {
      console.error('❌ FAIL: Listing tables returned:', tables);
    }

    // 6. Test Updating Table
    console.log('\n--- 6. Testing Table Update (Happy Path) ---');
    const updateRes = await axios.patch(
      `${API_URL}/cafes/${cafeA.id}/tables/${tableA.id}`,
      {
        capacity: 6,
        description: 'Larger cozy window table',
        isActive: false
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const updatedTable = updateRes.data.data.table;
    if (updatedTable.capacity === 6 && updatedTable.isActive === false) {
      console.log('✅ PASS: Table successfully updated capacity and deactivation state.');
    } else {
      console.error('❌ FAIL: Table update returned:', updatedTable);
    }

    // 7. Test Multi-Tenancy Table Update Protection: Owner B updating Owner A's table
    console.log('\n--- 7. Testing Multi-Tenancy Table Update Protection ---');
    try {
      await axios.patch(
        `${API_URL}/cafes/${cafeA.id}/tables/${tableA.id}`,
        { capacity: 10 },
        { headers: { Authorization: `Bearer ${tokenB}` } }
      );
      console.error('❌ FAIL: Owner B successfully updated Owner A\'s table!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('✅ PASS: Owner B request was rejected with 403 Forbidden.');
      } else {
        console.error('❌ FAIL: Expected 403, got:', err.response?.status || err.message);
      }
    }

    // 8. Test Table Deletion Guard (when table has bookings)
    console.log('\n--- 8. Testing Table Deletion Guard ---');
    if (prisma.booking) {
      // Create a dummy booking for tableA
      const booking = await prisma.booking.create({
        data: {
          customerId: userA.id,
          cafeId: cafeA.id,
          tableId: tableA.id,
          bookingDate: new Date(),
          startTime: '12:00',
          endTime: '14:00',
          partySize: 4,
          status: 'confirmed'
        }
      });
      console.log(`Created temporary booking (${booking.id}) for Table A`);

      try {
        await axios.delete(
          `${API_URL}/cafes/${cafeA.id}/tables/${tableA.id}`,
          { headers: { Authorization: `Bearer ${tokenA}` } }
        );
        console.error('❌ FAIL: Successfully deleted table with associated bookings!');
      } catch (err) {
        if (err.response && err.response.status === 400 && err.response.data.code === 'TABLE_HAS_BOOKINGS') {
          console.log('✅ PASS: Deletion rejected with 400 TABLE_HAS_BOOKINGS.');
        } else {
          console.error('❌ FAIL: Expected 400, got:', err.response?.status || err.message, err.response?.data);
        }
      }

      // Delete dummy booking
      await prisma.booking.delete({ where: { id: booking.id } });
      console.log('Deleted temporary booking');
    } else {
      console.log('Skipping Table Deletion Guard test as Booking model is not yet migrated in this build unit.');
    }

    // 9. Test Operating Hours Update (Happy Path)
    console.log('\n--- 9. Testing Operating Hours Update ---');
    const hoursData = {
      monday: { open: '09:00', close: '21:00', closed: false },
      tuesday: { open: '09:00', close: '21:00', closed: false },
      wednesday: { open: '09:00', close: '21:00', closed: false },
      thursday: { open: '09:00', close: '21:00', closed: false },
      friday: { open: '09:00', close: '23:00', closed: false },
      saturday: { open: '10:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '20:00', closed: true }
    };
    const hoursRes = await axios.patch(
      `${API_URL}/cafes/${cafeA.id}/hours`,
      hoursData,
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const updatedCafe = hoursRes.data.data.cafe;
    if (updatedCafe.operatingHours.monday.open === '09:00') {
      console.log('✅ PASS: Operating hours updated successfully.');
    } else {
      console.error('❌ FAIL: Operating hours update returned:', updatedCafe.operatingHours);
    }

    // 10. Test Multi-Tenancy Operating Hours Update Protection
    console.log('\n--- 10. Testing Multi-Tenancy Hours Update Protection ---');
    try {
      await axios.patch(
        `${API_URL}/cafes/${cafeA.id}/hours`,
        hoursData,
        { headers: { Authorization: `Bearer ${tokenB}` } }
      );
      console.error('❌ FAIL: Owner B successfully updated Owner A\'s operating hours!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('✅ PASS: Owner B request was rejected with 403 Forbidden.');
      } else {
        console.error('❌ FAIL: Expected 403, got:', err.response?.status || err.message);
      }
    }

    // 11. Test Table Deletion (Happy Path)
    console.log('\n--- 11. Testing Table Deletion (Happy Path) ---');
    const deleteRes = await axios.delete(
      `${API_URL}/cafes/${cafeA.id}/tables/${tableA.id}`,
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    if (deleteRes.status === 200) {
      console.log('✅ PASS: Table successfully deleted.');
    } else {
      console.error('❌ FAIL: Table deletion returned:', deleteRes.status);
    }

  } catch (error) {
    console.error('❌ Test runner encountered error:', error.response?.data || error.message);
  } finally {
    // Cleanup Database
    console.log('\nCleaning up database records...');
    if (tableA) {
      await prisma.table.deleteMany({ where: { cafeId: cafeA.id } }).catch(() => {});
    }
    if (cafeA) {
      await prisma.cafe.delete({ where: { id: cafeA.id } }).catch(() => {});
    }
    if (cafeB) {
      await prisma.cafe.delete({ where: { id: cafeB.id } }).catch(() => {});
    }
    if (userA) {
      await prisma.user.delete({ where: { id: userA.id } }).catch(() => {});
    }
    if (userB) {
      await prisma.user.delete({ where: { id: userB.id } }).catch(() => {});
    }
    console.log('Cleanup finished.');
  }
}

runTests();
