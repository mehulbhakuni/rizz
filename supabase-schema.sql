-- Run this in your Supabase SQL editor at supabase.com
-- Dashboard → SQL Editor → New Query → paste this → Run

-- Stores every generation
create table generations (
  id uuid default gen_random_uuid() primary key,
  type text not null,          -- 'reply' | 'opener' | 'bio'
  tone text,
  results jsonb not null,
  created_at timestamptz default now()
);

-- Stores user feedback (👍👎) on each reply
create table feedback (
  id uuid default gen_random_uuid() primary key,
  reply text not null,
  tone text,
  type text,                   -- 'reply' | 'opener' | 'bio'
  liked boolean not null,
  conversation_snippet text,
  created_at timestamptz default now()
);

-- Index for fast lookup of top replies by tone
create index feedback_tone_liked_idx on feedback(tone, liked, created_at desc);

-- Row Level Security (keep data private, only server can write)
alter table generations enable row level security;
alter table feedback enable row level security;

-- Allow server-side inserts (via service key) only
create policy "Service can insert generations" on generations
  for insert with check (true);

create policy "Service can insert feedback" on feedback
  for insert with check (true);

create policy "Service can select feedback" on feedback
  for select using (true);
