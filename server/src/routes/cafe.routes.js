const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { cafeUpload } = require('../middleware/upload.middleware');
const { register, getOwned } = require('../controllers/cafe.controller');

const router = express.Router();

router.post(
  '/',
  asyncHandler(authMiddleware),
  requireRole('CAFE_ADMIN'),
  cafeUpload,
  asyncHandler(register)
);

router.get(
  '/my',
  asyncHandler(authMiddleware),
  requireRole('CAFE_ADMIN', 'CAFE_STAFF'),
  asyncHandler(getOwned)
);

module.exports = router;
