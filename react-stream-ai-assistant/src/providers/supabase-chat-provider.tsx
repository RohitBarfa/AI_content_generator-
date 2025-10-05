import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Types
interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_seen: string;
  is_online: boolean;
}

interface Channel {
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

interface Message {
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
  profiles?: Profile;
}

interface ChatContextType {
  supabase: SupabaseClient;
  user: Profile | null;
  currentChannel: Channel | null;
  channels: Channel[];
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  signIn: (userId: string, userData?: any) => Promise<void>;
  signOut: () => Promise<void>;
  createChannel: (name: string, type?: Channel['type']) => Promise<Channel>;
  selectChannel: (channelId: string) => Promise<void>;
  sendMessage: (content: string, type?: Message['message_type']) => Promise<void>;
  loadMessages: (channelId: string, before?: string) => Promise<void>;
  
  // Real-time subscriptions
  subscribeToChannel: (channelId: string) => void;
  unsubscribeFromChannel: (channelId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Provider component
export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeChannels] = useState<Map<string, RealtimeChannel>>(new Map());

  const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // Sign in user
  const signIn = async (userId: string, userData?: any) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call backend auth endpoint
      const response = await fetch(`${backendUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, userData }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const { profile } = await response.json();
      setUser(profile);

      // Load user's channels
      await loadUserChannels(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Unsubscribe from all channels
      realtimeChannels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      realtimeChannels.clear();

      // Update user status to offline
      if (user) {
        await fetch(`${backendUrl}/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId: user.id, 
            userData: { is_online: false }
          }),
        });
      }

      setUser(null);
      setCurrentChannel(null);
      setChannels([]);
      setMessages([]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user's channels
  const loadUserChannels = async (userId: string) => {
    try {
      const response = await fetch(`${backendUrl}/channels/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to load channels: ${response.statusText}`);
      }
      const { channels: userChannels } = await response.json();
      setChannels(userChannels);
    } catch (err) {
      console.error('Error loading channels:', err);
      setError(err instanceof Error ? err.message : 'Failed to load channels');
    }
  };

  // Create new channel
  const createChannel = async (name: string, type: Channel['type'] = 'messaging'): Promise<Channel> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      const response = await fetch(`${backendUrl}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          channelName: name,
          channelType: type,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create channel: ${response.statusText}`);
      }

      const { channel } = await response.json();
      setChannels(prev => [channel, ...prev]);
      return channel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create channel';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Select and load channel
  const selectChannel = async (channelId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Find channel in our list
      const channel = channels.find(c => c.id === channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      setCurrentChannel(channel);
      await loadMessages(channelId);
      subscribeToChannel(channelId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select channel';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load messages for a channel
  const loadMessages = async (channelId: string, before?: string) => {
    try {
      const url = new URL(`${backendUrl}/messages/${channelId}`);
      if (before) url.searchParams.set('before', before);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`);
      }

      const { messages: channelMessages } = await response.json();
      
      if (before) {
        // Prepend older messages
        setMessages(prev => [...channelMessages, ...prev]);
      } else {
        // Replace all messages
        setMessages(channelMessages);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  };

  // Send message
  const sendMessage = async (content: string, type: Message['message_type'] = 'text') => {
    if (!user || !currentChannel) throw new Error('User or channel not available');

    try {
      const response = await fetch(`${backendUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: currentChannel.id,
          userId: user.id,
          content,
          messageType: type,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      // Message will be added via real-time subscription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    }
  };

  // Subscribe to real-time updates for a channel
  const subscribeToChannel = (channelId: string) => {
    // Unsubscribe from previous channel if any
    realtimeChannels.forEach((channel, id) => {
      if (id !== channelId) {
        supabase.removeChannel(channel);
        realtimeChannels.delete(id);
      }
    });

    // Don't resubscribe if already subscribed
    if (realtimeChannels.has(channelId)) return;

    const channel = supabase
      .channel(`channel-${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      }, (payload: any) => {
        // Add new message to the list
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    realtimeChannels.set(channelId, channel);
  };

  // Unsubscribe from channel
  const unsubscribeFromChannel = (channelId: string) => {
    const channel = realtimeChannels.get(channelId);
    if (channel) {
      supabase.removeChannel(channel);
      realtimeChannels.delete(channelId);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      realtimeChannels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      realtimeChannels.clear();
    };
  }, []);

  const value: ChatContextType = {
    supabase,
    user,
    currentChannel,
    channels,
    messages,
    isLoading,
    error,
    signIn,
    signOut,
    createChannel,
    selectChannel,
    sendMessage,
    loadMessages,
    subscribeToChannel,
    unsubscribeFromChannel,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook to use chat context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export type { Profile, Channel, Message, ChatContextType };