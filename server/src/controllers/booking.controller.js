const { holdBookingSchema } = require('../validators/booking.validators');
const {
  createBookingHold,
  confirmBooking,
  getCustomerBookings,
  cancelBookingHold,
} = require('../services/booking.service');

async function placeHold(req, res) {
  const payload = holdBookingSchema.parse(req.body);
  const booking = await createBookingHold(req.user.id, payload);

  return res.status(201).json({ data: { booking } });
}

async function confirm(req, res) {
  const { id } = req.params;
  const booking = await confirmBooking(id, req.user.id);

  return res.status(200).json({ data: { booking } });
}

async function listMyBookings(req, res) {
  const bookings = await getCustomerBookings(req.user.id);

  return res.status(200).json({ data: { bookings } });
}

async function cancel(req, res) {
  const { id } = req.params;
  const booking = await cancelBookingHold(id, req.user.id);

  return res.status(200).json({ data: { booking } });
}

module.exports = {
  placeHold,
  confirm,
  listMyBookings,
  cancel,
};
