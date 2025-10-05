# 🔑 API Keys Setup Guide

This guide explains how to enable real API integrations by replacing the mock system with actual API keys.

## 📋 Quick Setup

I've created `.env` files for both backend and frontend with placeholder values. Replace the placeholder values with your actual API keys:

- **Backend**: `nodejs-ai-assistant/.env`
- **Frontend**: `react-stream-ai-assistant/.env`

## 🔐 API Key Explanations

### 1. **Stream Chat API (Required)**
- **STREAM_API_KEY**: Public key for Stream Chat service
- **STREAM_API_SECRET**: Private key for server-side operations
- **Purpose**: Powers the real-time chat functionality
- **Where to get**: [getstream.io/chat](https://getstream.io/chat/)
- **Usage**: User authentication, channel management, message handling

### 2. **OpenAI API Key (Required)**  
- **OPENAI_API_KEY**: Secret key for OpenAI services
- **Purpose**: Powers the AI assistant responses
- **Where to get**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Usage**: GPT model interactions, AI-powered responses

### 3. **Tavily API Key (Optional)**
- **TAVILY_API_KEY**: Key for web search functionality  
- **Purpose**: Enables AI to search the web for current information
- **Where to get**: [tavily.com](https://tavily.com/)
- **Usage**: Real-time web search, fact-checking, current events

### 4. **Sentry DSN (Optional)**
- **SENTRY_DSN**: Data Source Name for error monitoring
- **Purpose**: Error tracking and performance monitoring
- **Where to get**: [sentry.io](https://sentry.io/)
- **Usage**: Production error monitoring, debugging, alerts

## 🚀 Running with Real APIs

### Step 1: Replace Placeholder Values
Edit the `.env` files and replace placeholder values with your actual API keys:

```bash
# Backend (.env in nodejs-ai-assistant/)
USE_MOCKS=false
STREAM_API_KEY=sk_stream_your_actual_key_here
STREAM_API_SECRET=your_stream_secret_here  
OPENAI_API_KEY=sk-your_openai_key_here
TAVILY_API_KEY=tvly-your_tavily_key_here  # optional
SENTRY_DSN=https://your_sentry_dsn_here   # optional
```

```bash
# Frontend (.env in react-stream-ai-assistant/)
VITE_STREAM_API_KEY=sk_stream_your_actual_key_here  # same as backend
VITE_SENTRY_DSN=https://your_frontend_sentry_dsn   # optional
```

### Step 2: Restart Services
```bash
# Terminal 1 - Backend
cd nodejs-ai-assistant
npm start

# Terminal 2 - Frontend  
cd react-stream-ai-assistant
npm run dev
```

### Step 3: Verify Real API Mode
```bash
# Check health endpoint - should show real API status
curl http://localhost:3000

# Look for:
# "mockMode": false
# "dependencies": {
#   "streamChat": {"status": "configured"},
#   "openAI": {"status": "configured"}
# }
```

## 🔒 Security Best Practices

### 1. **Never Commit API Keys**
- ✅ `.env` files are already in `.gitignore`
- ✅ Use `.env.template` files for reference
- ❌ Never commit actual keys to version control

### 2. **Environment Separation**
```bash
# Development
.env                    # Local development keys
.env.local             # Personal overrides

# Production
.env.production        # Production keys (on server only)
.env.staging           # Staging environment keys
```

### 3. **Key Rotation**
- Rotate API keys regularly (monthly/quarterly)
- Use different keys for development/staging/production
- Revoke unused or compromised keys immediately

### 4. **Access Control**
- Limit key permissions where possible
- Use read-only keys when write access isn't needed
- Monitor API usage for unusual activity

### 5. **Secure Storage Options**

#### For Development:
- Local `.env` files (already configured)
- Password managers (1Password, LastPass)
- Encrypted local storage

#### For Production:
- **Cloud Secrets**: AWS Secrets Manager, Azure Key Vault
- **Environment Variables**: Heroku Config Vars, Vercel Environment Variables
- **CI/CD Secrets**: GitHub Actions Secrets, GitLab CI Variables

## 📝 Environment Templates

### Backend Template (`nodejs-ai-assistant/.env.template`)
```bash
NODE_ENV=development
USE_MOCKS=false
STREAM_API_KEY=
STREAM_API_SECRET=
OPENAI_API_KEY=
TAVILY_API_KEY=
SENTRY_DSN=
LOG_LEVEL=info
PORT=3000
```

### Frontend Template (`react-stream-ai-assistant/.env.template`)
```bash
VITE_API_URL=http://localhost:3000
VITE_STREAM_API_KEY=
VITE_SENTRY_DSN=
VITE_ENV=development
```

## ⚠️ Important Notes

1. **Stream API Key**: Frontend and backend must use the **same** `STREAM_API_KEY`
2. **Never expose secrets**: Backend `.env` contains secrets, frontend only gets public keys
3. **API Costs**: Real APIs have usage costs - monitor your usage
4. **Rate Limits**: APIs have rate limits - implement proper error handling
5. **Testing**: Use separate keys for development/testing vs production

## 🔧 Troubleshooting

### Common Issues:

**"Invalid API Key" Errors:**
- Verify key format matches expected pattern
- Check for extra spaces or quotes around keys
- Ensure keys haven't expired

**"Mock mode still active":**
- Verify `USE_MOCKS=false` in backend `.env`
- Restart backend server after changing environment
- Check console logs for "Using Mock" messages

**Stream Chat connection issues:**
- Ensure STREAM_API_KEY matches between frontend/backend
- Verify STREAM_API_SECRET is set in backend only
- Check Stream Chat dashboard for app status

**High API costs:**
- Monitor usage in provider dashboards
- Implement rate limiting
- Set usage alerts and budgets
- Consider using cheaper models for development

## 📊 Monitoring Usage

After enabling real APIs, monitor your usage:

1. **OpenAI**: [platform.openai.com/usage](https://platform.openai.com/usage)
2. **Stream Chat**: Stream Dashboard → Usage
3. **Tavily**: Tavily Dashboard → API Usage
4. **Sentry**: Sentry Dashboard → Usage & Billing

---

**🎉 You're now ready to use real AI capabilities!**

Remember: Start with development/testing before moving to production, and always monitor your API usage and costs.