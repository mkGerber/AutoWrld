-- Migration: Replace friendships system with follows system
-- This migration creates the new follows table and migrates existing data

-- Create the new follows table
create table follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references profiles(id) on delete cascade,
  followed_id uuid references profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc', now()),
  unique (follower_id, followed_id)
);

-- Enable RLS
alter table follows enable row level security;

-- Policy: users can view follows where they are follower or followed
create policy "Users can view their follows"
on follows
for select
using (
  follower_id = auth.uid() or followed_id = auth.uid()
);

-- Policy: users can follow others
create policy "Users can follow others"
on follows
for insert
with check (
  follower_id = auth.uid()
);

-- Policy: users can unfollow others
create policy "Users can unfollow others"
on follows
for delete
using (
  follower_id = auth.uid()
);

-- Migrate existing accepted friendships to follows (mutual follows)
insert into follows (follower_id, followed_id, created_at)
select sender_id, receiver_id, created_at from friendships
where status = 'accepted'
union
select receiver_id, sender_id, created_at from friendships
where status = 'accepted';

-- Drop the old friendships table
drop table friendships; 