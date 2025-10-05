import cors from "cors";
import "dotenv/config";
import express from "express";
import { createAgent } from "./agents/createAgent";
import { AgentPlatform, AIAgent } from "./agents/types";
import { adminChatService, chatService } from "./supabaseClient";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Map to store the AI Agent instances
// [channel_id string]: AI Agent
const aiAgentCache = new Map<string, AIAgent>();
const pendingAiAgents = new Set<string>();

// Inactivity threshold for cleanup (8 hours)
const inactivityThreshold = 480 * 60 * 1000;

// Periodically check for inactive AI agents and dispose of them
setInterval(async () => {
  const now = Date.now();
  for (const [channelId, aiAgent] of aiAgentCache) {
    if (now - aiAgent.getLastInteraction() > inactivityThreshold) {
      console.log(`Disposing AI Agent due to inactivity: ${channelId}`);
      await disposeAiAgent(aiAgent);
      aiAgentCache.delete(channelId);
    }
  }
}, 5000);

app.get("/", async (req, res) => {
  try {
    // Test Supabase connection by trying to get profile count
    const testProfile = await chatService.getProfile('test-connection');
    
    res.json({
      message: "AI Writing Assistant Server is running",
      status: "healthy",
      environment: process.env.NODE_ENV || "development",
      database: "connected",
      activeAgents: aiAgentCache.size,
      dependencies: {
        supabase: { status: "connected", details: "Supabase client initialized" },
        openAI: { status: process.env.OPENAI_API_KEY ? "configured" : "missing", details: process.env.OPENAI_API_KEY ? "API key set" : "API key not configured" },
        tavily: { status: process.env.TAVILY_API_KEY ? "configured" : "missing", details: process.env.TAVILY_API_KEY ? "API key set" : "API key not configured" }
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Server health check failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Auth endpoint - Create or get user profile
 */
app.post("/auth", async (req, res) => {
  try {
    const { userId, userData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Check if profile exists
    let profile = await chatService.getProfile(userId);
    
    if (!profile) {
      // Create new profile
      profile = await chatService.createProfile(userId, {
        username: userData?.username || userData?.name || `user_${userId.substring(0, 8)}`,
        full_name: userData?.name || userData?.full_name,
        avatar_url: userData?.avatar_url || userData?.image,
        is_online: true
      });
    } else {
      // Update last seen
      profile = await chatService.updateProfile(userId, {
        last_seen: new Date().toISOString(),
        is_online: true
      });
    }

    res.json({ 
      success: true,
      profile: profile
    });
  } catch (error) {
    console.error("Error in auth endpoint:", error);
    res.status(500).json({
      error: "Authentication failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Create or join a channel
 */
app.post("/channels", async (req, res) => {
  try {
    const { userId, channelName, channelType = 'messaging' } = req.body;

    if (!userId || !channelName) {
      return res.status(400).json({ error: "userId and channelName are required" });
    }

    // Create channel
    const channel = await chatService.createChannel({
      name: channelName,
      type: channelType,
      created_by: userId,
      member_count: 1,
      is_private: false
    });

    // Add creator as admin
    await chatService.addChannelMember(channel.id, userId, 'admin');

    res.json({ 
      success: true,
      channel: channel
    });
  } catch (error) {
    console.error("Error creating channel:", error);
    res.status(500).json({
      error: "Failed to create channel",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Get user's channels
 */
app.get("/channels/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const channels = await chatService.getUserChannels(userId);

    res.json({ 
      success: true,
      channels: channels
    });
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({
      error: "Failed to fetch channels",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Send a message
 */
app.post("/messages", async (req, res) => {
  try {
    const { channelId, userId, content, messageType = 'text' } = req.body;

    if (!channelId || !userId || !content) {
      return res.status(400).json({ error: "channelId, userId, and content are required" });
    }

    const message = await chatService.sendMessage({
      channel_id: channelId,
      user_id: userId,
      content: content,
      message_type: messageType,
      metadata: {}
    });

    res.json({ 
      success: true,
      message: message
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      error: "Failed to send message",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Get channel messages
 */
app.get("/messages/:channelId", async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = '50', before } = req.query;

    const messages = await chatService.getChannelMessages(
      channelId, 
      parseInt(limit as string), 
      before as string
    );

    res.json({ 
      success: true,
      messages: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      error: "Failed to fetch messages",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Handle the request to start the AI Agent
 */
app.post("/start-ai-agent", async (req, res) => {
  const { channel_id, channel_type = "messaging" } = req.body;
  console.log(`[API] /start-ai-agent called for channel: ${channel_id}`);

  if (!channel_id) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const user_id = `ai-bot-${channel_id.replace(/[!-]/g, "")}`;

  try {
    // Prevent multiple agents from being created for the same channel simultaneously
    if (!aiAgentCache.has(channel_id) && !pendingAiAgents.has(channel_id)) {
      console.log(`[API] Creating new agent for ${user_id}`);
      pendingAiAgents.add(channel_id);

      // Create AI bot profile in Supabase
      await chatService.createProfile(user_id, {
        username: user_id,
        full_name: "AI Writing Assistant",
        is_online: true
      });

      // Add AI bot to the channel
      await chatService.addChannelMember(channel_id, user_id, 'member');

      // Create AI agent record
      await adminChatService.createAIAgent({
        user_id: user_id,
        channel_id: channel_id,
        status: 'connecting',
        agent_type: 'openai',
        metadata: {}
      });

      const agent = await createAgent(
        user_id,
        AgentPlatform.OPENAI,
        channel_type,
        channel_id
      );

      // Add timeout wrapper for agent initialization
      console.log(`[API] Initializing agent for ${user_id}...`);
      const initTimeout = 30000; // 30 seconds timeout

      await Promise.race([
        agent.init(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Agent initialization timeout after ${initTimeout}ms`)), initTimeout)
        )
      ]);

      console.log(`[API] Agent initialized successfully for ${user_id}`);

      // Update AI agent status
      await adminChatService.updateAIAgentStatus(channel_id, 'active');

      // Final check to prevent race conditions
      if (aiAgentCache.has(channel_id)) {
        await agent.dispose();
      } else {
        aiAgentCache.set(channel_id, agent);
      }
    } else {
      console.log(`AI Agent ${channel_id} already started or is pending.`);
    }

    res.json({ message: "AI Agent started", data: [] });
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Failed to start AI Agent:", errorMessage);

    // Update status to inactive on error
    try {
      await adminChatService.updateAIAgentStatus(channel_id, 'inactive');
    } catch (updateError) {
      console.error("Failed to update AI agent status:", updateError);
    }

    // Provide more specific error messages
    if (errorMessage.includes('timeout')) {
      res.status(408).json({
        error: "AI Agent initialization timeout",
        reason: "The AI service took too long to respond. Please check your API keys and try again.",
        details: errorMessage
      });
    } else if (errorMessage.includes('API key')) {
      res.status(401).json({
        error: "Authentication failed",
        reason: "Invalid or missing API key. Please check your OpenAI API key configuration.",
        details: errorMessage
      });
    } else {
      res.status(500).json({
        error: "Failed to start AI Agent",
        reason: errorMessage
      });
    }
  } finally {
    pendingAiAgents.delete(channel_id);
  }
});

/**
 * Handle the request to stop the AI Agent
 */
app.post("/stop-ai-agent", async (req, res) => {
  const { channel_id } = req.body;
  console.log(`[API] /stop-ai-agent called for channel: ${channel_id}`);
  
  try {
    const aiAgent = aiAgentCache.get(channel_id);
    if (aiAgent) {
      console.log(`[API] Disposing agent for channel: ${channel_id}`);
      await disposeAiAgent(aiAgent);
      aiAgentCache.delete(channel_id);
    } else {
      console.log(`[API] Agent for channel ${channel_id} not found in cache.`);
    }

    // Update status in Supabase
    try {
      await adminChatService.updateAIAgentStatus(channel_id, 'inactive');
    } catch (updateError) {
      console.error("Failed to update AI agent status:", updateError);
    }

    res.json({ message: "AI Agent stopped", data: [] });
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Failed to stop AI Agent", errorMessage);
    res.status(500).json({ 
      error: "Failed to stop AI Agent", 
      reason: errorMessage 
    });
  }
});

/**
 * Get AI agent status
 */
app.get("/agent-status", async (req, res) => {
  const { channel_id } = req.query;
  if (!channel_id || typeof channel_id !== "string") {
    return res.status(400).json({ error: "Missing channel_id" });
  }

  console.log(`[API] /agent-status called for channel: ${channel_id}`);

  try {
    // Check local cache first
    if (aiAgentCache.has(channel_id)) {
      console.log(`[API] Status for ${channel_id}: connected (from cache)`);
      return res.json({ status: "connected" });
    }

    if (pendingAiAgents.has(channel_id)) {
      console.log(`[API] Status for ${channel_id}: connecting (from cache)`);
      return res.json({ status: "connecting" });
    }

    // Check Supabase database
    const aiAgent = await adminChatService.getAIAgent(channel_id);
    if (aiAgent) {
      console.log(`[API] Status for ${channel_id}: ${aiAgent.status} (from database)`);
      res.json({ status: aiAgent.status });
    } else {
      console.log(`[API] Status for ${channel_id}: disconnected`);
      res.json({ status: "disconnected" });
    }
  } catch (error) {
    console.error("Error checking agent status:", error);
    res.status(500).json({ 
      error: "Failed to check agent status",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Legacy token endpoint for compatibility (now using Supabase Auth)
app.post("/token", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }

    // In Supabase, we would typically use the built-in auth system
    // For compatibility, we'll return a simple token
    const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64');

    res.json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({
      error: "Failed to generate token",
    });
  }
});

async function disposeAiAgent(aiAgent: AIAgent) {
  await aiAgent.dispose();
  
  if (aiAgent.user) {
    // In Supabase, we might want to mark the AI user as offline instead of deleting
    try {
      await chatService.updateProfile(aiAgent.user.id, {
        is_online: false,
        last_seen: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to update AI agent profile:", error);
    }
  }
}

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log("Using Supabase for real-time chat functionality");
});