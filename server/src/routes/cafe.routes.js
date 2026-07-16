const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { cafeUpload } = require('../middleware/upload.middleware');
const { register, getOwned } = require('../controllers/cafe.controller');
const { addTable, listTables, editTable, removeTable, setHours } = require('../controllers/table.controller');

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

// Table CRUD routes
router.post(
  '/:id/tables',
  asyncHandler(authMiddleware),
  requireRole('CAFE_ADMIN'),
  asyncHandler(addTable)
);

router.get(
  '/:id/tables',
  asyncHandler(authMiddleware),
  asyncHandler(listTables)
);

router.patch(
  '/:id/tables/:tableId',
  asyncHandler(authMiddleware),
  requireRole('CAFE_ADMIN'),
  asyncHandler(editTable)
);

router.delete(
  '/:id/tables/:tableId',
  asyncHandler(authMiddleware),
  requireRole('CAFE_ADMIN'),
  asyncHandler(removeTable)
);

// Operating Hours route
router.patch(
  '/:id/hours',
  asyncHandler(authMiddleware),
  requireRole('CAFE_ADMIN'),
  asyncHandler(setHours)
);

module.exports = router;
