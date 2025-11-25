-- Migration: Create Triggers and Functions
-- Purpose: Create automatic timestamp update triggers for tables with updated_at columns
-- Affected: ai_generation_sessions, flashcards, reviews, event_logs tables
-- Created: 2025-10-14

-- Create function to automatically update the updated_at timestamp
-- This function is triggered before any UPDATE operation on tables with an updated_at column
-- Returns: The modified NEW record with updated_at set to current timestamp
create or replace function update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Attach update_timestamp trigger to ai_generation_sessions table
-- Ensures updated_at is automatically refreshed on every row update
create trigger ai_sessions_update_ts
  before update on ai_generation_sessions
  for each row
  execute procedure update_timestamp();

-- Attach update_timestamp trigger to flashcards table
-- Ensures updated_at is automatically refreshed on every row update
create trigger flashcards_update_ts
  before update on flashcards
  for each row
  execute procedure update_timestamp();

-- Attach update_timestamp trigger to reviews table
-- Ensures updated_at is automatically refreshed on every row update
create trigger reviews_update_ts
  before update on reviews
  for each row
  execute procedure update_timestamp();

-- Note: event_logs table does not have an updated_at column,
-- so no trigger is needed for that table


