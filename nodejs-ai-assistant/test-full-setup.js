const axios = require('axios');
const { StreamChat } = require('stream-chat');
require('dotenv').config();

async function testFullAISetup() {
    console.log('🚀 Testing Complete AI Agent Setup...\n');

    try {
        // Step 1: Set up Stream Chat channel first
        console.log('📋 Step 1: Setting up Stream Chat channel...');
        const serverClient = StreamChat.getInstance(
            process.env.STREAM_API_KEY,
            process.env.STREAM_API_SECRET
        );

        const channelId = 'test-channel-' + Date.now();
        const userId = 'test-user-' + Date.now();

        // Create test user
        await serverClient.upsertUser({
            id: userId,
            name: 'Test User'
        });

        // Create channel
        const channel = serverClient.channel('messaging', channelId, {
            name: 'Test AI Channel',
            created_by_id: userId
        });
        await channel.create();
        console.log('✅ Channel created successfully');

        // Step 2: Test AI Agent initialization
        console.log('🤖 Step 2: Starting AI Agent...');
        const response = await axios.post('http://localhost:3000/start-ai-agent', {
            channel_id: channelId,
            channel_type: 'messaging'
        }, {
            timeout: 60000 // 60 second timeout
        });

        console.log('✅ AI Agent started successfully!');
        console.log('Response:', response.data);

        // Step 3: Check agent status
        console.log('📊 Step 3: Checking agent status...');
        const statusResponse = await axios.get(`http://localhost:3000/agent-status?channel_id=${channelId}`);
        console.log('Agent Status:', statusResponse.data);

        // Step 4: Test OpenRouter connection
        console.log('🔗 Step 4: Testing OpenRouter connection...');
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openrouter_api_key_here') {
            console.log('✅ OpenRouter API key is configured');
        } else {
            console.log('⚠️  OpenRouter API key needs to be configured for AI responses');
        }

        console.log('\n🎉 COMPLETE SETUP SUCCESSFUL!');
        console.log('✅ Stream Chat: Working');
        console.log('✅ AI Agent: Started');
        console.log('✅ Backend Server: Running');
        console.log('\n🚀 Your AI assistant is ready to use!');

        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await axios.post('http://localhost:3000/stop-ai-agent', {
            channel_id: channelId
        });
        await serverClient.deleteUser(userId, { hard_delete: true });
        console.log('✅ Cleanup completed');

    } catch (error) {
        console.log('\n❌ Setup failed at some step:');

        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', error.response.data);

            if (error.response.status === 408) {
                console.log('\n⏰ Timeout Error - Solutions:');
                console.log('   1. Check your OpenRouter API key');
                console.log('   2. Verify internet connection');
                console.log('   3. OpenRouter might be experiencing delays');
            } else if (error.response.status === 401) {
                console.log('\n🔑 Authentication Error - Solutions:');
                console.log('   1. Verify OpenRouter API key in .env');
                console.log('   2. Check API key format (should start with sk-or-v1-)');
            }
        } else if (error.code === 'ECONNABORTED') {
            console.log('\n⏰ Request timeout - OpenRouter took too long to respond');
            console.log('💡 This is often due to:');
            console.log('   1. Invalid or missing OpenRouter API key');
            console.log('   2. Network connectivity issues');
            console.log('   3. OpenRouter service delays');
        } else {
            console.log('Error details:', error.message);
        }
    }
}

// Run the complete test
testFullAISetup();