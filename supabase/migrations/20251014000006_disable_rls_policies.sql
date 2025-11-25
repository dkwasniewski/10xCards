-- Migration: Disable RLS Policies
-- Purpose: Disable all previously defined Row Level Security policies
-- Affected: ai_generation_sessions, flashcards, reviews, event_logs tables
-- Created: 2025-10-14
-- Security: WARNING - This migration disables security policies. Use with caution!

-- ============================================================================
-- DISABLE AI GENERATION SESSIONS POLICIES
-- ============================================================================

-- Disable all policies for AI generation sessions
drop policy if exists ai_sessions_select_own_authenticated on ai_generation_sessions;
drop policy if exists ai_sessions_insert_own_authenticated on ai_generation_sessions;
drop policy if exists ai_sessions_update_own_authenticated on ai_generation_sessions;
drop policy if exists ai_sessions_delete_own_authenticated on ai_generation_sessions;

-- Disable RLS on ai_generation_sessions
ALTER TABLE ai_generation_sessions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DISABLE FLASHCARDS POLICIES
-- ============================================================================

-- Disable all policies for flashcards
drop policy if exists flashcards_select_own_authenticated on flashcards;
drop policy if exists flashcards_insert_own_authenticated on flashcards;
drop policy if exists flashcards_update_own_authenticated on flashcards;
drop policy if exists flashcards_delete_own_authenticated on flashcards;

-- ============================================================================
-- DISABLE REVIEWS POLICIES
-- ============================================================================

-- Disable all policies for reviews
drop policy if exists reviews_select_own_authenticated on reviews;
drop policy if exists reviews_insert_own_authenticated on reviews;
drop policy if exists reviews_update_own_authenticated on reviews;
drop policy if exists reviews_delete_own_authenticated on reviews;

-- ============================================================================
-- DISABLE EVENT LOGS POLICIES
-- ============================================================================

-- Disable all policies for event logs
drop policy if exists event_logs_select_own_authenticated on event_logs;
drop policy if exists event_logs_insert_own_authenticated on event_logs;
drop policy if exists event_logs_update_own_authenticated on event_logs;
drop policy if exists event_logs_delete_own_authenticated on event_logs;

-- ============================================================================
-- COMMENT: IMPORTANT SECURITY NOTICE
-- ============================================================================
-- This migration disables all Row Level Security policies previously defined.
-- This means that any user with database access can now access ALL data in these tables.
-- 
-- To re-enable security:
-- 1. Create a new migration that re-adds the policies
-- 2. Or roll back this migration
--
-- CAUTION: In production environments, ensure you re-enable appropriate security
-- policies before exposing the database to users.

