/**
 * Test login using environment variables to avoid shell escaping issues
 * Create a .env.test file with:
 * TEST_EMAIL=your@email.com
 * TEST_PASSWORD=yourpassword
 * 
 * Then run: node scripts/test-with-env.js
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from 'fs';

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

async function testLogin() {
  console.log("🧪 Testing Login (avoiding shell escaping)\n");
  console.log("=".repeat(60));

  // Read credentials directly without shell processing
  let email, password;

  try {
    const envContent = readFileSync('.env.test', 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('TEST_EMAIL=')) {
        email = line.split('=')[1].trim();
      }
      if (line.startsWith('TEST_PASSWORD=')) {
        password = line.split('=').slice(1).join('=').trim(); // Handle = in password
      }
    }
  } catch (error) {
    console.error("❌ Could not read .env.test file");
    console.error("   Create a file named .env.test with:");
    console.error("   TEST_EMAIL=your@email.com");
    console.error("   TEST_PASSWORD=yourpassword");
    process.exit(1);
  }

  if (!email || !password) {
    console.error("❌ Missing credentials in .env.test");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log(`Email: ${email}`);
  console.log(`Password length: ${password.length} chars`);
  console.log(`Password (first 3 chars): ${password.substring(0, 3)}...`);
  console.log("");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("❌ Login failed:", error.message);
    console.error("   Status:", error.status);
    
    // Try to understand why
    console.log("\n🔍 Debugging info:");
    console.log("   Email format valid:", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    console.log("   Password not empty:", password.length > 0);
    
    return;
  }

  console.log("✅ Login successful!");
  console.log("   User ID:", data.user?.id);
  console.log("   Email:", data.user?.email);
}

testLogin();

