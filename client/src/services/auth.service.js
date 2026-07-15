import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('VITE_API_URL is required to connect to the Aura Reserve API.');
}

const authClient = axios.create({
  baseURL: apiUrl,
});

function extractResponseData(response) {
  return response.data.data;
}

export async function registerUser(payload) {
  const response = await authClient.post('/auth/register', payload);
  return extractResponseData(response);
}

export async function loginUser(payload) {
  const response = await authClient.post('/auth/login', payload);
  return extractResponseData(response);
}

export async function logoutUser(token) {
  await authClient.post('/auth/logout', undefined, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
