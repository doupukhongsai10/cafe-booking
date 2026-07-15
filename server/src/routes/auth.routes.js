const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { register, login, logout } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', asyncHandler(authMiddleware), asyncHandler(logout));

module.exports = router;
