const { StreamChat } = require('stream-chat');
require('dotenv').config();

async function verifyStreamChat() {
    console.log('🔍 Verifying Stream Chat API keys...\n');

    // Check if API keys are set
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || apiKey === 'your_stream_api_key_here') {
        console.log('❌ STREAM_API_KEY not set in .env file');
        console.log('📝 Please add your Stream Chat API key to .env');
        return;
    }

    if (!apiSecret || apiSecret === 'your_stream_secret_here') {
        console.log('❌ STREAM_API_SECRET not set in .env file');
        console.log('📝 Please add your Stream Chat secret to .env');
        return;
    }

    console.log('✅ API keys found in environment');
    console.log(`📋 API Key: ${apiKey.substring(0, 8)}...`);
    console.log(`🔐 Secret: ${apiSecret.substring(0, 8)}...\n`);

    try {
        // Initialize Stream Chat client
        console.log('🔄 Initializing Stream Chat client...');
        const serverClient = StreamChat.getInstance(apiKey, apiSecret);

        // Test 1: Create a test user
        console.log('👤 Testing user creation...');
        const testUser = {
            id: 'test-user-' + Date.now(),
            name: 'Test User',
            role: 'user'
        };

        await serverClient.upsertUser(testUser);
        console.log('✅ User creation successful');

        // Test 2: Create a test channel
        console.log('💬 Testing channel creation...');
        const channel = serverClient.channel('messaging', 'test-channel-' + Date.now(), {
            name: 'Test Channel',
            created_by_id: testUser.id
        });

        await channel.create();
        console.log('✅ Channel creation successful');

        // Test 3: Generate user token
        console.log('🎫 Testing token generation...');
        const token = serverClient.createToken(testUser.id);
        console.log('✅ Token generation successful');
        console.log(`📄 Token: ${token.substring(0, 20)}...\n`);

        // Test 4: Cleanup - Delete the test user
        console.log('🧹 Cleaning up test data...');
        await serverClient.deleteUser(testUser.id, { hard_delete: true });
        console.log('✅ Cleanup successful');

        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ Your Stream Chat API keys are working correctly');
        console.log('✅ Ready to start AI agents');

    } catch (error) {
        console.log('\n❌ Stream Chat verification failed:');
        console.log('Error:', error.message);

        if (error.message.includes('api_key not valid')) {
            console.log('\n💡 Solutions:');
            console.log('   1. Check your STREAM_API_KEY is correct');
            console.log('   2. Make sure you copied it exactly from Stream Dashboard');
            console.log('   3. Verify your Stream Chat app is active');
        } else if (error.message.includes('invalid signature')) {
            console.log('\n💡 Solutions:');
            console.log('   1. Check your STREAM_API_SECRET is correct');
            console.log('   2. Make sure API key and secret are from the same app');
        } else if (error.message.includes('rate limit')) {
            console.log('\n💡 Rate limit reached - wait a moment and try again');
        } else {
            console.log('\n💡 General troubleshooting:');
            console.log('   1. Check your internet connection');
            console.log('   2. Verify API keys are from the correct Stream app');
            console.log('   3. Ensure your Stream app has chat enabled');
        }
    }
}

// Run the verification
verifyStreamChat();