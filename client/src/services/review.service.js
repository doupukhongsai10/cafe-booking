import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('VITE_API_URL is required to connect to the Aura Reserve API.');
}

const reviewClient = axios.create({
  baseURL: apiUrl,
});

function getHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function submitReview(data, token) {
  const response = await reviewClient.post('/reviews', data, getHeaders(token));
  return response.data.data.review;
}

export async function getCafeReviews(cafeId) {
  const response = await reviewClient.get(`/reviews/cafe/${cafeId}`);
  return response.data.data.reviews;
}
