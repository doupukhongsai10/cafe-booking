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

export async function updateCafeProfile(id, formData, token) {
  const response = await cafeClient.patch(`/cafes/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data.cafe;
}

export async function getTables(cafeId, token) {
  const response = await cafeClient.get(`/cafes/${cafeId}/tables`, getHeaders(token));
  return response.data.data.tables;
}

export async function createTable(cafeId, tableData, token) {
  const response = await cafeClient.post(`/cafes/${cafeId}/tables`, tableData, getHeaders(token));
  return response.data.data.table;
}

export async function updateTable(cafeId, tableId, tableData, token) {
  const response = await cafeClient.patch(`/cafes/${cafeId}/tables/${tableId}`, tableData, getHeaders(token));
  return response.data.data.table;
}

export async function deleteTable(cafeId, tableId, token) {
  const response = await cafeClient.delete(`/cafes/${cafeId}/tables/${tableId}`, getHeaders(token));
  return response.data.data;
}

export async function updateOperatingHours(cafeId, hoursData, token) {
  const response = await cafeClient.patch(`/cafes/${cafeId}/hours`, hoursData, getHeaders(token));
  return response.data.data.cafe;
}

export async function listCafes() {
  const response = await cafeClient.get('/cafes');
  return response.data.data.cafes;
}

export async function getCafeTables(cafeId, token) {
  const config = token ? getHeaders(token) : {};
  const response = await cafeClient.get(`/cafes/${cafeId}/tables`, config);
  return response.data.data.tables;
}
