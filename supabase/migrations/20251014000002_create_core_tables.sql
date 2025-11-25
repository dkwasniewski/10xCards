-- Migration: Create Core Tables
-- Purpose: Create main application tables for AI generation sessions, flashcards, reviews, and event logs
-- Affected: ai_generation_sessions, flashcards, reviews, event_logs tables
-- Created: 2025-10-14
-- Notes: Users table is managed by Supabase Auth and does not need to be created

-- Create ai_generation_sessions table
-- Stores metadata about AI-powered flashcard generation sessions
create table ai_generation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_text text not null check (char_length(input_text) between 1000 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  model text,
  accepted_unedited_count integer,
  accepted_edited_count integer,
  generation_duration integer not null
);

-- Enable Row Level Security on ai_generation_sessions
alter table ai_generation_sessions enable row level security;

-- Create flashcards table
-- Stores individual flashcard data with support for both manual and AI-generated cards
create table flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ai_session_id uuid references ai_generation_sessions(id) on delete set null,
  source flashcard_source not null,
  front varchar(200) not null,
  back varchar(500) not null,
  model text,
  prompt text,
  -- Generated column for full-text search on front and back content
  tsv tsvector generated always as (to_tsvector('english', front || ' ' || back)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Enable Row Level Security on flashcards
alter table flashcards enable row level security;

-- Create reviews table
-- Stores spaced repetition review history for flashcards
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid not null references flashcards(id) on delete cascade,
  rating smallint not null,
  reviewed_at timestamptz not null default now(),
  next_due timestamptz not null,
  deleted_at timestamptz null
);

-- Enable Row Level Security on reviews
alter table reviews enable row level security;

-- Create event_logs table
-- Stores audit trail and analytics events for user interactions
create table event_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid null references flashcards(id),
  event_type text not null,
  event_source flashcard_source not null,
  ai_session_id uuid null references ai_generation_sessions(id),
  review_id uuid null references reviews(id),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security on event_logs
alter table event_logs enable row level security;


