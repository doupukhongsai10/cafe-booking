import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('VITE_API_URL is required to connect to the Aura Reserve API.');
}

const staffClient = axios.create({
  baseURL: apiUrl,
});

function getHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function addStaffUser(cafeId, data, token) {
  const response = await staffClient.post(`/cafes/${cafeId}/staff`, data, getHeaders(token));
  return response.data.data.staff;
}

export async function getStaffList(cafeId, token) {
  const response = await staffClient.get(`/cafes/${cafeId}/staff`, getHeaders(token));
  return response.data.data.staff;
}

export async function deleteStaffUser(cafeId, staffId, token) {
  const response = await staffClient.delete(`/cafes/${cafeId}/staff/${staffId}`, getHeaders(token));
  return response.data.data;
}
