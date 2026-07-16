const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/auth.middleware');
const { placeHold, confirm } = require('../controllers/booking.controller');

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

module.exports = router;
