import type { SupabaseClient } from "../../db/supabase.client";

interface LogEventParams {
  userId: string;
  eventType: string;
  eventSource: "manual" | "ai";
  aiSessionId?: string;
  flashcardId?: string;
  reviewId?: string;
}

/**
 * Logs an event to the event_logs table for analytics and debugging.
 * Failures are logged but don't throw errors to avoid breaking main flow.
 *
 * @param supabase - The Supabase client instance
 * @param params - Event logging parameters
 */
export async function logEvent(supabase: SupabaseClient, params: LogEventParams): Promise<void> {
  try {
    const { error } = await supabase.from("event_logs").insert({
      user_id: params.userId,
      event_type: params.eventType,
      event_source: params.eventSource,
      ai_session_id: params.aiSessionId || null,
      flashcard_id: params.flashcardId || null,
      review_id: params.reviewId || null,
    });

    if (error) {
      // Don't throw - logging failures shouldn't break the main flow
    }
  } catch {
    // Silently fail - logging failures shouldn't break the main flow
  }
}
