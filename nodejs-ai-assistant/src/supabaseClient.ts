import { createClient, SupabaseClient, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Database Types
export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_seen: string;
  is_online: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'messaging' | 'team' | 'direct';
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  member_count: number;
  is_private: boolean;
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  reply_to?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata: Record<string, any>;
}

export interface AIAgent {
  id: string;
  user_id: string;
  channel_id: string;
  status: 'active' | 'inactive' | 'connecting';
  agent_type: 'openai' | 'anthropic' | 'custom';
  created_at: string;
  last_interaction: string;
  metadata: Record<string, any>;
}

// Environment Variables
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error(
    "Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY"
  );
}

// Create clients
export const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// Supabase Chat Service Class
export class SupabaseChatService {
  private client: SupabaseClient;
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  // User Management
  async createProfile(userId: string, profileData: Partial<Profile>): Promise<Profile> {
    const { data, error } = await this.client
      .from('profiles')
      .insert({ id: userId, ...profileData })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await this.client
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Channel Management
  async createChannel(channelData: Omit<Channel, 'id' | 'created_at' | 'updated_at'>): Promise<Channel> {
    const { data, error } = await this.client
      .from('channels')
      .insert(channelData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getChannel(channelId: string): Promise<Channel | null> {
    const { data, error } = await this.client
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getUserChannels(userId: string): Promise<Channel[]> {
    const { data, error } = await this.client
      .from('channels')
      .select(`
        *,
        channel_members!inner(user_id)
      `)
      .eq('channel_members.user_id', userId)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Channel Membership
  async addChannelMember(channelId: string, userId: string, role: ChannelMember['role'] = 'member'): Promise<ChannelMember> {
    const { data, error } = await this.client
      .from('channel_members')
      .insert({ channel_id: channelId, user_id: userId, role })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getChannelMembers(channelId: string): Promise<(ChannelMember & { profiles: Profile })[]> {
    const { data, error } = await this.client
      .from('channel_members')
      .select(`
        *,
        profiles(*)
      `)
      .eq('channel_id', channelId);

    if (error) throw error;
    return data;
  }

  // Message Management
  async sendMessage(messageData: Omit<Message, 'id' | 'created_at' | 'updated_at'>): Promise<Message> {
    const { data, error } = await this.client
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getChannelMessages(channelId: string, limit: number = 50, before?: string): Promise<(Message & { profiles: Profile })[]> {
    let query = this.client
      .from('messages')
      .select(`
        *,
        profiles(*)
      `)
      .eq('channel_id', channelId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // AI Agent Management
  async createAIAgent(agentData: Omit<AIAgent, 'id' | 'created_at' | 'last_interaction'>): Promise<AIAgent> {
    const { data, error } = await this.client
      .from('ai_agents')
      .insert(agentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAIAgent(channelId: string): Promise<AIAgent | null> {
    const { data, error } = await this.client
      .from('ai_agents')
      .select('*')
      .eq('channel_id', channelId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateAIAgentStatus(channelId: string, status: AIAgent['status']): Promise<AIAgent> {
    const { data, error } = await this.client
      .from('ai_agents')
      .update({ status, last_interaction: new Date().toISOString() })
      .eq('channel_id', channelId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Real-time Subscriptions
  subscribeToChannel(channelId: string, callbacks: {
    onMessage?: (message: Message & { profiles: Profile }) => void;
    onMemberJoin?: (member: ChannelMember & { profiles: Profile }) => void;
    onMemberLeave?: (member: ChannelMember) => void;
  }): RealtimeChannel {
    const channel = this.client.channel(`channel-${channelId}`);

    if (callbacks.onMessage) {
      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      }, async (payload: any) => {
        // Fetch the complete message with profile data
        const { data } = await this.client
          .from('messages')
          .select(`
            *,
            profiles(*)
          `)
          .eq('id', payload.new.id)
          .single();
        
        if (data) {
          callbacks.onMessage!(data);
        }
      });
    }

    if (callbacks.onMemberJoin) {
      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'channel_members',
        filter: `channel_id=eq.${channelId}`
      }, async (payload) => {
        const { data } = await this.client
          .from('channel_members')
          .select(`
            *,
            profiles(*)
          `)
          .eq('id', payload.new.id)
          .single();
        
        if (data) {
          callbacks.onMemberJoin!(data);
        }
      });
    }

    channel.subscribe();
    this.realtimeChannels.set(channelId, channel);
    return channel;
  }

  unsubscribeFromChannel(channelId: string): void {
    const channel = this.realtimeChannels.get(channelId);
    if (channel) {
      this.client.removeChannel(channel);
      this.realtimeChannels.delete(channelId);
    }
  }

  // Authentication Helpers
  async createToken(userId: string): Promise<string> {
    // In Supabase, we use the built-in JWT tokens
    // This is handled by Supabase Auth automatically
    const { data, error } = await this.client.auth.admin.generateLink({
      type: 'magiclink',
      email: `${userId}@temp.com`, // This would be replaced with real email
    });

    if (error) throw error;
    return data.properties?.action_link || '';
  }
}

// Create service instances
export const chatService = new SupabaseChatService(supabaseClient);
export const adminChatService = new SupabaseChatService(supabaseAdmin);