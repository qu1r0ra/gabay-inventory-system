import {
  supabase,
  type Item,
  type ItemStock,
  type Transaction,
  type User,
} from "./index";
import { logger } from "../utils/console.js";

export interface CreateItemRequest {
  name: string;
  initialStock?: {
    lotId: string;
    quantity: number;
    expiryDate?: string;
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

export type StockFilter = "all" | "deleted" | "active";

export type NotificationType = "LOW_STOCK" | "NEAR_EXPIRY" | "EXPIRED";

export interface NotificationFilter {
  type?: NotificationType;
  days?: number;
}

export interface ItemStocksStatusOptions {
  lowStockThreshold?: number;
  nearExpiryDays?: number;
  expired?: boolean;
  filter?: StockFilter;
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
      logger.info(
        `Creating new lot ${data.initialStock.lotId} for item ${item.name}`
      );

      const { error: stockError } = await supabase.from("item_stocks").insert({
        item_id: item.id,
        lot_id: data.initialStock.lotId,
        item_qty: 0,
        expiry_date: data.initialStock.expiryDate || null,
      });

      if (stockError) {
        logger.error(`Failed to create item_stocks row: ${stockError.message}`);
        throw stockError;
      }

      logger.success(
        `Lot created; depositing initial stock: ${data.initialStock.quantity} units`
      );

      await inventoryApi.createTransaction({
        lotId: data.initialStock.lotId,
        userId: data.initialStock.userId,
        quantity: data.initialStock.quantity,
        type: "DEPOSIT",
      });

      logger.success(`Initial stock deposited successfully`);
    }

    return item;
  },

  async getItems(filter: StockFilter = "active") {
    logger.info("Fetching all items with stock information");
    const { data, error } = await supabase
      .from("items")
      .select(
        `
        id,
        name,
        created_at,
        updated_at,
        item_stocks (
          lot_id,
          item_qty,
          expiry_date,
          updated_at,
          is_deleted
        )
      `
      )
      .order("name");
    if (error) {
      logger.error(`Failed to fetch items: ${error.message}`);
      throw error;
    }
    if (!data) {
      logger.success(`Fetched 0 items`);
      return [];
    }
    let filteredData = data;
    if (filter === "deleted") {
      filteredData = data.map((item) => ({
        ...item,
        item_stocks:
          item.item_stocks?.filter((lot: any) => lot.is_deleted) || [],
      }));
    } else if (filter === "active") {
      filteredData = data.map((item) => ({
        ...item,
        item_stocks:
          item.item_stocks?.filter((lot: any) => !lot.is_deleted) || [],
      }));
    }
    logger.success(`Fetched ${filteredData.length} items`);
    return filteredData;
  },

