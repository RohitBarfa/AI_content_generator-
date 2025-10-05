require('dotenv').config();
const { StreamChat } = require('stream-chat');

console.log('🔍 Finding All Channels in Your GetStream Account...\n');

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

async function findAllChannels() {
    try {
        const serverClient = new StreamChat(apiKey, apiSecret);
        console.log('✅ Connected to Stream Chat\n');

        // Query all channels
        console.log('📋 Searching for all channels...');
        
        const channels = await serverClient.queryChannels(
            {}, // No filter - get all channels
            { last_message_at: -1 }, // Sort by most recent activity
            { limit: 50, watch: false } // Get up to 50 channels
        );

        console.log(`\n📊 Found ${channels.length} channels:\n`);

        if (channels.length === 0) {
            console.log('❌ No channels found. This might mean:');
            console.log('   1. You haven\'t created any channels yet');
            console.log('   2. Your app is in a different environment');
            console.log('   3. Channels were created but deleted');
            return;
        }

        // Display channel information
        channels.forEach((channel, index) => {
            const channelInfo = channel.data;
            const lastActivity = channelInfo.last_message_at 
                ? new Date(channelInfo.last_message_at).toLocaleString()
                : 'No messages';
            
            console.log(`${index + 1}. 📢 Channel: ${channelInfo.name || 'Unnamed'}`);
            console.log(`   ID: ${channel.id}`);
            console.log(`   Type: ${channel.type}`);
            console.log(`   Members: ${Object.keys(channel.state.members || {}).length}`);
            console.log(`   Last Activity: ${lastActivity}`);
            console.log(`   Created: ${channelInfo.created_at ? new Date(channelInfo.created_at).toLocaleString() : 'Unknown'}`);
            
            // Show member list
            const members = Object.keys(channel.state.members || {});
            if (members.length > 0) {
                console.log(`   👥 Members: ${members.join(', ')}`);
            }
            
            console.log('   ---');
        });

        console.log('\n🎯 How to Find These in Your Dashboard:');
        console.log('1. Go to: https://dashboard.getstream.io/');
        console.log('2. Select your Chat app');
        console.log('3. Go to Explorer > Chat > Channels');
        console.log('4. Look for the channel names and IDs listed above');
        console.log('5. Use the search box to find specific channels');

        // Show the test channel we created earlier
        const testChannel = channels.find(ch => ch.id === 'qoder-test-channel');
        if (testChannel) {
            console.log('\n✅ Found your test channel!');
            console.log('   Look for: "🎯 QODER TEST CHANNEL - Check Dashboard!"');
            console.log('   ID: qoder-test-channel');
        } else {
            console.log('\n❓ Test channel not found in results (might be on next page)');
        }

    } catch (error) {
        console.error('❌ Error finding channels:', error.message);
        
        if (error.code === 16) {
            console.error('\n💡 Authentication error - check your API keys');
        }
    }
}

findAllChannels();