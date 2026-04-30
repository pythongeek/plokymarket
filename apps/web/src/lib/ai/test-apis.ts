/**
 * AI API Test Script
 * Tests both Vertex AI and Kimi API connectivity
 */

import { checkKimiHealth, isKimiConfigured } from './kimi-client';

// Vertex AI Test
async function testVertexAI() {
  console.log('🧪 Testing Vertex AI API...');
  
  try {
    const response = await fetch('/api/ai/vertex-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'content',
        context: { 
          rawInput: 'বাংলাদেশ প্রিমিয়ার লিগ ২০২৬ এর চ্যাম্পিয়ন কে হবে?',
          title: 'BPL 2026 Champion'
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Vertex AI Error:', error);
      return { success: false, error: error.error || 'Unknown error' };
    }

    const data = await response.json();
    console.log('✅ Vertex AI Response:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Vertex AI Exception:', error);
    return { success: false, error: String(error) };
  }
}

// Kimi API Test
async function testKimiAPI() {
  console.log('🧪 Testing Kimi API...');
  
  // Check if configured
  if (!isKimiConfigured()) {
    console.warn('⚠️ Kimi API not configured (KIMI_API_KEY missing)');
    return { success: false, error: 'KIMI_API_KEY not configured' };
  }

  try {
    const health = await checkKimiHealth();
    console.log('✅ Kimi Health Check:', health);
    return { success: health.healthy, data: health };
  } catch (error) {
    console.error('❌ Kimi API Exception:', error);
    return { success: false, error: String(error) };
  }
}

// Run all tests
export async function runAllAITests() {
  console.log('========================================');
  console.log('🤖 AI API Test Suite Started');
  console.log('========================================');

  const results = {
    vertex: await testVertexAI(),
    kimi: await testKimiAPI(),
    timestamp: new Date().toISOString()
  };

  console.log('========================================');
  console.log('📊 Test Results Summary:');
  console.log('========================================');
  console.log('Vertex AI:', results.vertex.success ? '✅ PASS' : '❌ FAIL');
  console.log('Kimi API:', results.kimi.success ? '✅ PASS' : '❌ FAIL');
  
  if (!results.vertex.success) {
    console.log('Vertex Error:', results.vertex.error);
  }
  if (!results.kimi.success) {
    console.log('Kimi Error:', results.kimi.error);
  }

  return results;
}

// Export individual tests
export { testVertexAI, testKimiAPI };
