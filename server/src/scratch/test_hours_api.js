const axios = require('axios');

async function testApi() {
  const API_URL = 'http://localhost:5000/api';
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner_test@example.com',
      password: 'password123'
    });
    const token = loginRes.data.data.token;
    console.log('Logged in successfully, token received.');

    // 2. Get Cafe
    const cafeRes = await axios.get(`${API_URL}/cafes/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const cafe = cafeRes.data.data.cafe;
    console.log(`Cafe ID: ${cafe.id}, Name: ${cafe.name}`);

    // 3. Update hours
    const testHours = {
      monday: { open: '08:00', close: '22:00', closed: true },
      tuesday: { open: '08:00', close: '22:00', closed: false },
      wednesday: { open: '08:00', close: '22:00', closed: false },
      thursday: { open: '08:00', close: '22:00', closed: false },
      friday: { open: '08:00', close: '22:00', closed: false },
      saturday: { open: '08:00', close: '22:00', closed: false },
      sunday: { open: '08:00', close: '22:00', closed: false }
    };

    console.log('Sending PATCH request to update hours...');
    const updateRes = await axios.patch(
      `${API_URL}/cafes/${cafe.id}/hours`,
      testHours,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Success! Response data:', JSON.stringify(updateRes.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Network/Other Error:', error.message);
    }
  }
}

testApi();
