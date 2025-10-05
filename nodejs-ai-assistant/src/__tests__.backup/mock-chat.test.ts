import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { handleSimpleChatRequest } from '../services/externalClients';

// Create a test app with just the chat endpoint
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use(cors({ origin: '*' }));

    app.post('/api/chat', async (req, res) => {
        try {
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({
                    error: 'message is required',
                });
            }

            const response = await handleSimpleChatRequest(message);
            res.json(response);
        } catch (error) {
            console.error('Error handling chat request:', error);
            res.status(500).json({
                error: 'Failed to process chat request',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    return app;
};

describe('Mock Chat API', () => {
    let app: express.Application;

    beforeAll(() => {
        app = createTestApp();
    });

    test('should return mock response for chat message', async () => {
        const testMessage = 'hello, how are you?';

        const response = await request(app)
            .post('/api/chat')
            .send({ message: testMessage })
            .expect(200);

        expect(response.body).toHaveProperty('text');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body.text).toContain('Mock reply: Received:');
        expect(response.body.text).toContain(testMessage);
        expect(typeof response.body.timestamp).toBe('string');

        // Verify it's a valid ISO date string
        const date = new Date(response.body.timestamp);
        expect(date.toISOString()).toBe(response.body.timestamp);
    });

    test('should truncate long messages in mock response', async () => {
        const longMessage = 'a'.repeat(100); // 100 character message

        const response = await request(app)
            .post('/api/chat')
            .send({ message: longMessage })
            .expect(200);

        expect(response.body.text).toContain('Mock reply: Received:');
        // Should contain truncated message (50 chars + "...")
        const expectedTruncated = longMessage.substring(0, 50) + '...';
        expect(response.body.text).toContain(expectedTruncated);
    });

    test('should handle short messages without truncation', async () => {
        const shortMessage = 'hi';

        const response = await request(app)
            .post('/api/chat')
            .send({ message: shortMessage })
            .expect(200);

        expect(response.body.text).toContain('Mock reply: Received:');
        expect(response.body.text).toContain(shortMessage);
        expect(response.body.text).not.toContain('...');
    });

    test('should return error for missing message', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({})
            .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('message is required');
    });

    test('should return error for empty message', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({ message: '' })
            .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('message is required');
    });
});

describe('External Clients Mock Functions', () => {
    test('handleSimpleChatRequest should work directly', async () => {
        const testMessage = 'direct function test';

        const result = await handleSimpleChatRequest(testMessage);

        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('timestamp');
        expect(result.text).toContain('Mock reply: Received:');
        expect(result.text).toContain(testMessage);
    });
});