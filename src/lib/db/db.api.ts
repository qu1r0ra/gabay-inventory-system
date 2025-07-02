import { supabase, type Item, type ItemStock } from "./index";

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

export const inventoryApi = {
  async createItem(data: CreateItemRequest) {
    const { data: item, error: itemError } = await supabase
      .from("items")
      .insert({ name: data.name })
      .select()
      .single();

    if (itemError) throw itemError;

    if (data.initialStock) {
      const { error: stockError } = await supabase.from("item_stocks").insert({
        item_id: item.id,
        item_qty: data.initialStock.quantity,
        expiry_date: data.initialStock.expiryDate,
      });

      if (stockError) throw stockError;
    }

    return item;
  },

  async getItems() {
    const { data, error } = await supabase
      .from("items")
      .select(
        `
        *,
        item_stocks (
          lot_id,
          item_qty,
          expiry_date,
          updated_at
        )
      `
      )
      .order("name");

    if (error) throw error;
    return data;
  },

  async getItem(id: string) {
    const { data, error } = await supabase
      .from("items")
      .select(
        `
        *,
        item_stocks (
          lot_id,
          item_qty,
          expiry_date,
          updated_at
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateItem(id: string, data: UpdateItemRequest) {
    const { error: itemError } = await supabase
      .from("items")
      .update({
        name: data.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (itemError) throw itemError;

    if (data.stock) {
      const { error: stockError } = await supabase
        .from("item_stocks")
        .update({
          item_qty: data.stock.quantity,
          expiry_date: data.stock.expiryDate,
          updated_at: new Date().toISOString(),
        })
        .eq("item_id", id);

      if (stockError) throw stockError;
    }

    return this.getItem(id);
  },

  async deleteItem(id: string) {
    const { error } = await supabase.from("items").delete().eq("id", id);

    if (error) throw error;
    return true;
  },

  async updateStock(lotId: string, quantity: number, userId: string) {
    const { data: currentStock, error: fetchError } = await supabase
      .from("item_stocks")
      .select("item_qty")
      .eq("lot_id", lotId)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from("item_stocks")
      .update({
        item_qty: quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("lot_id", lotId);

    if (updateError) throw updateError;

    const { error: transactionError } = await supabase
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

export class ApiError extends Error {
  constructor(message: string, public statusCode: number, public code: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const handleApiError = (error: unknown) => {
  if (error instanceof ApiError) throw error;

  console.error("API Error:", error);
  throw new ApiError(
    "An unexpected error occurred",
    500,
    "INTERNAL_SERVER_ERROR"
  );
};
