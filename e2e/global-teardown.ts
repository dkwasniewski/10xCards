/**
 * Playwright Global Teardown
 * Cleans up Supabase database after all E2E tests complete
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";
import * as dotenv from "dotenv";
import * as path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

async function globalTeardown() {
  console.log("\n🧹 Starting database cleanup...\n");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testEmail = process.env.E2E_EMAIL;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials (SUPABASE_URL or SUPABASE_KEY)");
    throw new Error("Missing Supabase environment variables");
  }

  if (!testEmail) {
    console.error("❌ Missing E2E_EMAIL environment variable");
    throw new Error("Missing E2E_EMAIL environment variable");
  }

  // Create admin client for cleanup operations
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  try {
    // Get the test user ID
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: process.env.E2E_PASSWORD || "",
    });

    if (authError || !authData.user) {
      console.error("❌ Failed to authenticate test user:", authError?.message);
      throw authError;
    }

    const testUserId = authData.user.id;
    console.log(`🔍 Found test user: ${testEmail} (ID: ${testUserId})`);

    // Delete records in correct order (respecting foreign key constraints)
    // Order: reviews -> event_logs -> flashcards -> ai_generation_sessions

    console.log("\n📋 Deleting reviews...");
    const { error: reviewsError, count: reviewsCount } = await supabase
      .from("reviews")
      .delete({ count: "exact" })
      .eq("user_id", testUserId);

    if (reviewsError) {
      console.error("❌ Error deleting reviews:", reviewsError.message);
    } else {
      console.log(`✅ Deleted ${reviewsCount ?? 0} reviews`);
    }

    console.log("\n📋 Deleting event logs...");
    const { error: logsError, count: logsCount } = await supabase
      .from("event_logs")
      .delete({ count: "exact" })
      .eq("user_id", testUserId);

    if (logsError) {
      console.error("❌ Error deleting event logs:", logsError.message);
    } else {
      console.log(`✅ Deleted ${logsCount ?? 0} event logs`);
    }

    console.log("\n📋 Deleting flashcards...");
    const { error: flashcardsError, count: flashcardsCount } = await supabase
      .from("flashcards")
      .delete({ count: "exact" })
      .eq("user_id", testUserId);

    if (flashcardsError) {
      console.error("❌ Error deleting flashcards:", flashcardsError.message);
    } else {
      console.log(`✅ Deleted ${flashcardsCount ?? 0} flashcards`);
    }

    console.log("\n📋 Deleting AI generation sessions...");
    const { error: sessionsError, count: sessionsCount } = await supabase
      .from("ai_generation_sessions")
      .delete({ count: "exact" })
      .eq("user_id", testUserId);

    if (sessionsError) {
      console.error("❌ Error deleting AI generation sessions:", sessionsError.message);
    } else {
      console.log(`✅ Deleted ${sessionsCount ?? 0} AI generation sessions`);
    }

    console.log("\n✨ Database cleanup completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Database cleanup failed:", error);
    throw error;
  } finally {
    // Sign out to clean up the session
    await supabase.auth.signOut();
  }
}

export default globalTeardown;
