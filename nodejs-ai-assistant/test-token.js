const axios = require('axios');

// Test the token endpoint that frontend uses
async function testTokenEndpoint() {
    console.log('🎫 Testing token endpoint...');

    try {
        const response = await axios.post('http://localhost:3000/token', {
            userId: 'test-user-frontend'
        });

        console.log('✅ Token endpoint working!');
        console.log('Token received:', response.data.token.substring(0, 20) + '...');

    } catch (error) {
        console.log('❌ Token endpoint failed:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testTokenEndpoint();