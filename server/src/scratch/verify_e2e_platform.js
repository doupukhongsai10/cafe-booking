const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const prisma = require('../lib/prisma');

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

async function runValidation() {
  console.log('==================================================');
  console.log('  STARTING END-TO-END PLATFORM VALIDATION TESTS   ');
  console.log(`  API URL: ${API_URL}`);
  console.log('==================================================\n');

  const suffix = Date.now();
  const customerEmail = `customer_${suffix}@e2e.com`;
  const ownerEmail = `owner_${suffix}@e2e.com`;
  const superAdminEmail = `admin_${suffix}@e2e.com`;
  const staffEmail = `staff_${suffix}@e2e.com`;
  const password = 'password123';

  let customerToken, ownerToken, adminToken, staffToken;
  let customerUser, ownerUser, adminUser, staffUser;
  let cafeId, tableId, bookingId, staffRecordId;

  try {
    // ----------------------------------------------------
    // 1. REGISTER USERS
    // ----------------------------------------------------
    console.log('--- 1. Registering Platform Users ---');
    
    // Register Customer
    const regCust = await axios.post(`${API_URL}/auth/register`, {
      name: 'E2E Customer',
      email: customerEmail,
      password,
    });
    customerToken = regCust.data.data.token;
    customerUser = regCust.data.data.user;
    console.log(`✔ Customer registered: ${customerEmail}`);

    // Register Cafe Owner
    const regOwner = await axios.post(`${API_URL}/auth/register`, {
      name: 'E2E Cafe Owner',
      email: ownerEmail,
      password,
      role: 'CAFE_ADMIN'
    });
    ownerToken = regOwner.data.data.token;
    ownerUser = regOwner.data.data.user;
    console.log(`✔ Owner registered: ${ownerEmail}`);

    // Register Super Admin
    const regAdmin = await axios.post(`${API_URL}/auth/register`, {
      name: 'E2E Super Admin',
      email: superAdminEmail,
      password,
    });
    adminToken = regAdmin.data.data.token;
    adminUser = regAdmin.data.data.user;

    // Elevate to SUPER_ADMIN directly in DB
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: 'SUPER_ADMIN' }
    });

    // Login to get a token with the SUPER_ADMIN role
    const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: superAdminEmail,
      password,
    });
    adminToken = adminLoginRes.data.data.token;
    adminUser = adminLoginRes.data.data.user;
    console.log(`✔ Super Admin registered, elevated, and logged in: ${superAdminEmail}`);

    // ----------------------------------------------------
    // 2. CAFE ONBOARDING & APPROVAL
    // ----------------------------------------------------
    console.log('\n--- 2. Café Onboarding & Super Admin Approval Flow ---');

    // Submit Cafe application (as Owner)
    // Create directly in Prisma to avoid form-data/multer file upload complexities in node
    const cafe = await prisma.cafe.create({
      data: {
        ownerId: ownerUser.id,
        name: 'E2E Validation Cafe',
        description: 'E2E Validation Cafe description',
        location: '123 E2E Lane',
        city: 'Aizawl',
        area: 'Kulikawn',
        latitude: 23.7271,
        longitude: 92.7176,
        coverPhotoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
        photos: [],
        operatingHours: {
          monday: { open: '00:00', close: '23:59', closed: false },
          tuesday: { open: '00:00', close: '23:59', closed: false },
          wednesday: { open: '00:00', close: '23:59', closed: false },
          thursday: { open: '00:00', close: '23:59', closed: false },
          friday: { open: '00:00', close: '23:59', closed: false },
          saturday: { open: '00:00', close: '23:59', closed: false },
          sunday: { open: '00:00', close: '23:59', closed: false },
        },
        status: 'PENDING',
      }
    });
    cafeId = cafe.id;
    console.log(`✔ Cafe created with PENDING status. Cafe ID: ${cafeId}`);

    // Verify Cafe appears in pending list for Super Admin
    const pendingList = await axios.get(`${API_URL}/admin/cafes/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const foundPending = pendingList.data.data.cafes.find(c => c.id === cafeId);
    if (!foundPending) throw new Error('Pending café not found in Super Admin pending list.');
    console.log('✔ Super Admin successfully retrieved the pending application');

    // Super Admin approves the cafe
    const approvalRes = await axios.patch(`${API_URL}/admin/cafes/${cafeId}/approve`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (approvalRes.data.data.cafe.status !== 'APPROVED') {
      throw new Error('Cafe status was not updated to APPROVED.');
    }
    console.log('✔ Super Admin approved the café application');

    // ----------------------------------------------------
    // 3. TABLE CRUD & HOURS (Owner)
    // ----------------------------------------------------
    console.log('\n--- 3. Cafe Settings & Table Management (Owner) ---');

    // Owner creates a Table
    const tableRes = await axios.post(`${API_URL}/cafes/${cafeId}/tables`, {
      name: 'E2E Table 1',
      capacity: 4,
      zone: 'INDOOR',
      description: 'Cozy table near window'
    }, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    tableId = tableRes.data.data.table.id;
    console.log(`✔ Owner successfully created Table: ${tableRes.data.data.table.name} (ID: ${tableId})`);

    // ----------------------------------------------------
    // 4. STAFF REGISTRATION & TENANCY PROTECTION
    // ----------------------------------------------------
    console.log('\n--- 4. Staff Management & Access Controls ---');

    // Owner registers a Staff login account
    const staffRegisterRes = await axios.post(`${API_URL}/cafes/${cafeId}/staff`, {
      name: 'E2E Staff Member',
      email: staffEmail,
      password,
    }, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    staffRecordId = staffRegisterRes.data.data.staff.id;
    
    // Login as the Staff user to get their JWT token
    const staffLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: staffEmail,
      password,
    });
    staffToken = staffLoginRes.data.data.token;
    staffUser = staffLoginRes.data.data.user;
    console.log(`✔ Owner registered Staff: ${staffEmail}`);
    console.log(`✔ Staff logged in with role: ${staffUser.role}`);

    // Verify Role Gating: Staff member tries to add a table (should fail with 403)
    try {
      await axios.post(`${API_URL}/cafes/${cafeId}/tables`, {
        name: 'Staff Unauthorized Table',
        capacity: 2,
        zone: 'INDOOR',
        description: 'Unauthorized'
      }, {
        headers: { Authorization: `Bearer ${staffToken}` }
      });
      throw new Error('FAIL: Staff user was allowed to add a table.');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✔ SUCCESS: Staff user was BLOCKED from adding a table (403 Forbidden)');
      } else {
        throw err;
      }
    }

    // Verify Tenancy protection: Another Owner tries to view staff list (should fail with 403)
    // Register another owner
    const regOwnerB = await axios.post(`${API_URL}/auth/register`, {
      name: 'Owner B',
      email: `owner_b_${suffix}@e2e.com`,
      password,
      role: 'CAFE_ADMIN'
    });
    const tokenB = regOwnerB.data.data.token;
    try {
      await axios.get(`${API_URL}/cafes/${cafeId}/staff`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      throw new Error('FAIL: Foreign Owner was allowed to view staff list.');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✔ SUCCESS: Cross-tenant access was BLOCKED (403 Forbidden)');
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // 5. BOOKING ENGINE & CONFLICT PREVENTION
    // ----------------------------------------------------
    console.log('\n--- 5. Booking Hold, Double-Booking Prevention, & Confirmation ---');

    // Customer places a 5-minute hold on Table 1
    const holdDate = new Date();
    // Use tomorrow's date to avoid time zone date offsets
    holdDate.setDate(holdDate.getDate() + 1);
    const holdDateStr = new Date(holdDate.setUTCHours(0, 0, 0, 0)).toISOString();

    const holdRes = await axios.post(`${API_URL}/bookings`, {
      tableId,
      bookingDate: holdDateStr,
      startTime: '12:00',
      endTime: '13:00',
      partySize: 2,
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    bookingId = holdRes.data.data.booking.id;
    console.log(`✔ Customer placed 5-minute hold on Table (Booking ID: ${bookingId}, Status: ${holdRes.data.data.booking.status})`);

    // Verify Double-Booking block: Another customer tries to hold same slot (should fail with 409)
    const regCustomerB = await axios.post(`${API_URL}/auth/register`, {
      name: 'Customer B',
      email: `customer_b_${suffix}@e2e.com`,
      password,
    });
    const tokenCustB = regCustomerB.data.data.token;
    try {
      await axios.post(`${API_URL}/bookings`, {
        tableId,
        bookingDate: holdDateStr,
        startTime: '12:00',
        endTime: '13:00',
        partySize: 2,
      }, {
        headers: { Authorization: `Bearer ${tokenCustB}` }
      });
      throw new Error('FAIL: Another customer was allowed to book the same slot.');
    } catch (err) {
      if (err.response?.status === 409) {
        console.log('✔ SUCCESS: Double-booking blocked (409 Conflict)');
      } else {
        throw err;
      }
    }

    // Customer confirms the hold
    const confirmRes = await axios.post(`${API_URL}/bookings/${bookingId}/confirm`, {}, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    if (confirmRes.data.data.booking.status !== 'CONFIRMED') {
      throw new Error('Booking status is not CONFIRMED.');
    }
    console.log(`✔ Customer confirmed reservation successfully (Status: CONFIRMED)`);

    // ----------------------------------------------------
    // 6. DASHBOARD CANCELLATION RULES & STATUS ACTIONS (Staff)
    // ----------------------------------------------------
    console.log('\n--- 6. Status Transition & Dashboards ---');

    // Customer tries to cancel booking within 20 minutes (simulate start time near now)
    // Create another booking with start time 5 minutes from now
    const nowTime = new Date();
    nowTime.setUTCMinutes(nowTime.getUTCMinutes() + 5);
    const startStr = `${String(nowTime.getUTCHours()).padStart(2, '0')}:${String(nowTime.getUTCMinutes()).padStart(2, '0')}`;
    nowTime.setUTCMinutes(nowTime.getUTCMinutes() + 30);
    const endStr = `${String(nowTime.getUTCHours()).padStart(2, '0')}:${String(nowTime.getUTCMinutes()).padStart(2, '0')}`;

    const nearHold = await axios.post(`${API_URL}/bookings`, {
      tableId,
      bookingDate: new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString(),
      startTime: startStr,
      endTime: endStr,
      partySize: 2,
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const nearBookingId = nearHold.data.data.booking.id;
    await axios.post(`${API_URL}/bookings/${nearBookingId}/confirm`, {}, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    try {
      await axios.patch(`${API_URL}/bookings/${nearBookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      throw new Error('FAIL: Allowed customer to cancel booking within 20 minutes.');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✔ SUCCESS: Cancellation window protection active (403 Forbidden)');
      } else {
        throw err;
      }
    }

    // Clean up the temporary nearBookingId
    await prisma.booking.delete({ where: { id: nearBookingId } });

    // Staff user marks the primary confirmed booking as COMPLETED
    const markCompletedRes = await axios.patch(`${API_URL}/bookings/${bookingId}/status`, {
      status: 'COMPLETED'
    }, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    if (markCompletedRes.data.data.booking.status !== 'COMPLETED') {
      throw new Error('Booking status is not COMPLETED.');
    }
    console.log('✔ Staff user successfully marked reservation as COMPLETED');

    // ----------------------------------------------------
    // 7. REVIEWS & RATINGS GATING
    // ----------------------------------------------------
    console.log('\n--- 7. Reviews, Ratings & Cafe Aggregates ---');

    // Customer submits a 5-star review for the completed booking
    const reviewRes = await axios.post(`${API_URL}/reviews`, {
      bookingId,
      rating: 5,
      comment: 'Excellent service and great atmosphere!'
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log(`✔ Customer successfully submitted a 5-star review`);

    // Verify Cafe rating aggregates updated in database
    const updatedCafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
    console.log(`✔ Café averageRating: ${updatedCafe.averageRating} (Expected: 5.0)`);
    console.log(`✔ Café totalReviews: ${updatedCafe.totalReviews} (Expected: 1)`);
    if (updatedCafe.averageRating !== 5.0 || updatedCafe.totalReviews !== 1) {
      throw new Error('Cafe aggregates were not updated correctly.');
    }

    // Fetch reviews list publicly
    const reviewsList = await axios.get(`${API_URL}/reviews/cafe/${cafeId}`);
    const foundReview = reviewsList.data.data.reviews.find(r => r.bookingId === bookingId);
    if (!foundReview || foundReview.comment !== 'Excellent service and great atmosphere!') {
      throw new Error('Submitted review not found in café reviews listing.');
    }
    console.log('✔ Review successfully listed on public endpoint');

    console.log('\n==================================================');
    console.log('  SUCCESS: ALL E2E PLATFORM VALIDATIONS PASSED!  ');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ E2E VALIDATION ERROR ENCOUNTERED:', error.response?.data || error.message);
  } finally {
    // ----------------------------------------------------
    // 8. DATABASE CLEANUP
    // ----------------------------------------------------
    console.log('\nCleaning up database records...');
    try {
      if (bookingId) {
        await prisma.review.deleteMany({ where: { bookingId } }).catch(() => {});
        await prisma.booking.delete({ where: { id: bookingId } }).catch(() => {});
      }
      if (staffRecordId) {
        await prisma.cafeStaff.delete({ where: { id: staffRecordId } }).catch(() => {});
      }
      if (staffUser) {
        await prisma.user.delete({ where: { email: staffEmail } }).catch(() => {});
      }
      if (tableId) {
        await prisma.table.delete({ where: { id: tableId } }).catch(() => {});
      }
      if (cafeId) {
        await prisma.cafe.delete({ where: { id: cafeId } }).catch(() => {});
      }
      if (customerUser) {
        await prisma.user.delete({ where: { email: customerEmail } }).catch(() => {});
      }
      if (ownerUser) {
        await prisma.user.delete({ where: { email: ownerEmail } }).catch(() => {});
      }
      if (adminUser) {
        await prisma.user.delete({ where: { email: superAdminEmail } }).catch(() => {});
      }
      // Clean up B records
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              `owner_b_${suffix}@e2e.com`,
              `customer_b_${suffix}@e2e.com`
            ]
          }
        }
      }).catch(() => {});

      console.log('Cleanup finished.');
    } catch (cleanErr) {
      console.error('Failed to clean up records:', cleanErr.message);
    }
    prisma.$disconnect();
  }
}

runValidation();
