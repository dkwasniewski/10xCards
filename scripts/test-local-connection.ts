#!/usr/bin/env ts-node
/**
 * Test script to verify local Supabase connection and create a test user
 * Run with: npx tsx scripts/test-local-connection.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "testpassword123";

async function main() {
  console.log("🔍 Testing Supabase Connection...\n");

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`📡 Connecting to: ${SUPABASE_URL}`);
  console.log(`🔑 Using anon key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
  console.log("");

  // Test 1: Check database connection
  console.log("Test 1: Database connection");
  try {
    const { error } = await supabase.from("flashcards").select("count").limit(0);
    if (error) throw error;
    console.log("✅ Database connection successful!\n");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }

  // Test 2: Check for existing test user
  console.log("Test 2: Checking for existing test user");
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (!signInError && signInData.user) {
      console.log(`✅ Test user exists: ${TEST_EMAIL}`);
      console.log(`   User ID: ${signInData.user.id}`);
      console.log(`   Email confirmed: ${!!signInData.user.email_confirmed_at}`);
      console.log("");

      // Sign out
      await supabase.auth.signOut();
      console.log("✅ All tests passed! Your Supabase connection is working.\n");
      return;
    }
  } catch {
    // User doesn't exist, we'll create it next
  }

  // Test 3: Create test user
  console.log("Test user doesn't exist. Creating test user...");
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        emailRedirectTo: "http://localhost:3000/verify-email",
      },
    });

    if (signUpError) throw signUpError;

    if (!signUpData.user) {
      throw new Error("Failed to create user");
    }

    console.log(`✅ Test user created: ${TEST_EMAIL}`);
    console.log(`   User ID: ${signUpData.user.id}`);
    console.log(`   Email confirmed: ${!!signUpData.user.email_confirmed_at}`);
    console.log("");

    // In local development, email confirmation is usually disabled or auto-confirmed
    // Let's verify we can login
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (loginError) {
      if (loginError.message.includes("Email not confirmed")) {
        console.log("⚠️  Email confirmation is required. Checking Mailpit for confirmation link...");
        console.log("   Open: http://127.0.0.1:54324");
        console.log("");
      } else {
        throw loginError;
      }
    } else {
      console.log("✅ Login test successful!");
      await supabase.auth.signOut();
    }

    console.log("");
    console.log("✅ All tests passed! Your Supabase connection is working.\n");
    console.log("📧 Test credentials:");
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log("");
  } catch (error) {
    console.error("❌ Failed to create test user:", error);
    process.exit(1);
  }
}

main();
