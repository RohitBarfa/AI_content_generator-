# AI Chat App Deployment Guide

This guide covers deploying the AI Chat App to various platforms. The application consists of a backend (Node.js/Express) and frontend (React/Vite) that can be deployed separately or together.

## Prerequisites

Before deploying, ensure you have:
- [ ] GitHub repository with your code
- [ ] API keys for production services (if not using mock mode):
  - OpenAI API Key
  - Stream Chat API Key & Secret
  - Tavily API Key (optional)
  - Sentry DSN (optional)

## Environment Variables

### Backend (.env)
```bash
# Core Configuration
NODE_ENV=production
PORT=3000

# Mock Mode (set to false for production with real APIs)
USE_MOCKS=false

# Stream Chat Configuration
STREAM_API_KEY=your_stream_api_key_here
STREAM_API_SECRET=your_stream_api_secret_here

# AI Service Configuration  
OPENAI_API_KEY=your_openai_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here

# Observability (Optional)
SENTRY_DSN=your_sentry_dsn_here
LOG_LEVEL=info
```

### Frontend (.env)
```bash
# API Configuration
VITE_API_URL=https://your-backend-domain.com
VITE_STREAM_API_KEY=your_stream_api_key_here

# Observability (Optional)
VITE_SENTRY_DSN=your_frontend_sentry_dsn_here
```

---

## Platform Deployments

### 1. Vercel (Frontend Only - Recommended for Frontend)

**Step 1: Prepare Your Repository**
```bash
# Ensure your frontend is in a separate folder or use vercel.json to specify build settings
cd react-stream-ai-assistant
```

**Step 2: Deploy via Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" and import your repository
3. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `react-stream-ai-assistant`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

**Step 3: Set Environment Variables**
In Vercel dashboard → Settings → Environment Variables:
```
VITE_API_URL = https://your-backend-url.onrender.com
VITE_STREAM_API_KEY = your_stream_api_key
VITE_SENTRY_DSN = your_sentry_dsn (optional)
```

**Step 4: Deploy**
- Click "Deploy" - Vercel will build and deploy automatically
- Your app will be available at `https://your-app.vercel.app`

---

### 2. Render (Backend + Frontend)

**Backend Deployment on Render:**

