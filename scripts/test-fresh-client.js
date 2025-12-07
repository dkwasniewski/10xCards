/**
 * Test with completely fresh client, no session interference
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

async function test() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node scripts/test-fresh-client.js email password");
    process.exit(1);
  }

  const [email, password] = args;

  // Create completely fresh client with no session storage
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Don't persist session
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: () => null,
        setItem: () => {
          // Intentionally empty
        },
        removeItem: () => {
          // Intentionally empty
        },
      },
    },
  });

  console.log("🧪 Testing with fresh client (no session storage)");
  console.log("Email:", email);
  console.log(
    "Password chars:",
    password
      .split("")
      .map((c, i) => `[${i}:${c}]`)
      .join(" ")
  );
  console.log("");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password,
  });

  if (error) {
    console.error("❌ Failed:", error.message);
    console.error("Full error:", JSON.stringify(error, null, 2));
  } else {
    console.log("✅ Success!");
    console.log("User:", data.user?.email);
  }
}

test();
