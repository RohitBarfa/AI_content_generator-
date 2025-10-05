const OpenAI = require('openai');
require('dotenv').config();

async function testOpenRouter() {
    console.log('Testing OpenRouter API connection...');

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
        console.log('❌ OpenRouter API key not set in .env file');
        console.log('Please update OPENAI_API_KEY in your .env file with your actual OpenRouter API key');
        return;
    }

    console.log('✅ API key found in environment');

    const openai = new OpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI Chat Assistant Test"
        }
    });

    try {
        console.log('🔄 Testing connection to Llama 3.3 70B...');

        const completion = await openai.chat.completions.create({
            model: "meta-llama/llama-3.3-70b-instruct:free",
            messages: [
                {
                    role: "user",
                    content: "Hello! Please respond with 'OpenRouter connection successful' if you can see this."
                }
            ],
            max_tokens: 50
        });

        console.log('🎉 SUCCESS! OpenRouter is working!');
        console.log('📝 Response:', completion.choices[0].message.content);
        console.log('🤖 Model used:', completion.model);
        console.log('💰 Tokens used:', completion.usage);

    } catch (error) {
        console.log('❌ Error testing OpenRouter:');
        console.log(error.message);

        if (error.message.includes('401')) {
            console.log('💡 This looks like an authentication error. Please check:');
            console.log('   1. Your OpenRouter API key is correct');
            console.log('   2. Your OpenRouter account has credits/quota available');
        }
    }
}

testOpenRouter();