**Step 1: Create Web Service**
1. Go to [render.com](https://render.com) and connect your GitHub
2. Click "New" → "Web Service"
3. Select your repository
4. Configure service:
   - **Name**: `ai-chat-backend`
   - **Environment**: Node
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `nodejs-ai-assistant`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

**Step 2: Set Environment Variables**
```
NODE_ENV = production
USE_MOCKS = false
STREAM_API_KEY = your_stream_api_key
STREAM_API_SECRET = your_stream_api_secret
OPENAI_API_KEY = your_openai_api_key
TAVILY_API_KEY = your_tavily_api_key
SENTRY_DSN = your_sentry_dsn
LOG_LEVEL = info
```

**Step 3: Advanced Settings**
- **Port**: `3000` (or use Render's default)
- **Health Check Path**: `/`

**Frontend Deployment on Render:**

**Step 1: Create Static Site**
1. Click "New" → "Static Site"
2. Select your repository
3. Configure:
   - **Name**: `ai-chat-frontend`
   - **Branch**: `main`
   - **Root Directory**: `react-stream-ai-assistant`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

**Step 2: Set Environment Variables**
```
VITE_API_URL = https://your-backend-service.onrender.com
VITE_STREAM_API_KEY = your_stream_api_key
VITE_SENTRY_DSN = your_frontend_sentry_dsn
```

---

### 3. Fly.io (Full Docker Deployment - Recommended for Full Stack)

**Prerequisites:**
- Install [flyctl CLI](https://fly.io/docs/getting-started/installing-flyctl/)
- Sign up for Fly.io account

**Step 1: Initialize Application**
```bash
# From project root
flyctl launch

# Follow prompts:
# - App name: ai-chat-app
# - Region: choose closest
# - Database: No (we're not using one)
# - Deploy now: No (we need to set secrets first)
```

**Step 2: Configure fly.toml**
```toml
app = "ai-chat-app"
primary_region = "ord"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3000"
  USE_MOCKS = "false"

[[services]]
  http_checks = []
  internal_port = 3000
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    restart_limit = 0
    timeout = "2s"
```

**Step 3: Set Secrets**
```bash
flyctl secrets set STREAM_API_KEY=your_stream_api_key
flyctl secrets set STREAM_API_SECRET=your_stream_api_secret
flyctl secrets set OPENAI_API_KEY=your_openai_api_key
flyctl secrets set TAVILY_API_KEY=your_tavily_api_key
flyctl secrets set SENTRY_DSN=your_sentry_dsn
```

**Step 4: Deploy**
```bash
flyctl deploy
```

**Step 5: Monitor**
```bash
flyctl status
flyctl logs
```

---

## GitHub Actions Secrets Setup

For CI/CD deployment, set these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

### Vercel Deployment
```
VERCEL_TOKEN = your_vercel_token
VERCEL_ORG_ID = your_org_id
VERCEL_PROJECT_ID = your_project_id
```

### Render Deployment
```
RENDER_API_KEY = your_render_api_key
RENDER_SERVICE_ID = your_service_id
```

### Fly.io Deployment
```
FLY_API_TOKEN = your_fly_api_token
```

### Docker Hub (if using)
```
DOCKERHUB_USERNAME = your_username
DOCKERHUB_TOKEN = your_access_token
```

### How to Get Tokens:

**Vercel Token:**
1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create new token with appropriate scope

**Render API Key:**
1. Go to [dashboard.render.com/account/api-keys](https://dashboard.render.com/account/api-keys)
2. Create new API key

**Fly.io Token:**
```bash
flyctl auth token
```

**Docker Hub Token:**
1. Go to [hub.docker.com/settings/security](https://hub.docker.com/settings/security)
2. Create new access token

---

## Production Checklist

### Before Deploying:
- [ ] Set `USE_MOCKS=false` in production environment
- [ ] Obtain all required API keys
- [ ] Test locally with real APIs
- [ ] Set up error monitoring (Sentry)
- [ ] Configure logging level appropriately
- [ ] Set up health monitoring
- [ ] Review security settings

### After Deploying:
- [ ] Test all endpoints
- [ ] Verify frontend connects to backend
- [ ] Check logs for errors
- [ ] Test agent creation/deletion
- [ ] Monitor performance metrics
- [ ] Set up alerting

### Security Considerations:
- [ ] Use HTTPS in production
- [ ] Set appropriate CORS origins
- [ ] Rotate API keys regularly
- [ ] Monitor for suspicious activity
- [ ] Set up rate limiting if needed
- [ ] Regular security updates

---

## Monitoring & Troubleshooting

### Health Checks
- Backend: `GET /` - Returns system status and dependency health
- Check for "healthy" status and dependency configurations

### Common Issues:

**502/503 Errors:**
- Check if backend is running: `curl https://your-backend/`
- Verify environment variables are set correctly
- Check logs for startup errors

**CORS Issues:**
- Ensure frontend URL is in CORS allowlist
- Check if API URL in frontend matches deployed backend

**API Connection Issues:**
- Verify API keys are correctly set
- Check network connectivity between services
- Review rate limiting and quotas

### Log Analysis:
```bash
# Render
render logs --service your-service-id

# Fly.io  
flyctl logs

# Vercel
vercel logs your-deployment-url
```

---

## Cost Optimization

### Free Tier Limits:
- **Vercel**: 100GB bandwidth, unlimited personal projects
- **Render**: 750 hours/month free tier
- **Fly.io**: 3 shared-cpu-1x VMs, 3GB total RAM

### Scaling Recommendations:
1. Start with free tiers for development/testing
2. Monitor resource usage and performance
3. Scale up based on actual usage patterns
4. Consider CDN for static assets
5. Implement caching where appropriate

---

## Support

For deployment issues:
1. Check platform-specific documentation
2. Review logs for error details
3. Verify environment variable configuration
4. Test locally with same configuration
5. Contact platform support if needed

Remember to never commit API keys or secrets to your repository!