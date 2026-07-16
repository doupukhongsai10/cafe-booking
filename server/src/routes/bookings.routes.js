const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  placeHold,
  confirm,
  listMyBookings,
  cancel,
  listCafeBookings,
  updateStatus,
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

router.get(
  '/cafe/:cafeId',
  asyncHandler(authMiddleware),
  requireRole('CAFE_ADMIN', 'CAFE_STAFF'),
  asyncHandler(listCafeBookings)
);

router.patch(
  '/:id/status',
  asyncHandler(authMiddleware),
  requireRole('CAFE_ADMIN', 'CAFE_STAFF'),
  asyncHandler(updateStatus)
);

module.exports = router;
