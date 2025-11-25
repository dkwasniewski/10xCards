-- Migration: Create Indexes
-- Purpose: Create indexes to optimize query performance for common access patterns
-- Affected: ai_generation_sessions, flashcards, reviews, event_logs tables
-- Created: 2025-10-14

-- GIN index on flashcards.tsv for full-text search
-- Enables efficient text search across flashcard front and back content
create index idx_flashcards_tsv on flashcards using gin(tsv);

-- BTree index on ai_generation_sessions for user-specific queries ordered by creation time
-- Supports queries like "get recent AI sessions for user X"
create index idx_ai_sessions_user_created on ai_generation_sessions(user_id, created_at);

-- BTree index on reviews.next_due for spaced repetition scheduling
-- Enables efficient lookup of cards due for review
create index idx_reviews_next_due on reviews(next_due);

-- BTree index on event_logs for user-specific analytics queries ordered by creation time
-- Supports queries like "get recent events for user X"
create index idx_event_logs_user_created on event_logs(user_id, created_at);

-- BTree index on flashcards.user_id for user-specific flashcard queries
-- Supports queries like "get all flashcards for user X"
create index idx_flashcards_user_id on flashcards(user_id);

-- BTree index on flashcards.ai_session_id for session-specific flashcard queries
-- Supports queries like "get all flashcards generated in session X"
create index idx_flashcards_ai_session_id on flashcards(ai_session_id);

-- BTree index on reviews.user_id for user-specific review queries
-- Supports queries like "get all reviews for user X"
create index idx_reviews_user_id on reviews(user_id);

-- BTree index on reviews.flashcard_id for flashcard-specific review history
-- Supports queries like "get review history for flashcard X"
create index idx_reviews_flashcard_id on reviews(flashcard_id);


