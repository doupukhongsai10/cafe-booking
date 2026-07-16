const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  placeHold,
  confirm,
  listMyBookings,
  cancel,
} = require('../controllers/booking.controller');

const router = express.Router();

router.post(
  '/',
  asyncHandler(authMiddleware),
  asyncHandler(placeHold)
);

router.post(
  '/:id/confirm',
  asyncHandler(authMiddleware),
  asyncHandler(confirm)
);

router.get(
  '/my',
  asyncHandler(authMiddleware),
  asyncHandler(listMyBookings)
);

router.patch(
  '/:id/cancel',
  asyncHandler(authMiddleware),
  asyncHandler(cancel)
);

module.exports = router;
