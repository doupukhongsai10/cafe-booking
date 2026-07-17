import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('VITE_API_URL is required to connect to the CafeReserve API.');
}

const bookingClient = axios.create({
  baseURL: apiUrl,
});

function getHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function getMyBookings(token) {
  const response = await bookingClient.get('/bookings/my', getHeaders(token));
  return response.data.data.bookings;
}

export async function cancelBooking(bookingId, token) {
  const response = await bookingClient.patch(
    `/bookings/${bookingId}/cancel`,
    {},
    getHeaders(token)
  );
  return response.data.data.booking;
}

export async function placeHold(data, token) {
  const response = await bookingClient.post('/bookings', data, getHeaders(token));
  return response.data.data.booking;
}

export async function confirmHold(bookingId, token) {
  const response = await bookingClient.post(
    `/bookings/${bookingId}/confirm`,
    {},
    getHeaders(token)
  );
  return response.data.data.booking;
}

export async function getCafeBookings(cafeId, token) {
  const response = await bookingClient.get(`/bookings/cafe/${cafeId}`, getHeaders(token));
  return response.data.data.bookings;
}

export async function updateBookingStatus(bookingId, status, token) {
  const response = await bookingClient.patch(
    `/bookings/${bookingId}/status`,
    { status },
    getHeaders(token)
  );
  return response.data.data.booking;
}
