-- Migration: Add Composite Index for Flashcards List Query
-- Purpose: Optimize GET /api/flashcards endpoint performance
-- Affected: flashcards table
-- Created: 2025-11-18
--
-- This composite index optimizes the common query pattern of:
-- 1. Filtering flashcards by user_id
-- 2. Sorting by created_at in descending order (most recent first)
--
-- The index supports queries like:
-- SELECT * FROM flashcards 
-- WHERE user_id = ? AND deleted_at IS NULL 
-- ORDER BY created_at DESC
-- LIMIT ? OFFSET ?;
--
-- Benefits:
-- - Eliminates the need for a separate sort operation
-- - Speeds up pagination queries
-- - Works efficiently with the existing user_id index for other query patterns

-- Create composite index on user_id and created_at (descending)
create index if not exists idx_flashcards_user_created 
on flashcards(user_id, created_at desc);

-- Note: The existing idx_flashcards_user_id index (on user_id alone) 
-- can be dropped if this composite index is sufficient for all use cases.
-- However, we're keeping it for now to ensure backward compatibility
-- with any existing queries that don't include ordering.


