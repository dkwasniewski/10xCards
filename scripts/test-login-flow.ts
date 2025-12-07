/**
 * Test script to debug login flow and RLS policies
 * Run with: npx tsx scripts/test-login-flow.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

async function testLogin() {
  console.log("🧪 Testing Login Flow with RLS\n");
  console.log("=".repeat(60));

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Test credentials (you'll need to use a real user)
  const testEmail = "test@example.com"; // CHANGE THIS
  const testPassword = "password123"; // CHANGE THIS

  try {
    console.log("\n1️⃣  Attempting login...");
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.error("❌ Login failed:", loginError.message);
      return;
    }

    console.log("✅ Login successful!");
    console.log("   User ID:", loginData.user?.id);
    console.log("   Email:", loginData.user?.email);
    const expiresAt = loginData.session?.expires_at;
    if (expiresAt) {
      console.log("   Session expires:", new Date(expiresAt * 1000).toISOString());
    }

    // Now test if we can write to event_logs
    console.log("\n2️⃣  Testing event_logs INSERT with RLS...");

    const userId = loginData.user?.id;
    if (!userId) {
      console.error("❌ No user ID available");
      process.exit(1);
    }

    const { data: eventData, error: eventError } = await supabase
      .from("event_logs")
      .insert({
        user_id: userId,
        event_type: "test_login",
        event_source: "manual",
      })
      .select()
      .single();

    if (eventError) {
      console.error("❌ Event log insert failed!");
      console.error("   Error message:", eventError.message);
      console.error("   Error code:", eventError.code);
      console.error("   Error details:", eventError.details);
      console.error("   Error hint:", eventError.hint);

      console.log("\n🔍 This is likely your login issue!");
      console.log("   The login succeeds, but event logging fails due to RLS.");
    } else {
      console.log("✅ Event log inserted successfully!");
      console.log("   Event ID:", eventData.id);
    }

    // Test reading from event_logs
    console.log("\n3️⃣  Testing event_logs SELECT with RLS...");
    const { data: events, error: selectError } = await supabase
      .from("event_logs")
      .select("*")
      .eq("user_id", userId)
      .limit(5);

    if (selectError) {
      console.error("❌ Event log select failed:", selectError.message);
    } else {
      console.log(`✅ Can read ${events?.length || 0} event logs`);
    }

    // Test flashcards
    console.log("\n4️⃣  Testing flashcards SELECT with RLS...");
    const { data: flashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", userId)
      .limit(5);

    if (flashcardsError) {
      console.error("❌ Flashcards select failed:", flashcardsError.message);
    } else {
      console.log(`✅ Can read ${flashcards?.length || 0} flashcards`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ All RLS tests completed!");
  } catch (error) {
    console.error("\n💥 Unexpected error:", error);
  }
}

// Check if credentials are provided
const args = process.argv.slice(2);
if (args.length >= 2) {
  const [email] = args;
  console.log(`Using provided credentials: ${email}`);
  // You could modify the script to use these
}

console.log("\n⚠️  IMPORTANT: Edit this file to add real test credentials!");
console.log("   Or run: npx tsx scripts/test-login-flow.ts your@email.com yourpassword\n");

testLogin();
