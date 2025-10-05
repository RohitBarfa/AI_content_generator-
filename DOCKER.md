# Docker Setup for AI Chat App

This document provides instructions for building and running the AI Chat App using Docker containers.

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 3000 and 5173 available

### Build and Run with Docker Compose

```bash
# Build and start all services
docker compose up --build --detach

# View logs
docker compose logs --tail=200

# Check container status
docker compose ps

# Stop services
docker compose down

# Stop and remove everything (containers, networks, volumes)
docker compose down --volumes --remove-orphans
```

## Manual Docker Commands

If you prefer to build and run containers individually:

### Backend

```bash
# Build backend image
cd nodejs-ai-assistant
docker build -t ai-chat-backend .

# Run backend container
docker run -d \
  --name ai-chat-backend \
  -p 3000:3000 \
  --env-file .env \
  -e NODE_ENV=production \
  ai-chat-backend

# View logs
docker logs ai-chat-backend

# Stop and remove
docker stop ai-chat-backend
docker rm ai-chat-backend
```

### Frontend

```bash
# Build frontend image
cd react-stream-ai-assistant
docker build -t ai-chat-frontend .

# Run frontend container
docker run -d \
  --name ai-chat-frontend \
  -p 5173:80 \
  --env-file .env \
  -e NODE_ENV=production \
  ai-chat-frontend

# View logs
docker logs ai-chat-frontend

# Stop and remove
docker stop ai-chat-frontend
docker rm ai-chat-frontend
```

## Development Mode

For development with live reload, use the override file:

```bash
# Start in development mode (uses docker-compose.override.yml automatically)
docker compose -f docker-compose.yml -f docker-compose.override.yml up --build

# Or rename docker-compose.override.yml to enable it by default
docker compose up --build
```

## Environment Variables and Secrets

### Using .env files (Current Setup)
The docker-compose.yml references `.env` files in each service directory:
- `nodejs-ai-assistant/.env`
- `react-stream-ai-assistant/.env`

### Using Docker Secrets (Production Recommended)

For production deployments, use Docker secrets instead of .env files:

```yaml
# docker-compose.prod.yml example
version: '3.8'

services:
  backend:
    # ... other config
    secrets:
      - stream_api_key
      - stream_api_secret
      - openai_api_key
      - tavily_api_key
    environment:
      - STREAM_API_KEY_FILE=/run/secrets/stream_api_key
      - STREAM_API_SECRET_FILE=/run/secrets/stream_api_secret
      - OPENAI_API_KEY_FILE=/run/secrets/openai_api_key
      - TAVILY_API_KEY_FILE=/run/secrets/tavily_api_key

secrets:
  stream_api_key:
    file: ./secrets/stream_api_key.txt
  stream_api_secret:
    file: ./secrets/stream_api_secret.txt
  openai_api_key:
    file: ./secrets/openai_api_key.txt
  tavily_api_key:
    file: ./secrets/tavily_api_key.txt
```

### Using Environment Variables

```bash
# Pass environment variables directly
docker run -d \
  --name ai-chat-backend \
  -p 3000:3000 \
  -e USE_MOCKS=true \
  -e STREAM_API_KEY=your_key_here \
  -e STREAM_API_SECRET=your_secret_here \
  -e OPENAI_API_KEY=your_openai_key \
  -e TAVILY_API_KEY=your_tavily_key \
  ai-chat-backend
```

## Testing Endpoints

Once containers are running:

```bash
# Test backend health
curl -sS http://localhost:3000/

# Test backend chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello, how are you?"}'

# Test frontend (should return HTML)
curl -sS http://localhost:5173/

# Test frontend health
curl -sS http://localhost:5173/health
```

## Container Management

### Viewing Logs
```bash
# All services
docker compose logs

# Specific service
docker compose logs backend
docker compose logs frontend

# Follow logs
docker compose logs -f

# Last N lines
docker compose logs --tail=50
```

### Rebuilding
```bash
# Rebuild specific service
docker compose build backend
docker compose build frontend

# Rebuild and restart
docker compose up --build -d

# Force rebuild (no cache)
docker compose build --no-cache
```

### Cleanup
```bash
# Stop services
docker compose stop

# Remove containers but keep volumes
docker compose down

# Remove everything including volumes
docker compose down --volumes

# Remove unused Docker resources
docker system prune -a
```

## Production Deployment

### Multi-stage Production Build
Both Dockerfiles use multi-stage builds:
- **Builder stage**: Installs dependencies and builds the application
- **Runtime stage**: Minimal production image with only necessary files

### Security Features
- Non-root user execution
- Minimal base images (Alpine Linux)
- Security headers in nginx
- Health checks for both services
- Proper signal handling with dumb-init

### Performance Optimizations
- Gzip compression enabled
- Static asset caching
- Optimized nginx configuration
- npm cache cleaning in production builds

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml if 3000 or 5173 are in use
2. **Memory issues**: Ensure Docker has at least 4GB RAM allocated
3. **Build failures**: Check that .env files exist and contain valid values
4. **Network issues**: Services communicate via the `ai-chat-network` bridge

### Debug Mode

To debug containers:

```bash
# Run backend in interactive mode
docker run -it --rm ai-chat-backend sh

# Execute commands in running container
docker exec -it ai-chat-backend sh

# Check container resource usage
docker stats
```

### Log Locations

- Container logs: `docker logs <container_name>`
- Application logs: Available via Docker logs (stdout/stderr)
- nginx logs: Available via Docker logs for frontend container