const axios = require('axios');

// Test the start AI agent endpoint with timeout handling
async function testAIAgentSetup() {
    console.log('🔧 Testing AI Agent Setup with timeout handling...');

    try {
        console.log('📡 Sending request to start AI agent...');

        const response = await axios.post('http://localhost:3000/start-ai-agent', {
            channel_id: 'test-channel-123',
            channel_type: 'messaging'
        }, {
            timeout: 45000 // 45 second timeout
        });

        console.log('✅ AI Agent setup successful!');
        console.log('Response:', response.data);

    } catch (error) {
        if (error.response) {
            // Server responded with error status
            console.log('❌ AI Agent setup failed:');
            console.log('Status:', error.response.status);
            console.log('Error:', error.response.data);

            if (error.response.status === 408) {
                console.log('⏰ This was a timeout error - the AI service took too long to respond');
                console.log('💡 Possible solutions:');
                console.log('   1. Check your OpenRouter API key in .env file');
                console.log('   2. Verify your internet connection');
                console.log('   3. Try again - sometimes OpenRouter can be slow');
            } else if (error.response.status === 401) {
                console.log('🔑 This was an authentication error');
                console.log('💡 Please check your OpenRouter API key in .env file');
            }
        } else if (error.code === 'ECONNABORTED') {
            console.log('⏰ The request timed out after 45 seconds');
            console.log('💡 This usually means:');
            console.log('   1. OpenRouter API is slow/unavailable');
            console.log('   2. Your API key might be invalid');
            console.log('   3. Network connectivity issues');
        } else {
            console.log('💥 Request failed:', error.message);
        }
    }
}

// Run the test
testAIAgentSetup();