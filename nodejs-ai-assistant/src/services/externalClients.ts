import OpenAI from "openai";
import { StreamChat } from "stream-chat";
import type { AssistantStream } from "openai/lib/AssistantStream";

const USE_MOCKS = process.env.USE_MOCKS === 'true';

// Mock implementations
class MockOpenAI {
    beta = {
        assistants: {
            create: async () => ({
                id: 'mock_assistant_id',
                name: 'Mock AI Writing Assistant',
                model: 'gpt-4o',
                instructions: 'Mock assistant for testing',
            }),
        },
        threads: {
            create: async () => ({
                id: 'mock_thread_id',
            }),
            messages: {
                create: async () => ({
                    id: 'mock_message_id',
                    content: 'mock content',
                }),
            },
            runs: {
                createAndStream: () => {
                    return new MockAssistantStream();
                },
                submitToolOutputsStream: () => {
                    return new MockAssistantStream();
                },
                cancel: async () => ({}),
            },
        },
    };
}

class MockAssistantStream {
    async *[Symbol.asyncIterator]() {
        // Simulate OpenAI assistant stream events
        yield {
            event: 'thread.run.created',
            data: { id: 'mock_run_id' }
        };

        yield {
            event: 'thread.message.delta',
            data: {
                delta: {
                    content: [{
                        type: 'text',
                        text: { value: 'Mock' }
                    }]
                }
            }
        };

        yield {
            event: 'thread.message.delta',
            data: {
                delta: {
                    content: [{
                        type: 'text',
                        text: { value: ' reply:' }
                    }]
                }
            }
        };

        yield {
            event: 'thread.message.delta',
            data: {
                delta: {
                    content: [{
                        type: 'text',
                        text: { value: ' Received: ' }
                    }]
                }
            }
        };

        // Add partial user message content
        const mockUserMessage = 'User message content';
        const truncatedContent = mockUserMessage.length > 50
            ? mockUserMessage.substring(0, 50) + '...'
            : mockUserMessage;

        yield {
            event: 'thread.message.delta',
            data: {
                delta: {
                    content: [{
                        type: 'text',
                        text: { value: truncatedContent }
                    }]
                }
            }
        };

        yield {
            event: 'thread.run.completed',
            data: { id: 'mock_run_id', status: 'completed' }
        };
    }
}

class MockStreamChat {
    private apiKey: string;
    private secret?: string;
    private options?: any;

    constructor(apiKey: string, secret?: string, options?: any) {
        this.apiKey = apiKey;
        this.secret = secret;
        this.options = options;
    }

    async connectUser(user: any, token: any) {
        return {
            user: { id: user.id, name: user.name || 'Mock User' },
            me: { id: user.id }
        };
    }

    async disconnectUser() {
        return Promise.resolve();
    }

    channel(type: string, id: string) {
        return new MockChannel(type, id);
    }

    createToken(userId: string) {
        return `mock_token_${userId}`;
    }

    async upsertUser(user: any) {
        return {
            user: { ...user, created_at: new Date().toISOString() },
            users: { [user.id]: user },
            duration: '0ms'
        };
    }

    async deleteUser(userId: string, options?: any) {
        return {
            user: { id: userId },
            duration: '0ms'
        };
    }

    on() {
        return { unsubscribe: () => { } };
    }

    off() { }
}

class MockChannel {
    constructor(private type: string, private id: string) { }

    async watch() {
        return {
            channel: this,
            members: [],
            messages: []
        };
    }

    async addMembers(userIds: string[]) {
        return {
            members: userIds.map(id => ({ user_id: id }))
        };
    }

    async sendMessage(message: any) {
        const mockMessage = {
            id: `mock_message_${Date.now()}`,
            text: message.text || '',
            user: { id: 'mock_user' },
            created_at: new Date().toISOString(),
            ai_generated: message.ai_generated || false,
            cid: `${this.type}:${this.id}`,
            ...message
        };

        return {
            message: mockMessage
        };
    }

    async sendEvent(event: any) {
        console.log('Mock channel event:', event);
        return Promise.resolve();
    }

    on() { }
    off() { }
}

// Mock Tavily search function
export const performWebSearch = async (query: string): Promise<string> => {
    if (USE_MOCKS) {
        const mockResults = {
            query,
            answer: `Mock search answer for: ${query}`,
            results: [
                {
                    title: `Mock Result 1 for ${query}`,
                    url: `https://example.com/result1?q=${encodeURIComponent(query)}`,
                    content: `This is mock content for search result 1 about ${query}. It provides relevant information in a realistic format.`,
                    score: 0.95
                },
                {
                    title: `Mock Result 2 for ${query}`,
                    url: `https://example.com/result2?q=${encodeURIComponent(query)}`,
                    content: `This is mock content for search result 2 about ${query}. It offers additional context and details.`,
                    score: 0.89
                }
            ]
        };

        console.log(`Mock web search performed for: "${query}"`);
        return JSON.stringify(mockResults);
    } else {
        // Real Tavily implementation (moved from OpenAIResponseHandler)
        const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

        if (!TAVILY_API_KEY) {
            return JSON.stringify({
                error: "Web search is not available. API key not configured.",
            });
        }

        console.log(`Performing web search for: "${query}"`);

        try {
            const response = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${TAVILY_API_KEY}`,
                },
                body: JSON.stringify({
                    query: query,
                    search_depth: "advanced",
                    max_results: 5,
                    include_answer: true,
                    include_raw_content: false,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Tavily search failed for query "${query}":`, errorText);
                return JSON.stringify({
                    error: `Search failed with status: ${response.status}`,
                    details: errorText,
                });
            }

            const data = await response.json();
            console.log(`Tavily search successful for query "${query}"`);

            return JSON.stringify(data);
        } catch (error) {
            console.error(
                `An exception occurred during web search for "${query}":`,
                error
            );
            return JSON.stringify({
                error: "An exception occurred during the search.",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
};

// Export the appropriate implementations based on USE_MOCKS flag
export const createOpenAI = (apiKey: string): OpenAI => {
    if (USE_MOCKS) {
        console.log('Using Mock OpenAI client');
        return new MockOpenAI() as any;
    } else {
        return new OpenAI({ apiKey });
    }
};

export const createStreamChat = (apiKey: string, secret?: string, options?: any): StreamChat => {
    if (USE_MOCKS) {
        console.log('Using Mock StreamChat client');
        return new MockStreamChat(apiKey, secret, options) as any;
    } else {
        return new StreamChat(apiKey, secret, options);
    }
};

// Simple chat endpoint for testing mocks
export const handleSimpleChatRequest = async (message: string): Promise<{ text: string; timestamp: string }> => {
    if (USE_MOCKS) {
        const truncatedMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;
        return {
            text: `Mock reply: Received: ${truncatedMessage}`,
            timestamp: new Date().toISOString()
        };
    } else {
        // In real mode, this would integrate with actual OpenAI
        throw new Error('Real chat implementation not available without proper API keys');
    }
};