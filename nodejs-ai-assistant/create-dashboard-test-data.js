require('dotenv').config();
const { StreamChat } = require('stream-chat');

console.log('🚀 Creating Permanent Test Data for GetStream Dashboard...\n');

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

async function createPermanentTestData() {
    try {
        const serverClient = new StreamChat(apiKey, apiSecret);
        
        // Create a clearly identifiable user
        const testUserId = 'qoder-test-user';
        await serverClient.upsertUser({
            id: testUserId,
            name: 'Qoder Test User',
            role: 'user',
            custom_field: 'Created from Qoder IDE'
        });
        console.log('✅ Created permanent test user:', testUserId);

        // Create a clearly identifiable channel
        const channelId = 'qoder-test-channel';
        const channel = serverClient.channel('messaging', channelId, {
            name: '🎯 QODER TEST CHANNEL - Check Dashboard!',
            created_by_id: testUserId,
            custom_field: 'Created from Qoder IDE'
        });

        await channel.create();
        await channel.addMembers([testUserId]);
        console.log('✅ Created permanent test channel:', channelId);

        // Send multiple messages to make it very visible
        const messages = [
            'Hello! This is a test message from Qoder IDE 🚀',
            'If you can see this in your GetStream dashboard, the connection is working perfectly!',
            'This channel was created to verify that changes from your local development environment appear in the dashboard.',
            `Timestamp: ${new Date().toISOString()}`,
            'You can now see your local development activity in the GetStream dashboard! ✅'
        ];

        for (let i = 0; i < messages.length; i++) {
            await channel.sendMessage({
                text: messages[i],
                user_id: testUserId
            });
            console.log(`✅ Sent message ${i + 1}/${messages.length}`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between messages
        }

        console.log('\n🎉 SUCCESS! Permanent test data created!');
        console.log('\n📋 Now check your GetStream dashboard:');
        console.log('   1. Go to: https://dashboard.getstream.io/');
        console.log('   2. Select your Chat application');
        console.log('   3. Go to "Explorer" > "Chat" > "Channels"');
        console.log('   4. Look for: "🎯 QODER TEST CHANNEL - Check Dashboard!"');
        console.log('   5. Click on it to see all the test messages');
        console.log('\n📊 Data created:');
        console.log('   - Channel ID:', channelId);
        console.log('   - User ID:', testUserId);
        console.log('   - Messages sent:', messages.length);
        console.log('\n💡 This data will remain in your dashboard until you delete it.');

    } catch (error) {
        console.error('❌ Error creating test data:', error.message);
    }
}

createPermanentTestData();