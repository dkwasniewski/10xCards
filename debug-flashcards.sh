#!/bin/bash

# Debug script to check flashcards in database

echo "========================================"
echo "Checking Flashcards in Database"
echo "========================================"
echo ""

# Get the most recent session ID
echo "Getting most recent AI session..."
SESSION_ID=$(psql $DATABASE_URL -t -c "SELECT id FROM ai_generation_sessions ORDER BY created_at DESC LIMIT 1;" 2>/dev/null | xargs)

if [ -z "$SESSION_ID" ]; then
    echo "No AI sessions found in database"
    echo ""
    echo "Please set DATABASE_URL environment variable or check your Supabase connection"
    exit 1
fi

echo "Most recent session: $SESSION_ID"
echo ""

# Check flashcards for this session
echo "Flashcards for this session:"
echo "----------------------------"
psql $DATABASE_URL -c "
SELECT 
    id,
    LEFT(front, 50) as front_preview,
    source,
    ai_session_id IS NOT NULL as has_session_id,
    deleted_at IS NOT NULL as is_deleted,
    created_at
FROM flashcards 
WHERE ai_session_id = '$SESSION_ID'
ORDER BY created_at;
" 2>/dev/null

echo ""
echo "All flashcards (last 10):"
echo "-------------------------"
psql $DATABASE_URL -c "
SELECT 
    id,
    LEFT(front, 40) as front,
    source,
    ai_session_id IS NOT NULL as has_ai_session,
    deleted_at IS NOT NULL as is_deleted,
    created_at
FROM flashcards 
ORDER BY created_at DESC
LIMIT 10;
" 2>/dev/null

echo ""
echo "Flashcards that SHOULD show in 'My Flashcards':"
echo "------------------------------------------------"
echo "(deleted_at IS NULL)"
psql $DATABASE_URL -c "
SELECT 
    COUNT(*) as count,
    source
FROM flashcards 
WHERE deleted_at IS NULL
GROUP BY source;
" 2>/dev/null

echo ""
echo "To test the API endpoint directly:"
echo "curl http://localhost:3000/api/flashcards?page=1&limit=10"


