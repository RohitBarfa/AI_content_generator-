require('dotenv').config();
const { StreamChat } = require('stream-chat');

console.log('👥 Finding All Users in Your GetStream Account...\n');

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

async function findAllUsers() {
    try {
        const serverClient = new StreamChat(apiKey, apiSecret);
        console.log('✅ Connected to Stream Chat\n');

        // Query all users with pagination
        console.log('📋 Searching for all users...');
        
        let allUsers = [];
        let offset = 0;
        const limit = 30;
        let hasMore = true;

        while (hasMore) {
            const response = await serverClient.queryUsers(
                {}, // No filter - get all users
                { created_at: -1 }, // Sort by creation date (newest first)
                { limit: limit, offset: offset }
            );

            allUsers = allUsers.concat(response.users);
            
            if (response.users.length < limit) {
                hasMore = false;
            } else {
                offset += limit;
            }
        }

        console.log(`\n📊 Found ${allUsers.length} users total:\n`);

        if (allUsers.length === 0) {
            console.log('❌ No users found. This might mean:');
            console.log('   1. This is a fresh Stream Chat application');
            console.log('   2. Users were created but deleted');
            return;
        }

        // Group users by type
        const regularUsers = [];
        const aiBots = [];
        const testUsers = [];

        allUsers.forEach(user => {
            if (user.id.startsWith('ai-bot-')) {
                aiBots.push(user);
            } else if (user.id.includes('test') || user.id.includes('qoder')) {
                testUsers.push(user);
            } else {
                regularUsers.push(user);
            }
        });

        // Display regular users
        if (regularUsers.length > 0) {
            console.log('👤 REGULAR USERS:');
            console.log('================\n');
            
            regularUsers.forEach((user, index) => {
                const createdDate = user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown';
                const lastSeen = user.last_active ? new Date(user.last_active).toLocaleString() : 'Never active';
                
                console.log(`${index + 1}. 👤 User: ${user.name || user.id}`);
                console.log(`   ID: ${user.id}`);
                console.log(`   Created: ${createdDate}`);
                console.log(`   Last Active: ${lastSeen}`);
                console.log(`   Role: ${user.role || 'user'}`);
                
                if (user.email) {
                    console.log(`   Email: ${user.email}`);
                }
                
                // Show custom fields
                const customFields = Object.keys(user).filter(key => 
                    !['id', 'name', 'created_at', 'updated_at', 'last_active', 'role', 'email', 'online', 'banned'].includes(key)
                );
                
                if (customFields.length > 0) {
                    console.log(`   Custom: ${customFields.map(field => `${field}=${user[field]}`).join(', ')}`);
                }
                
                console.log('   ---\n');
            });
        }

        // Display AI bots
        if (aiBots.length > 0) {
            console.log('🤖 AI BOTS:');
            console.log('===========\n');
            
            aiBots.forEach((user, index) => {
                const createdDate = user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown';
                const channelId = user.id.replace('ai-bot-', '');
                
                console.log(`${index + 1}. 🤖 Bot: ${user.name || user.id}`);
                console.log(`   ID: ${user.id}`);
                console.log(`   Created: ${createdDate}`);
                console.log(`   Channel: ${channelId}`);
                console.log('   ---\n');
            });
        }

        // Display test users
        if (testUsers.length > 0) {
            console.log('🧪 TEST USERS:');
            console.log('==============\n');
            
            testUsers.forEach((user, index) => {
                const createdDate = user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown';
                
                console.log(`${index + 1}. 🧪 Test User: ${user.name || user.id}`);
                console.log(`   ID: ${user.id}`);
                console.log(`   Created: ${createdDate}`);
                console.log('   ---\n');
            });
        }

        // Summary
        console.log('📊 SUMMARY:');
        console.log('===========');
        console.log(`Total Users: ${allUsers.length}`);
        console.log(`Regular Users: ${regularUsers.length}`);
        console.log(`AI Bots: ${aiBots.length}`);
        console.log(`Test Users: ${testUsers.length}`);

        // Show newest users (created in last 24 hours)
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const newUsers = allUsers.filter(user => 
            user.created_at && new Date(user.created_at) > last24Hours
        );

        if (newUsers.length > 0) {
            console.log('\n🆕 NEW USERS (Last 24 Hours):');
            console.log('==============================');
            
            newUsers.forEach((user, index) => {
                const createdDate = new Date(user.created_at).toLocaleString();
                const userType = user.id.startsWith('ai-bot-') ? '🤖' : 
                               user.id.includes('test') ? '🧪' : '👤';
                
                console.log(`${index + 1}. ${userType} ${user.name || user.id}`);
                console.log(`   ID: ${user.id}`);
                console.log(`   Created: ${createdDate}`);
                console.log('   ---');
            });
        } else {
            console.log('\n❌ No new users created in the last 24 hours');
        }

        console.log('\n🎯 How to Find These in Your Dashboard:');
        console.log('1. Go to: https://dashboard.getstream.io/');
        console.log('2. Select your Chat app');
        console.log('3. Go to Explorer > Chat > Users');
        console.log('4. Sort by "Created At" to see newest users first');
        console.log('5. Use filters to find specific user types');

    } catch (error) {
        console.error('❌ Error finding users:', error.message);
        
        if (error.code === 16) {
            console.error('\n💡 Authentication error - check your API keys');
        }
    }
}

findAllUsers();