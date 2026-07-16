const { createReview, getCafeReviews } = require('../services/review.service');
const { AppError } = require('../utils/errors');
const zod = require('zod');

const createReviewSchema = zod.object({
  bookingId: zod.string().uuid(),
  rating: zod.number().min(1).max(5),
  comment: zod.string().min(1, 'Comment cannot be empty.'),
});

async function create(req, res) {
  const payload = createReviewSchema.parse(req.body);
  const review = await createReview(req.user.id, payload);
  return res.status(201).json({ data: { review } });
}

async function listForCafe(req, res) {
  const { id } = req.params;
  const reviews = await getCafeReviews(id);
  return res.status(200).json({ data: { reviews } });
}

module.exports = {
  create,
  listForCafe,
};
