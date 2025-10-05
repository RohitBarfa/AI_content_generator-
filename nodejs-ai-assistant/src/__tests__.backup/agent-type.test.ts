import { AgentPlatform } from '../agents/types';
import { createAgent } from '../agents/createAgent';

describe('AgentPlatform Types', () => {
    test('should have defined platform values', () => {
        expect(AgentPlatform.OPENAI).toBe('openai');
        expect(AgentPlatform.WRITING_ASSISTANT).toBe('writing_assistant');
    });

    test('should contain all expected platforms', () => {
        const platforms = Object.values(AgentPlatform);
        expect(platforms).toContain('openai');
        expect(platforms).toContain('writing_assistant');
        expect(platforms).toHaveLength(2);
    });

    test('should have consistent enum keys and values', () => {
        expect(Object.keys(AgentPlatform)).toEqual(['OPENAI', 'WRITING_ASSISTANT']);
        expect(Object.values(AgentPlatform)).toEqual(['openai', 'writing_assistant']);
    });
});

describe('createAgent Function', () => {
    beforeEach(() => {
        // Ensure we're in mock mode for tests
        process.env.USE_MOCKS = 'true';
    });

    test('should accept valid AgentPlatform values', async () => {
        // Test that createAgent accepts the enum values without throwing
        expect(() => {
            createAgent('test-user', AgentPlatform.OPENAI, 'messaging', 'test-channel');
        }).not.toThrow();

        expect(() => {
            createAgent('test-user', AgentPlatform.WRITING_ASSISTANT, 'messaging', 'test-channel');
        }).not.toThrow();
    });

    test('should reject invalid platform values', async () => {
        // @ts-expect-error - Testing invalid platform value
        await expect(createAgent('test-user', 'invalid-platform', 'messaging', 'test-channel'))
            .rejects.toThrow('Unsupported agent platform: invalid-platform');
    });

    test('should create agent with OPENAI platform', async () => {
        const agent = await createAgent('test-user-openai', AgentPlatform.OPENAI, 'messaging', 'test-channel-openai');

        expect(agent).toBeDefined();
        expect(typeof agent.init).toBe('function');
        expect(typeof agent.dispose).toBe('function');
        expect(typeof agent.getLastInteraction).toBe('function');

        // Clean up
        await agent.dispose();
    });

    test('should create agent with WRITING_ASSISTANT platform', async () => {
        const agent = await createAgent('test-user-writing', AgentPlatform.WRITING_ASSISTANT, 'messaging', 'test-channel-writing');

        expect(agent).toBeDefined();
        expect(typeof agent.init).toBe('function');
        expect(typeof agent.dispose).toBe('function');
        expect(typeof agent.getLastInteraction).toBe('function');

        // Clean up
        await agent.dispose();
    });

    test('should return same agent type for both platforms in mock mode', async () => {
        const openaiAgent = await createAgent('user1', AgentPlatform.OPENAI, 'messaging', 'channel1');
        const writingAgent = await createAgent('user2', AgentPlatform.WRITING_ASSISTANT, 'messaging', 'channel2');

        // In mock mode, both should return OpenAIAgent instances
        expect(openaiAgent.constructor.name).toBe('OpenAIAgent');
        expect(writingAgent.constructor.name).toBe('OpenAIAgent');

        // Clean up
        await openaiAgent.dispose();
        await writingAgent.dispose();
    });
});