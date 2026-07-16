const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');

async function createReview(userId, data) {
  const { bookingId, rating, comment } = data;
  const numRating = Number(rating);

  if (numRating < 1 || numRating > 5) {
    throw new AppError('Rating must be between 1 and 5.', 400, 'INVALID_RATING');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch booking
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { review: true }
    });

    if (!booking) {
      throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
    }

    // 2. Validate booking belongs to customer
    if (booking.customerId !== userId) {
      throw new AppError('Forbidden: You did not make this reservation.', 403, 'FORBIDDEN');
    }

    // 3. Validate booking is COMPLETED
    if (booking.status !== 'COMPLETED') {
      throw new AppError('You can only review completed reservations.', 400, 'INVALID_BOOKING_STATUS');
    }

    // 4. Validate no review already exists
    if (booking.review) {
      throw new AppError('You have already reviewed this reservation.', 409, 'DUPLICATE_REVIEW');
    }

    // 5. Create Review
    const review = await tx.review.create({
      data: {
        customerId: userId,
        cafeId: booking.cafeId,
        bookingId,
        rating: numRating,
        comment,
      },
    });

    // 6. Update Cafe Average Rating & Total Reviews
    const reviews = await tx.review.findMany({
      where: { cafeId: booking.cafeId },
      select: { rating: true },
    });

    const total = reviews.length;
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = total > 0 ? Number((sum / total).toFixed(2)) : 0.0;

    await tx.cafe.update({
      where: { id: booking.cafeId },
      data: {
        averageRating: avg,
        totalReviews: total,
      },
    });

    return review;
  });
}

async function getCafeReviews(cafeId) {
  return await prisma.review.findMany({
    where: { cafeId },
    include: {
      customer: {
        select: { id: true, name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = {
  createReview,
  getCafeReviews,
};
