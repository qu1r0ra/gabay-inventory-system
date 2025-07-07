import { supabase, type Item, type ItemStock, type Transaction, type User } from "./index";
import { logger } from "../utils/console.js";

export interface CreateItemRequest {
  name: string;
  initialStock?: {
    quantity: number;
    expiryDate?: string;
  };
}

export interface UpdateItemRequest {
  name?: string;
  stock?: {
    quantity?: number;
    expiryDate?: string;
  };
}

export interface StockUpdateRequest {
  lotId: string;
  quantity: number;
  userId: string;
}

export const inventoryApi = {
  async createItem(data: CreateItemRequest) {
    logger.info(`Creating item: ${data.name}`);
    
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
      logger.info(`Adding initial stock: ${data.initialStock.quantity} units`);
      
      const { error: stockError } = await supabase.from("item_stocks").insert({
        item_id: item.id,
        item_qty: data.initialStock.quantity,
        expiry_date: data.initialStock.expiryDate,
        lot_id: crypto.randomUUID(), // Generate a unique lot ID
      });

      if (stockError) {
        logger.error(`Failed to add initial stock: ${stockError.message}`);
        throw stockError;
      }
      
      logger.success(`Initial stock added successfully`);
    }

    return item;
  },

  async getItems() {
    logger.info('Fetching all items with stock information');
    
    const { data, error } = await supabase
      .from("items")
      .select(
        `
        *,
        item_stocks (
          lot_id,
          item_qty,
          expiry_date,
          is_low_stock,
          is_expiring_soon,
          updated_at
        )
      `
      )
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
      .select(
        `
        *,
        item_stocks (
          lot_id,
          item_qty,
          expiry_date,
          is_low_stock,
          is_expiring_soon,
          updated_at
        )
      `
      )
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

    if (data.stock) {
      logger.info(`Updating stock for item ${id}`);
      
      // Get the first stock record for this item (or create one if none exists)
      const { data: existingStock, error: fetchError } = await supabase
        .from("item_stocks")
        .select("lot_id")
        .eq("item_id", id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error(`Failed to fetch existing stock: ${fetchError.message}`);
        throw fetchError;
      }

      if (existingStock) {
        // Update existing stock
        const { error: stockError } = await supabase
        .from("item_stocks")
        .update({
          item_qty: data.stock.quantity,
          expiry_date: data.stock.expiryDate,
          updated_at: new Date().toISOString(),
        })
          .eq("lot_id", existingStock.lot_id);

        if (stockError) {
          logger.error(`Failed to update stock: ${stockError.message}`);
          throw stockError;
        }
        
        logger.success(`Stock updated successfully`);
      } else {
        // Create new stock record
        const { error: stockError } = await supabase
          .from("item_stocks")
          .insert({
            item_id: id,
            item_qty: data.stock.quantity,
            expiry_date: data.stock.expiryDate,
            lot_id: crypto.randomUUID(),
          });

        if (stockError) {
          logger.error(`Failed to create stock: ${stockError.message}`);
          throw stockError;
        }
        
        logger.success(`Stock created successfully`);
      }
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
   * Create a transaction and rely on trigger to update stock.
   * @param lotId - The lot to update
   * @param userId - The user performing the transaction
   * @param quantity - The amount to add/subtract (always positive)
   * @param type - The transaction type
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

  async getLowStockItems() {
    logger.info('Fetching items with low stock');
    
    const { data, error } = await supabase
      .from('item_stocks')
      .select(`
        *,
        items (
          name
        )
      `)
      .eq('is_low_stock', true)
      .order('item_qty', { ascending: true });

    if (error) {
      logger.error(`Failed to fetch low stock items: ${error.message}`);
      throw error;
    }
    
    logger.success(`Found ${data?.length || 0} items with low stock`);
    return data;
  },

  async getExpiringItems() {
    logger.info('Fetching items expiring soon');
    
    const { data, error } = await supabase
      .from('item_stocks')
      .select(`
        *,
        items (
          name
        )
      `)
      .eq('is_expiring_soon', true)
      .not('expiry_date', 'is', null)
      .order('expiry_date', { ascending: true });

    if (error) {
      logger.error(`Failed to fetch expiring items: ${error.message}`);
      throw error;
    }
    
    logger.success(`Found ${data?.length || 0} items expiring soon`);
    return data;
  },

  async createNotification(data: {
    message: string;
    type: string;
    priority?: string;
  }) {
    logger.info(`Creating notification: ${data.type}`);
    
    const { error } = await supabase
      .from('notifications')
      .insert(data);

    if (error) {
      logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }
    
    logger.success('Notification created successfully');
    return true;
  },

  async notifyWithdrawal(itemName: string, quantity: number, userId: string) {
    logger.info(`Creating withdrawal notification for ${itemName}`);
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        message: `Withdrawal: ${itemName} - ${quantity} units`,
        type: 'withdrawal',
        priority: 'high'
      });

    if (error) {
      logger.error(`Failed to create withdrawal notification: ${error.message}`);
      throw error;
    }
    
    logger.success('Withdrawal notification created');
  },

  /**
   * Apply a correction to item stock by inserting into corrections table.
   * The trigger will set item_qty_before and update item_stocks.
   */
  async updateStocks(lotId: string, userId: string, itemQtyAfter: number) {
    logger.info(`Applying correction for lot ${lotId} by user ${userId} to new quantity ${itemQtyAfter}`);

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
  }
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
