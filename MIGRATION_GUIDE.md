# 🚀 Complete Migration Guide: Stream Chat to Supabase

This guide provides all the steps needed to migrate your AI Chat App from Stream Chat to Supabase.

## 📋 **Phase 1: Prerequisites**

### 1. **Create Supabase Project**
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details:
   - Name: `ai-chat-app`
   - Database Password: (generate strong password)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)
5. Note down:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon key: Found in Settings > API
   - Service role key: Found in Settings > API

### 2. **Setup Database Schema**
1. In Supabase Dashboard, go to SQL Editor
2. Copy and paste the contents of `supabase_schema.sql`
3. Click "Run" to create all tables and policies

## 📦 **Phase 2: Backend Migration**

### 1. **Install New Dependencies**
```bash
cd nodejs-ai-assistant
npm uninstall stream-chat
npm install @supabase/supabase-js@^2.45.4
```

### 2. **Update Environment Variables**
Replace your `.env` file content:
```bash
# Core Configuration
NODE_ENV=development
USE_MOCKS=false

# Supabase Configuration (Required)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AI Model Configuration (Keep existing)
OPENAI_API_KEY=your_existing_openai_key
AI_MODEL=meta-llama/llama-3.3-70b-instruct:free

# Tavily Search Configuration (Keep existing)
TAVILY_API_KEY=your_existing_tavily_key

# Observability Configuration (Keep existing)
SENTRY_DSN=your_existing_sentry_dsn
LOG_LEVEL=info

# Server Configuration
PORT=3000
```

### 3. **Replace Main Server File**
```bash
# Backup original
mv src/index.ts src/index-stream.ts.bak

# Use new Supabase version
mv src/index-supabase.ts src/index.ts
```

### 4. **Update Agent Creation**
Modify `src/agents/types.ts` to work with Supabase user IDs instead of Stream Chat users.

## 📱 **Phase 3: Frontend Migration**

### 1. **Install New Dependencies**
```bash
cd react-stream-ai-assistant
npm uninstall stream-chat stream-chat-react
npm install @supabase/supabase-js@^2.45.4
```

### 2. **Update Environment Variables**
Replace your `.env` file content:
```bash
# Backend API URL
VITE_API_BASE_URL=http://localhost:3000
VITE_BACKEND_URL=http://localhost:3000

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Development mode
VITE_DEV_MODE=true

# Sentry DSN for frontend error tracking (optional)
VITE_SENTRY_DSN=your_existing_sentry_dsn
```

### 3. **Replace Chat Provider**
```bash
# Backup original
mv src/providers/chat-provider.tsx src/providers/chat-provider-stream.tsx.bak

# Use new Supabase version
mv src/providers/supabase-chat-provider.tsx src/providers/chat-provider.tsx
```

### 4. **Update Main App Component**
You'll need to update `src/App.tsx` to use the new chat provider and remove Stream Chat dependencies.

### 5. **Update Chat Components**
The following components need to be rewritten to use Supabase instead of Stream Chat:
- `src/components/chat-interface.tsx`
- `src/components/chat-message.tsx`  
- `src/components/chat-input.tsx`
- `src/components/chat-sidebar.tsx`

## 🔧 **Phase 4: Component Updates**

### Key Changes Required:

1. **Remove Stream Chat Hooks:**
   - Replace `useChatContext()` with `useChat()`
   - Replace `useChannelStateContext()` with custom state
   - Replace `useChannelActionContext()` with custom actions

2. **Update Message Rendering:**
   - Use custom message components instead of Stream Chat's `MessageList`
   - Implement your own message formatting and rendering

3. **Real-time Updates:**
   - Replace Stream Chat's real-time with Supabase real-time subscriptions
   - Handle message updates through Supabase webhooks

## 🚀 **Phase 5: Testing and Deployment**

### 1. **Local Testing**
```bash
# Terminal 1: Start backend
cd nodejs-ai-assistant
npm run dev

# Terminal 2: Start frontend  
cd react-stream-ai-assistant
npm run dev
```

### 2. **Verify Functionality**
- [ ] User authentication works
- [ ] Channel creation works
- [ ] Message sending works
- [ ] Real-time message updates work
- [ ] AI agent integration works

### 3. **Production Deployment**
Update your deployment configurations to use the new Supabase environment variables.

## 🔍 **Phase 6: Data Migration (Optional)**

If you want to migrate existing Stream Chat data:

1. **Export Stream Chat Data:**
   - Use Stream Chat API to export channels, users, and messages
   - Save to JSON files

2. **Import to Supabase:**
   - Create migration scripts to import data into Supabase tables
   - Map Stream Chat user IDs to Supabase user IDs
   - Import channels, messages, and relationships

## ⚠️ **Important Notes**

### **Breaking Changes:**
- Authentication system completely different
- Real-time event structure different  
- Message format and metadata different
- User management approach different

### **Features You'll Lose:**
- Stream Chat's built-in moderation tools
- Advanced chat features (reactions, threads, etc.)
- Stream Chat's optimized performance for high-scale chat
- Pre-built UI components from stream-chat-react

### **Features You'll Gain:**
- Full control over your data
- PostgreSQL database flexibility
- Row Level Security (RLS) for fine-grained permissions
- Integrated backend (database + real-time + auth)
- Potentially lower costs at scale

## 💰 **Cost Comparison**

### **Stream Chat:**
- $99/month for Maker plan (up to 25,000 MAU)
- $499/month for Team plan (up to 100,000 MAU)

### **Supabase:**
- Free tier: 500MB database, 2GB bandwidth
- Pro: $25/month per project
- Team: $599/month per organization

## 🚨 **Rollback Plan**

If migration fails:
1. Restore backup files (`*.bak`)
2. Reinstall Stream Chat dependencies
3. Restore original environment variables
4. Restart services

## 📞 **Support**

If you need help during migration:
1. Check Supabase documentation: https://supabase.com/docs
2. Review migration logs for specific errors
3. Test each component individually
4. Consider gradual migration (keep both systems running temporarily)

---

**Estimated Migration Time:** 2-4 weeks depending on complexity and custom features needed.