// Test script to create a transaction and verify item_stocks update
import { createClient } from '@supabase/supabase-js'
import { logger } from '../src/lib/utils/console.js'

const SUPABASE_URL = 'https://dvmdiucleurmqxsydfjc.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2bWRpdWNsZXVybXF4c3lkZmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDY3NjQsImV4cCI6MjA2NDg4Mjc2NH0.TVBbwvzFPEw_Xq53PhcRNIZ1OiVFRc59hUd4vErvppw' // Replace with your actual service role key

// CONFIGURATION - Change these values to test different scenarios
const TEST_CONFIG = {
  itemName: 'Bandage',           // Item to test with
  transactionType: 'DEPOSIT', // 'DEPOSIT', 'DISTRIBUTE', or 'DISPOSE'
  quantityChange: 10,           // Positive for DEPOSIT, negative for DISTRIBUTE/DISPOSE
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function testTransaction() {
  logger.test(`Testing ${TEST_CONFIG.itemName} transaction...`)
  console.log(`Transaction Type: ${TEST_CONFIG.transactionType}`)
  console.log(`Quantity Change: ${TEST_CONFIG.quantityChange}`)
  
  try {
    // Step 0: Check available users
    logger.users('Step 0: Checking available users...')
    
    let { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(5)
    
    if (usersError) {
      console.log('No users in public.users table, trying auth.users...')
      
      const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers()
      if (authUsersError) {
        console.error('Error fetching users from both tables:', authUsersError)
        return
      }
      users = authUsers.users.map(user => ({ id: user.id, email: user.email }))
    }
    
    if (!users || users.length === 0) {
      logger.error('No users found in either table')
      console.log('You need to create users first in your Supabase dashboard')
      return
    }
    
    console.log('Available users:', users)
    const testUser = users[0] // Use the first available user
    
    // Step 1: Get current item stock
    logger.stock(`Step 1: Getting current ${TEST_CONFIG.itemName} stock...`)
    const { data: testItem, error: itemError } = await supabase
      .from('items')
      .select('id')
      .eq('name', TEST_CONFIG.itemName)
      .single()
    
    if (itemError) {
      console.error(`Error finding ${TEST_CONFIG.itemName} item:`, itemError)
      return
    }
    
    const { data: testStock, error: stockError } = await supabase
      .from('item_stocks')
      .select('*')
      .eq('item_id', testItem.id)
      .single()
    
    if (stockError) {
      console.error(`Error finding ${TEST_CONFIG.itemName} stock:`, stockError)
      return
    }
    
    console.log(`Current ${TEST_CONFIG.itemName} stock:`, {
      lot_id: testStock.lot_id,
      item_qty: testStock.item_qty,
      expiry_date: testStock.expiry_date
    })
    
    // Step 2: Create a transaction
    logger.transaction('Step 2: Creating transaction...')
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        lot_id: testStock.lot_id,
        user_id: testUser.id,
        type: TEST_CONFIG.transactionType,
        item_qty_change: TEST_CONFIG.quantityChange,
      })
      .select()
      .single()
    
    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return
    }
    
    console.log('Transaction created:', {
      id: transaction.id,
      lot_id: transaction.lot_id,
      item_qty_change: transaction.item_qty_change,
      type: transaction.type
    })
    
    // Step 3: Check if item_stocks was updated
    logger.check('Step 3: Checking if item_stocks was updated...')
    const { data: updatedStock, error: updateCheckError } = await supabase
      .from('item_stocks')
      .select('*')
      .eq('lot_id', testStock.lot_id)
      .single()
    
    if (updateCheckError) {
      console.error('Error checking updated stock:', updateCheckError)
      return
    }
    
    console.log(`Updated ${TEST_CONFIG.itemName} stock:`, {
      lot_id: updatedStock.lot_id,
      item_qty: updatedStock.item_qty,
      expiry_date: updatedStock.expiry_date
    })
    
    // Step 4: Verify the change
    const quantityChange = updatedStock.item_qty - testStock.item_qty
    logger.verify('Step 4: Verification...')
    console.log(`Quantity change: ${quantityChange} (expected: ${TEST_CONFIG.quantityChange})`)
    console.log(`Stock updated automatically: ${quantityChange === TEST_CONFIG.quantityChange ? 'YES' : 'NO'}`)
    
    if (quantityChange === TEST_CONFIG.quantityChange) {
      logger.success('item_stocks was automatically updated!')
    } else {
      logger.failed('item_stocks was not updated automatically')
      console.log('You may need to implement a trigger or update logic')
    }
    
  } catch (error) {
    logger.error(`Error testing transaction: ${error}`)
  }
}

// Check if service role key is set
if (SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.log(`
${logger.setup('SETUP REQUIRED:')}
1. Go to your Supabase project dashboard: https://supabase.com
2. Navigate to Settings > API
3. Copy the "service_role" key (starts with 'eyJ...')
4. Replace 'YOUR_SERVICE_ROLE_KEY_HERE' in this file with your actual service role key
5. Run: node test-transaction.js

${logger.warning('WARNING: The service role key has full access to your database.')}
   Only use it for development/testing scripts like this one.
`)
} else {
  testTransaction()
} 