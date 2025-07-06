import { createClient } from 'jsr:@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    console.log('Starting daily notifications...')
    
    // Get items that need attention
    const { data: alertItems, error: fetchError } = await supabase
      .from('item_stocks')
      .select(`
        *,
        items(name)
      `)
      .or('is_expiring_soon.eq.true,is_low_stock.eq.true')

    if (fetchError) {
      console.error('Error fetching alert items:', fetchError)
      throw fetchError
    }

    if (!alertItems || alertItems.length === 0) {
      console.log('No items need attention today.')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No alerts needed today',
        alertCount: 0
      }))
    }

    // Separate items by type
    const expiringItems = alertItems.filter(item => item.is_expiring_soon)
    const lowStockItems = alertItems.filter(item => item.is_low_stock)

    // Create notifications
    const notifications = []

    // Expiring items notification
    if (expiringItems.length > 0) {
      const expiringNames = expiringItems.map(item => item.items.name).join(', ')
      notifications.push({
        message: `Daily Alert: ${expiringItems.length} item(s) expiring soon - ${expiringNames}`,
        type: 'expiry',
        priority: 'high'
      })
    }

    // Low stock items notification
    if (lowStockItems.length > 0) {
      const lowStockNames = lowStockItems.map(item => item.items.name).join(', ')
      notifications.push({
        message: `Daily Alert: ${lowStockItems.length} item(s) have low stock - ${lowStockNames}`,
        type: 'low_stock',
        priority: 'medium'
      })
    }

    // Insert notifications
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (insertError) {
      console.error('Error inserting notifications:', insertError)
      throw insertError
    }

    console.log(`Daily notifications created: ${notifications.length} notifications`)

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Daily notifications created successfully',
      notificationsCreated: notifications.length,
      expiringCount: expiringItems.length,
      lowStockCount: lowStockItems.length
    }))
  } catch (error) {
    console.error('Daily notifications failed:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { status: 500 })
  }
})