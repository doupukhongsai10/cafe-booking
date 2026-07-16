const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

async function createBookingHold(userId, data) {
  const { tableId, bookingDate, startTime, endTime, partySize } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch table and associated cafe
    const table = await tx.table.findUnique({
      where: { id: tableId },
      include: { cafe: true },
    });

    if (!table) {
      throw new AppError('Table not found.', 404, 'TABLE_NOT_FOUND');
    }

    if (!table.isActive) {
      throw new AppError('Table is currently inactive.', 400, 'TABLE_INACTIVE');
    }

    // Check capacity
    if (partySize > table.capacity) {
      throw new AppError(`Party size exceeds table capacity of ${table.capacity}.`, 400, 'EXCEEDS_CAPACITY');
    }

    // 2. Validate operating hours
    const dateObj = new Date(bookingDate);
    const dayIndex = dateObj.getUTCDay() === 0 ? 6 : dateObj.getUTCDay() - 1;
    const dayName = DAYS_OF_WEEK[dayIndex];

    const hours = table.cafe.operatingHours?.[dayName];
    if (!hours || hours.closed) {
      throw new AppError('Café is closed on this day.', 400, 'CAFE_CLOSED');
    }

    if (startTime < hours.open || endTime > hours.close) {
      throw new AppError(`Booking time is outside operating hours (${hours.open} - ${hours.close}).`, 400, 'OUTSIDE_OPERATING_HOURS');
    }

    if (startTime >= endTime) {
      throw new AppError('Start time must be before end time.', 400, 'INVALID_TIME_RANGE');
    }

    // Check if target date is in the past
    const dateStr = dateObj.toISOString().split('T')[0];
    const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);
    if (targetDate < todayDate) {
      throw new AppError('Cannot book in the past.', 400, 'PAST_DATE');
    }

    // 3. Acquire row lock for overlapping bookings
    const overlappingBookings = await tx.$queryRaw`
      SELECT id FROM bookings
      WHERE table_id = ${tableId}
        AND booking_date = ${targetDate}
        AND (
          status = 'CONFIRMED'
          OR (status = 'HELD' AND hold_expires_at > ${new Date()})
        )
        AND start_time < ${endTime}
        AND end_time > ${startTime}
      LIMIT 1
      FOR UPDATE;
    `;

    if (overlappingBookings.length > 0) {
      throw new AppError('The table is already booked or held for this time slot.', 409, 'BOOKING_CONFLICT');
    }

    // 4. Create HELD booking
    const holdExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const booking = await tx.booking.create({
      data: {
        customerId: userId,
        cafeId: table.cafeId,
        tableId,
        bookingDate: targetDate,
        startTime,
        endTime,
        partySize,
        status: 'HELD',
        holdExpiresAt,
      },
    });

    return booking;
  });
}

async function confirmBooking(bookingId, userId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
  }

  if (booking.customerId !== userId) {
    throw new AppError('Forbidden: You did not make this booking.', 403, 'FORBIDDEN');
  }

  if (booking.status === 'CONFIRMED') {
    return booking;
  }

  if (booking.status !== 'HELD') {
    throw new AppError('Booking cannot be confirmed.', 400, 'INVALID_BOOKING_STATUS');
  }

  if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
    throw new AppError('Booking hold has expired.', 400, 'HOLD_EXPIRED');
  }

  return await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CONFIRMED',
      holdExpiresAt: null,
    },
  });
}

module.exports = {
  createBookingHold,
  confirmBooking,
};
