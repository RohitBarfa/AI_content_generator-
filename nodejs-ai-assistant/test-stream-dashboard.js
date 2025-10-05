require('dotenv').config();
const { StreamChat } = require('stream-chat');

console.log('🔍 Testing Stream Chat Dashboard Connection...\n');

// Configuration
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

console.log('API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET');
console.log('API Secret:', apiSecret ? `${apiSecret.substring(0, 8)}...` : 'NOT SET');

if (!apiKey || !apiSecret) {
    console.error('❌ Missing STREAM_API_KEY or STREAM_API_SECRET in .env file');
    process.exit(1);
}

async function testStreamConnection() {
    try {
        // Initialize Stream Chat client
        const serverClient = new StreamChat(apiKey, apiSecret);
        console.log('✅ Stream Chat client initialized');

        // Test 1: Create a test user
        const testUserId = `test-user-${Date.now()}`;
        const testUser = {
            id: testUserId,
            name: 'Test User from Qoder',
            role: 'user'
        };

        console.log('\n📝 Creating test user...');
        await serverClient.upsertUser(testUser);
        console.log('✅ Test user created:', testUserId);

        // Test 2: Create a test channel
        const testChannelId = `test-channel-${Date.now()}`;
        console.log('\n📝 Creating test channel...');
        const channel = serverClient.channel('messaging', testChannelId, {
            name: 'Test Channel from Qoder',
            created_by_id: testUserId
        });

        await channel.create();
        console.log('✅ Test channel created:', testChannelId);

        // Test 3: Add user to channel
        console.log('\n📝 Adding user to channel...');
        await channel.addMembers([testUserId]);
        console.log('✅ User added to channel');

        // Test 4: Send a test message
        console.log('\n📝 Sending test message...');
        const message = await channel.sendMessage({
            text: 'Hello from Qoder! This message should appear in your GetStream dashboard. 🚀',
            user_id: testUserId
        });
        console.log('✅ Message sent:', message.message.id);

        // Test 5: Send another message to make it more visible
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const message2 = await channel.sendMessage({
            text: 'This is a second test message to confirm the connection is working! Check your GetStream dashboard now. 📊',
            user_id: testUserId
        });
        console.log('✅ Second message sent:', message2.message.id);

        // Test 6: Query channels to verify
        console.log('\n📝 Querying channels...');
        const channels = await serverClient.queryChannels({
            members: { $in: [testUserId] }
        });
        console.log('✅ Found channels:', channels.length);

        console.log('\n🎉 SUCCESS! All tests passed!');
        console.log('\n📋 What to check in your GetStream dashboard:');
        console.log('   1. Go to https://dashboard.getstream.io/');
        console.log('   2. Select your Chat application');
        console.log('   3. Go to "Explorer" > "Chat" > "Channels"');
        console.log('   4. Look for channel:', testChannelId);
        console.log('   5. Click on it to see the test messages');
        console.log('\n   User created:', testUserId);
        console.log('   Channel created:', testChannelId);
        console.log('   Messages sent: 2');

        // Cleanup (optional - comment out if you want to keep the test data)
        console.log('\n🧹 Cleaning up test data...');
        await serverClient.deleteUser(testUserId, { hard_delete: true });
        console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ Error testing Stream Chat connection:', error.message);
        
        if (error.code === 16) {
            console.error('\n💡 This looks like an authentication error.');
            console.error('   Please verify your Stream Chat API credentials:');
            console.error('   1. Go to https://dashboard.getstream.io/');
            console.error('   2. Select your app');
            console.error('   3. Go to "App Settings" > "API Keys"');
            console.error('   4. Copy the correct API Key and Secret to your .env file');
        }
        
        console.error('\nFull error details:', error);
    }
}

testStreamConnection();