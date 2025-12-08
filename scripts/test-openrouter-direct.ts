/**
 * Test script to verify OpenRouter API integration
 *
 * This script tests the OpenRouter service directly to confirm we're making real API calls.
 *
 * Run with: npx tsx scripts/test-openrouter-direct.ts
 */

import { OpenRouterService } from "../src/lib/services/openrouter.service";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "..", ".env");
dotenv.config({ path: envPath });

const TEST_TEXT = `
Photosynthesis is the process by which green plants and some other organisms use sunlight 
to synthesize foods from carbon dioxide and water. Photosynthesis in plants generally involves 
the green pigment chlorophyll and generates oxygen as a byproduct. The process can be divided 
into two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). 
During the light-dependent reactions, which take place in the thylakoid membrane, chlorophyll absorbs 
energy from sunlight and converts it into chemical energy in the form of ATP and NADPH. The Calvin cycle, 
which takes place in the stroma, uses the ATP and NADPH to convert carbon dioxide into glucose. 
This process is essential for life on Earth as it is the primary source of organic matter for nearly 
all organisms and the primary source of atmospheric oxygen. Plants, algae, and cyanobacteria all 
perform photosynthesis. The rate of photosynthesis can be affected by several environmental factors 
including light intensity, carbon dioxide concentration, temperature, and water availability.
`.trim();

const SYSTEM_PROMPT = `You are a flashcard generation assistant. Your task is to create high-quality flashcards from the provided text.

Rules:
- Generate 5-15 flashcards depending on content length and complexity
- Each flashcard should test a single concept
- Questions should be clear and concise
- Answers should be accurate and complete but not overly verbose
- Focus on key concepts, definitions, and important facts
- Avoid yes/no questions

Return a JSON object with this exact format:
{
  "flashcards": [
    {
      "front": "Clear, specific question",
      "back": "Accurate, concise answer",
      "prompt": "Brief explanation of what this flashcard tests"
    }
  ]
}`;

