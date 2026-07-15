const multer = require('multer');
const { AppError } = require('../utils/errors');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed.', 400, 'INVALID_FILE_TYPE'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size per file
  },
});

// Café onboarding requires a cover photo and up to 10 additional detail photos
const cafeUpload = upload.fields([
  { name: 'coverPhoto', maxCount: 1 },
  { name: 'photos', maxCount: 10 },
]);

module.exports = { cafeUpload };
