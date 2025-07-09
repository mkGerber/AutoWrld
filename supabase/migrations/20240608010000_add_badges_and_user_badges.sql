-- Create badges table
create table badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon_url text,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Create user_badges table
create table user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  badge_id uuid references badges(id) on delete cascade,
  awarded_at timestamp with time zone default timezone('utc', now()),
  unique (user_id, badge_id)
);

-- Enable RLS
alter table user_badges enable row level security;
create policy "Users can view their badges" on user_badges for select using (user_id = auth.uid());
create policy "Users can earn badges" on user_badges for insert with check (user_id = auth.uid()); 