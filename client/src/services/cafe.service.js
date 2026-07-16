import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('VITE_API_URL is required to connect to the Aura Reserve API.');
}

const cafeClient = axios.create({
  baseURL: apiUrl,
});

function getHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function getOwnedCafe(token) {
  const response = await cafeClient.get('/cafes/my', getHeaders(token));
  return response.data.data.cafe;
}

export async function onboardCafe(formData, token) {
  const response = await cafeClient.post('/cafes', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data.cafe;
}

export async function getPendingCafes(token) {
  const response = await cafeClient.get('/admin/cafes/pending', getHeaders(token));
  return response.data.data.cafes;
}

export async function approveCafe(id, token) {
  const response = await cafeClient.patch(`/admin/cafes/${id}/approve`, {}, getHeaders(token));
  return response.data.data.cafe;
}

export async function rejectCafe(id, reason, token) {
  const response = await cafeClient.patch(
    `/admin/cafes/${id}/reject`,
    { reason },
    getHeaders(token)
  );
  return response.data.data.cafe;
}
