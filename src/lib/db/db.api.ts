import { supabase, type Item, type ItemStock, type Transaction, type User } from "./index";
import { logger } from "../utils/console.js";

export interface CreateItemRequest {
  name: string;
  initialStock: {
    lotId: string;
    quantity: number;
    expiryDate?: string;
    lotId: string;
    userId: string;
  };
}

export interface UpdateItemRequest {
  name?: string;
}

export interface StockUpdateRequest {
  lotId: string;
  quantity: number;
  userId: string;
}

export const inventoryApi = {
  async createItem(data: CreateItemRequest) {
    logger.info(`Creating item: ${data}`);

    const { data: item, error: itemError } = await supabase
      .from("items")
      .insert({ name: data.name })
      .select()
      .single();

    if (itemError) {
      logger.error(`Failed to create item: ${itemError.message}`);
      throw itemError;
    }

    logger.success(`Item created with ID: ${item.id}`);

    if (data.initialStock) {
      logger.info(`Depositing initial stock: ${data.initialStock.quantity} units`);
      await inventoryApi.createTransaction({
        lotId: data.initialStock.lotId,
        userId: data.initialStock.userId,
        quantity: data.initialStock.quantity,
        type: 'DEPOSIT'
      });
      logger.success(`Initial stock deposited successfully`);
    }

    logger.success(`Initial stock added successfully`);

    return item;
  },

  async getItems() {
    logger.info('Fetching all items with stock information');

    const { data, error } = await supabase
      .from("items")
      .select(`
        id,
        name,
        created_at,
        updated_at,
        item_stocks (
          lot_id,
          item_qty,
          expiry_date,
          updated_at
        )
      `)
      .order("name");

    if (error) {
      logger.error(`Failed to fetch items: ${error.message}`);
      throw error;
    }

    logger.success(`Fetched ${data?.length || 0} items`);
    return data;
  },

  async getItem(id: string) {
    logger.info(`Fetching item with ID: ${id}`);

    const { data, error } = await supabase
      .from("items")
      .select(`
        id,
        name,
        created_at,
        updated_at,
        item_stocks (
          lot_id,
          item_qty,
          expiry_date,
          updated_at
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      logger.error(`Failed to fetch item ${id}: ${error.message}`);
      throw error;
    }

    logger.success(`Fetched item: ${data.name}`);
    return data;
  },

  async updateItem(id: string, data: UpdateItemRequest) {
    logger.info(`Updating item with ID: ${id}`);

    if (data.name) {
      const { error: itemError } = await supabase
        .from("items")
        .update({
          name: data.name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (itemError) {
        logger.error(`Failed to update item name: ${itemError.message}`);
        throw itemError;
      }

      logger.success(`Item name updated to: ${data.name}`);
    }

    return this.getItem(id);
  },

  async deleteItem(id: string) {
    logger.info(`Deleting item with ID: ${id}`);

    const { error } = await supabase.from("items").delete().eq("id", id);

    if (error) {
      logger.error(`Failed to delete item: ${error.message}`);
      throw error;
    }

    logger.success(`Item deleted successfully`);
    return true;
  },

  // TODO: We might want to remove this since it may not really be needed - CJ.
  async getStockByLotId(lotId: string) {
    logger.info(`Fetching stock for lot ID: ${lotId}`);

    const { data, error } = await supabase
      .from("item_stocks")
      .select(`
        *,
        items (
          name
        )
      `)
      .eq("lot_id", lotId)
      .single();

    if (error) {
      logger.error(`Failed to fetch stock for lot ${lotId}: ${error.message}`);
      throw error;
    }

    logger.success(`Fetched stock: ${data.item_qty} units of ${data.items?.name}`);
    return data;
  },

  /**
   * Apply a correction to item stock by inserting into corrections table.
   * The trigger will set item_qty_before and update item_stocks.
   */
  async correctStocks(lotId: string, userId: string, itemQtyAfter: number) {
    logger.info(`Applying correction for lot ${lotId} by user ${userId} to new quantity ${itemQtyAfter}`);

    // Validate userId exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    if (userError || !user) {
      logger.error(`Invalid user ID: ${userId}`);
      throw new Error('Invalid user ID');
    }

    // Validate lotId exists
    const { data: lot, error: lotError } = await supabase
      .from('item_stocks')
      .select('lot_id')
      .eq('lot_id', lotId)
      .single();
    if (lotError || !lot) {
      logger.error(`Invalid lot ID: ${lotId}`);
      throw new Error('Invalid lot ID');
    }

    const { error } = await supabase
      .from("corrections")
      .insert({
        lot_id: lotId,
        user_id: userId,
        item_qty_after: itemQtyAfter,
        // item_qty_before will be set by the trigger
      });

    if (error) {
      logger.error(`Failed to apply correction: ${error.message}`);
      throw error;
    }

    logger.success(`Correction applied; stock will be updated by trigger.`);
    return true;
  },

  /**
   * Create a transaction and rely on trigger to update stock.
   */
  async createTransaction({
    lotId,
    userId,
    quantity,
    type
  }: {
    lotId: string,
    userId: string,
    quantity: number,
    type: 'DEPOSIT' | 'DISTRIBUTE' | 'DISPOSE'
  }) {
    logger.info(`Creating ${type} transaction for lot ${lotId} by user ${userId} with quantity ${quantity}`);

    // Validate userId exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    if (userError || !user) {
      logger.error(`Invalid user ID: ${userId}`);
      throw new Error('Invalid user ID');
    }

    // Fetch current stock for validation
    const { data: currentStock, error: fetchError } = await supabase
      .from("item_stocks")
      .select("item_qty")
      .eq("lot_id", lotId)
      .single();

    if (fetchError) {
      logger.error(`Failed to fetch current stock: ${fetchError.message}`);
      throw fetchError;
    }

    let quantityChange = 0;
    if (type === 'DEPOSIT') {
      quantityChange = quantity;
    } else if (type === 'DISTRIBUTE' || type === 'DISPOSE') {
      if (currentStock.item_qty < quantity) {
        logger.error(`Insufficient stock: trying to subtract ${quantity} from ${currentStock.item_qty}`);
        throw new Error(`Insufficient stock: cannot subtract ${quantity} from ${currentStock.item_qty}`);
      }
      quantityChange = -quantity;
    } else {
      throw new Error(`Invalid transaction type: ${type}`);
    }

    // Insert transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        lot_id: lotId,
        user_id: userId,
        item_qty_change: quantityChange,
        type: type,
      })
      .select()
      .single();

    if (transactionError) {
      logger.error(`Failed to create transaction: ${transactionError.message}`);
      throw transactionError;
    }

    logger.success(`Transaction created with ID: ${transaction.id}`);

    // Fetch updated stock
    const { data: updatedStock, error: stockError } = await supabase
      .from("item_stocks")
      .select("item_qty")
      .eq("lot_id", lotId)
      .single();

    if (stockError) {
      logger.error(`Failed to verify stock update: ${stockError.message}`);
      throw stockError;
    }

    logger.success(`Stock verified: ${updatedStock.item_qty} units`);

    return {
      transaction,
      updatedStock,
    };
  },

  /**
   * Get items with low stock (quantity <= threshold).
   */
  async getLowStockItems(threshold: number = 10) {
    logger.info(`Fetching items with stock <= ${threshold}`);
    const { data, error } = await supabase
      .from('item_stocks')
      .select(`*, items ( name )`)
      .lte('item_qty', threshold)
      .order('item_qty', { ascending: true });

    if (error) {
      logger.error(`Failed to fetch low stock items: ${error.message}`);
      throw error;
    }
    logger.success(`Found ${data?.length || 0} items with low stock`);
    return data;
  },

  /**
   * Get items expiring within the next X days (default 30 days).
   */
  async getNearExpiryItems(days: number = 30) {
    logger.info(`Fetching items expiring within ${days} days`);
    const today = new Date();
    const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const todayStr = today.toISOString().slice(0, 10);
    const futureStr = future.toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('item_stocks')
      .select(`*, items ( name )`)
      .not('expiry_date', 'is', null)
      .gte('expiry_date', todayStr)
      .lte('expiry_date', futureStr)
      .order('expiry_date', { ascending: true });

    if (error) {
      logger.error(`Failed to fetch near expiry items: ${error.message}`);
      throw error;
    }
    logger.success(`Found ${data?.length || 0} items expiring soon`);
    return data;
  },

  /**
   * Get items that are already expired (expiry_date < today).
   */
  async getExpiredItems() {
    logger.info('Fetching expired items');
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('item_stocks')
      .select(`*, items ( name )`)
      .not('expiry_date', 'is', null)
      .lt('expiry_date', todayStr)
      .order('expiry_date', { ascending: true });

    if (error) {
      logger.error(`Failed to fetch expired items: ${error.message}`);
      throw error;
    }
    logger.success(`Found ${data?.length || 0} expired items`);
    return data;
  },

  // TODO: Not finalized. Feel free to revise accordingly.
  async generateReport(filters: {
    startDate: string;
    endDate: string;
    type?: 'weekly' | 'monthly';
  }) {
    logger.info(`Generating report from ${filters.startDate} to ${filters.endDate}`);

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        item_stocks!inner (
          item_id,
          item_qty,
          expiry_date
        ),
        items!item_stocks!inner (
          name
        ),
        users (
          name,
          email
        )
      `)
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Failed to generate report: ${error.message}`);
      throw error;
    }

    logger.success(`Report generated with ${data?.length || 0} transactions`);
    return data;
  },

  /**
   * Get all notifications with item details, ordered by most recent first.
   */
  async getNotifications() {
    logger.info('Fetching all notifications');

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        item_stocks!inner (
          item_qty,
          expiry_date,
          items (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Failed to fetch notifications: ${error.message}`);
      throw error;
    }

    logger.success(`Found ${data?.length || 0} items with low stock`);
    return data;
  },

  /**
   * Get notifications by type (LOW_STOCK, NEAR_EXPIRY, EXPIRED).
   */
  async getNotificationsByType(type: 'LOW_STOCK' | 'NEAR_EXPIRY' | 'EXPIRED') {
    logger.info(`Fetching notifications of type: ${type}`);
    
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        item_stocks!inner (
          item_qty,
          expiry_date,
          items (name)
        )
      `)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Failed to fetch ${type} notifications: ${error.message}`);
      throw error;
    }

    logger.success(`Found ${data?.length || 0} items expiring soon`);
    return data;
  },

  /**
   * Get recent notifications (last 30 days).
   */
  async getRecentNotifications(days: number = 30) {
    logger.info(`Fetching notifications from last ${days} days`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        item_stocks!inner (
          item_qty,
          expiry_date,
          items (name)
        )
      `)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Failed to fetch recent notifications: ${error.message}`);
      throw error;
    }
    
    logger.success(`Fetched ${data?.length || 0} recent notifications`);
    return data;
  },

  /**
 * Get detailed item information for a list of lot IDs.
 * Useful for displaying detailed information when users click on notifications.
 */
  async getItemsByLotIds(lotIds: string[]) {
    logger.info(`Fetching detailed item information for ${lotIds.length} lot IDs`);
    
    if (!lotIds || lotIds.length === 0) {
      logger.warning('No lot IDs provided');
      return [];
    }

    const { data, error } = await supabase
      .from('item_stocks')
      .select(`
        *,
        items (
          id,
          name,
          created_at,
          updated_at
        )
      `)
      .in('lot_id', lotIds)
      .order('items(name)', { ascending: true });

    if (error) {
      logger.error(`Failed to fetch items by lot IDs: ${error.message}`);
      throw error;
    }
    
    logger.success(`Fetched ${data?.length || 0} items with detailed information`);
    return data;
  },
};

export class ApiError extends Error {
  constructor(message: string, public statusCode: number, public code: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const handleApiError = (error: unknown) => {
  if (error instanceof ApiError) throw error;

  logger.error(`API Error: ${error}`);
  throw new ApiError(
    "An unexpected error occurred",
    500,
    "INTERNAL_SERVER_ERROR"
  );
};
