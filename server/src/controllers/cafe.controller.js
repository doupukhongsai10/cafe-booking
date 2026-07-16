const { registerCafeSchema, rejectCafeSchema } = require('../validators/cafe.validators');
const { createCafe, getPendingCafes, updateCafeStatus, getCafeByOwnerId } = require('../services/cafe.service');
const { uploadImageBuffer } = require('../lib/cloudinary');
const { AppError } = require('../utils/errors');

async function register(req, res) {
  const payload = registerCafeSchema.parse(req.body);

  const coverPhotoFile = req.files && req.files['coverPhoto'] ? req.files['coverPhoto'][0] : null;
  const photosFiles = req.files && req.files['photos'] ? req.files['photos'] : [];

  if (!coverPhotoFile) {
    throw new AppError('Cover photo is required.', 400, 'COVER_PHOTO_REQUIRED');
  }

  // Upload cover photo to Cloudinary
  const coverPhotoUrl = await uploadImageBuffer(coverPhotoFile.buffer, 'cafe-cover');

  // Upload gallery photos to Cloudinary
  const photos = [];
  for (const file of photosFiles) {
    const url = await uploadImageBuffer(file.buffer, 'cafe-gallery');
    photos.push(url);
  }

  const cafe = await createCafe(req.user.id, {
    ...payload,
    coverPhotoUrl,
    photos,
  });

  return res.status(201).json({ data: { cafe } });
}

async function listPending(req, res) {
  const cafes = await getPendingCafes();
  return res.status(200).json({ data: { cafes } });
}

async function approve(req, res) {
  const { id } = req.params;
  const cafe = await updateCafeStatus(id, 'APPROVED');
  return res.status(200).json({ data: { cafe } });
}

async function reject(req, res) {
  const { id } = req.params;
  const { reason } = rejectCafeSchema.parse(req.body);
  const cafe = await updateCafeStatus(id, 'REJECTED', reason);
  return res.status(200).json({ data: { cafe } });
}

async function getOwned(req, res) {
  const cafe = await getCafeByOwnerId(req.user.id);
  return res.status(200).json({ data: { cafe } });
}

module.exports = {
  register,
  listPending,
  approve,
  reject,
  getOwned,
};
