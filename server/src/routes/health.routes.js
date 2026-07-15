const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ data: { status: 'ok', message: 'Backend is running' } });
});

module.exports = router;
