import { supabase } from "./index";
import { logger } from "../utils/console.js";
import { Document } from "../pdf";
import { tableToHtml } from "../table";
import html2pdf from "html2pdf.js";

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

// --- Input Validation Helpers ---
function validateString(value: any, name: string, required = true) {
  if (required && (typeof value !== "string" || value.trim() === "")) {
    throw new ApiError(
      `${name} must be a non-empty string`,
      400,
      "BAD_REQUEST"
    );
  }
  if (!required && value !== undefined && typeof value !== "string") {
    throw new ApiError(`${name} must be a string`, 400, "BAD_REQUEST");
  }
}

function validateNumber(
  value: any,
  name: string,
  opts: { min?: number; max?: number; integer?: boolean } = {},
  required = true
) {
  if (required && (typeof value !== "number" || isNaN(value))) {
    throw new ApiError(`${name} must be a number`, 400, "BAD_REQUEST");
  }
  if (
    !required &&
    value !== undefined &&
    (typeof value !== "number" || isNaN(value))
  ) {
    throw new ApiError(`${name} must be a number`, 400, "BAD_REQUEST");
  }
  if (opts.integer && value !== undefined && !Number.isInteger(value)) {
    throw new ApiError(`${name} must be an integer`, 400, "BAD_REQUEST");
  }
  if (opts.min !== undefined && value !== undefined && value < opts.min) {
    throw new ApiError(`${name} must be >= ${opts.min}`, 400, "BAD_REQUEST");
  }
  if (opts.max !== undefined && value !== undefined && value > opts.max) {
    throw new ApiError(`${name} must be <= ${opts.max}`, 400, "BAD_REQUEST");
  }
}

function validateEnum<T extends string>(
  value: any,
  name: string,
  allowed: readonly T[],
  required = true
) {
  if (required && !allowed.includes(value)) {
    throw new ApiError(
      `${name} must be one of: ${allowed.join(", ")}`,
      400,
      "BAD_REQUEST"
    );
  }
  if (!required && value !== undefined && !allowed.includes(value)) {
    throw new ApiError(
      `${name} must be one of: ${allowed.join(", ")}`,
      400,
      "BAD_REQUEST"
    );
  }
}

function validateDate(value: any, name: string, required = true) {
  if (required && (typeof value !== "string" || isNaN(Date.parse(value)))) {
    throw new ApiError(
      `${name} must be a valid ISO date string`,
      400,
      "BAD_REQUEST"
    );
  }
  if (
    !required &&
    value !== undefined &&
    value !== null && // <-- allow null when not required
    (typeof value !== "string" || isNaN(Date.parse(value)))
  ) {
    throw new ApiError(
      `${name} must be a valid ISO date string`,
      400,
      "BAD_REQUEST"
    );
  }
}

function validateArray(
  value: any,
  name: string,
  opts: { minLength?: number; ofType?: (v: any) => void } = {},
  required = true
) {
  if (
    required &&
    (!Array.isArray(value) || (opts.minLength && value.length < opts.minLength))
  ) {
    throw new ApiError(
      `${name} must be an array${
        opts.minLength ? ` of at least ${opts.minLength} items` : ""
      }`,
      400,
      "BAD_REQUEST"
    );
  }
  if (!required && value !== undefined && !Array.isArray(value)) {
    throw new ApiError(`${name} must be an array`, 400, "BAD_REQUEST");
  }
  if (Array.isArray(value) && typeof opts.ofType === "function") {
    value.forEach((v, i) => {
      try {
        if (opts.ofType) {
          opts.ofType(v);
        }
      } catch (e) {
        throw new ApiError(
          `${name}[${i}]: ${(e as Error).message}`,
          400,
          "BAD_REQUEST"
        );
      }
    });
  }
}

