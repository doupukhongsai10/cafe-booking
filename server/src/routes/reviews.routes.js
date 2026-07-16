const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/auth.middleware');
const { create, listForCafe } = require('../controllers/review.controller');

const router = express.Router();

router.post(
  '/',
  asyncHandler(authMiddleware),
  asyncHandler(create)
);

router.get(
  '/cafe/:id',
  asyncHandler(listForCafe)
);

module.exports = router;
