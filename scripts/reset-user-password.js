/**
 * Resets a user's password in local Supabase
 * Run with: node scripts/reset-user-password.js <email>
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

async function resetPassword() {
  console.log("🔐 Password Reset Request\n");
  console.log("=".repeat(60));

  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error("\n❌ Please provide email:");
    console.error("   node scripts/reset-user-password.js your@email.com\n");
    process.exit(1);
  }

  const email = args[0];
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log(`\n📧 Requesting password reset for: ${email}`);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${supabaseUrl}/reset-password`,
    });

    if (error) {
      console.error("❌ Password reset request failed:", error.message);
      return;
    }

    console.log("✅ Password reset email sent!");
    console.log("\n📬 Check your local Mailpit inbox:");
    console.log("   http://127.0.0.1:54324");
    console.log("\n💡 Click the reset link in the email to set a new password.");
    
  } catch (error) {
    console.error("\n💥 Unexpected error:", error);
  }
}

resetPassword();

