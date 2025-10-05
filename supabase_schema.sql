-- Supabase Database Schema for Chat Application
-- Run these SQL commands in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT FALSE
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Channels table
CREATE TABLE public.channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'messaging' CHECK (type IN ('messaging', 'team', 'direct')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  member_count INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT FALSE
);

-- Enable RLS on channels
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Channel members table
CREATE TABLE public.channel_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Enable RLS on channel_members
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  reply_to UUID REFERENCES public.messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- AI agents table
CREATE TABLE public.ai_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  channel_id UUID REFERENCES public.channels(id),
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'connecting')),
  agent_type TEXT DEFAULT 'openai' CHECK (agent_type IN ('openai', 'anthropic', 'custom')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on ai_agents
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_channel_members_channel_id ON public.channel_members(channel_id);
CREATE INDEX idx_channel_members_user_id ON public.channel_members(user_id);
CREATE INDEX idx_channels_created_at ON public.channels(created_at DESC);
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update channel's last_message_at
CREATE OR REPLACE FUNCTION update_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.channels 
    SET last_message_at = NEW.created_at
    WHERE id = NEW.channel_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update channel's last message time
CREATE TRIGGER update_channel_last_message_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_channel_last_message();

-- Row Level Security Policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Channels policies
CREATE POLICY "Channels are viewable by members" ON public.channels
    FOR SELECT USING (
        id IN (
            SELECT channel_id FROM public.channel_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create channels" ON public.channels
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Channel members policies
CREATE POLICY "Channel members are viewable by channel members" ON public.channel_members
    FOR SELECT USING (
        channel_id IN (
            SELECT channel_id FROM public.channel_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Channel admins can add members" ON public.channel_members
    FOR INSERT WITH CHECK (
        channel_id IN (
            SELECT channel_id FROM public.channel_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- Messages policies
CREATE POLICY "Messages are viewable by channel members" ON public.messages
    FOR SELECT USING (
        channel_id IN (
            SELECT channel_id FROM public.channel_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Channel members can insert messages" ON public.messages
    FOR INSERT WITH CHECK (
        channel_id IN (
            SELECT channel_id FROM public.channel_members 
            WHERE user_id = auth.uid()
        ) AND auth.uid() = user_id
    );

-- AI agents policies
CREATE POLICY "AI agents are viewable by channel members" ON public.ai_agents
    FOR SELECT USING (
        channel_id IN (
            SELECT channel_id FROM public.channel_members 
            WHERE user_id = auth.uid()
        )
    );

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;