import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Create a test app with just the health/status endpoints
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use(cors({ origin: '*' }));

    // Root health endpoint
    app.get('/', (req, res) => {
        res.json({
            message: 'AI Writing Assistant Server is running',
            apiKey: process.env.STREAM_API_KEY || 'dummy_stream_api_key',
            activeAgents: 0,
        });
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            env: process.env.NODE_ENV || 'test'
        });
    });

    return app;
};

describe('Health Endpoints', () => {
    let app: express.Application;

    beforeAll(() => {
        app = createTestApp();
    });

    describe('GET /', () => {
        test('should return server status', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('apiKey');
            expect(response.body).toHaveProperty('activeAgents');
            expect(response.body.message).toBe('AI Writing Assistant Server is running');
            expect(typeof response.body.activeAgents).toBe('number');
        });

        test('should include API key in response', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.body.apiKey).toBeDefined();
            expect(typeof response.body.apiKey).toBe('string');
        });
    });

    describe('GET /health', () => {
        test('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('env');
            expect(response.body.status).toBe('healthy');
        });

        test('should return valid timestamp', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            const timestamp = response.body.timestamp;
            expect(typeof timestamp).toBe('string');

            // Verify it's a valid ISO date string
            const date = new Date(timestamp);
            expect(date.toISOString()).toBe(timestamp);
        });

        test('should return uptime as number', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(typeof response.body.uptime).toBe('number');
            expect(response.body.uptime).toBeGreaterThanOrEqual(0);
        });
    });
});