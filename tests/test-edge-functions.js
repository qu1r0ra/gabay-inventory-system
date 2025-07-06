// Simple test script for Supabase Edge Functions
// Replace the ANON_KEY with your actual anon key from Supabase dashboard

import { logger } from '../src/lib/utils/console.js';

const PROJECT_URL = 'https://dvmdiucleurmqxsydfjc.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2bWRpdWNsZXVybXF4c3lkZmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDY3NjQsImV4cCI6MjA2NDg4Mjc2NH0.TVBbwvzFPEw_Xq53PhcRNIZ1OiVFRc59hUd4vErvppw' // Replace this with your actual anon key

async function testFunction(functionName) {
  try {
    logger.test(`Testing ${functionName} function...`)
    
    const response = await fetch(`${PROJECT_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`Response status: ${response.status}`)
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))
    
    let result
    try {
      result = await response.json()
    } catch (parseError) {
      logger.error(`Failed to parse JSON response: ${parseError.message}`)
      const textResult = await response.text()
      console.log('Raw response:', textResult)
      return
    }
    
    if (response.ok) {
      logger.success(`${functionName} executed successfully`)
      if (result && Object.keys(result).length > 0) {
        console.log('Response data:', JSON.stringify(result, null, 2))
      } else {
        console.log('No response data returned')
      }
    } else {
      logger.error(`${functionName} failed with status ${response.status}`)
      console.log('Error details:', JSON.stringify(result, null, 2))
    }
  } catch (error) {
    logger.error(`Error calling ${functionName}: ${error.message}`)
    console.log('Full error:', error)
  }
}

async function runTests() {
  logger.info('Testing deployed edge functions...\n')
  
  await testFunction('update-stock-status')
  console.log('')
  await testFunction('daily-notifications')
  
  logger.success('Tests completed!')
}

// Check if anon key is set
if (ANON_KEY === 'YOUR_ANON_KEY_HERE') {
  console.log(`
${logger.setup('SETUP REQUIRED:')}
1. Go to your Supabase project dashboard: https://supabase.com
2. Navigate to Settings > API
3. Copy the "anon public" key (starts with 'eyJ...')
4. Replace 'YOUR_ANON_KEY_HERE' in this file with your actual key
5. Run: node test-functions.js

${logger.info('Your project URL:')} ${PROJECT_URL}
`)
} else {
  runTests().catch(console.error)
} 