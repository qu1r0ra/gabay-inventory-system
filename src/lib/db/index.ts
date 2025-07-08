/**
 * @ Author: CSSWENG Group 3
 * @ Create Time: 2025-06-11 21:23:24
 * @ Modified time: 2025-06-11 22:41:39
 * @ Description:
 *
 * A hook for accessing the database.
 */

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Json, Tables } from "./db.rawtypes";
import { buildSelectQuery } from "./db.querybuilder";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Database types.
 */
export type Item = Tables<"items">;
export type ItemStock = Tables<"item_stocks">;
export type Correction = Tables<"corrections">;
export type Transaction = Tables<"transactions">;
export type User = Tables<"users">;

/**
 * A templative hook.
 *
 * @param tableName   The name of the table to make a hook for.
 * @returns
 */
const createTableHook = <T>(tableName: string) => {
  return () => {
    // State of the hook
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<T[]>([]);
    const [params, setParams] = useState<Json>({});

    /**
     * Fetches data from supabase.
     * To be run in useEffect.
     *
     * @param params  JSON parameters to filter the query
     */
    async function getData(params: Json) {
      // Set loading to true, so we can indicate through UI
      setLoading(true);

      // Build query based off `params`
      let query = buildSelectQuery(supabase, tableName, params);

      // Execute query
      const { data, error } = await query;

      // Save the error or the data
      if (error) setError(error.message);
      else setData(data as T[]);

      // Remove loading in UI
      setLoading(false);
    }

    useEffect(() => {
      getData(params); // uses state params
    });

    return [getData, loading, error];
  };
};

/**
 *
 * How to use:
 *
 * const [ items, itemsLoading, itemsError ] = useItems();
 * const [ itemStocks, itemStocksLoading, itemStocksError ] = useItemStocks();
 * ...
 */
export const useItems = createTableHook("items");
export const useItemStocks = createTableHook("item_stocks");
export const useUsers = createTableHook("users");
export const useCorrections = createTableHook("corrections");
export const useTransactions = createTableHook("transactions");