  async getItem(id: string, filter: StockFilter = "active") {
    logger.info(`Fetching item with ID: ${id}`);
    const { data, error } = await supabase
      .from("items")
      .select(
        `
        id,
        name,
        created_at,
        updated_at,
        item_stocks (
          lot_id,
          item_qty,
          expiry_date,
          updated_at,
          is_deleted
        )
      `
      )
      .eq("id", id)
      .single();
    if (error) {
      logger.error(`Failed to fetch item ${id}: ${error.message}`);
      throw error;
    }
    if (!data) {
      logger.success(`Fetched 0 items`);
      return null;
    }
    let filteredData = { ...data };
    if (filter === "deleted") {
      filteredData.item_stocks =
        data.item_stocks?.filter((lot: any) => lot.is_deleted) || [];
    } else if (filter === "active") {
      filteredData.item_stocks =
        data.item_stocks?.filter((lot: any) => !lot.is_deleted) || [];
    }
    logger.success(`Fetched item: ${data.name}`);
    return filteredData;
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

  async updateLotId({
    oldLotId,
    newLotId,
  }: {
    oldLotId: string;
    newLotId: string;
  }) {
    logger.info(`Updating lot ID from ${oldLotId} to ${newLotId}`);

    const { error } = await supabase
      .from("item_stocks")
      .update({ lot_id: newLotId })
      .eq("lot_id", oldLotId);

    if (error) {
      logger.error(`Failed to update lot ID: ${error.message}`);
      throw error;
    }

    logger.success(`Lot ID successfully updated to: ${newLotId}`);
    return true;
  },

  async updateItemStockDetails({
    itemId,
    oldLotId,
    newItemName,
    newLotId,
    quantity,
    expiryDate,
    userId,
  }: {
    itemId: string;
    oldLotId: string;
    newItemName?: string;
    newLotId?: string;
    quantity?: number;
    expiryDate?: string;
    userId: string;
  }) {
    logger.info(
      `Updating item stock details for item ${itemId}, lot ${oldLotId}`
    );

    const updates: any = {};
    let finalLotId = oldLotId;

    // Rename item
    if (newItemName) {
      await inventoryApi.updateItem(itemId, { name: newItemName });
    }

    // Rename lot ID
    if (newLotId && newLotId !== oldLotId) {
      // Check for conflict
      const { data: existing, error: checkError } = await supabase
        .from("item_stocks")
        .select("lot_id")
        .eq("lot_id", newLotId)
        .eq("is_deleted", false)
        .maybeSingle();

      if (checkError) {
        logger.error(
          `Error checking for existing lot ID: ${checkError.message}`
        );
        throw checkError;
      }

      if (existing) {
        logger.error(`Lot ID conflict: ${newLotId} already exists`);
        throw new Error(`Lot ID "${newLotId}" already exists.`);
      }

      await inventoryApi.updateLotId({ oldLotId, newLotId }); // pass as object
      finalLotId = newLotId;
    }

    // Update expiration date
    if (expiryDate) {
      updates.expiry_date = expiryDate;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("item_stocks")
        .update(updates)
        .eq("lot_id", finalLotId);

      if (error) {
        logger.error(`Failed to update lot fields: ${error.message}`);
        throw new Error("Failed to update lot fields.");
      }
    }

    // Update quantity (optional, via corrections)
    if (typeof quantity === "number") {
      await inventoryApi.correctStocks(finalLotId, userId, quantity);
    }

    logger.success(`Item stock details updated successfully`);
    return true;
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

  async createItemStockForItem({
    itemId,
    lotId,
    expiryDate,
    userId,
    quantity,
  }: {
    itemId: string;
    lotId: string;
    expiryDate?: string;
    userId: string;
    quantity: number;
  }) {
    logger.info(`Creating new lot ${lotId} for item ID ${itemId}`);

    const { error: stockError } = await supabase.from("item_stocks").insert({
      item_id: itemId,
      lot_id: lotId,
      item_qty: 0,
      expiry_date: expiryDate || null,
    });

    if (stockError) {
      logger.error(`Failed to create item stock: ${stockError.message}`);
      throw stockError;
    }

    logger.success(`Lot created. Depositing ${quantity} units via transaction`);

    await inventoryApi.createTransaction({
      lotId,
      userId,
      quantity,
      type: "DEPOSIT",
    });

    logger.success(`Deposit transaction complete for lot ${lotId}`);

    return true;
  },

  async deleteItemStock({ lotId, userId }: { lotId: string; userId: string }) {
    logger.info(
      `Soft-deleting item stock with lot ID: ${lotId} by user ${userId}`
    );

    // Soft delete the lot
    const { error: deleteError } = await supabase
      .from("item_stocks")
      .update({ is_deleted: true })
      .eq("lot_id", lotId);

    if (deleteError) {
      logger.error(`Failed to soft delete item stock: ${deleteError.message}`);
      throw deleteError;
    }

    logger.success(`Item stock marked as deleted`);

    // Log the deletion via a transaction
    await inventoryApi.createTransaction({
      lotId,
      userId,
      quantity: 0,
      type: "DELETE",
    });

    logger.success(`DELETE transaction logged successfully`);
    return true;
  },

  async correctStocks(lotId: string, userId: string, itemQtyAfter: number) {
    logger.info(
      `Applying correction for lot ${lotId} by user ${userId} to new quantity ${itemQtyAfter}`
    );

    // Validate userId exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();
    if (userError || !user) {
      logger.error(`Invalid user ID: ${userId}`);
      throw new Error("Invalid user ID");
    }

    // Validate lotId exists
    const { data: lot, error: lotError } = await supabase
      .from("item_stocks")
      .select("lot_id")
      .eq("lot_id", lotId)
      .single();
    if (lotError || !lot) {
      logger.error(`Invalid lot ID: ${lotId}`);
      throw new Error("Invalid lot ID");
    }

    const { error } = await supabase.from("corrections").insert({
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

  async createTransaction({
    lotId,
    userId,
    quantity,
    type,
  }: {
    lotId: string;
    userId: string;
    quantity: number;
    type: "DEPOSIT" | "DISTRIBUTE" | "DISPOSE" | "DELETE";
  }) {
    logger.info(
      `Creating ${type} transaction for lot ${lotId} by user ${userId}${
        type !== "DELETE" ? ` with quantity ${quantity}` : ""
      }`
    );

    // Validate userId exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();
    if (userError || !user) {
      logger.error(`Invalid user ID: ${userId}`);
      throw new Error("Invalid user ID");
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
    if (type === "DEPOSIT") {
      quantityChange = quantity;
    } else if (type === "DISTRIBUTE" || type === "DISPOSE") {
      if (currentStock.item_qty < quantity) {
        logger.error(
          `Insufficient stock: trying to subtract ${quantity} from ${currentStock.item_qty}`
        );
        throw new Error(
          `Insufficient stock: cannot subtract ${quantity} from ${currentStock.item_qty}`
        );
      }
      quantityChange = -quantity;
    } else if (type === "DELETE") {
      quantityChange = 0;
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

  async getItemStocksStatus(options: ItemStocksStatusOptions = {}) {
    logger.info(
      `Fetching item stocks status with options: ${JSON.stringify(options)}`
    );
    let query = supabase
      .from("item_stocks")
      .select(`*, items ( name )`)
      .order("expiry_date", { ascending: true });
    if (options.filter === "deleted") {
      query = query.eq("is_deleted", true);
    } else if (options.filter === "active" || !options.filter) {
      query = query.eq("is_deleted", false);
    }
    if (typeof options.lowStockThreshold === "number") {
      query = query.lte("item_qty", options.lowStockThreshold);
    }
    if (typeof options.nearExpiryDays === "number") {
      const today = new Date();
      const future = new Date(
        today.getTime() + options.nearExpiryDays * 24 * 60 * 60 * 1000
      );
      const todayStr = today.toISOString().slice(0, 10);
      const futureStr = future.toISOString().slice(0, 10);
      query = query
        .not("expiry_date", "is", null)
        .gte("expiry_date", todayStr)
        .lte("expiry_date", futureStr);
    }
    if (options.expired) {
      const todayStr = new Date().toISOString().slice(0, 10);
      query = query.not("expiry_date", "is", null).lt("expiry_date", todayStr);
    }
    const { data, error } = await query;
    if (error) {
      logger.error(`Failed to fetch item stocks status: ${error.message}`);
      throw error;
    }
    logger.success(`Fetched ${data?.length || 0} item stocks status entries`);
    return data;
  },

  /**
   * Get items with low stock (quantity <= threshold).
   */
  async getLowStockItems(threshold: number = 10) {
    logger.info(`Fetching items with stock <= ${threshold}`);
    const { data, error } = await supabase
      .from("item_stocks")
      .select(`*, items ( name )`)
      .lte("item_qty", threshold)
      .order("item_qty", { ascending: true });

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
      .from("item_stocks")
      .select(`*, items ( name )`)
      .not("expiry_date", "is", null)
      .gte("expiry_date", todayStr)
      .lte("expiry_date", futureStr)
      .order("expiry_date", { ascending: true });

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
    logger.info("Fetching expired items");
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("item_stocks")
      .select(`*, items ( name )`)
      .not("expiry_date", "is", null)
      .lt("expiry_date", todayStr)
      .order("expiry_date", { ascending: true });

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
    type?: "weekly" | "monthly";
  }) {
    logger.info(
      `Generating report from ${filters.startDate} to ${filters.endDate}`
    );

    const { data, error } = await supabase
      .from("transactions")
      .select(
        `
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
      `
      )
      .gte("created_at", filters.startDate)
      .lte("created_at", filters.endDate)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error(`Failed to generate report: ${error.message}`);
      throw error;
    }

    logger.success(`Report generated with ${data?.length || 0} transactions`);
    return data;
  },

  async getNotifications(filter: NotificationFilter = {}) {
    logger.info(
      `Fetching notifications with filter: ${JSON.stringify(filter)}`
    );
    let query = supabase
      .from("notifications")
      .select(
        `
        *,
        item_stocks!inner (
          item_qty,
          expiry_date,
          items (name)
        )
      `
      )
      .order("created_at", { ascending: false });
    if (filter.type) {
      query = query.eq("type", filter.type);
    }
    if (filter.days !== undefined) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filter.days);
      query = query.gte("created_at", cutoffDate.toISOString());
    }
    const { data, error } = await query;
    if (error) {
      logger.error(`Failed to fetch notifications: ${error.message}`);
      throw error;
    }

    logger.success(`Fetched ${data?.length || 0} notifications`);
    return data;
  },

  /**
   * Get notifications by type (LOW_STOCK, NEAR_EXPIRY, EXPIRED).
   */
  async getNotificationsByType(type: "LOW_STOCK" | "NEAR_EXPIRY" | "EXPIRED") {
    logger.info(`Fetching notifications of type: ${type}`);

    const { data, error } = await supabase
      .from("notifications")
      .select(
        `
        *,
        item_stocks!inner (
          item_qty,
          expiry_date,
          items (name)
        )
      `
      )
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error(`Failed to fetch ${type} notifications: ${error.message}`);
      throw error;
    }

    logger.success(`Fetched ${data?.length || 0} ${type} notifications`);
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
      .from("notifications")
      .select(
        `
        *,
        item_stocks!inner (
          item_qty,
          expiry_date,
          items (name)
        )
      `
      )
      .gte("created_at", cutoffDate.toISOString())
      .order("created_at", { ascending: false });

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
  async getItemsByLotIds(lotIds: string[], filter: StockFilter = "active") {
    logger.info(
      `Fetching detailed item information for ${lotIds.length} lot IDs`
    );

    if (!lotIds || lotIds.length === 0) {
      logger.warning("No lot IDs provided");
      return [];
    }

    let query = supabase
      .from("item_stocks")
      .select(
        `
        *,
        items (
          id,
          name,
          created_at,
          updated_at
        )
      `
      )
      .in("lot_id", lotIds)
      .order("items(name)", { ascending: true });
    if (filter === "deleted") {
      query = query.eq("is_deleted", true);
    } else if (filter === "active") {
      query = query.eq("is_deleted", false);
    }
    const { data, error } = await query;

    if (error) {
      logger.error(`Failed to fetch items by lot IDs: ${error.message}`);
      throw error;
    }

    logger.success(
      `Fetched ${data?.length || 0} items with detailed information`
    );
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
