import { Json } from "./db.rawtypes";
import { SupabaseClient } from "@supabase/supabase-js";

function isStringRecord(obj: any): obj is Record<string, unknown> {
  return obj && typeof obj === "object" && !Array.isArray(obj);
}

/**
 *
 * @param supabase The instance of a Supabase client to interact with
 * @param tableName The name of the table to query
 * @param params JSON parameters to filter the query
 * @returns
 */
export function buildSelectQuery(
  supabase: SupabaseClient,
  tableName: string,
  params: Json
): any {
  let query = supabase.from(tableName).select();

  if (isStringRecord(params)) {
    /**
     *  Handle general filtering.
     *  params["filters"] is expected to be an array of parameters to .filter()
     *  by, following the ff. format:
     *  filters: [
     *    [column, operator, value],
     *    ...
     *    [columnN, operatorN, valueN]
     *  ]
     *  e.g.,
     *  filters: [
     *    ["status", "eq", "active"]
     *    ["age", "gte", 123]
     *  ]
     * See {@link https://supabase.com/docs/reference/javascript/filter} for a
     * list of supported filter operators.
     */
    if (Array.isArray(params["filters"])) {
      for (const filter of params["filters"]) {
        if (Array.isArray(filter)) {
          const column = filter[0] as string;
          const operator = filter[1] as string;
          const value = filter[2];
          query = query.filter(column, operator, value);
        }
      }
    }

    /**
     * Add more cases as needed. The above technically encompasses
     * all that's needed, but it might be convenient to handle the more
     * specific database query builder functions, too, like:
     */

    /**
     * Handle "eq" key for equality filters (object of column-value pairs), e.g.
     *  eq: {
     *    name: "John",
     *    age: 30,
     *  },
     */
    const { eq } = params;
    if (isStringRecord(eq)) {
      for (const column of Object.keys(eq)) {
        query = query.eq(column, eq[column]);
      }
    }
  }

  return query;
}
