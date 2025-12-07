/**
 * Test script to verify OpenRouter API integration
 * 
 * This script:
 * 1. Tests if OPENROUTER_API_KEY is set
 * 2. Makes a real API call to OpenRouter
 * 3. Verifies we get actual AI-generated flashcards
 * 
 * Run with: npx tsx scripts/test-openrouter-integration.ts
 */

import { generateFlashcards } from '../src/lib/services/ai.service';

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

async function testOpenRouterIntegration() {
  console.log('🧪 Testing OpenRouter API Integration\n');
  console.log('=' .repeat(60));
  
  // Step 1: Check API key
  console.log('\n📋 Step 1: Checking OPENROUTER_API_KEY...');
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY is not set in environment!');
    console.log('\nTo fix this:');
    console.log('  1. Check your .env file');
    console.log('  2. Make sure it contains: OPENROUTER_API_KEY=sk-or-v1-...');
    process.exit(1);
  }
  
  console.log(`✅ API key found: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);
  
  // Step 2: Test text validation
  console.log('\n📋 Step 2: Validating test text...');
  console.log(`   Text length: ${TEST_TEXT.length} characters`);
  
  if (TEST_TEXT.length < 1000) {
    console.error('❌ Test text is too short (< 1000 characters)');
    process.exit(1);
  }
  
  console.log('✅ Test text is valid');
  
  // Step 3: Make real API call
  console.log('\n📋 Step 3: Calling OpenRouter API...');
  console.log('   Model: openai/gpt-4o-mini');
  console.log('   Please wait, this may take 5-15 seconds...\n');
  
  const startTime = Date.now();
  
  try {
    const result = await generateFlashcards(TEST_TEXT, 'openai/gpt-4o-mini');
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('✅ API call successful!\n');
    console.log('=' .repeat(60));
    console.log('\n📊 RESULTS:\n');
    console.log(`   ⏱️  Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    console.log(`   📝 Flashcards generated: ${result.candidates.length}`);
    console.log(`   💰 Reported duration: ${result.duration}ms\n`);
    
    // Step 4: Verify flashcards look real
    console.log('=' .repeat(60));
    console.log('\n🔍 SAMPLE FLASHCARDS:\n');
    
    result.candidates.slice(0, 3).forEach((card, index) => {
      console.log(`\n${index + 1}. FRONT: ${card.front}`);
      console.log(`   BACK: ${card.back.substring(0, 100)}${card.back.length > 100 ? '...' : ''}`);
      console.log(`   PROMPT: ${card.prompt}`);
    });
    
    if (result.candidates.length > 3) {
      console.log(`\n   ... and ${result.candidates.length - 3} more flashcards`);
    }
    
    // Step 5: Validate flashcard quality
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ VALIDATION:\n');
    
    const validations = [
      {
        name: 'All flashcards have front text',
        test: () => result.candidates.every(c => c.front && c.front.length > 0)
      },
      {
        name: 'All flashcards have back text',
        test: () => result.candidates.every(c => c.back && c.back.length > 0)
      },
      {
        name: 'All flashcards have prompt text',
        test: () => result.candidates.every(c => c.prompt && c.prompt.length > 0)
      },
      {
        name: 'Flashcards are about photosynthesis (not generic)',
        test: () => {
          const allText = result.candidates.map(c => `${c.front} ${c.back}`).join(' ').toLowerCase();
          return allText.includes('photosynthesis') || 
                 allText.includes('chlorophyll') || 
                 allText.includes('calvin') ||
                 allText.includes('light');
        }
      },
      {
        name: 'Flashcards vary in content (not duplicates)',
        test: () => {
          const fronts = new Set(result.candidates.map(c => c.front));
          return fronts.size === result.candidates.length;
        }
      }
    ];
    
    let allPassed = true;
    validations.forEach(validation => {
      const passed = validation.test();
      console.log(`   ${passed ? '✅' : '❌'} ${validation.name}`);
      if (!passed) allPassed = false;
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (allPassed) {
      console.log('\n🎉 SUCCESS! OpenRouter API is working correctly!\n');
      console.log('✅ Real AI-generated flashcards received');
      console.log('✅ Content is relevant to input text');
      console.log('✅ All validations passed\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  WARNING: Some validations failed');
      console.log('   The API is responding, but flashcard quality may be an issue.\n');
      process.exit(1);
    }
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error('\n❌ API call failed!\n');
    console.error('=' .repeat(60));
    console.error('\n📋 ERROR DETAILS:\n');
    console.error(`   Duration before error: ${duration}ms`);
    console.error(`   Error type: ${error.constructor.name}`);
    console.error(`   Error message: ${error.message}\n`);
    
    if (error.stack) {
      console.error('   Stack trace:');
      console.error('   ' + error.stack.split('\n').slice(1, 4).join('\n   '));
    }
    
    console.error('\n=' .repeat(60));
    console.error('\n💡 TROUBLESHOOTING:\n');
    console.error('   1. Check if your OPENROUTER_API_KEY is valid');
    console.error('   2. Verify you have credits in your OpenRouter account');
    console.error('   3. Check OpenRouter status: https://status.openrouter.ai/');
    console.error('   4. Try running: npm run dev (to test in full environment)\n');
    
    process.exit(1);
  }
}

// Run the test
testOpenRouterIntegration();

