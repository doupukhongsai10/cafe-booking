const { z } = require('zod');

const holdBookingSchema = z.object({
  tableId: z.string().uuid('Invalid table ID format'),
  bookingDate: z.string().datetime({ message: 'bookingDate must be a valid ISO datetime string' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid startTime format. Must be HH:MM'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid endTime format. Must be HH:MM'),
  partySize: z.number().int().min(1, 'Party size must be at least 1'),
});

module.exports = {
  holdBookingSchema,
};
