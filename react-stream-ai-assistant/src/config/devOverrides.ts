// Development overrides for mock mode

// @ts-ignore
export const API_BASE = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3000';

// @ts-ignore
export const IS_DEV_MODE = import.meta.env?.DEV;

// @ts-ignore
export const STREAM_API_KEY = import.meta.env?.VITE_STREAM_API_KEY || 'dummy_stream_api_key';

// Mock API client for development
export const mockApiClient = {
    async chat(message: string) {
        try {
            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Mock API client error:', error);
            throw error;
        }
    },

    async getServerStatus() {
        try {
            const response = await fetch(`${API_BASE}/`);
            return await response.json();
        } catch (error) {
            console.error('Server status check failed:', error);
            throw error;
        }
    }
};

export default {
    API_BASE,
    IS_DEV_MODE,
    STREAM_API_KEY,
    mockApiClient
};