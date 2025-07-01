-- Add social posts system for Instagram-style feed
-- This allows users to create posts about their cars and interact with others

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[], -- Array of image URLs
  hashtags TEXT[], -- Array of hashtags
  location TEXT,
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create post comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user follows table
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_posts_vehicle_id ON posts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
-- Users can view all public posts
CREATE POLICY "Users can view public posts"
ON posts FOR SELECT
TO authenticated
USING (is_public = true);

-- Users can view their own posts (public or private)
CREATE POLICY "Users can view their own posts"
ON posts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create posts
CREATE POLICY "Users can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for post_likes
-- Users can view all likes
CREATE POLICY "Users can view post likes"
ON post_likes FOR SELECT
TO authenticated
USING (true);

-- Users can create likes
CREATE POLICY "Users can create post likes"
ON post_likes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can delete their own likes
CREATE POLICY "Users can delete their own post likes"
ON post_likes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for post_comments
-- Users can view all comments
CREATE POLICY "Users can view post comments"
ON post_comments FOR SELECT
TO authenticated
USING (true);

-- Users can create comments
CREATE POLICY "Users can create post comments"
ON post_comments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "Users can update their own post comments"
ON post_comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own post comments"
ON post_comments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for user_follows
-- Users can view all follows
CREATE POLICY "Users can view user follows"
ON user_follows FOR SELECT
TO authenticated
USING (true);

-- Users can create follows
CREATE POLICY "Users can create user follows"
ON user_follows FOR INSERT
TO authenticated
WITH CHECK (follower_id = auth.uid());

-- Users can delete their own follows
CREATE POLICY "Users can delete their own user follows"
ON user_follows FOR DELETE
TO authenticated
USING (follower_id = auth.uid());

-- Functions to update counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update counts
CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER update_post_comments_count_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count(); 