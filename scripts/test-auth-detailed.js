/**
 * Detailed authentication diagnostics
 * Run with: node scripts/test-auth-detailed.js <email> <password>
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

async function testAuth() {
  console.log("🔍 Detailed Authentication Diagnostics\n");
  console.log("=".repeat(70));

  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error("\n❌ Please provide email and password:");
    console.error("   node scripts/test-auth-detailed.js your@email.com yourpassword\n");
    process.exit(1);
  }

  const [email, password] = args;

  // Create both anon and service role clients
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`\n📧 Testing authentication for: ${email}`);
  console.log(`🔑 Password length: ${password.length} characters`);

  try {
    // Step 1: Check if user exists (using service role)
    console.log("\n" + "=".repeat(70));
    console.log("STEP 1: Checking if user exists in database...");
    console.log("=".repeat(70));
    
    const { data: users, error: userError } = await serviceClient
      .from('auth.users')
      .select('id, email, email_confirmed_at, confirmed_at, last_sign_in_at')
      .eq('email', email);

    if (userError) {
      console.log("⚠️  Could not query auth.users directly (expected in RLS environment)");
      console.log("   Will rely on auth API instead");
    } else if (users && users.length > 0) {
      const user = users[0];
      console.log("✅ User found in database:");
      console.log("   User ID:", user.id);
      console.log("   Email:", user.email);
      console.log("   Email confirmed:", user.email_confirmed_at ? "✅ Yes" : "❌ No");
      console.log("   Last sign in:", user.last_sign_in_at || "Never");
    } else {
      console.log("❌ User NOT found in database");
    }

    // Step 2: Try signing in with anon client
    console.log("\n" + "=".repeat(70));
    console.log("STEP 2: Attempting login with anon client...");
    console.log("=".repeat(70));
    
    const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (loginError) {
      console.error("\n❌ LOGIN FAILED");
      console.error("   Error message:", loginError.message);
      console.error("   Error status:", loginError.status);
      console.error("   Error name:", loginError.name);
      
      if (loginError.message.includes("Invalid login credentials")) {
        console.log("\n🔍 DIAGNOSIS:");
        console.log("   The credentials are incorrect. This could mean:");
        console.log("   1. The password is wrong");
        console.log("   2. The email is wrong");
        console.log("   3. The user was deleted or reset");
        console.log("   4. Database was reset and user needs to re-register");
      }
      
      if (loginError.message.includes("Email not confirmed")) {
        console.log("\n🔍 DIAGNOSIS:");
        console.log("   The email needs to be confirmed.");
        console.log("   Check Mailpit: http://127.0.0.1:54324");
      }

      // Try to reset password
      console.log("\n💡 SUGGESTION:");
      console.log("   Try resetting the password or creating a new user:");
      console.log(`   node scripts/create-test-user.js ${email} NewPassword123!`);
      
      return;
    }

    console.log("\n✅ LOGIN SUCCESSFUL!");
    console.log("   User ID:", loginData.user?.id);
    console.log("   Email:", loginData.user?.email);
    console.log("   Role:", loginData.user?.role);
    console.log("   Session expires:", new Date(loginData.session?.expires_at * 1000).toISOString());

    // Step 3: Test RLS with authenticated context
    console.log("\n" + "=".repeat(70));
    console.log("STEP 3: Testing RLS policies with authenticated user...");
    console.log("=".repeat(70));

    // Test event_logs INSERT
    console.log("\n📝 Testing event_logs INSERT...");
    const { data: eventData, error: eventError } = await anonClient
      .from("event_logs")
      .insert({
        user_id: loginData.user.id,
        event_type: "test_diagnostic",
        event_source: "manual",
      })
      .select()
      .single();

    if (eventError) {
      console.error("❌ Event log insert FAILED");
      console.error("   Error:", eventError.message);
      console.error("   Code:", eventError.code);
      console.error("   Details:", eventError.details);
      console.error("   Hint:", eventError.hint);
      console.log("\n🔍 This is the RLS issue! Event logging is blocked.");
    } else {
      console.log("✅ Event log inserted successfully");
      console.log("   Event ID:", eventData.id);
    }

    // Test flashcards SELECT
    console.log("\n📖 Testing flashcards SELECT...");
    const { data: flashcards, error: flashcardsError } = await anonClient
      .from("flashcards")
      .select("*")
      .limit(1);

    if (flashcardsError) {
      console.error("❌ Flashcards select FAILED:", flashcardsError.message);
    } else {
      console.log(`✅ Flashcards select successful (${flashcards?.length || 0} rows)`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ DIAGNOSTICS COMPLETE");
    console.log("=".repeat(70));

  } catch (error) {
    console.error("\n💥 UNEXPECTED ERROR:");
    console.error(error);
  }
}

testAuth();

