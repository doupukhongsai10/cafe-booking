import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('VITE_API_URL is required to connect to the Aura Reserve API.');
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
