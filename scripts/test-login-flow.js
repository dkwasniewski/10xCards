/**
 * Test script to debug login flow and RLS policies
 * Run with: node scripts/test-login-flow.js <email> <password>
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

async function testLogin() {
  console.log("🧪 Testing Login Flow with RLS\n");
  console.log("=".repeat(60));

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Get credentials from command line
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("\n❌ Please provide email and password:");
    console.error("   node scripts/test-login-flow.js your@email.com yourpassword\n");
    process.exit(1);
  }

  const [testEmail, testPassword] = args;

  try {
    console.log("\n1️⃣  Attempting login...");
    console.log(`   Email: ${testEmail}`);

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.error("❌ Login failed:", loginError.message);
      console.error("   Code:", loginError.status);
      return;
    }

    console.log("✅ Login successful!");
    console.log("   User ID:", loginData.user?.id);
    console.log("   Email:", loginData.user?.email);
    console.log("   Session expires:", new Date(loginData.session?.expires_at * 1000).toISOString());

    // Now test if we can write to event_logs
    console.log("\n2️⃣  Testing event_logs INSERT with RLS...");

    const { data: eventData, error: eventError } = await supabase
      .from("event_logs")
      .insert({
        user_id: loginData.user.id,
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
      console.log("\n💡 Solution: Check if RLS policies are properly configured for event_logs");
    } else {
      console.log("✅ Event log inserted successfully!");
      console.log("   Event ID:", eventData.id);
    }

    // Test reading from event_logs
    console.log("\n3️⃣  Testing event_logs SELECT with RLS...");
    const { data: events, error: selectError } = await supabase
      .from("event_logs")
      .select("*")
      .eq("user_id", loginData.user.id)
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
      .eq("user_id", loginData.user.id)
      .limit(5);

    if (flashcardsError) {
      console.error("❌ Flashcards select failed:", flashcardsError.message);
    } else {
      console.log(`✅ Can read ${flashcards?.length || 0} flashcards`);
    }

    // Test ai_generation_sessions
    console.log("\n5️⃣  Testing ai_generation_sessions SELECT with RLS...");
    const { data: sessions, error: sessionsError } = await supabase
      .from("ai_generation_sessions")
      .select("*")
      .eq("user_id", loginData.user.id)
      .limit(5);

    if (sessionsError) {
      console.error("❌ AI sessions select failed:", sessionsError.message);
    } else {
      console.log(`✅ Can read ${sessions?.length || 0} AI generation sessions`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ All RLS tests completed!");
  } catch (error) {
    console.error("\n💥 Unexpected error:", error);
  }
}

testLogin();