const TRANSACTION_TYPES = [
  "DEPOSIT",
  "DISTRIBUTE",
  "DISPOSE",
  "DELETE",
] as const;
const NOTIFICATION_TYPES = ["LOW_STOCK", "NEAR_EXPIRY", "EXPIRED"] as const;
const STOCK_FILTERS = ["all", "deleted", "active"] as const;

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
    // Input validation
    validateString(data.name, "name");
    if (data.initialStock) {
      validateString(data.initialStock.lotId, "initialStock.lotId");
      validateNumber(data.initialStock.quantity, "initialStock.quantity", {
        min: 1,
        integer: true,
      }); // must be > 0
      validateString(data.initialStock.userId, "initialStock.userId");
      if (data.initialStock.expiryDate !== undefined) {
        validateDate(
          data.initialStock.expiryDate,
          "initialStock.expiryDate",
          false
        );
      }
    }
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
    validateEnum(filter, "filter", STOCK_FILTERS, false);
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
        item_stocks: Array.isArray(item.item_stocks)
          ? item.item_stocks.filter((lot: any) => lot.is_deleted)
          : [],
      }));
    } else if (filter === "active") {
      filteredData = data.map((item) => ({
        ...item,
        item_stocks: Array.isArray(item.item_stocks)
          ? item.item_stocks.filter((lot: any) => !lot.is_deleted)
          : [],
      }));
    }
    logger.success(`Fetched ${filteredData.length} items`);
    return filteredData;
  },

  async getItem(id: string, filter: StockFilter = "active") {
    validateString(id, "id");
    validateEnum(filter, "filter", STOCK_FILTERS, false);
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
    validateString(id, "id");
    if (data.name !== undefined) validateString(data.name, "name", false);
    logger.info(`Updating item with ID: ${id}`);

    if (data.name) {
      // Uniqueness check
      const { data: existing, error: checkError } = await supabase
        .from("items")
        .select("id")
        .eq("name", data.name)
        .neq("id", id)
        .maybeSingle();
      if (checkError) {
        logger.error(
          `Error checking for existing item name: ${checkError.message}`
        );
        throw checkError;
      }
      if (existing) {
        logger.error(`Item name conflict: ${data.name} already exists`);
        throw new ApiError(
          `Item name "${data.name}" already exists.`,
          400,
          "DUPLICATE_ITEM_NAME"
        );
      }
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
    validateString(oldLotId, "oldLotId");
    validateString(newLotId, "newLotId");
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
    expiryDate?: string | null; // <-- allow null here
    userId: string;
  }) {
    validateString(itemId, "itemId");
    validateString(oldLotId, "oldLotId");
    if (newItemName !== undefined)
      validateString(newItemName, "newItemName", false);
    if (newLotId !== undefined) validateString(newLotId, "newLotId", false);
    if (quantity !== undefined)
      validateNumber(quantity, "quantity", { min: 1, integer: true }, false);
    if (expiryDate !== undefined) validateDate(expiryDate, "expiryDate", false);
    validateString(userId, "userId");
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
    if (expiryDate !== undefined) {
      updates.expiry_date = expiryDate === null ? null : expiryDate;
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
    validateString(id, "id");
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
    validateString(itemId, "itemId");
    validateString(lotId, "lotId");
    if (expiryDate !== undefined) validateDate(expiryDate, "expiryDate", false);
    validateString(userId, "userId");
    validateNumber(quantity, "quantity", { min: 1, integer: true });
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
    validateString(lotId, "lotId");
    validateString(userId, "userId");
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
    validateString(lotId, "lotId");
    validateString(userId, "userId");
    validateNumber(itemQtyAfter, "itemQtyAfter", { min: 0, integer: true });
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
    validateString(lotId, "lotId");
    validateString(userId, "userId");
    validateEnum(type, "type", TRANSACTION_TYPES);
    if (type === "DEPOSIT") {
      validateNumber(quantity, "quantity", { min: 1, integer: true });
      if (quantity <= 0) {
        throw new ApiError(
          "quantity for DEPOSIT must be > 0",
          400,
          "BAD_REQUEST"
        );
      }
    } else if (["DISTRIBUTE", "DISPOSE"].includes(type)) {
      validateNumber(quantity, "quantity", { min: 1, integer: true });
      if (quantity <= 0) {
        throw new ApiError(
          `quantity for ${type} must be > 0`,
          400,
          "BAD_REQUEST"
        );
      }
    } else {
      validateNumber(quantity, "quantity", { min: 0, integer: true });
    }
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

  async getActivityLogEntries() {
    try {
      const [transactionsResult, correctionsResult] = await Promise.all([
        supabase
          .from("transactions")
          .select(
            `
        id,
        lot_id,
        item_qty_change,
        type,
        created_at,
        users ( name ),
        item_stocks (
          items ( name )
        )
      `
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("corrections")
          .select(
            `
        id,
        lot_id,
        item_qty_after,
        created_at,
        users ( name ),
        item_stocks (
          items ( name )
        )
      `
          )
          .order("created_at", { ascending: false }),
      ]);

      if (transactionsResult.error) {
        logger.error(
          `Failed to fetch transactions: ${transactionsResult.error.message}`
        );
        throw transactionsResult.error;
      }

      if (correctionsResult.error) {
        logger.error(
          `Failed to fetch corrections: ${correctionsResult.error.message}`
        );
        throw correctionsResult.error;
      }

      const transactions = (transactionsResult.data || []).map((tx: any) => {
        const localDate = new Date(tx.created_at);
        return {
          id: `tx-${tx.id}`,
          actor: tx.users?.name ?? "Unknown",
          item: tx.item_stocks?.items?.name ?? "Unknown",
          lotId: tx.lot_id,
          date: localDate.toLocaleDateString("en-CA"), // YYYY-MM-DD
          time: localDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }), // HH:MM
          type:
            tx.type === "DEPOSIT"
              ? `+${tx.item_qty_change}`
              : tx.type === "DISTRIBUTE" || tx.type === "DISPOSE"
              ? `${tx.item_qty_change}` // already negative
              : tx.type === "DELETE"
              ? "X"
              : tx.type,
        };
      });

      const corrections = (correctionsResult.data || []).map((corr: any) => {
        const localDate = new Date(corr.created_at);
        return {
          id: `corr-${corr.id}`,
          actor: corr.users?.name ?? "Unknown",
          item: corr.item_stocks?.items?.name ?? "Unknown",
          lotId: corr.lot_id,
          date: localDate.toLocaleDateString("en-CA"),
          time: localDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          type: `=${corr.item_qty_after}`,
        };
      });

      const combined = [...transactions, ...corrections].sort((a, b) => {
        const aDate = new Date(`${a.date}T${a.time}`);
        const bDate = new Date(`${b.date}T${b.time}`);
        return bDate.getTime() - aDate.getTime(); // Newest first
      });

      logger.success(`Fetched ${combined.length} activity log entries`);
      return combined;
    } catch (error) {
      logger.error(`Failed to fetch activity log: ${(error as Error).message}`);
      throw error;
    }
  },

  async getItemStocksStatus(options: ItemStocksStatusOptions = {}) {
    if (options.filter !== undefined)
      validateEnum(options.filter, "filter", STOCK_FILTERS, false);
    if (options.lowStockThreshold !== undefined)
      validateNumber(
        options.lowStockThreshold,
        "lowStockThreshold",
        { min: 0, integer: true },
        false
      );
    if (options.nearExpiryDays !== undefined)
      validateNumber(
        options.nearExpiryDays,
        "nearExpiryDays",
        { min: 0, integer: true },
        false
      );
    if (options.expired !== undefined && typeof options.expired !== "boolean")
      throw new ApiError("expired must be a boolean", 400, "BAD_REQUEST");
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
    validateNumber(threshold, "threshold", { min: 0, integer: true });
    logger.info(`Fetching items with stock <= ${threshold}`);
    const { data, error } = await supabase
      .from("item_stocks")
      .select(`*, items ( name )`)
      .lte("item_qty", threshold)
      .eq("is_deleted", false) // 👈 Exclude soft-deleted
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
    validateNumber(days, "days", { min: 0, integer: true });
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
      .eq("is_deleted", false) // 👈 Exclude soft-deleted
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
    // No input to validate
    logger.info("Fetching expired items");
    const todayStr = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("item_stocks")
      .select(`*, items ( name )`)
      .not("expiry_date", "is", null)
      .lt("expiry_date", todayStr)
      .eq("is_deleted", false) // 👈 Exclude soft-deleted
      .order("expiry_date", { ascending: true });

    if (error) {
      logger.error(`Failed to fetch expired items: ${error.message}`);
      throw error;
    }
    logger.success(`Found ${data?.length || 0} expired items`);
    return data;
  },

  async getReportData(filters: {
    startDate: string; // inclusive
    endDate: string; // exclusive
    type?: "weekly" | "monthly";
  }) {
    console.log(filters);
    validateDate(filters.startDate, "startDate");
    validateDate(filters.endDate, "endDate");
    if (filters.type !== undefined)
      validateEnum(filters.type, "type", ["weekly", "monthly"], false);
    logger.info(
      `Generating report from ${filters.startDate} to ${filters.endDate}`
    );

    const { data, error } = await supabase
      .from("transactions")
      .select(
        `
        created_at,
        users ( name ),
        type,
        item_stocks (
          items (name),
          lot_id
        ),
        item_qty_change
      `
      )
      .gte("created_at", filters.startDate)
      .lt("created_at", filters.endDate)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error(`Failed to generate report: ${error.message}`);
      throw error;
    }

    logger.success(`Report generated with ${data?.length || 0} transactions`);
    console.log(data);
    return data;
  },

  /**
   *
   * @param month
   * @param year
   * @returns URL to the created PDF file if sucessful, otherwise throws an error.
   */
  async generateReport(month: number, year: number) {
    // Flatten nested objects into a single level with joined keys
    function flattenJoin(
      obj: Record<string, any>,
      parentKey = "",
      sep = "_"
    ): Record<string, any> {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        const newKey = parentKey ? `${parentKey}${sep}${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
          Object.assign(acc, flattenJoin(value, newKey, sep));
        } else {
          acc[newKey] = value;
        }
        return acc;
      }, {} as Record<string, any>);
    }

    // Convert JSON array to table format
    function jsonToTable(jsonArray: Record<string, any>[]): {
      columnNames: string[];
      data: string[][];
    } {
      if (!jsonArray || jsonArray.length === 0) {
        return { columnNames: [], data: [] };
      }
      // Get all unique keys from all objects
      const columnNames = Array.from(
        new Set(jsonArray.flatMap((obj) => Object.keys(obj)))
      );

      // Build the data matrix
      const data = jsonArray.map((obj) =>
        columnNames.map((col) =>
          obj[col] !== undefined ? String(obj[col]) : ""
        )
      );

      return { columnNames, data };
    }

    // Formatting
    function formatDataAsDate(data: string[][], index: number) {
      data.forEach((row) => {
        if (row[index]) {
          const date = new Date(row[index]);
          row[index] = date.toLocaleDateString("en-US");
        }
      });
    }

    function capitalizeWords(str: string): string {
      const words = str.split("_");
      const capitalizedWords = words.map((word) => {
        if (word.length === 0) {
          return "";
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
      return capitalizedWords.join(" ");
    }

    logger.info("Generating PDF report");

    // Array of objects
    let data = (
      await this.getReportData({
        startDate: `${year}-${month}-01`,
        endDate: `${year}-${month + 1}-01`,
        type: "monthly",
      })
    ).map((item) => flattenJoin(item));

    let { columnNames, data: tableData } = jsonToTable(data);

    // Change columnNames here (maybe via a map)
    columnNames = columnNames.map((name, index) => {
      switch (name) {
        case "users_email":
          return "User Email";
        case "users_name":
          return "User Name";
        case "item_stocks_items_name":
          return "Item Name";
        case "item_qty_change":
          return "Quantity Changed";
        case "type":
          return "Transaction Type";
        case "created_at":
          formatDataAsDate(tableData, index);
          return "Transaction Date";
        case "id":
          return "Transaction ID";
        case "item_stocks_lot_id":
          return "Lot ID";
        default:
          return capitalizeWords(name);
      }
    });

    // Generate PDF
    try {
      const mainPdf = await Document.new("GABAY REPORT");
      const monthStr = new Date(year, month - 1).toLocaleString("default", {
        month: "long",
      });
      mainPdf
        .beginPage()
        .header("GABAY Transactions Report", {})
        .header(`for ${monthStr} ${year}`, {
          size: 3,
          alignment: "right",
        })
        .text(`Generated on ${new Date().toLocaleDateString("en-US")}.`)
        .text("View the table in the next page.")
        .endPage();

      const tableHtml = await tableToHtml({
        columnNames,
        data: tableData,
        // title: `GABAY Transactions Report for ${monthStr} ${year}, generated ${new Date().toLocaleDateString("en-US")}`
      });

      await html2pdf()
        .set({
          margin: [20, 20, 20, 20], // Set appropriate margins
          autoPaging: "text", // Crucial for handling text flow across pages
          html2canvas: {
            allowTaint: true,
            letterRendering: true,
            logging: false,
          },
          jsPDF: { orientation: "landscape" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(tableHtml)
        .toPdf()
        .get("pdf")
        .then(async (tablePdf: { output: (arg0: string) => any }) => {
          const buffer = tablePdf.output("arraybuffer");
          await mainPdf.appendDocument(buffer);
        });

      logger.success("PDF report generated successfully");
      return mainPdf.save();
    } catch (error) {
      logger.error(
        `Failed to generate PDF report: ${(error as Error).message}`
      );
      throw error;
    }
  },

  async getNotifications(filter: NotificationFilter = {}) {
    if (filter.type !== undefined)
      validateEnum(filter.type, "type", NOTIFICATION_TYPES, false);
    if (filter.days !== undefined)
      validateNumber(filter.days, "days", { min: 0, integer: true }, false);
    logger.info(
      `Fetching notifications with filter: ${JSON.stringify(filter)}`
    );
    let query = supabase
      .from("notifications")
      .select("*")
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
    if (!data) return [];
    // Gather all lot_ids from all notifications
    const allLotIds = Array.from(
      new Set(data.flatMap((notif: any) => notif.lot_ids || []))
    );
    let lotDetails: any[] = [];
    if (allLotIds.length > 0) {
      try {
        // Fetch all lots, including deleted
        lotDetails = await inventoryApi.getItemsByLotIds(allLotIds, "all");
      } catch (e) {
        logger.error(
          `Failed to fetch lot details for notifications: ${
            (e as Error).message
          }`
        );
        lotDetails = [];
      }
    }
    // Map lotId to detail for quick lookup
    const lotMap: Record<string, any> = {};
    lotDetails.forEach((lot: any) => {
      lotMap[lot.lot_id] = {
        ...lot,
        deleted: !!lot.is_deleted,
      };
    });
    // Attach stocks to each notification
    const notificationsWithStocks = data.map((notif: any) => {
      const stocks = (notif.lot_ids || []).map((lotId: string) => {
        if (lotMap[lotId]) {
          return lotMap[lotId];
        } else {
          return { lot_id: lotId, invalid: true };
        }
      });
      return { ...notif, stocks };
    });
    logger.success(
      `Fetched ${notificationsWithStocks.length} notifications (with stocks)`
    );
    return notificationsWithStocks;
  },

  async deleteNotification(id: string) {
    validateString(id, "id");

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  },

  /**
   * Get notifications by type (LOW_STOCK, NEAR_EXPIRY, EXPIRED).
   */
  async getNotificationsByType(type: "LOW_STOCK" | "NEAR_EXPIRY" | "EXPIRED") {
    validateEnum(type, "type", NOTIFICATION_TYPES);
    logger.info(`Fetching notifications of type: ${type}`);
    // Use the refactored getNotifications
    return this.getNotifications({ type });
  },

  /**
   * Get recent notifications (last 30 days).
   */
  async getRecentNotifications(days: number = 30) {
    validateNumber(days, "days", { min: 0, integer: true });
    logger.info(`Fetching notifications from last ${days} days`);
    // Use the refactored getNotifications
    return this.getNotifications({ days });
  },
  /**
   * Get total quantities added and taken within the current month.
   */
  async getMonthlyTransactionSummary() {
    const startDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();
    const endDate = new Date().toISOString();

    const { data, error } = await supabase
      .from("transactions")
      .select("type, item_qty_change")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .not("type", "eq", "DELETE"); // exclude deleted

    if (error) {
      logger.error("Failed to fetch monthly transactions: " + error.message);
      throw error;
    }

    let itemsAdded = 0;
    let itemsTaken = 0;

    data?.forEach((t: any) => {
      if (t.type === "DEPOSIT") itemsAdded += t.item_qty_change;
      if (t.type === "DISTRIBUTE" || t.type === "DISPOSE")
        itemsTaken += Math.abs(t.item_qty_change);
    });

    return { itemsAdded, itemsTaken };
  },

  /**
   * Get detailed item information for a list of lot IDs.
   * Useful for displaying detailed information when users click on notifications.
   */
  async getItemsByLotIds(lotIds: string[], filter: StockFilter = "active") {
    validateArray(lotIds, "lotIds", {
      minLength: 1,
      ofType: (v) => validateString(v, "lotId"),
    });
    validateEnum(filter, "filter", STOCK_FILTERS, false);
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
      logger.error(
        `Failed to fetch detailed item information: ${error.message}`
      );
      throw error;
    }

    if (!data) {
      logger.success(`Fetched 0 detailed item information`);
      return [];
    }

    // Rename "items" field to "item" for consistency
    const itemDetails = data.map(({ items, ...stock }) => ({
      ...stock,
      item: items,
    }));

    logger.success(`Fetched ${itemDetails.length} detailed item information`);
    return itemDetails;
  },
};
