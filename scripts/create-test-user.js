/**
 * Creates a test user in the local Supabase instance
 * Run with: node scripts/create-test-user.js <email> <password>
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

async function createTestUser() {
  console.log("🧪 Creating Test User\n");
  console.log("=".repeat(60));

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Get credentials from command line
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("\n❌ Please provide email and password:");
    console.error("   node scripts/create-test-user.js test@example.com password123\n");
    process.exit(1);
  }

  const [email, password] = args;

  try {
    console.log(`\n📝 Creating user: ${email}`);

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        // Auto-confirm for local development
        emailRedirectTo: `${supabaseUrl}/auth/verify-email`,
      },
    });

    if (error) {
      console.error("❌ Sign up failed:", error.message);

      if (error.message.includes("already registered")) {
        console.log("\n💡 User already exists! Try logging in with:");
        console.log(`   node scripts/test-login-flow.js ${email} ${password}`);
      }
      return;
    }

    console.log("✅ User created successfully!");
    console.log("   User ID:", data.user?.id);
    console.log("   Email:", data.user?.email);
    console.log("   Email confirmed:", data.user?.email_confirmed_at ? "Yes" : "No");

    if (!data.user?.email_confirmed_at) {
      console.log("\n⚠️  Email not confirmed!");
      console.log("   For local development, you may need to confirm the email manually.");
      console.log("   Check Mailpit: http://127.0.0.1:54324");
    }

    console.log("\n✅ You can now test login with:");
    console.log(`   node scripts/test-login-flow.js ${email} ${password}`);
  } catch (error) {
    console.error("\n💥 Unexpected error:", error);
  }
}

createTestUser();
