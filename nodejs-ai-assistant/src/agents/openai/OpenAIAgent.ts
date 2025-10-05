import type { Channel, DefaultGenerics, Event, StreamChat } from "stream-chat";
import OpenAI from "openai";
import type { AIAgent } from "../types";

export class OpenAIAgent implements AIAgent {
  private openai?: OpenAI;
  private model: string;
  private conversationHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  private lastInteractionTs = Date.now();

  constructor(
    readonly chatClient: StreamChat,
    readonly channel: Channel
  ) {
    this.model = process.env.AI_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
  }

  dispose = async () => {
    this.chatClient.off("message.new", this.handleMessage);
    await this.chatClient.disconnectUser();
  };

  get user() {
    return this.chatClient.user;
  }

  getLastInteraction = (): number => this.lastInteractionTs;

  init = async () => {
    const apiKey = process.env.OPENAI_API_KEY as string | undefined;
    if (!apiKey) {
      throw new Error("OpenRouter API key is required");
    }



    // Configure OpenAI client to use OpenRouter
    this.openai = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Chat Assistant"
      },
      timeout: 20000
    });

    // Initialize conversation with system prompt
    this.conversationHistory = [{
      role: "system",
      content: this.getWritingAssistantPrompt()
    }];

    this.chatClient.on("message.new", this.handleMessage);
  };

  private getWritingAssistantPrompt = (context?: string): string => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return `You are an expert AI Writing Assistant. Your primary purpose is to be a collaborative writing partner.

**Your Core Capabilities:**
- Content Creation, Improvement, Style Adaptation, Brainstorming, and Writing Coaching.
- **Current Date**: Today's date is ${currentDate}. Please use this for any time-sensitive queries.

**Response Format:**
- Be direct and production-ready.
- Use clear formatting.
- Never begin responses with phrases like "Here's the edit:", "Here are the changes:", or similar introductory statements.
- Provide responses directly and professionally without unnecessary preambles.

**Writing Context**: ${context || "General writing assistance."}

Your goal is to provide accurate, current, and helpful written content.`;
  };

  private handleMessage = async (e: Event<DefaultGenerics>) => {
    if (!this.openai) {

      return;
    }

    if (!e.message || e.message.ai_generated) {
      return;
    }

    const message = e.message.text;
    if (!message) return;

    this.lastInteractionTs = Date.now();

    // Add user message to conversation history
    this.conversationHistory.push({
      role: "user",
      content: message
    });

    // Create an initial empty message
    const { message: channelMessage } = await this.channel.sendMessage({
      text: "",
      ai_generated: true,
    });

    // Show thinking indicator
    await this.channel.sendEvent({
      type: "ai_indicator.update",
      ai_state: "AI_STATE_THINKING",
      cid: channelMessage.cid,
      message_id: channelMessage.id,
    });

    try {

      // Make streaming chat completion request
      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: this.conversationHistory,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      });

      let fullResponse = "";
      let lastUpdateTime = Date.now();
      const updateInterval = 2000; // Update every 2 seconds to avoid rate limits

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;

          // Update message periodically to show streaming effect
          const now = Date.now();
          if (now - lastUpdateTime > updateInterval) {
            this.chatClient.partialUpdateMessage(channelMessage.id, {
              set: { text: fullResponse },
            });
            lastUpdateTime = now;
          }
        }
      }

      // Final update with complete response
      this.chatClient.partialUpdateMessage(channelMessage.id, {
        set: { text: fullResponse },
      });

      // Add assistant response to conversation history
      this.conversationHistory.push({
        role: "assistant",
        content: fullResponse
      });

      // Keep conversation history manageable (last 10 exchanges)
      if (this.conversationHistory.length > 21) { // 1 system + 20 messages
        this.conversationHistory = [
          this.conversationHistory[0], // Keep system message
          ...this.conversationHistory.slice(-20) // Keep last 20 messages
        ];
      }

      // Show completed indicator
      await this.channel.sendEvent({
        type: "ai_indicator.clear",
        cid: channelMessage.cid,
        message_id: channelMessage.id,
      });

    } catch (error) {

      let errorMessage = "I'm sorry, I encountered an error while processing your request.";

      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = "Authentication failed. Please check your OpenRouter API key.";
        } else if (error.message.includes('429')) {
          errorMessage = "Rate limit exceeded. Please try again in a moment.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        }
      }

      this.chatClient.partialUpdateMessage(channelMessage.id, {
        set: { text: errorMessage },
      });

      // Clear any indicators
      await this.channel.sendEvent({
        type: "ai_indicator.clear",
        cid: channelMessage.cid,
        message_id: channelMessage.id,
      });
    }
  };
}
