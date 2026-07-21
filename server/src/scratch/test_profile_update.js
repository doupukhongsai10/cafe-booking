const axios = require('axios');
const FormData = require('form-data');

async function testProfileUpdate() {
  const API_URL = 'http://localhost:5000/api';
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner_test@example.com',
      password: 'password123'
    });
    const token = loginRes.data.data.token;
    console.log('Logged in successfully.');

    // 2. Get Cafe
    const cafeRes = await axios.get(`${API_URL}/cafes/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const cafe = cafeRes.data.data.cafe;
    console.log(`Current Cafe state: Name="${cafe.name}", Description="${cafe.description}", Cover="${cafe.coverPhotoUrl}"`);

    // 3. Update profile without photo
    console.log('\nUpdating profile WITHOUT photo...');
    const form1 = new FormData();
    form1.append('name', 'Updated Cafe Name No Photo');
    form1.append('description', 'This is a brand new description that should be saved successfully.');
    form1.append('location', '456 Updated St');
    form1.append('city', 'Aizawl');
    form1.append('area', 'Zarkawt');
    form1.append('latitude', '23.7272');
    form1.append('longitude', '92.7178');

    const res1 = await axios.patch(`${API_URL}/cafes/${cafe.id}`, form1, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form1.getHeaders()
      }
    });
    const updatedCafe1 = res1.data.data.cafe;
    console.log(`Result: Name="${updatedCafe1.name}", Description="${updatedCafe1.description}", Cover="${updatedCafe1.coverPhotoUrl}"`);

  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testProfileUpdate();
