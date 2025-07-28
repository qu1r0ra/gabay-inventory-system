import {
  supabase,
  type Item,
  type ItemStock,
  type Transaction,
  type User,
} from "./index";
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
        item_qty_change: quantity - currentStock.item_qty,
        type: quantity > currentStock.item_qty ? "DEPOSIT" : "DISTRIBUTE",
      });

    if (transactionError) throw transactionError;

    return true;
  },
};