async function testOpenRouterDirect() {
  console.log("🧪 Testing OpenRouter API Integration (Direct)\n");
  console.log("=".repeat(60));

  // Step 1: Check API key
  console.log("\n📋 Step 1: Checking OPENROUTER_API_KEY...");
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY is not set in environment!");
    console.log("\nTo fix this:");
    console.log("  1. Check your .env file");
    console.log("  2. Make sure it contains: OPENROUTER_API_KEY=sk-or-v1-...");
    process.exit(1);
  }

  console.log(`✅ API key found: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);

  // Step 2: Initialize OpenRouter service
  console.log("\n📋 Step 2: Initializing OpenRouter service...");

  let service;
  try {
    service = new OpenRouterService({
      apiKey: apiKey,
    });
    console.log("✅ Service initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize service:", error.message);
    process.exit(1);
  }

  // Step 3: Build messages
  console.log("\n📋 Step 3: Building chat messages...");
  const messages = service.buildMessages({
    system: SYSTEM_PROMPT,
    user: `Generate flashcards from this text:\n\n${TEST_TEXT}`,
  });
  console.log(`✅ Built ${messages.length} messages`);

  // Step 4: Make real API call
  console.log("\n📋 Step 4: Calling OpenRouter API...");
  console.log("   Model: openai/gpt-4o-mini");
  console.log("   API URL: https://openrouter.ai/api/v1/chat/completions");
  console.log("   Please wait, this may take 5-15 seconds...\n");

  const startTime = Date.now();

  try {
    const response = await service.chat({
      model: "openai/gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      maxTokens: 2000,
      responseFormat: { type: "json_object" },
      metadata: {
        test: "integration-test",
      },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log("✅ API call successful!\n");
    console.log("=".repeat(60));
    console.log("\n📊 API RESPONSE DETAILS:\n");
    console.log(`   ⏱️  Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    console.log(`   🤖 Model: ${response.model}`);
    console.log(`   🆔 Request ID: ${response.id}`);
    console.log(`   💰 Tokens - Prompt: ${response.usage?.prompt_tokens || "N/A"}`);
    console.log(`   💰 Tokens - Completion: ${response.usage?.completion_tokens || "N/A"}`);
    console.log(`   💰 Tokens - Total: ${response.usage?.total_tokens || "N/A"}`);

    // Step 5: Parse flashcards
    console.log("\n📋 Step 5: Parsing flashcards from response...");

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("❌ No content in response!");
      process.exit(1);
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("❌ Failed to parse JSON response!");
      console.error("   Raw content:", content.substring(0, 200));
      process.exit(1);
    }

    const flashcards = parsed.flashcards;

    if (!Array.isArray(flashcards)) {
      console.error("❌ Response does not contain flashcards array!");
      console.error("   Response structure:", JSON.stringify(parsed, null, 2).substring(0, 200));
      process.exit(1);
    }

    console.log(`✅ Parsed ${flashcards.length} flashcards\n`);

    // Step 6: Display sample flashcards
    console.log("=".repeat(60));
    console.log("\n🔍 SAMPLE FLASHCARDS:\n");

    flashcards.slice(0, 3).forEach((card, index) => {
      console.log(`\n${index + 1}. FRONT: ${card.front}`);
      console.log(`   BACK: ${card.back.substring(0, 100)}${card.back.length > 100 ? "..." : ""}`);
      if (card.prompt) {
        console.log(`   PROMPT: ${card.prompt}`);
      }
    });

    if (flashcards.length > 3) {
      console.log(`\n   ... and ${flashcards.length - 3} more flashcards`);
    }

    // Step 7: Validate flashcard quality
    console.log("\n" + "=".repeat(60));
    console.log("\n✅ VALIDATION:\n");

    const validations = [
      {
        name: "All flashcards have front text",
        test: () => flashcards.every((c) => c.front && c.front.length > 0),
      },
      {
        name: "All flashcards have back text",
        test: () => flashcards.every((c) => c.back && c.back.length > 0),
      },
      {
        name: "Generated multiple flashcards (5-15 expected)",
        test: () => flashcards.length >= 5 && flashcards.length <= 15,
      },
      {
        name: "Flashcards are about photosynthesis (not generic)",
        test: () => {
          const allText = flashcards
            .map((c) => `${c.front} ${c.back}`)
            .join(" ")
            .toLowerCase();
          return (
            allText.includes("photosynthesis") ||
            allText.includes("chlorophyll") ||
            allText.includes("calvin") ||
            allText.includes("light") ||
            allText.includes("plant")
          );
        },
      },
      {
        name: "Flashcards vary in content (not duplicates)",
        test: () => {
          const fronts = new Set(flashcards.map((c) => c.front));
          return fronts.size === flashcards.length;
        },
      },
      {
        name: "Real AI response (not mock data)",
        test: () => {
          // Check that content is not from our mock generator
          const allText = flashcards.map((c) => `${c.front} ${c.back}`).join(" ");
          return !allText.includes("approximate length of the provided text");
        },
      },
    ];

    let allPassed = true;
    validations.forEach((validation) => {
      const passed = validation.test();
      console.log(`   ${passed ? "✅" : "❌"} ${validation.name}`);
      if (!passed) allPassed = false;
    });

    console.log("\n" + "=".repeat(60));

    if (allPassed) {
      console.log("\n🎉 SUCCESS! OpenRouter API is working correctly!\n");
      console.log("✅ Real API call to OpenRouter made");
      console.log("✅ AI-generated flashcards received");
      console.log("✅ Content is relevant to input text");
      console.log("✅ All validations passed");
      console.log("\n💡 This confirms your app is making REAL API calls to OpenRouter!\n");
      process.exit(0);
    } else {
      console.log("\n⚠️  WARNING: Some validations failed");
      console.log("   The API is responding, but flashcard quality may be an issue.\n");
      process.exit(1);
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error("\n❌ API call failed!\n");
    console.error("=".repeat(60));
    console.error("\n📋 ERROR DETAILS:\n");
    console.error(`   Duration before error: ${duration}ms`);
    console.error(`   Error type: ${error.constructor.name}`);
    console.error(`   Error message: ${error.message}\n`);

    if (error.stack) {
      console.error("   Stack trace:");
      const stackLines = error.stack.split("\n").slice(1, 4);
      stackLines.forEach((line) => console.error("   " + line));
    }

    console.error("\n=".repeat(60));
    console.error("\n💡 TROUBLESHOOTING:\n");
    console.error("   1. Check if your OPENROUTER_API_KEY is valid");
    console.error("   2. Verify you have credits in your OpenRouter account");
    console.error("   3. Go to: https://openrouter.ai/");
    console.error("   4. Check API status: https://status.openrouter.ai/");
    console.error("   5. View your usage: https://openrouter.ai/activity\n");

    process.exit(1);
  }
}

// Run the test
testOpenRouterDirect();
