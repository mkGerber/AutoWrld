-- Create group_chats table
CREATE TABLE IF NOT EXISTS group_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_chat_members table
CREATE TABLE IF NOT EXISTS group_chat_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_chat_id, user_id)
);

-- Create group_chat_messages table
CREATE TABLE IF NOT EXISTS group_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_chat_members_group_chat_id ON group_chat_members(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_user_id ON group_chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_group_chat_id ON group_chat_messages(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_sender_id ON group_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_created_at ON group_chat_messages(created_at);

-- Enable RLS
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for the tables
ALTER PUBLICATION supabase_realtime ADD TABLE group_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE group_chat_members;

-- Create a function to check if a user is a member of a group
CREATE OR REPLACE FUNCTION check_group_membership(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM group_chat_members 
        WHERE group_chat_id = p_group_id 
        AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view group chats they are members of" ON group_chats;
DROP POLICY IF EXISTS "Users can create group chats" ON group_chats;
DROP POLICY IF EXISTS "Users can update their own group chats" ON group_chats;
DROP POLICY IF EXISTS "Users can delete their own group chats" ON group_chats;

DROP POLICY IF EXISTS "Users can view members of their groups" ON group_chat_members;
DROP POLICY IF EXISTS "Group creators can add members" ON group_chat_members;
DROP POLICY IF EXISTS "Group creators can update members" ON group_chat_members;
DROP POLICY IF EXISTS "Group creators can remove members" ON group_chat_members;

DROP POLICY IF EXISTS "Members can view messages" ON group_chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON group_chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON group_chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON group_chat_messages;

-- Create policies for group_chats
CREATE POLICY "Users can view group chats they are members of"
ON group_chats FOR SELECT
TO authenticated
USING (
    created_by = auth.uid()
    OR check_group_membership(id, auth.uid())
);

CREATE POLICY "Users can create group chats"
ON group_chats FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own group chats"
ON group_chats FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own group chats"
ON group_chats FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Create policies for group_chat_members
CREATE POLICY "Users can view members of their groups"
ON group_chat_members FOR SELECT
TO authenticated
USING (
    check_group_membership(group_chat_id, auth.uid())
);

CREATE POLICY "Group creators can add members"
ON group_chat_members FOR INSERT
TO authenticated
WITH CHECK (
    group_chat_id IN (
        SELECT id 
        FROM group_chats 
        WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Group creators can update members"
ON group_chat_members FOR UPDATE
TO authenticated
USING (
    group_chat_id IN (
        SELECT id 
        FROM group_chats 
        WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Group creators can remove members"
ON group_chat_members FOR DELETE
TO authenticated
USING (
    group_chat_id IN (
        SELECT id 
        FROM group_chats 
        WHERE created_by = auth.uid()
    )
);

-- Create policies for group_chat_messages
CREATE POLICY "Members can view messages"
ON group_chat_messages FOR SELECT
TO authenticated
USING (check_group_membership(group_chat_id, auth.uid()));

CREATE POLICY "Members can send messages"
ON group_chat_messages FOR INSERT
TO authenticated
WITH CHECK (
    check_group_membership(group_chat_id, auth.uid())
    AND auth.uid() = sender_id
);

CREATE POLICY "Users can update their own messages"
ON group_chat_messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
ON group_chat_messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_group_chats_updated_at
    BEFORE UPDATE ON group_chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_chat_messages_updated_at
    BEFORE UPDATE ON group_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for group chat images
INSERT INTO storage.buckets (id, name, public) VALUES ('group-images', 'group-images', true);

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload group images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'group-images' AND
  auth.uid() = owner
);

-- Create policy to allow public to view group images
CREATE POLICY "Allow public to view group images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'group-images');

-- Create policy to allow group owners to update their group images
CREATE POLICY "Allow group owners to update their group images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'group-images' AND
  auth.uid() = owner
);

-- Create policy to allow group owners to delete their group images
CREATE POLICY "Allow group owners to delete their group images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'group-images' AND
  auth.uid() = owner
); 