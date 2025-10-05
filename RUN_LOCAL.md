# Local Development Setup with Mock Mode

This guide shows how to run the AI Chat App locally using mock implementations that don't require real API keys.

## Prerequisites

- Node.js 20 or higher
- npm

## Quick Start (8 commands)

1. **Clone and setup the repository**
   ```bash
   git clone https://github.com/hiteshchoudhary/ai-chat-app-with-agents-getstream.git
   cd ai-chat-app-with-agents-getstream
   ```

2. **Install backend dependencies**
   ```bash
   cd nodejs-ai-assistant
   npm ci
   ```

3. **Setup environment variables (backend)**
   ```bash
   # Copy the existing .env file (already configured for mock mode)
   # Or create manually:
   echo "USE_MOCKS=true" > .env
   echo "STREAM_API_KEY=dummy_stream_api_key" >> .env
   echo "STREAM_API_SECRET=dummy_stream_api_secret" >> .env
   echo "OPENAI_API_KEY=dummy_openai_api_key" >> .env
   echo "TAVILY_API_KEY=dummy_tavily_api_key" >> .env
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```

5. **Install frontend dependencies (in new terminal)**
   ```bash
   cd react-stream-ai-assistant
   npm ci
   ```

6. **Setup environment variables (frontend)**
   ```bash
   # Copy the existing .env file (already configured for mock mode)
   # Or create manually:
   echo "VITE_STREAM_API_KEY=dummy_stream_api_key" > .env
   echo "VITE_API_BASE_URL=http://localhost:3000" >> .env
   ```

7. **Start the frontend development server**
   ```bash
   npm run dev
   ```

8. **Test the mock endpoint**
   ```bash
   # Test the chat endpoint with PowerShell/CMD:
   Invoke-WebRequest -Uri "http://localhost:3000/api/chat" -Method POST -ContentType "application/json" -Body '{"message":"hello, how are you?"}'
   
   # Or with curl (if available):
   curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message":"hello, how are you?"}'
   ```

## Expected Responses

### Backend Server Status
When you access `http://localhost:3000/`, you should see:
```json
{
  "message": "AI Writing Assistant Server is running",
  "apiKey": "dummy_stream_api_key",
  "activeAgents": 0
}
```

### Mock Chat Response
When you POST to `http://localhost:3000/api/chat` with `{"message":"hello, how are you?"}`, you should see:
```json
{
  "text": "Mock reply: Received: hello, how are you?",
  "timestamp": "2025-09-21T12:39:42.135Z"
}
```

## Mock Features

When `USE_MOCKS=true` is set, the application uses mock implementations for:

- **OpenAI API**: Returns deterministic mock responses instead of calling the real OpenAI API
- **Stream Chat**: Uses mock chat client that simulates message sending and events
- **Tavily Search**: Returns mock search results instead of calling the real Tavily API

## Running Tests

To run the test suite that validates mock functionality:

```bash
cd nodejs-ai-assistant
npm test
```

## Switching to Real APIs

To use real APIs instead of mocks:

1. **Get API Keys**:
   - OpenAI API key from https://platform.openai.com/
   - Stream API key and secret from https://getstream.io/
   - Tavily API key from https://tavily.com/

2. **Update Environment Variables**:
   ```bash
   # In nodejs-ai-assistant/.env
   USE_MOCKS=false
   STREAM_API_KEY=your_real_stream_api_key
   STREAM_API_SECRET=your_real_stream_api_secret
   OPENAI_API_KEY=your_real_openai_api_key
   TAVILY_API_KEY=your_real_tavily_api_key
   
   # In react-stream-ai-assistant/.env
   VITE_STREAM_API_KEY=your_real_stream_api_key
   ```

3. **Restart the servers**

## Architecture

The mock system works through a wrapper layer in `nodejs-ai-assistant/src/services/externalClients.ts` that:

1. Checks the `USE_MOCKS` environment variable
2. Returns mock implementations when true
3. Returns real API clients when false
4. Provides deterministic responses for testing

This allows the same codebase to work in both development (with mocks) and production (with real APIs) without code changes.