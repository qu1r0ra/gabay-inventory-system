/**
 * @ Author: CSSWENG Group 3
 * @ Create Time: 2025-06-11 21:23:24
 * @ Modified time: 2025-06-11 22:13:48
 * @ Description:
 *
 * A hook for accessing the database.
 */

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * A templative hook.
 *
 * @param tableName   The name of the table to make a hook for.
 * @returns
 */
const createTableHook = (tableName) => () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  /**
   * Fetches data from supabase.
   * To be run in useEffect.
   */
  async function getData() {
    // Set loading to true, so we can indicate through UI
    setLoading(true);
    const { data, error } = await supabase.from(tableName).select();

    // Save the error or the data
    if (error) setError(error);
    else setData(data);

    // Remove loading in UI
    setLoading(false);
  }

  useEffect(() => {
    getData();
  });

  return [data, loading, error];
};

export const useItems = createTableHook("items");
export const useItemStocks = createTableHook("item_stocks");
export const useUsers = createTableHook("users");
export const useCorrections = createTableHook("corrections");
export const useTransactions = createTableHook("transactions");

/**
 *
 * How to use:
 *
 * const [ items, itemsLoading, itemsError ] = useItems();
 * const [ itemStocks, itemStocksLoading, itemStocksError ] = useItemStocks();
 * ...
 */
