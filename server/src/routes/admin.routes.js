const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { listPending, approve, reject } = require('../controllers/cafe.controller');

const router = express.Router();

// All super admin actions require a authenticated session and SUPER_ADMIN role
router.use(asyncHandler(authMiddleware));
router.use(requireRole('SUPER_ADMIN'));

router.get('/cafes/pending', asyncHandler(listPending));
router.post('/cafes/:id/approve', asyncHandler(approve));
router.post('/cafes/:id/reject', asyncHandler(reject));

module.exports = router;
